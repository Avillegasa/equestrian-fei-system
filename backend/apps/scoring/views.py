from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import (
    EvaluationParameter, 
    ScoreEntry, 
    JudgeEvaluation, 
    JudgePosition,
    ScoreAuditLog
)
from .serializers import (
    EvaluationParameterSerializer,
    ScoreEntrySerializer,
    JudgeEvaluationSerializer,
    ScoreEntryCreateSerializer,
    JudgePositionSerializer
)
from .calculators import FEICalculator, FEIValidationEngine
from apps.competitions.models import Competition, Participant
from apps.users.permissions import IsJudge, IsOrganizer, IsAdminOrOrganizer


class EvaluationParameterViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para parámetros de evaluación FEI
    Solo lectura - configurados por administradores
    """
    queryset = EvaluationParameter.objects.all()
    serializer_class = EvaluationParameterSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset.order_by('order', 'exercise_number')
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Obtener parámetros agrupados por categoría"""
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response(
                {'error': 'category_id es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        parameters = self.get_queryset().filter(category_id=category_id)
        serializer = self.get_serializer(parameters, many=True)
        
        # Calcular puntuación máxima total
        total_max_score = sum(p.max_score * p.coefficient for p in parameters)
        
        return Response({
            'parameters': serializer.data,
            'total_max_score': total_max_score,
            'parameters_count': len(parameters)
        })


class ScoreEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de calificaciones FEI
    Implementa validaciones específicas y cálculos automáticos
    """
    queryset = ScoreEntry.objects.all()
    serializer_class = ScoreEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ScoreEntryCreateSerializer
        return ScoreEntrySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        participant_id = self.request.query_params.get('participant_id')
        judge_position_id = self.request.query_params.get('judge_position_id')
        competition_id = self.request.query_params.get('competition_id')
        
        if participant_id:
            queryset = queryset.filter(participant_id=participant_id)
        if judge_position_id:
            queryset = queryset.filter(judge_position_id=judge_position_id)
        if competition_id:
            queryset = queryset.filter(participant__competition_id=competition_id)
        
        return queryset.select_related(
            'participant', 'judge_position', 'evaluation_parameter', 'scored_by'
        ).order_by('evaluation_parameter__order', 'evaluation_parameter__exercise_number')
    
    def perform_create(self, serializer):
        """Crear calificación con validaciones FEI"""
        # Obtener datos de la request
        score = serializer.validated_data['score']
        evaluation_parameter = serializer.validated_data['evaluation_parameter']
        justification = serializer.validated_data.get('justification', '')
        
        # Validar usando el motor FEI
        validation = FEICalculator.validate_score_entry(
            score, 
            evaluation_parameter.coefficient,
            justification
        )
        
        if not validation['is_valid']:
            return Response(
                {'errors': validation['errors']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Guardar con metadatos de auditoría
        score_entry = serializer.save(
            scored_by=self.request.user,
            scored_at=timezone.now()
        )
        
        # Crear log de auditoría
        self._create_audit_log(score_entry, 'create')
        
        # Actualizar evaluación del juez
        self._update_judge_evaluation(score_entry)
        
        return Response(
            ScoreEntrySerializer(score_entry).data,
            status=status.HTTP_201_CREATED
        )
    
    def perform_update(self, serializer):
        """Actualizar calificación con auditoría"""
        old_score = self.get_object()
        old_score_value = old_score.score
        old_justification = old_score.justification
        
        # Validar nueva puntuación
        new_score = serializer.validated_data['score']
        evaluation_parameter = serializer.validated_data['evaluation_parameter']
        justification = serializer.validated_data.get('justification', '')
        
        validation = FEICalculator.validate_score_entry(
            new_score, 
            evaluation_parameter.coefficient,
            justification
        )
        
        if not validation['is_valid']:
            return Response(
                {'errors': validation['errors']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Guardar cambios
        score_entry = serializer.save()
        
        # Crear log de auditoría
        self._create_audit_log(
            score_entry, 
            'update',
            old_score_value,
            old_justification
        )
        
        # Actualizar evaluación del juez
        self._update_judge_evaluation(score_entry)
        
        return Response(ScoreEntrySerializer(score_entry).data)
    
    def _create_audit_log(self, score_entry, action, old_score=None, old_justification=""):
        """Crear entrada en el log de auditoría"""
        reason = self.request.data.get('reason', '')
        if not reason and action == 'update':
            reason = "Actualización de puntuación"
        
        ScoreAuditLog.objects.create(
            score_entry=score_entry,
            action=action,
            old_score=old_score,
            new_score=score_entry.score,
            old_justification=old_justification,
            new_justification=score_entry.justification,
            changed_by=self.request.user,
            reason=reason,
            ip_address=self._get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def _update_judge_evaluation(self, score_entry):
        """Actualizar evaluación automáticamente"""
        try:
            FEICalculator.update_judge_evaluation(
                score_entry.participant,
                score_entry.judge_position
            )
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error updating judge evaluation: {e}")
    
    def _get_client_ip(self):
        """Obtener IP del cliente"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip
    
    @action(detail=False, methods=['get'])
    def judge_scorecard(self, request):
        """Obtener tarjeta de puntuación para un juez específico"""
        participant_id = request.query_params.get('participant_id')
        judge_position_id = request.query_params.get('judge_position_id')
        
        if not participant_id or not judge_position_id:
            return Response(
                {'error': 'participant_id y judge_position_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participant = get_object_or_404(Participant, id=participant_id)
        judge_position = get_object_or_404(JudgePosition, id=judge_position_id)
        
        # Obtener parámetros de evaluación
        parameters = EvaluationParameter.objects.filter(
            category=participant.category
        ).order_by('order', 'exercise_number')
        
        # Obtener calificaciones existentes
        existing_scores = {
            score.evaluation_parameter_id: score 
            for score in ScoreEntry.objects.filter(
                participant=participant,
                judge_position=judge_position
            ).select_related('evaluation_parameter')
        }
        
        # Construir tarjeta de puntuación
        scorecard = []
        for param in parameters:
            score_entry = existing_scores.get(param.id)
            scorecard.append({
                'parameter': EvaluationParameterSerializer(param).data,
                'score_entry': ScoreEntrySerializer(score_entry).data if score_entry else None,
                'weighted_score': score_entry.weighted_score if score_entry else 0,
                'is_scored': score_entry is not None
            })
        
        # Calcular totales
        totals = FEICalculator.calculate_participant_total(participant, judge_position)
        
        return Response({
            'participant': {
                'id': participant.id,
                'number': participant.number,
                'rider_name': f"{participant.rider.first_name} {participant.rider.last_name}",
                'horse_name': participant.horse.name,
                'category': participant.category.name
            },
            'judge': {
                'name': judge_position.judge.get_full_name(),
                'position': judge_position.position
            },
            'scorecard': scorecard,
            'totals': totals
        })
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Actualización masiva de calificaciones"""
        scores_data = request.data.get('scores', [])
        
        if not scores_data:
            return Response(
                {'error': 'No se proporcionaron calificaciones'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_scores = []
        errors = []
        
        with transaction.atomic():
            for score_data in scores_data:
                try:
                    # Validar datos requeridos
                    required_fields = ['participant_id', 'judge_position_id', 'evaluation_parameter_id', 'score']
                    if not all(field in score_data for field in required_fields):
                        errors.append({
                            'error': 'Faltan campos requeridos',
                            'data': score_data
                        })
                        continue
                    
                    # Obtener o crear calificación
                    score_entry, created = ScoreEntry.objects.get_or_create(
                        participant_id=score_data['participant_id'],
                        judge_position_id=score_data['judge_position_id'],
                        evaluation_parameter_id=score_data['evaluation_parameter_id'],
                        defaults={
                            'score': Decimal(str(score_data['score'])),
                            'justification': score_data.get('justification', ''),
                            'scored_by': request.user
                        }
                    )
                    
                    if not created:
                        # Actualizar existente
                        old_score = score_entry.score
                        score_entry.score = Decimal(str(score_data['score']))
                        score_entry.justification = score_data.get('justification', '')
                        score_entry.save()
                        
                        # Auditoría
                        self._create_audit_log(score_entry, 'update', old_score)
                    else:
                        # Auditoría para nueva
                        self._create_audit_log(score_entry, 'create')
                    
                    updated_scores.append(ScoreEntrySerializer(score_entry).data)
                    
                except Exception as e:
                    errors.append({
                        'error': str(e),
                        'data': score_data
                    })
        
        return Response({
            'updated_scores': updated_scores,
            'errors': errors,
            'success_count': len(updated_scores),
            'error_count': len(errors)
        })


class JudgeEvaluationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para evaluaciones de jueces
    Proporciona cálculos automáticos y estadísticas
    """
    queryset = JudgeEvaluation.objects.all()
    serializer_class = JudgeEvaluationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        participant_id = self.request.query_params.get('participant_id')
        judge_id = self.request.query_params.get('judge_id')
        competition_id = self.request.query_params.get('competition_id')
        
        if participant_id:
            queryset = queryset.filter(participant_id=participant_id)
        if judge_id:
            queryset = queryset.filter(judge_position__judge_id=judge_id)
        if competition_id:
            queryset = queryset.filter(participant__competition_id=competition_id)
        
        return queryset.select_related(
            'participant', 'judge_position__judge'
        )
    
    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        """Recalcular totales de una evaluación"""
        evaluation = self.get_object()
        
        try:
            result = FEICalculator.calculate_participant_total(
                evaluation.participant,
                evaluation.judge_position
            )
            
            evaluation.total_score = result['total_weighted_score']
            evaluation.total_possible = result['total_possible_score']
            evaluation.percentage = result['percentage']
            evaluation.save()
            
            return Response({
                'message': 'Evaluación recalculada exitosamente',
                'evaluation': JudgeEvaluationSerializer(evaluation).data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error recalculando evaluación: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def competition_progress(self, request):
        """Obtener progreso de evaluación por competencia"""
        competition_id = request.query_params.get('competition_id')
        if not competition_id:
            return Response(
                {'error': 'competition_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        competition = get_object_or_404(Competition, id=competition_id)
        
        # Estadísticas generales
        stats = FEICalculator.get_statistics_summary(competition)
        
        # Progreso por juez
        judges_progress = []
        judge_positions = JudgePosition.objects.filter(
            competition=competition,
            is_active=True
        )
        
        for judge_position in judge_positions:
            evaluations = self.get_queryset().filter(
                judge_position=judge_position,
                participant__competition=competition
            )
            
            completed = evaluations.filter(status='completed').count()
            total = evaluations.count()
            
            judges_progress.append({
                'judge_name': judge_position.judge.get_full_name(),
                'judge_position': judge_position.position,
                'completed_evaluations': completed,
                'total_evaluations': total,
                'completion_percentage': (completed / total * 100) if total > 0 else 0
            })
        
        return Response({
            'competition': {
                'id': competition.id,
                'name': competition.name,
                'status': competition.status
            },
            'statistics': stats,
            'judges_progress': judges_progress
        })


class CompetitionRankingView(viewsets.ViewSet):
    """
    ViewSet para rankings de competencias
    Proporciona cálculos en tiempo real
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def live_rankings(self, request):
        """Obtener rankings en tiempo real"""
        competition_id = request.query_params.get('competition_id')
        category_id = request.query_params.get('category_id')
        
        if not competition_id:
            return Response(
                {'error': 'competition_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        competition = get_object_or_404(Competition, id=competition_id)
        
        try:
            rankings = FEICalculator.calculate_competition_rankings(competition)
            
            # Filtrar por categoría si se especifica
            if category_id:
                rankings = [r for r in rankings if r['participant'].category_id == int(category_id)]
            
            return Response({
                'competition': {
                    'id': competition.id,
                    'name': competition.name,
                    'status': competition.status
                },
                'rankings': rankings,
                'last_updated': timezone.now(),
                'total_participants': len(rankings)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error calculando rankings: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def participant_detail(self, request):
        """Obtener detalle completo de un participante"""
        participant_id = request.query_params.get('participant_id')
        
        if not participant_id:
            return Response(
                {'error': 'participant_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participant = get_object_or_404(Participant, id=participant_id)
        
        try:
            # Calcular promedio del participante
            average_result = FEICalculator.calculate_participant_average(participant)
            
            # Obtener detalles por juez
            judge_details = []
            for judge_breakdown in average_result['judges_breakdown']:
                judge_position = JudgePosition.objects.get(
                    competition=participant.competition,
                    judge__first_name__icontains=judge_breakdown['judge_name'].split()[0]
                )
                
                detail_result = FEICalculator.calculate_participant_total(
                    participant, judge_position
                )
                
                judge_details.append({
                    'judge_info': judge_breakdown,
                    'detailed_scores': detail_result['scores_breakdown']
                })
            
            return Response({
                'participant': {
                    'id': participant.id,
                    'number': participant.number,
                    'rider_name': f"{participant.rider.first_name} {participant.rider.last_name}",
                    'horse_name': participant.horse.name,
                    'category': participant.category.name
                },
                'summary': average_result,
                'judge_details': judge_details
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error obteniendo detalle: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def anomaly_detection(self, request):
        """Detectar anomalías en calificaciones"""
        competition_id = request.query_params.get('competition_id')
        
        if not competition_id:
            return Response(
                {'error': 'competition_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        competition = get_object_or_404(Competition, id=competition_id)
        
        try:
            anomalies = FEIValidationEngine.detect_scoring_anomalies(competition)
            
            return Response({
                'competition_id': competition.id,
                'anomalies_count': len(anomalies),
                'anomalies': anomalies,
                'checked_at': timezone.now()
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error detectando anomalías: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )