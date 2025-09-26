from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count, Avg, Sum, Max, Min
from django.core.cache import cache
import json

from .models import (
    LiveRanking,
    LiveRankingEntry,
    RankingSnapshot,
    RankingRule,
    TeamRanking
)
from .serializers import (
    LiveRankingSerializer,
    LiveRankingDetailSerializer,
    LiveRankingEntrySerializer,
    RankingSnapshotSerializer,
    RankingRuleSerializer,
    TeamRankingSerializer,
    RankingStatsSerializer,
    QuickRankingSerializer,
    CompetitionRankingOverviewSerializer,
    ParticipantRankingHistorySerializer,
    BulkRankingUpdateSerializer,
    RankingExportSerializer
)
from apps.users.permissions import IsAdminOrOrganizer, IsJudgeOrAbove
from apps.competitions.models import Competition, Category, Participant
from apps.scoring.models import ScoreCard


class LiveRankingViewSet(viewsets.ModelViewSet):
    """ViewSet para rankings en vivo"""
    queryset = LiveRanking.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LiveRankingDetailSerializer
        return LiveRankingSerializer

    def get_permissions(self):
        """Permisos basados en la acción"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminOrOrganizer]
        elif self.action in ['force_update', 'bulk_update']:
            permission_classes = [IsJudgeOrAbove]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filtrar queryset según usuario y parámetros"""
        queryset = LiveRanking.objects.select_related(
            'competition', 'category'
        ).prefetch_related('entries__participant')

        # Filtros
        competition_id = self.request.query_params.get('competition')
        category_id = self.request.query_params.get('category')
        status_filter = self.request.query_params.get('status')
        is_public = self.request.query_params.get('is_public')

        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if is_public is not None:
            queryset = queryset.filter(is_public=is_public.lower() == 'true')

        # Solo mostrar rankings públicos para usuarios no autorizados
        user = self.request.user
        if not (user.is_staff or hasattr(user, 'organizer_profile') or hasattr(user, 'judge_profile')):
            queryset = queryset.filter(is_public=True, is_live=True)

        return queryset.order_by('-last_updated')

    @action(detail=True, methods=['post'])
    def force_update(self, request, pk=None):
        """Forzar actualización del ranking"""
        ranking = self.get_object()

        try:
            ranking.update_rankings()

            # Crear snapshot
            RankingSnapshot.objects.create(
                live_ranking=ranking,
                round_number=ranking.round_number,
                event_trigger='manual_update',
                total_participants=ranking.entries.count(),
                active_participants=ranking.entries.filter(is_active=True, is_eliminated=False).count(),
                notes=f"Actualización manual por {request.user.email}"
            )

            # Limpiar caché
            cache.delete(f'ranking_{ranking.id}_entries')

            return Response({
                'success': True,
                'message': 'Ranking actualizado correctamente',
                'last_updated': ranking.last_updated,
                'total_entries': ranking.entries.count()
            })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def entries(self, request, pk=None):
        """Obtener entradas del ranking con paginación"""
        ranking = self.get_object()

        # Obtener desde caché si está disponible
        cache_key = f'ranking_{ranking.id}_entries'
        cached_entries = cache.get(cache_key)

        if cached_entries and not request.query_params.get('force_refresh'):
            return Response(cached_entries)

        # Obtener entradas desde base de datos
        entries = ranking.entries.select_related('participant__user').order_by('position')

        # Aplicar filtros
        position_from = request.query_params.get('position_from')
        position_to = request.query_params.get('position_to')
        search = request.query_params.get('search')

        if position_from:
            entries = entries.filter(position__gte=position_from)
        if position_to:
            entries = entries.filter(position__lte=position_to)
        if search:
            entries = entries.filter(
                Q(participant__rider_name__icontains=search) |
                Q(participant__horse_name__icontains=search) |
                Q(participant__number__icontains=search)
            )

        serializer = LiveRankingEntrySerializer(entries, many=True)
        data = serializer.data

        # Cachear resultado por 30 segundos
        cache.set(cache_key, data, 30)

        return Response(data)

    @action(detail=True, methods=['get'])
    def quick_view(self, request, pk=None):
        """Vista rápida del ranking (top 10)"""
        ranking = self.get_object()

        top_entries = ranking.entries.select_related('participant').order_by('position')[:10]
        serializer = QuickRankingSerializer(top_entries, many=True)

        return Response({
            'ranking_name': ranking.name,
            'competition': ranking.competition.name,
            'last_updated': ranking.last_updated,
            'total_participants': ranking.entries.count(),
            'top_entries': serializer.data
        })

    @action(detail=True, methods=['post'])
    def create_snapshot(self, request, pk=None):
        """Crear instantánea manual del ranking"""
        ranking = self.get_object()

        snapshot = RankingSnapshot.objects.create(
            live_ranking=ranking,
            round_number=ranking.round_number,
            event_trigger=request.data.get('event_trigger', 'manual_snapshot'),
            total_participants=ranking.entries.count(),
            active_participants=ranking.entries.filter(is_active=True, is_eliminated=False).count(),
            notes=request.data.get('notes', f"Snapshot manual por {request.user.email}")
        )

        serializer = RankingSnapshotSerializer(snapshot)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Actualización masiva de rankings"""
        serializer = BulkRankingUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        competition = get_object_or_404(Competition, id=data['competition_id'])

        # Filtrar rankings a actualizar
        rankings_query = LiveRanking.objects.filter(
            competition=competition,
            status='active'
        )

        if data.get('category_ids'):
            rankings_query = rankings_query.filter(category_id__in=data['category_ids'])

        updated_rankings = []
        errors = []

        for ranking in rankings_query:
            try:
                if data.get('round_number'):
                    ranking.round_number = data['round_number']
                    ranking.save()

                ranking.update_rankings()
                updated_rankings.append(ranking.id)

            except Exception as e:
                errors.append(f"Error en ranking {ranking.id}: {str(e)}")

        return Response({
            'success': len(errors) == 0,
            'updated_rankings': updated_rankings,
            'errors': errors,
            'total_updated': len(updated_rankings)
        })


class LiveRankingEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para entradas de ranking (solo lectura)"""
    queryset = LiveRankingEntry.objects.all()
    serializer_class = LiveRankingEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrar entradas según parámetros"""
        queryset = LiveRankingEntry.objects.select_related(
            'ranking', 'participant__user'
        ).order_by('ranking', 'position')

        # Filtros
        ranking_id = self.request.query_params.get('ranking')
        participant_id = self.request.query_params.get('participant')
        position_from = self.request.query_params.get('position_from')
        position_to = self.request.query_params.get('position_to')

        if ranking_id:
            queryset = queryset.filter(ranking_id=ranking_id)
        if participant_id:
            queryset = queryset.filter(participant_id=participant_id)
        if position_from:
            queryset = queryset.filter(position__gte=position_from)
        if position_to:
            queryset = queryset.filter(position__lte=position_to)

        return queryset

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Historial de posiciones de una entrada"""
        entry = self.get_object()

        # Obtener snapshots que incluyan esta entrada
        snapshots = RankingSnapshot.objects.filter(
            live_ranking=entry.ranking
        ).order_by('-snapshot_time')[:20]

        history = []
        for snapshot in snapshots:
            # Aquí se podría implementar un sistema de histórico más detallado
            history.append({
                'timestamp': snapshot.snapshot_time,
                'round_number': snapshot.round_number,
                'event_trigger': snapshot.event_trigger,
                'position': entry.position,  # Simplificado
                'score': entry.current_score
            })

        return Response({
            'participant': entry.participant.rider_name,
            'ranking': entry.ranking.name,
            'history': history
        })


class RankingSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para instantáneas de ranking"""
    queryset = RankingSnapshot.objects.all()
    serializer_class = RankingSnapshotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = RankingSnapshot.objects.select_related('live_ranking')

        # Filtros
        ranking_id = self.request.query_params.get('ranking')
        round_number = self.request.query_params.get('round')

        if ranking_id:
            queryset = queryset.filter(live_ranking_id=ranking_id)
        if round_number:
            queryset = queryset.filter(round_number=round_number)

        return queryset.order_by('-snapshot_time')


class RankingRuleViewSet(viewsets.ModelViewSet):
    """ViewSet para reglas de ranking"""
    queryset = RankingRule.objects.all()
    serializer_class = RankingRuleSerializer
    permission_classes = [IsAdminOrOrganizer]

    def get_queryset(self):
        queryset = RankingRule.objects.select_related('competition')

        competition_id = self.request.query_params.get('competition')
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)

        return queryset.order_by('priority', 'name')

    @action(detail=True, methods=['post'])
    def test_rule(self, request, pk=None):
        """Probar una regla contra datos de ejemplo"""
        rule = self.get_object()

        # Obtener una muestra de entradas para probar
        sample_entries = LiveRankingEntry.objects.filter(
            ranking__competition=rule.competition
        )[:10]

        results = []
        for entry in sample_entries:
            try:
                result = rule.evaluate_participant(entry)
                results.append({
                    'participant': entry.participant.rider_name,
                    'current_score': entry.current_score,
                    'rule_result': result,
                    'field_value': getattr(entry, rule.field_name, None)
                })
            except Exception as e:
                results.append({
                    'participant': entry.participant.rider_name,
                    'error': str(e)
                })

        return Response({
            'rule_name': rule.name,
            'test_results': results,
            'passed_count': sum(1 for r in results if r.get('rule_result')),
            'total_tested': len(results)
        })


class TeamRankingViewSet(viewsets.ModelViewSet):
    """ViewSet para rankings por equipos"""
    queryset = TeamRanking.objects.all()
    serializer_class = TeamRankingSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminOrOrganizer]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = TeamRanking.objects.select_related('competition')

        competition_id = self.request.query_params.get('competition')
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)

        return queryset.order_by('position')

    @action(detail=True, methods=['post'])
    def calculate_scores(self, request, pk=None):
        """Recalcular puntuaciones del equipo"""
        team_ranking = self.get_object()

        try:
            team_ranking.calculate_team_score()

            return Response({
                'success': True,
                'team_name': team_ranking.team_name,
                'total_score': team_ranking.total_score,
                'members_count': team_ranking.members_count,
                'qualified_members': team_ranking.qualified_members
            })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def update_all_teams(self, request):
        """Actualizar todos los equipos de una competencia"""
        competition_id = request.data.get('competition_id')
        if not competition_id:
            return Response({
                'error': 'competition_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        team_rankings = TeamRanking.objects.filter(competition_id=competition_id)
        updated_teams = []

        for team in team_rankings:
            try:
                team.calculate_team_score()
                updated_teams.append(team.team_name)
            except Exception as e:
                continue

        # Reordenar posiciones
        teams_ordered = list(team_rankings.order_by('-total_score'))
        for position, team in enumerate(teams_ordered, 1):
            team.position = position
            team.save()

        return Response({
            'success': True,
            'updated_teams': updated_teams,
            'total_teams': len(updated_teams)
        })


class RankingStatsViewSet(viewsets.ViewSet):
    """ViewSet para estadísticas de rankings"""
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Estadísticas generales de rankings"""
        stats = self._calculate_general_stats()
        serializer = RankingStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def competition_overview(self, request):
        """Vista general de rankings por competencia"""
        competition_id = request.query_params.get('competition_id')
        if not competition_id:
            return Response({
                'error': 'competition_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        competition = get_object_or_404(Competition, id=competition_id)
        rankings = LiveRanking.objects.filter(competition=competition)

        overview = {
            'competition_id': competition.id,
            'competition_name': competition.name,
            'total_rankings': rankings.count(),
            'active_rankings': rankings.filter(status='active').count(),
            'total_participants': Participant.objects.filter(competition=competition).count(),
            'categories': list(rankings.values_list('category__name', flat=True).distinct()),
            'last_update': rankings.aggregate(Max('last_updated'))['last_updated__max'],
            'rankings': LiveRankingSerializer(rankings, many=True).data
        }

        return Response(overview)

    @action(detail=False, methods=['get'])
    def participant_history(self, request):
        """Historial de ranking de un participante"""
        participant_id = request.query_params.get('participant_id')
        if not participant_id:
            return Response({
                'error': 'participant_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)

        participant = get_object_or_404(Participant, id=participant_id)

        # Obtener historial de entradas en rankings
        entries = LiveRankingEntry.objects.filter(
            participant=participant
        ).select_related('ranking').order_by('-created_at')

        history = {
            'participant_id': participant.id,
            'participant_name': participant.rider_name,
            'horse_name': participant.horse_name,
            'position_history': list(entries.values_list('position', flat=True)),
            'score_history': list(entries.values_list('current_score', flat=True)),
            'best_position': entries.aggregate(Min('position'))['position__min'] or 0,
            'current_position': entries.first().position if entries.exists() else 0,
            'total_competitions': entries.values('ranking__competition').distinct().count(),
            'win_rate': self._calculate_win_rate(participant)
        }

        return Response(history)

    def _calculate_general_stats(self):
        """Calcular estadísticas generales"""
        return {
            'total_competitions': Competition.objects.count(),
            'active_rankings': LiveRanking.objects.filter(status='active').count(),
            'total_participants': Participant.objects.count(),
            'completed_rounds': ScoreCard.objects.filter(status='completed').count(),
            'average_score': ScoreCard.objects.aggregate(Avg('final_score'))['final_score__avg'] or 0,
            'highest_score': ScoreCard.objects.aggregate(Max('final_score'))['final_score__max'] or 0,
            'lowest_score': ScoreCard.objects.aggregate(Min('final_score'))['final_score__min'] or 0,
            'score_distribution': {},  # Se podría implementar un análisis más detallado
            'recent_updates': []  # Lista de actualizaciones recientes
        }

    def _calculate_win_rate(self, participant):
        """Calcular tasa de victorias de un participante"""
        total_competitions = LiveRankingEntry.objects.filter(
            participant=participant
        ).values('ranking__competition').distinct().count()

        wins = LiveRankingEntry.objects.filter(
            participant=participant,
            position=1
        ).count()

        return (wins / total_competitions * 100) if total_competitions > 0 else 0