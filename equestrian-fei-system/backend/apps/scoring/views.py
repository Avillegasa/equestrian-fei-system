from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Avg, Count, Max, Min, Sum
from django.utils import timezone
from datetime import datetime, timedelta

from .models import (
    ScoringCriteria, ScoreCard, IndividualScore, JumpingFault,
    DressageMovement, EventingPhase, CompetitionRanking, RankingEntry
)
from .serializers import (
    ScoringCriteriaSerializer, ScoreCardDetailSerializer, ScoreCardListSerializer,
    ScoreCardCreateSerializer, IndividualScoreSerializer, JumpingFaultSerializer,
    DressageMovementSerializer, EventingPhaseSerializer, CompetitionRankingSerializer,
    RankingEntrySerializer, CompetitionScoresSummarySerializer,
    JudgeScoresSummarySerializer
)
from apps.competitions.models import Competition, Participant
from apps.users.permissions import CanJudgeCompetition, CanCreateCompetition


class ScoringCriteriaViewSet(viewsets.ModelViewSet):
    """ViewSet para criterios de puntuación"""
    queryset = ScoringCriteria.objects.select_related('discipline').all()
    serializer_class = ScoringCriteriaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = self.queryset
        discipline_id = self.request.query_params.get('discipline', None)
        criteria_type = self.request.query_params.get('type', None)
        
        if discipline_id:
            queryset = queryset.filter(discipline_id=discipline_id)
        
        if criteria_type:
            queryset = queryset.filter(criteria_type=criteria_type)
        
        return queryset.order_by('discipline__name', 'order', 'name')
    
    @action(detail=False, methods=['get'])
    def by_discipline(self, request):
        """Obtener criterios agrupados por disciplina"""
        criteria = self.get_queryset()
        disciplines = {}
        
        for criterion in criteria:
            discipline_name = criterion.discipline.name
            if discipline_name not in disciplines:
                disciplines[discipline_name] = []
            disciplines[discipline_name].append(self.get_serializer(criterion).data)
        
        return Response(disciplines)


class ScoreCardViewSet(viewsets.ModelViewSet):
    """ViewSet para tarjetas de puntuación"""
    queryset = ScoreCard.objects.select_related(
        'participant__competition', 'participant__rider', 'participant__horse', 'participant__category', 'judge'
    ).prefetch_related(
        'individual_scores__criteria',
        'jumping_faults',
        'dressage_movements'
    ).all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ScoreCardListSerializer
        elif self.action == 'create':
            return ScoreCardCreateSerializer
        return ScoreCardDetailSerializer
    
    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user
        
        # Filtrar por competencia
        competition_id = self.request.query_params.get('competition', None)
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        
        # Filtrar por participante
        participant_id = self.request.query_params.get('participant', None)
        if participant_id:
            queryset = queryset.filter(participant_id=participant_id)
        
        # Filtrar por juez
        judge_id = self.request.query_params.get('judge', None)
        if judge_id:
            queryset = queryset.filter(judge_id=judge_id)
        
        # Filtrar por estado
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Permisos: jueces ven solo sus evaluaciones
        if user.role == 'judge':
            queryset = queryset.filter(judge=user)
        elif user.role == 'participant':
            queryset = queryset.filter(participant__rider=user)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def start_evaluation(self, request, pk=None):
        """Iniciar evaluación de un scorecard"""
        scorecard = self.get_object()
        
        if scorecard.status != 'pending':
            return Response(
                {'error': 'El scorecard ya ha sido iniciado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        scorecard.status = 'in_progress'
        scorecard.start_time = timezone.now()
        scorecard.save()
        
        return Response({'message': 'Evaluación iniciada correctamente'})
    
    @action(detail=True, methods=['post'])
    def complete_evaluation(self, request, pk=None):
        """Completar evaluación y calcular puntuación final"""
        scorecard = self.get_object()
        
        if scorecard.status not in ['in_progress', 'completed']:
            return Response(
                {'error': 'El scorecard debe estar en progreso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            scorecard.finish_time = timezone.now()
            scorecard.status = 'completed'
            
            # Recalcular puntuaciones
            scorecard.calculate_scores()
            scorecard.save()
            
            # Actualizar ranking si es necesario
            self._update_competition_ranking(scorecard.competition)
        
        return Response({'message': 'Evaluación completada correctamente'})
    
    @action(detail=True, methods=['post'])
    def validate_scores(self, request, pk=None):
        """Validar puntuaciones (solo organizadores)"""
        if request.user.role != 'organizer':
            return Response(
                {'error': 'Solo los organizadores pueden validar puntuaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        scorecard = self.get_object()
        scorecard.status = 'validated'
        scorecard.save()
        
        return Response({'message': 'Puntuaciones validadas correctamente'})
    
    @action(detail=True, methods=['post'])
    def disqualify(self, request, pk=None):
        """Descalificar participante"""
        scorecard = self.get_object()
        reason = request.data.get('reason', '')
        
        if not reason:
            return Response(
                {'error': 'Debe proporcionar una razón para la descalificación'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        scorecard.is_disqualified = True
        scorecard.disqualification_reason = reason
        scorecard.status = 'completed'
        scorecard.save()
        
        # Actualizar ranking
        self._update_competition_ranking(scorecard.competition)
        
        return Response({'message': 'Participante descalificado correctamente'})
    
    def _update_competition_ranking(self, competition):
        """Actualizar ranking de la competencia"""
        from .utils import calculate_competition_ranking
        calculate_competition_ranking(competition)
    
    @action(detail=False, methods=['get'])
    def my_evaluations(self, request):
        """Obtener evaluaciones del juez actual"""
        if request.user.role != 'judge':
            return Response(
                {'error': 'Solo los jueces pueden ver sus evaluaciones'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset().filter(judge=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class IndividualScoreViewSet(viewsets.ModelViewSet):
    """ViewSet para puntuaciones individuales"""
    queryset = IndividualScore.objects.select_related(
        'scorecard', 'criteria', 'judge'
    ).all()
    serializer_class = IndividualScoreSerializer
    permission_classes = [permissions.IsAuthenticated, CanJudgeCompetition]
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Filtrar por scorecard
        scorecard_id = self.request.query_params.get('scorecard', None)
        if scorecard_id:
            queryset = queryset.filter(scorecard_id=scorecard_id)
        
        # Los jueces solo ven sus propias puntuaciones
        if self.request.user.role == 'judge':
            queryset = queryset.filter(judge=self.request.user)
        
        return queryset.order_by('criteria__order')
    
    def perform_create(self, serializer):
        """Asignar juez actual al crear puntuación"""
        serializer.save(judge=self.request.user)
    
    def perform_update(self, serializer):
        """Recalcular scorecard al actualizar puntuación"""
        instance = serializer.save()
        
        # Recalcular scorecard
        scorecard = instance.scorecard
        scorecard.calculate_scores()
        scorecard.save()


class JumpingFaultViewSet(viewsets.ModelViewSet):
    """ViewSet para faltas de salto"""
    queryset = JumpingFault.objects.select_related('scorecard').all()
    serializer_class = JumpingFaultSerializer
    permission_classes = [permissions.IsAuthenticated, CanJudgeCompetition]
    
    def get_queryset(self):
        queryset = self.queryset
        scorecard_id = self.request.query_params.get('scorecard', None)
        
        if scorecard_id:
            queryset = queryset.filter(scorecard_id=scorecard_id)
        
        return queryset.order_by('obstacle_number')
    
    def perform_create(self, serializer):
        """Recalcular scorecard al crear falta"""
        instance = serializer.save()
        
        scorecard = instance.scorecard
        scorecard.calculate_scores()
        scorecard.save()
    
    def perform_update(self, serializer):
        """Recalcular scorecard al actualizar falta"""
        instance = serializer.save()
        
        scorecard = instance.scorecard
        scorecard.calculate_scores()
        scorecard.save()
    
    def perform_destroy(self, instance):
        """Recalcular scorecard al eliminar falta"""
        scorecard = instance.scorecard
        instance.delete()
        
        scorecard.calculate_scores()
        scorecard.save()


class DressageMovementViewSet(viewsets.ModelViewSet):
    """ViewSet para movimientos de doma"""
    queryset = DressageMovement.objects.select_related('scorecard').all()
    serializer_class = DressageMovementSerializer
    permission_classes = [permissions.IsAuthenticated, CanJudgeCompetition]
    
    def get_queryset(self):
        queryset = self.queryset
        scorecard_id = self.request.query_params.get('scorecard', None)
        
        if scorecard_id:
            queryset = queryset.filter(scorecard_id=scorecard_id)
        
        return queryset.order_by('movement_number')
    
    def perform_create(self, serializer):
        instance = serializer.save()
        scorecard = instance.scorecard
        scorecard.calculate_scores()
        scorecard.save()
    
    def perform_update(self, serializer):
        instance = serializer.save()
        scorecard = instance.scorecard
        scorecard.calculate_scores()
        scorecard.save()


class EventingPhaseViewSet(viewsets.ModelViewSet):
    """ViewSet for eventing phases"""
    queryset = EventingPhase.objects.select_related('scorecard').all()
    serializer_class = EventingPhaseSerializer
    permission_classes = [permissions.IsAuthenticated, CanJudgeCompetition]
    
    def get_queryset(self):
        queryset = self.queryset
        scorecard_id = self.request.query_params.get('scorecard', None)
        
        if scorecard_id:
            queryset = queryset.filter(scorecard_id=scorecard_id)
        
        return queryset.order_by('phase_type')
    
    def perform_create(self, serializer):
        instance = serializer.save()
        scorecard = instance.scorecard
        scorecard.calculate_scores()
        scorecard.save()
    
    def perform_update(self, serializer):
        instance = serializer.save()
        scorecard = instance.scorecard
        scorecard.calculate_scores()
        scorecard.save()


class CompetitionRankingViewSet(viewsets.ModelViewSet):
    """ViewSet para rankings de competencias"""
    queryset = CompetitionRanking.objects.select_related(
        'competition', 'discipline', 'category'
    ).prefetch_related('entries__participant__user', 'entries__participant__horse').all()
    serializer_class = CompetitionRankingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Filtrar por competencia
        competition_id = self.request.query_params.get('competition', None)
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        
        # Filtrar por disciplina
        discipline_id = self.request.query_params.get('discipline', None)
        if discipline_id:
            queryset = queryset.filter(discipline_id=discipline_id)
        
        # Filtrar por categoría
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Solo rankings publicados para participantes
        if self.request.user.role == 'participant':
            queryset = queryset.filter(is_published=True)
        
        return queryset.order_by('-last_updated')
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publicar ranking (solo organizadores)"""
        if request.user.role != 'organizer':
            return Response(
                {'error': 'Solo los organizadores pueden publicar rankings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ranking = self.get_object()
        ranking.is_published = True
        ranking.save()
        
        return Response({'message': 'Ranking publicado correctamente'})
    
    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        """Recalcular ranking"""
        ranking = self.get_object()
        
        from .utils import calculate_competition_ranking
        calculate_competition_ranking(ranking.competition, ranking.discipline, ranking.category)
        
        return Response({'message': 'Ranking recalculado correctamente'})
    
    @action(detail=False, methods=['get'])
    def live(self, request):
        """Obtener rankings en vivo"""
        competition_id = request.query_params.get('competition')
        if not competition_id:
            return Response(
                {'error': 'ID de competencia requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rankings = self.get_queryset().filter(
            competition_id=competition_id,
            is_published=True
        )
        
        serializer = self.get_serializer(rankings, many=True)
        return Response(serializer.data)


class ScoringStatisticsViewSet(viewsets.ViewSet):
    """ViewSet para estadísticas de puntuación"""
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """Endpoint principal de estadísticas"""
        return Response({
            'message': 'Sistema de estadísticas de puntuación',
            'available_endpoints': [
                '/api/scoring/statistics/competition_summary/?competition=<id>',
                '/api/scoring/statistics/judge_performance/?judge=<id>',
                '/api/scoring/statistics/discipline_analysis/?discipline=<id>',
                '/api/scoring/statistics/system_metrics/'
            ],
            'status': 'ready'
        })
    
    @action(detail=False, methods=['get'])
    def competition_summary(self, request):
        """Resumen de puntuaciones por competencia"""
        competition_id = request.query_params.get('competition')
        if not competition_id:
            return Response(
                {'error': 'ID de competencia requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            competition = Competition.objects.get(id=competition_id)
        except Competition.DoesNotExist:
            return Response(
                {'error': 'Competencia no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calcular estadísticas
        scorecards = ScoreCard.objects.filter(competition=competition)
        total_participants = scorecards.count()
        completed = scorecards.filter(status='completed').count()
        pending = scorecards.filter(status__in=['pending', 'in_progress']).count()
        
        scores = scorecards.exclude(is_disqualified=True).aggregate(
            avg_score=Avg('final_score'),
            max_score=Max('final_score'),
            min_score=Min('final_score')
        )
        
        rankings_published = CompetitionRanking.objects.filter(
            competition=competition,
            is_published=True
        ).exists()
        
        data = {
            'competition_id': competition.id,
            'competition_name': competition.name,
            'total_participants': total_participants,
            'completed_evaluations': completed,
            'pending_evaluations': pending,
            'average_score': scores['avg_score'] or 0,
            'highest_score': scores['max_score'] or 0,
            'lowest_score': scores['min_score'] or 0,
            'rankings_published': rankings_published,
            'last_updated': timezone.now()
        }
        
        serializer = CompetitionScoresSummarySerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def judge_summary(self, request):
        """Resumen de evaluaciones por juez"""
        judge_id = request.query_params.get('judge', request.user.id)
        
        try:
            from apps.users.models import User
            judge = User.objects.get(id=judge_id, role='judge')
        except User.DoesNotExist:
            return Response(
                {'error': 'Juez no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        scorecards = ScoreCard.objects.filter(judge=judge)
        total = scorecards.count()
        completed = scorecards.filter(status='completed').count()
        pending = scorecards.filter(status__in=['pending', 'in_progress']).count()
        
        avg_score = scorecards.filter(status='completed').aggregate(
            avg=Avg('final_score')
        )['avg'] or 0
        
        competitions = scorecards.values('competition').distinct().count()
        last_evaluation = scorecards.order_by('-updated_at').first()
        
        data = {
            'judge_id': judge.id,
            'judge_name': judge.get_full_name(),
            'total_evaluations': total,
            'completed_evaluations': completed,
            'pending_evaluations': pending,
            'average_score_given': avg_score,
            'competitions_judged': competitions,
            'last_evaluation': last_evaluation.updated_at if last_evaluation else None
        }
        
        serializer = JudgeScoresSummarySerializer(data)
        return Response(serializer.data)
