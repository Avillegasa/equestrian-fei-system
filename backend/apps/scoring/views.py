"""
Vistas para el sistema de calificación FEI
Implementa todas las operaciones de scoring y rankings
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from typing import Dict, List

from .models import (
    EvaluationParameter, 
    ScoreEntry, 
    JudgeEvaluation
)
from .serializers import (
    EvaluationParameterSerializer,
    ScoreEntrySerializer,
    JudgeEvaluationSerializer
)
# Corregir importaciones del calculador
from .calculators import FEIScoreCalculator, FEIRankingCalculator, FEIStatisticsCalculator

from apps.competitions.models import Competition, Registration
from apps.users.models import User


class EvaluationParameterViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para parámetros de evaluación FEI
    Solo lectura - configurados por administradores
    """
    queryset = EvaluationParameter.objects.all()
    serializer_class = EvaluationParameterSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset().filter(is_active=True)
        
        # Filtros opcionales
        competition_id = self.request.query_params.get('competition_id')
        category_id = self.request.query_params.get('category_id')
        
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        return queryset.order_by('code')
    
    @action(detail=False, methods=['get'])
    def by_competition(self, request):
        """Obtener parámetros para una competencia específica"""
        competition_id = request.query_params.get('competition_id')
        if not competition_id:
            return Response(
                {'error': 'competition_id es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            competition = Competition.objects.get(id=competition_id)
            parameters = self.get_queryset().filter(competition_id=competition_id)
            serializer = self.get_serializer(parameters, many=True)
            
            return Response({
                'competition': {
                    'id': competition.id,
                    'name': competition.name,
                    'discipline': competition.discipline.name if competition.discipline else None
                },
                'parameters': serializer.data,
                'total_parameters': len(parameters)
            })
            
        except Competition.DoesNotExist:
            return Response(
                {'error': 'Competencia no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class ScoreEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de calificaciones FEI
    Implementa validaciones específicas y cálculos automáticos
    """
    queryset = ScoreEntry.objects.all()
    serializer_class = ScoreEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.calculator = FEIScoreCalculator()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        evaluation_id = self.request.query_params.get('evaluation_id')
        parameter_id = self.request.query_params.get('parameter_id')
        judge_id = self.request.query_params.get('judge_id')
        
        if evaluation_id:
            queryset = queryset.filter(evaluation_id=evaluation_id)
        if parameter_id:
            queryset = queryset.filter(parameter_id=parameter_id)
        if judge_id:
            queryset = queryset.filter(evaluation__judge_id=judge_id)
            
        return queryset.select_related('parameter', 'evaluation')
    
    def perform_create(self, serializer):
        """Crear entrada de puntuación con validaciones FEI"""
        score = serializer.validated_data['score']
        parameter = serializer.validated_data['parameter']
        
        # Validar con el motor FEI
        validation = self.calculator.validate_score_increment(score)
        if not validation:
            return Response(
                {'error': 'Puntuación inválida. Debe ser en incrementos de 0.5 entre 0.0 y 10.0'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar rango específico del parámetro
        if not self.calculator.validate_score_range(score, parameter.min_score, parameter.max_score):
            return Response(
                {'error': f'Puntuación fuera de rango para este parámetro ({parameter.min_score}-{parameter.max_score})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save()
        
        # Recalcular totales de la evaluación
        self._recalculate_evaluation_totals(serializer.instance.evaluation)
    
    def perform_update(self, serializer):
        """Actualizar entrada con validaciones"""
        old_score = serializer.instance.score
        new_score = serializer.validated_data.get('score', old_score)
        
        # Validar nueva puntuación
        if new_score != old_score:
            validation = self.calculator.validate_score_increment(new_score)
            if not validation:
                return Response(
                    {'error': 'Puntuación inválida. Debe ser en incrementos de 0.5'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer.save()
        
        # Recalcular totales
        self._recalculate_evaluation_totals(serializer.instance.evaluation)
        
        # Crear log de auditoría
        self._create_audit_log(serializer.instance, 'update', old_score)
    
    @action(detail=False, methods=['post'])
    def validate_score(self, request):
        """Validar una puntuación sin guardarla"""
        score_str = request.data.get('score')
        parameter_id = request.data.get('parameter_id')
        
        if not score_str or not parameter_id:
            return Response(
                {'error': 'score y parameter_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            score = Decimal(str(score_str))
            parameter = EvaluationParameter.objects.get(id=parameter_id)
            
            # Validar incrementos FEI
            increment_valid = self.calculator.validate_score_increment(score)
            range_valid = self.calculator.validate_score_range(score, parameter.min_score, parameter.max_score)
            
            return Response({
                'is_valid': increment_valid and range_valid,
                'increment_valid': increment_valid,
                'range_valid': range_valid,
                'formatted_score': self.calculator.utils.formatScore(str(score)) if increment_valid else None,
                'percentage': self.calculator.calculate_percentage(score, parameter.max_score) if range_valid else None
            })
            
        except (ValueError, EvaluationParameter.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Actualización masiva de puntuaciones"""
        scores_data = request.data.get('scores', [])
        
        if not scores_data:
            return Response(
                {'error': 'Se requiere lista de puntuaciones'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_scores = []
        errors = []
        
        with transaction.atomic():
            for score_data in scores_data:
                try:
                    score_id = score_data.get('id')
                    new_score = Decimal(str(score_data.get('score')))
                    justification = score_data.get('justification', '')
                    
                    if score_id:
                        # Actualizar existente
                        score_entry = ScoreEntry.objects.get(id=score_id)
                        old_score = score_entry.score
                        
                        # Validar
                        if not self.calculator.validate_score_increment(new_score):
                            errors.append({
                                'id': score_id,
                                'error': 'Puntuación inválida'
                            })
                            continue
                        
                        score_entry.score = new_score
                        score_entry.justification = justification
                        score_entry.updated_at = timezone.now()
                        score_entry.save()
                        
                        # Auditoría
                        self._create_audit_log(score_entry, 'update', old_score)
                    else:
                        # Crear nueva
                        evaluation_id = score_data.get('evaluation_id')
                        parameter_id = score_data.get('parameter_id')
                        
                        if not evaluation_id or not parameter_id:
                            errors.append({
                                'error': 'evaluation_id y parameter_id requeridos para nuevas entradas',
                                'data': score_data
                            })
                            continue
                        
                        score_entry = ScoreEntry.objects.create(
                            evaluation_id=evaluation_id,
                            parameter_id=parameter_id,
                            score=new_score,
                            justification=justification
                        )
                        
                        # Auditoría
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
    
    @action(detail=False, methods=['get'])
    def judge_scorecard(self, request):
        """Obtener tarjeta de puntuación para un juez"""
        competition_id = request.query_params.get('competition_id')
        rider_id = request.query_params.get('rider_id')
        horse_id = request.query_params.get('horse_id')
        
        if not all([competition_id, rider_id, horse_id]):
            return Response(
                {'error': 'competition_id, rider_id y horse_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Buscar o crear evaluación
            evaluation, created = JudgeEvaluation.objects.get_or_create(
                judge_id=request.user.id,
                competition_id=competition_id,
                rider_id=rider_id,
                horse_id=horse_id,
                defaults={
                    'status': 'draft',
                    'total_score': Decimal('0.00'),
                    'percentage': Decimal('0.00')
                }
            )
            
            # Obtener parámetros para la competencia
            parameters = EvaluationParameter.objects.filter(
                competition_id=competition_id,
                is_active=True
            ).order_by('code')
            
            # Obtener puntuaciones existentes
            existing_scores = ScoreEntry.objects.filter(
                evaluation=evaluation
            ).select_related('parameter')
            
            return Response({
                'evaluation': JudgeEvaluationSerializer(evaluation).data,
                'parameters': EvaluationParameterSerializer(parameters, many=True).data,
                'existing_scores': ScoreEntrySerializer(existing_scores, many=True).data,
                'can_edit': evaluation.status in ['draft', 'submitted'],
                'is_new': created
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _recalculate_evaluation_totals(self, evaluation):
        """Recalcular totales de una evaluación"""
        try:
            scores = ScoreEntry.objects.filter(evaluation=evaluation)
            
            if not scores.exists():
                evaluation.total_score = Decimal('0.00')
                evaluation.percentage = Decimal('0.00')
                evaluation.save()
                return
            
            # Preparar datos para el calculador
            parameter_scores = {}
            for score in scores:
                parameter_scores[score.parameter.code] = {
                    'score': score.score,
                    'weight': score.parameter.weight,
                    'max_score': score.parameter.max_score
                }
            
            # Calcular totales
            result = self.calculator.calculate_total_score(parameter_scores)
            
            evaluation.total_score = result['total_score']
            evaluation.percentage = result['percentage']
            evaluation.save()
            
        except Exception as e:
            # Log error but don't break the flow
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error recalculando evaluación {evaluation.id}: {e}")
    
    def _create_audit_log(self, score_entry, action, old_score=None):
        """Crear log de auditoría para cambios en puntuaciones"""
        try:
            from .models import ScoreAuditLog
            
            ScoreAuditLog.objects.create(
                score_entry=score_entry,
                user=self.request.user,
                action=action,
                old_score=old_score,
                new_score=score_entry.score,
                timestamp=timezone.now(),
                ip_address=self.request.META.get('REMOTE_ADDR'),
                user_agent=self.request.META.get('HTTP_USER_AGENT', '')[:255]
            )
        except Exception:
            # Log error but don't break the flow
            pass


class JudgeEvaluationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para evaluaciones de jueces
    Proporciona cálculos automáticos y estadísticas
    """
    queryset = JudgeEvaluation.objects.all()
    serializer_class = JudgeEvaluationSerializer
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.calculator = FEIScoreCalculator()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        competition_id = self.request.query_params.get('competition_id')
        judge_id = self.request.query_params.get('judge_id')
        rider_id = self.request.query_params.get('rider_id')
        status = self.request.query_params.get('status')
        
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        if judge_id:
            queryset = queryset.filter(judge_id=judge_id)
        if rider_id:
            queryset = queryset.filter(rider_id=rider_id)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.select_related('judge', 'rider', 'horse', 'competition')
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Enviar evaluación final"""
        evaluation = self.get_object()
        
        if evaluation.judge_id != request.user.id:
            return Response(
                {'error': 'Solo puedes enviar tus propias evaluaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if evaluation.status == 'final':
            return Response(
                {'error': 'Evaluación ya está finalizada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar completitud
        scores = ScoreEntry.objects.filter(evaluation=evaluation)
        parameters_count = EvaluationParameter.objects.filter(
            competition=evaluation.competition,
            is_active=True
        ).count()
        
        if scores.count() != parameters_count:
            return Response(
                {'error': 'Evaluación incompleta. Faltan puntuaciones'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Finalizar evaluación
        evaluation.status = 'final'
        evaluation.submission_time = timezone.now()
        evaluation.save()
        
        return Response({
            'message': 'Evaluación enviada exitosamente',
            'evaluation': JudgeEvaluationSerializer(evaluation).data
        })
    
    @action(detail=False, methods=['get'])
    def my_evaluations(self, request):
        """Obtener evaluaciones del juez actual"""
        evaluations = self.get_queryset().filter(judge=request.user)
        serializer = self.get_serializer(evaluations, many=True)
        
        return Response({
            'evaluations': serializer.data,
            'total_count': evaluations.count(),
            'draft_count': evaluations.filter(status='draft').count(),
            'submitted_count': evaluations.filter(status='submitted').count(),
            'final_count': evaluations.filter(status='final').count()
        })
    
    @action(detail=False, methods=['get'])
    def competition_progress(self, request):
        """Progreso de evaluaciones en una competencia"""
        competition_id = request.query_params.get('competition_id')
        
        if not competition_id:
            return Response(
                {'error': 'competition_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            stats_calculator = FEIStatisticsCalculator()
            
            # Obtener evaluaciones de la competencia
            evaluations = self.get_queryset().filter(competition_id=competition_id)
            
            # Preparar datos para el calculador de estadísticas
            eval_data = []
            for evaluation in evaluations:
                eval_data.append({
                    'rider_id': evaluation.rider_id,
                    'rider_name': evaluation.rider.name if evaluation.rider else 'Desconocido',
                    'horse_id': evaluation.horse_id,
                    'horse_name': evaluation.horse.name if evaluation.horse else 'Desconocido',
                    'judge_evaluations': [{
                        'judge_id': evaluation.judge_id,
                        'judge_name': evaluation.judge.get_full_name() if evaluation.judge else 'Desconocido',
                        'total_score': evaluation.total_score,
                        'percentage': evaluation.percentage
                    }]
                })
            
            # Calcular estadísticas
            stats = stats_calculator.calculate_competition_statistics(eval_data)
            
            return Response(stats)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CompetitionRankingView(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para rankings y resultados de competencias
    """
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ranking_calculator = FEIRankingCalculator()
        self.stats_calculator = FEIStatisticsCalculator()
    
    def get_queryset(self):
        return JudgeEvaluation.objects.none()  # No queryset base necesario
    
    @action(detail=False, methods=['get'])
    def live_rankings(self, request):
        """Rankings en tiempo real de una competencia"""
        competition_id = request.query_params.get('competition_id')
        category_id = request.query_params.get('category_id')
        
        if not competition_id:
            return Response(
                {'error': 'competition_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Obtener evaluaciones
            evaluations_query = JudgeEvaluation.objects.filter(
                competition_id=competition_id,
                status__in=['submitted', 'final']
            ).select_related('judge', 'rider', 'horse')
            
            if category_id:
                evaluations_query = evaluations_query.filter(category_id=category_id)
            
            # Agrupar por participante
            participants_data = {}
            for evaluation in evaluations_query:
                key = f"{evaluation.rider_id}_{evaluation.horse_id}"
                
                if key not in participants_data:
                    participants_data[key] = {
                        'rider_id': evaluation.rider_id,
                        'rider_name': evaluation.rider.name if evaluation.rider else 'Desconocido',
                        'horse_id': evaluation.horse_id,
                        'horse_name': evaluation.horse.name if evaluation.horse else 'Desconocido',
                        'judge_evaluations': []
                    }
                
                participants_data[key]['judge_evaluations'].append({
                    'judge_id': evaluation.judge_id,
                    'judge_name': evaluation.judge.get_full_name() if evaluation.judge else 'Desconocido',
                    'total_score': evaluation.total_score,
                    'percentage': evaluation.percentage
                })
            
            # Calcular rankings
            rankings = self.ranking_calculator.calculate_competition_rankings(
                list(participants_data.values())
            )
            
            return Response({
                'competition_id': competition_id,
                'category_id': category_id,
                'rankings': rankings,
                'last_updated': timezone.now().isoformat(),
                'total_participants': len(rankings)
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def anomaly_detection(self, request):
        """Detectar anomalías en las puntuaciones"""
        competition_id = request.query_params.get('competition_id')
        
        if not competition_id:
            return Response(
                {'error': 'competition_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Obtener datos para detección de anomalías
            evaluations = JudgeEvaluation.objects.filter(
                competition_id=competition_id,
                status__in=['submitted', 'final']
            ).select_related('judge', 'rider', 'horse')
            
            # Preparar datos
            participants_data = {}
            for evaluation in evaluations:
                key = f"{evaluation.rider_id}_{evaluation.horse_id}"
                
                if key not in participants_data:
                    participants_data[key] = {
                        'rider_name': evaluation.rider.name if evaluation.rider else 'Desconocido',
                        'horse_name': evaluation.horse.name if evaluation.horse else 'Desconocido',
                        'judge_scores': []
                    }
                
                participants_data[key]['judge_scores'].append({
                    'judge_id': evaluation.judge_id,
                    'judge_name': evaluation.judge.get_full_name() if evaluation.judge else 'Desconocido',
                    'percentage': evaluation.percentage
                })
            
            # Detectar anomalías
            rankings_list = list(participants_data.values())
            anomalies = self.ranking_calculator.detect_ranking_anomalies(rankings_list)
            
            return Response({
                'competition_id': competition_id,
                'anomalies': anomalies,
                'anomalies_count': len(anomalies),
                'analysis_date': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )