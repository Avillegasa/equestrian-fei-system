"""
Servicios para el sistema de rankings
"""

import logging
from datetime import timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg, Max, Min
from django.core.cache import cache
from django.conf import settings
from celery import shared_task

from .models import (
    LiveRanking,
    LiveRankingEntry,
    RankingSnapshot,
    RankingRule,
    TeamRanking
)
from apps.competitions.models import Competition, Participant
from apps.scoring.models import ScoreCard

logger = logging.getLogger(__name__)


class RankingCalculationService:
    """Servicio para cálculos de rankings"""

    def __init__(self):
        self.cache_timeout = getattr(settings, 'RANKING_CACHE_TIMEOUT', 300)  # 5 minutos

    def calculate_live_ranking(self, ranking: LiveRanking) -> Dict[str, Any]:
        """
        Calcular ranking en tiempo real
        """
        try:
            # Verificar si necesita actualización
            if not self._needs_update(ranking):
                return {
                    'success': True,
                    'message': 'Ranking no necesita actualización',
                    'updated': False
                }

            # Obtener participantes y calcular puntuaciones
            participants_data = self._get_participants_data(ranking)

            # Aplicar reglas de ranking
            participants_data = self._apply_ranking_rules(ranking, participants_data)

            # Ordenar participantes
            ranked_participants = self._sort_participants(ranking, participants_data)

            # Actualizar entradas del ranking
            updated_entries = self._update_ranking_entries(ranking, ranked_participants)

            # Crear snapshot si es necesario
            if ranking.auto_publish:
                self._create_auto_snapshot(ranking)

            # Limpiar cache
            self._clear_ranking_cache(ranking)

            logger.info(f"Ranking {ranking.name} actualizado con {len(updated_entries)} entradas")

            return {
                'success': True,
                'message': 'Ranking actualizado correctamente',
                'updated': True,
                'total_entries': len(updated_entries),
                'last_updated': ranking.last_updated
            }

        except Exception as e:
            logger.error(f"Error calculando ranking {ranking.id}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'updated': False
            }

    def _needs_update(self, ranking: LiveRanking) -> bool:
        """Verificar si el ranking necesita actualización"""
        if not ranking.is_live:
            return False

        # Verificar frecuencia de actualización
        if ranking.last_updated:
            time_since_update = timezone.now() - ranking.last_updated
            if time_since_update.total_seconds() < ranking.update_frequency:
                return False

        # Verificar si hay nuevas puntuaciones
        latest_score = ScoreCard.objects.filter(
            participant__competition=ranking.competition,
            status__in=['completed', 'validated', 'published']
        ).aggregate(latest=Max('updated_at'))['latest']

        if latest_score and ranking.last_updated:
            return latest_score > ranking.last_updated

        return True

    def _get_participants_data(self, ranking: LiveRanking) -> List[Dict[str, Any]]:
        """Obtener datos de participantes para el ranking"""
        participants_query = Participant.objects.filter(
            competition=ranking.competition
        ).select_related('user')

        if ranking.category:
            participants_query = participants_query.filter(category=ranking.category)

        participants_data = []

        for participant in participants_query:
            # Obtener tarjetas de puntuación válidas
            score_cards = ScoreCard.objects.filter(
                participant=participant,
                status__in=['completed', 'validated', 'published']
            )

            if ranking.round_number > 0:
                score_cards = score_cards.filter(round_number__lte=ranking.round_number)

            if score_cards.exists():
                stats = self._calculate_participant_stats(score_cards, ranking.calculation_method)

                participant_data = {
                    'participant': participant,
                    'total_score': stats['total_score'],
                    'best_score': stats['best_score'],
                    'average_score': stats['average_score'],
                    'rounds_completed': stats['rounds_completed'],
                    'total_penalties': stats['total_penalties'],
                    'technical_score': stats['technical_score'],
                    'artistic_score': stats['artistic_score'],
                    'time_score': stats['time_score'],
                    'consistency_score': stats['consistency_score'],
                    'recent_trend': stats['recent_trend']
                }

                participants_data.append(participant_data)

        return participants_data

    def _calculate_participant_stats(self, score_cards, calculation_method: str) -> Dict[str, Any]:
        """Calcular estadísticas de un participante"""
        stats = score_cards.aggregate(
            total_score=Sum('final_score'),
            best_score=Max('final_score'),
            average_score=Avg('final_score'),
            rounds_completed=Count('id'),
            total_penalties=Sum('penalty_score'),
            technical_total=Sum('technical_score'),
            artistic_total=Sum('artistic_score'),
            time_total=Sum('time_score')
        )

        # Calcular puntuación según método
        if calculation_method == 'best':
            final_score = stats['best_score'] or 0
        elif calculation_method == 'average':
            final_score = stats['average_score'] or 0
        else:  # cumulative (default)
            final_score = stats['total_score'] or 0

        # Calcular consistencia
        scores = list(score_cards.values_list('final_score', flat=True))
        consistency_score = self._calculate_consistency(scores)

        # Calcular tendencia reciente
        recent_trend = self._calculate_recent_trend(scores)

        return {
            'total_score': final_score,
            'best_score': stats['best_score'] or 0,
            'average_score': stats['average_score'] or 0,
            'rounds_completed': stats['rounds_completed'] or 0,
            'total_penalties': stats['total_penalties'] or 0,
            'technical_score': stats['technical_total'] or 0,
            'artistic_score': stats['artistic_total'] or 0,
            'time_score': stats['time_total'] or 0,
            'consistency_score': consistency_score,
            'recent_trend': recent_trend
        }

    def _calculate_consistency(self, scores: List[float]) -> float:
        """Calcular puntuación de consistencia"""
        if len(scores) <= 1:
            return 100.0

        import statistics
        try:
            mean_score = statistics.mean(scores)
            std_dev = statistics.stdev(scores)

            if mean_score == 0:
                return 0.0

            # Consistencia inversa a la desviación estándar (normalizada)
            consistency = max(0, 100 - (std_dev / mean_score * 100))
            return round(consistency, 2)

        except (statistics.StatisticsError, ZeroDivisionError):
            return 0.0

    def _calculate_recent_trend(self, scores: List[float]) -> str:
        """Calcular tendencia reciente de puntuaciones"""
        if len(scores) < 3:
            return 'insufficient_data'

        # Tomar las últimas 3 puntuaciones
        recent_scores = scores[-3:]

        # Calcular tendencia
        if recent_scores[-1] > recent_scores[0]:
            return 'improving'
        elif recent_scores[-1] < recent_scores[0]:
            return 'declining'
        else:
            return 'stable'

    def _apply_ranking_rules(self, ranking: LiveRanking, participants_data: List[Dict]) -> List[Dict]:
        """Aplicar reglas de ranking específicas"""
        rules = RankingRule.objects.filter(
            competition=ranking.competition,
            is_active=True
        ).order_by('priority')

        for rule in rules:
            participants_data = self._apply_single_rule(rule, participants_data)

        return participants_data

    def _apply_single_rule(self, rule: RankingRule, participants_data: List[Dict]) -> List[Dict]:
        """Aplicar una regla específica"""
        # Esta implementación puede expandirse según las necesidades
        # Por ahora, maneja reglas básicas de eliminación y penalización

        if rule.rule_type == 'elimination':
            # Marcar participantes para eliminación basado en la regla
            for data in participants_data:
                field_value = data.get(rule.field_name)
                if field_value is not None and self._evaluate_rule_condition(field_value, rule):
                    data['is_eliminated'] = True
                    data['elimination_reason'] = rule.action

        elif rule.rule_type == 'penalty':
            # Aplicar penalizaciones adicionales
            for data in participants_data:
                field_value = data.get(rule.field_name)
                if field_value is not None and self._evaluate_rule_condition(field_value, rule):
                    penalty = float(rule.threshold_value)
                    data['total_penalties'] = data.get('total_penalties', 0) + penalty

        return participants_data

    def _evaluate_rule_condition(self, field_value: Any, rule: RankingRule) -> bool:
        """Evaluar condición de una regla"""
        threshold = float(rule.threshold_value)

        if rule.operator == 'gt':
            return float(field_value) > threshold
        elif rule.operator == 'gte':
            return float(field_value) >= threshold
        elif rule.operator == 'lt':
            return float(field_value) < threshold
        elif rule.operator == 'lte':
            return float(field_value) <= threshold
        elif rule.operator == 'eq':
            return float(field_value) == threshold
        elif rule.operator == 'ne':
            return float(field_value) != threshold

        return False

    def _sort_participants(self, ranking: LiveRanking, participants_data: List[Dict]) -> List[Dict]:
        """Ordenar participantes según criterios de ranking"""
        discipline_name = ranking.competition.discipline.name.lower() if ranking.competition.discipline else ''

        # Para ciertas disciplinas, menor puntuación es mejor
        reverse_order = 'eventing' not in discipline_name and 'cross' not in discipline_name

        # Función de ordenamiento personalizada
        def sort_key(participant_data):
            # Los eliminados van al final
            if participant_data.get('is_eliminated', False):
                return (1, 0, 0, 0)  # Los eliminados al final

            score = participant_data['total_score']
            penalties = participant_data.get('total_penalties', 0)
            best_score = participant_data.get('best_score', 0)
            rounds = participant_data.get('rounds_completed', 0)

            if reverse_order:
                return (0, -score, penalties, -best_score, -rounds)
            else:
                return (0, score, -penalties, best_score, rounds)

        return sorted(participants_data, key=sort_key)

    def _update_ranking_entries(self, ranking: LiveRanking, ranked_participants: List[Dict]) -> List[LiveRankingEntry]:
        """Actualizar entradas del ranking"""
        # Obtener entradas existentes para comparar posiciones
        existing_entries = {
            entry.participant_id: entry for entry in ranking.entries.all()
        }

        updated_entries = []

        for position, participant_data in enumerate(ranked_participants, 1):
            participant = participant_data['participant']

            # Obtener entrada existente o crear nueva
            if participant.id in existing_entries:
                entry = existing_entries[participant.id]
                entry.previous_position = entry.position
                entry.previous_score = entry.current_score
            else:
                entry = LiveRankingEntry(
                    ranking=ranking,
                    participant=participant
                )

            # Actualizar datos de la entrada
            entry.position = position
            entry.current_score = Decimal(str(participant_data['total_score']))
            entry.total_penalties = Decimal(str(participant_data.get('total_penalties', 0)))
            entry.rounds_completed = participant_data.get('rounds_completed', 0)
            entry.best_score = Decimal(str(participant_data.get('best_score', 0)))
            entry.average_score = Decimal(str(participant_data.get('average_score', 0)))
            entry.technical_score = Decimal(str(participant_data.get('technical_score', 0)))
            entry.artistic_score = Decimal(str(participant_data.get('artistic_score', 0)))
            entry.time_score = Decimal(str(participant_data.get('time_score', 0)))
            entry.consistency_score = Decimal(str(participant_data.get('consistency_score', 0)))
            entry.improvement_trend = participant_data.get('recent_trend', 'stable')
            entry.is_eliminated = participant_data.get('is_eliminated', False)
            entry.elimination_reason = participant_data.get('elimination_reason', '')

            # Calcular cambio de posición
            entry.calculate_position_change()

            entry.save()
            updated_entries.append(entry)

        # Eliminar entradas de participantes que ya no están en la competencia
        current_participant_ids = [p['participant'].id for p in ranked_participants]
        ranking.entries.exclude(participant_id__in=current_participant_ids).delete()

        # Actualizar timestamp del ranking
        ranking.last_updated = timezone.now()
        ranking.save()

        return updated_entries

    def _create_auto_snapshot(self, ranking: LiveRanking):
        """Crear snapshot automático si se cumplen las condiciones"""
        # Crear snapshot cada cierto número de actualizaciones o tiempo
        last_snapshot = ranking.snapshots.order_by('-snapshot_time').first()

        if not last_snapshot or (timezone.now() - last_snapshot.snapshot_time).total_seconds() > 3600:  # 1 hora
            RankingSnapshot.objects.create(
                live_ranking=ranking,
                round_number=ranking.round_number,
                event_trigger='auto_update',
                total_participants=ranking.entries.count(),
                active_participants=ranking.entries.filter(is_active=True, is_eliminated=False).count(),
                notes=f"Snapshot automático - {timezone.now()}"
            )

    def _clear_ranking_cache(self, ranking: LiveRanking):
        """Limpiar cache relacionado con el ranking"""
        cache_keys = [
            f'ranking_{ranking.id}_entries',
            f'ranking_{ranking.id}_quick',
            f'competition_{ranking.competition_id}_rankings'
        ]

        for key in cache_keys:
            cache.delete(key)


class TeamRankingService:
    """Servicio para rankings por equipos"""

    def calculate_team_rankings(self, competition: Competition) -> Dict[str, Any]:
        """Calcular rankings por equipos"""
        try:
            # Obtener todos los equipos de la competencia
            team_names = Participant.objects.filter(
                competition=competition
            ).exclude(
                team_name__isnull=True
            ).exclude(
                team_name__exact=''
            ).values_list('team_name', flat=True).distinct()

            updated_teams = []

            for team_name in team_names:
                team_ranking, created = TeamRanking.objects.get_or_create(
                    competition=competition,
                    team_name=team_name,
                    defaults={
                        'team_code': team_name[:10].upper(),
                        'position': 999  # Posición temporal
                    }
                )

                # Calcular puntuación del equipo
                team_ranking.calculate_team_score()
                updated_teams.append(team_ranking)

            # Reordenar posiciones basado en puntuaciones
            teams_ordered = sorted(updated_teams, key=lambda t: (-t.total_score, t.team_name))

            for position, team in enumerate(teams_ordered, 1):
                team.position = position
                team.save()

            return {
                'success': True,
                'message': f'{len(updated_teams)} equipos actualizados',
                'updated_teams': len(updated_teams)
            }

        except Exception as e:
            logger.error(f"Error calculando rankings de equipos: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Tareas Celery para procesamiento en background

@shared_task
def update_live_rankings():
    """Tarea periódica para actualizar rankings en vivo"""
    service = RankingCalculationService()

    # Obtener rankings activos que necesiten actualización
    active_rankings = LiveRanking.objects.filter(
        status='active',
        is_live=True
    )

    results = {
        'total_processed': 0,
        'successful_updates': 0,
        'errors': []
    }

    for ranking in active_rankings:
        try:
            result = service.calculate_live_ranking(ranking)
            results['total_processed'] += 1

            if result['success'] and result['updated']:
                results['successful_updates'] += 1

        except Exception as e:
            results['errors'].append(f"Ranking {ranking.id}: {str(e)}")

    logger.info(f"Actualización automática completada: {results}")
    return results


@shared_task
def update_team_rankings(competition_id: str):
    """Tarea para actualizar rankings por equipos"""
    try:
        competition = Competition.objects.get(id=competition_id)
        service = TeamRankingService()
        result = service.calculate_team_rankings(competition)

        logger.info(f"Rankings de equipos actualizados para {competition.name}: {result}")
        return result

    except Competition.DoesNotExist:
        error = f"Competencia {competition_id} no encontrada"
        logger.error(error)
        return {'success': False, 'error': error}
    except Exception as e:
        error = f"Error actualizando rankings de equipos: {str(e)}"
        logger.error(error)
        return {'success': False, 'error': error}


@shared_task
def cleanup_old_snapshots():
    """Limpiar snapshots antiguos"""
    try:
        # Eliminar snapshots más antiguos de 30 días
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = RankingSnapshot.objects.filter(
            snapshot_time__lt=cutoff_date
        ).count()

        RankingSnapshot.objects.filter(
            snapshot_time__lt=cutoff_date
        ).delete()

        logger.info(f"Limpieza de snapshots completada: {deleted_count} eliminados")
        return {'success': True, 'deleted_count': deleted_count}

    except Exception as e:
        error = f"Error limpiando snapshots: {str(e)}"
        logger.error(error)
        return {'success': False, 'error': error}


@shared_task
def generate_ranking_analytics():
    """Generar análisis y estadísticas de rankings"""
    try:
        # Esta tarea podría generar reportes de análisis avanzados
        # Por ahora solo actualiza estadísticas básicas

        active_competitions = Competition.objects.filter(
            status='active'
        ).count()

        total_rankings = LiveRanking.objects.filter(
            status='active'
        ).count()

        total_participants = Participant.objects.count()

        analytics = {
            'active_competitions': active_competitions,
            'total_rankings': total_rankings,
            'total_participants': total_participants,
            'generated_at': timezone.now().isoformat()
        }

        # Cachear estadísticas por 1 hora
        cache.set('ranking_analytics', analytics, 3600)

        logger.info(f"Analytics generados: {analytics}")
        return analytics

    except Exception as e:
        error = f"Error generando analytics: {str(e)}"
        logger.error(error)
        return {'success': False, 'error': error}