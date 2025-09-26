"""
Tareas programadas para el sistema de rankings
"""

import logging
from celery import shared_task
from celery.schedules import crontab
from django.utils import timezone
from django.conf import settings

from .services import (
    RankingCalculationService,
    TeamRankingService,
    update_live_rankings,
    update_team_rankings,
    cleanup_old_snapshots,
    generate_ranking_analytics
)
from .models import LiveRanking, TeamRanking
from apps.competitions.models import Competition

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def calculate_single_ranking(self, ranking_id: str):
    """
    Calcular un ranking específico
    """
    try:
        ranking = LiveRanking.objects.get(id=ranking_id)
        service = RankingCalculationService()
        result = service.calculate_live_ranking(ranking)

        logger.info(f"Ranking {ranking.name} calculado: {result}")
        return result

    except LiveRanking.DoesNotExist:
        error = f"Ranking {ranking_id} no encontrado"
        logger.error(error)
        return {'success': False, 'error': error}

    except Exception as e:
        error = f"Error calculando ranking {ranking_id}: {str(e)}"
        logger.error(error)

        # Reintento automático
        if self.request.retries < self.max_retries:
            logger.info(f"Reintentando cálculo de ranking {ranking_id} en 30 segundos...")
            raise self.retry(countdown=30, exc=e)

        return {'success': False, 'error': error}


@shared_task(bind=True, max_retries=2)
def bulk_update_competition_rankings(self, competition_id: str):
    """
    Actualizar todos los rankings de una competencia
    """
    try:
        competition = Competition.objects.get(id=competition_id)
        service = RankingCalculationService()

        rankings = LiveRanking.objects.filter(
            competition=competition,
            status='active'
        )

        results = {
            'competition': competition.name,
            'total_rankings': rankings.count(),
            'successful_updates': 0,
            'failed_updates': 0,
            'errors': []
        }

        for ranking in rankings:
            try:
                result = service.calculate_live_ranking(ranking)
                if result['success']:
                    results['successful_updates'] += 1
                else:
                    results['failed_updates'] += 1
                    results['errors'].append(f"Ranking {ranking.name}: {result.get('error', 'Unknown error')}")

            except Exception as e:
                results['failed_updates'] += 1
                results['errors'].append(f"Ranking {ranking.name}: {str(e)}")

        logger.info(f"Actualización masiva completada para {competition.name}: {results}")
        return results

    except Competition.DoesNotExist:
        error = f"Competencia {competition_id} no encontrada"
        logger.error(error)
        return {'success': False, 'error': error}

    except Exception as e:
        error = f"Error en actualización masiva: {str(e)}"
        logger.error(error)

        # Reintento con delay más largo
        if self.request.retries < self.max_retries:
            logger.info(f"Reintentando actualización masiva en 60 segundos...")
            raise self.retry(countdown=60, exc=e)

        return {'success': False, 'error': error}


@shared_task
def update_ranking_on_score_change(score_card_id: str):
    """
    Actualizar rankings cuando cambia una puntuación
    """
    try:
        from apps.scoring.models import ScoreCard

        score_card = ScoreCard.objects.select_related(
            'participant__competition'
        ).get(id=score_card_id)

        # Encontrar rankings afectados
        affected_rankings = LiveRanking.objects.filter(
            competition=score_card.participant.competition,
            status='active',
            is_live=True
        )

        # Filtrar por categoría si aplica
        if score_card.participant.category:
            affected_rankings = affected_rankings.filter(
                Q(category=score_card.participant.category) | Q(category__isnull=True)
            )

        service = RankingCalculationService()
        updated_rankings = []

        for ranking in affected_rankings:
            try:
                result = service.calculate_live_ranking(ranking)
                if result['success'] and result['updated']:
                    updated_rankings.append(ranking.name)

                    # Enviar actualización via WebSocket
                    send_ranking_update.delay(str(ranking.id))

            except Exception as e:
                logger.error(f"Error actualizando ranking {ranking.name}: {str(e)}")

        logger.info(f"Rankings actualizados por cambio de puntuación: {updated_rankings}")
        return {
            'success': True,
            'updated_rankings': updated_rankings,
            'score_card': str(score_card_id)
        }

    except Exception as e:
        error = f"Error procesando cambio de puntuación: {str(e)}"
        logger.error(error)
        return {'success': False, 'error': error}


@shared_task
def send_ranking_update(ranking_id: str):
    """
    Enviar actualización de ranking via WebSocket
    """
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        ranking = LiveRanking.objects.get(id=ranking_id)
        channel_layer = get_channel_layer()

        # Datos a enviar
        update_data = {
            'type': 'ranking_update',
            'ranking_id': str(ranking.id),
            'ranking_name': ranking.name,
            'competition_id': str(ranking.competition.id),
            'last_updated': ranking.last_updated.isoformat(),
            'total_participants': ranking.entries.count(),
            'round_number': ranking.round_number
        }

        # Enviar a grupo de competencia
        group_name = f'competition_{ranking.competition.id}'
        async_to_sync(channel_layer.group_send)(group_name, {
            'type': 'ranking_update',
            'data': update_data
        })

        # Enviar a grupo específico de ranking
        ranking_group = f'ranking_{ranking.id}'
        async_to_sync(channel_layer.group_send)(ranking_group, {
            'type': 'ranking_update',
            'data': update_data
        })

        logger.info(f"Actualización WebSocket enviada para ranking {ranking.name}")
        return {'success': True, 'ranking': ranking.name}

    except Exception as e:
        error = f"Error enviando actualización WebSocket: {str(e)}"
        logger.error(error)
        return {'success': False, 'error': error}


@shared_task
def generate_competition_report(competition_id: str, report_type: str = 'final'):
    """
    Generar reporte de competencia con rankings finales
    """
    try:
        competition = Competition.objects.get(id=competition_id)

        # Esta función se expandiría para generar reportes completos
        # Por ahora, crea snapshots finales de todos los rankings

        rankings = LiveRanking.objects.filter(
            competition=competition,
            status__in=['active', 'completed']
        )

        snapshots_created = []

        for ranking in rankings:
            snapshot = ranking.snapshots.create(
                round_number=ranking.round_number,
                event_trigger=f'{report_type}_report',
                total_participants=ranking.entries.count(),
                active_participants=ranking.entries.filter(
                    is_active=True,
                    is_eliminated=False
                ).count(),
                notes=f"Snapshot para reporte {report_type} - {timezone.now()}"
            )
            snapshots_created.append(snapshot.id)

        logger.info(f"Reporte generado para {competition.name}: {len(snapshots_created)} snapshots")

        return {
            'success': True,
            'competition': competition.name,
            'report_type': report_type,
            'snapshots_created': len(snapshots_created)
        }

    except Competition.DoesNotExist:
        error = f"Competencia {competition_id} no encontrada"
        logger.error(error)
        return {'success': False, 'error': error}

    except Exception as e:
        error = f"Error generando reporte: {str(e)}"
        logger.error(error)
        return {'success': False, 'error': error}


@shared_task
def archive_completed_competitions():
    """
    Archivar competencias completadas y sus rankings
    """
    try:
        # Encontrar competencias completadas hace más de 7 días
        cutoff_date = timezone.now() - timezone.timedelta(days=7)

        completed_competitions = Competition.objects.filter(
            status='completed',
            end_date__lt=cutoff_date
        )

        archived_count = 0

        for competition in completed_competitions:
            # Archivar rankings de la competencia
            rankings_updated = LiveRanking.objects.filter(
                competition=competition
            ).update(status='archived', is_live=False)

            # Crear snapshot final si no existe
            final_snapshots = []
            for ranking in competition.live_rankings.all():
                if not ranking.snapshots.filter(event_trigger='final_archive').exists():
                    snapshot = ranking.snapshots.create(
                        round_number=ranking.round_number,
                        event_trigger='final_archive',
                        total_participants=ranking.entries.count(),
                        active_participants=ranking.entries.filter(
                            is_active=True,
                            is_eliminated=False
                        ).count(),
                        notes=f"Snapshot final de archivo - {timezone.now()}"
                    )
                    final_snapshots.append(snapshot.id)

            archived_count += 1
            logger.info(f"Competencia archivada: {competition.name} ({rankings_updated} rankings, {len(final_snapshots)} snapshots finales)")

        return {
            'success': True,
            'archived_competitions': archived_count,
            'cutoff_date': cutoff_date.isoformat()
        }

    except Exception as e:
        error = f"Error archivando competencias: {str(e)}"
        logger.error(error)
        return {'success': False, 'error': error}


@shared_task
def calculate_global_statistics():
    """
    Calcular estadísticas globales del sistema de rankings
    """
    try:
        from django.db.models import Q, Count, Sum, Avg, Max, Min
        from django.core.cache import cache

        stats = {
            'timestamp': timezone.now().isoformat(),
            'competitions': {
                'total': Competition.objects.count(),
                'active': Competition.objects.filter(status='active').count(),
                'completed': Competition.objects.filter(status='completed').count()
            },
            'rankings': {
                'total': LiveRanking.objects.count(),
                'active': LiveRanking.objects.filter(status='active').count(),
                'public': LiveRanking.objects.filter(is_public=True).count()
            },
            'participants': {
                'total': Competition.objects.aggregate(
                    total=Sum('participants__count')
                )['total'] or 0,
                'with_scores': LiveRanking.objects.aggregate(
                    total=Sum('entries__count')
                )['total'] or 0
            },
            'snapshots': {
                'total': RankingSnapshot.objects.count(),
                'last_24h': RankingSnapshot.objects.filter(
                    snapshot_time__gte=timezone.now() - timezone.timedelta(days=1)
                ).count()
            }
        }

        # Cachear estadísticas por 6 horas
        cache.set('global_ranking_stats', stats, 21600)

        logger.info(f"Estadísticas globales calculadas: {stats}")
        return stats

    except Exception as e:
        error = f"Error calculando estadísticas globales: {str(e)}"
        logger.error(error)
        return {'success': False, 'error': error}


# Configuración de tareas periódicas (se debe agregar al settings de Celery)
"""
Para agregar al settings.py o celery.py:

from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Actualizar rankings cada 30 segundos
    'update-live-rankings': {
        'task': 'apps.rankings.services.update_live_rankings',
        'schedule': 30.0,
    },

    # Generar analytics cada hora
    'generate-ranking-analytics': {
        'task': 'apps.rankings.services.generate_ranking_analytics',
        'schedule': crontab(minute=0),
    },

    # Limpiar snapshots antiguos diariamente a las 2 AM
    'cleanup-old-snapshots': {
        'task': 'apps.rankings.services.cleanup_old_snapshots',
        'schedule': crontab(hour=2, minute=0),
    },

    # Archivar competencias completadas semanalmente
    'archive-completed-competitions': {
        'task': 'apps.rankings.tasks.archive_completed_competitions',
        'schedule': crontab(hour=1, minute=0, day_of_week=1),  # Lunes a la 1 AM
    },

    # Calcular estadísticas globales cada 6 horas
    'calculate-global-statistics': {
        'task': 'apps.rankings.tasks.calculate_global_statistics',
        'schedule': crontab(minute=0, hour='*/6'),
    },
}
"""