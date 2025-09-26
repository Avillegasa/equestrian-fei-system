"""
WebSocket consumers para actualizaciones de rankings en tiempo real
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model

from .models import LiveRanking, LiveRankingEntry
from .serializers import LiveRankingSerializer, LiveRankingEntrySerializer
from apps.competitions.models import Competition

User = get_user_model()
logger = logging.getLogger(__name__)


class RankingConsumer(AsyncWebsocketConsumer):
    """Consumer para actualizaciones de rankings específicos"""

    async def connect(self):
        """Manejar conexión WebSocket"""
        self.ranking_id = self.scope['url_route']['kwargs']['ranking_id']
        self.ranking_group_name = f'ranking_{self.ranking_id}'

        # Verificar si el ranking existe
        ranking_exists = await self.check_ranking_exists(self.ranking_id)
        if not ranking_exists:
            await self.close(code=4004)
            return

        # Verificar permisos del usuario
        if not await self.check_user_permissions(self.ranking_id):
            await self.close(code=4003)
            return

        # Unirse al grupo del ranking
        await self.channel_layer.group_add(
            self.ranking_group_name,
            self.channel_name
        )

        await self.accept()

        # Enviar datos iniciales
        await self.send_initial_data()

        logger.info(f"User {self.scope['user']} connected to ranking {self.ranking_id}")

    async def disconnect(self, close_code):
        """Manejar desconexión WebSocket"""
        # Salir del grupo del ranking
        await self.channel_layer.group_discard(
            self.ranking_group_name,
            self.channel_name
        )

        logger.info(f"User {self.scope['user']} disconnected from ranking {self.ranking_id} with code {close_code}")

    async def receive(self, text_data):
        """Manejar mensajes del cliente"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')

            if message_type == 'request_update':
                # Cliente solicita actualización manual
                await self.send_ranking_data()

            elif message_type == 'subscribe_entries':
                # Cliente quiere suscribirse a actualizaciones de entradas específicas
                entry_ids = text_data_json.get('entry_ids', [])
                await self.subscribe_to_entries(entry_ids)

            elif message_type == 'ping':
                # Ping para mantener conexión activa
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))

        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            await self.send_error("Error processing message")

    async def ranking_update(self, event):
        """Enviar actualización de ranking al cliente"""
        await self.send(text_data=json.dumps({
            'type': 'ranking_update',
            'data': event['data'],
            'timestamp': event.get('timestamp')
        }))

    async def entry_update(self, event):
        """Enviar actualización de entrada específica"""
        await self.send(text_data=json.dumps({
            'type': 'entry_update',
            'data': event['data'],
            'entry_id': event['entry_id'],
            'timestamp': event.get('timestamp')
        }))

    async def position_change(self, event):
        """Enviar cambios de posición"""
        await self.send(text_data=json.dumps({
            'type': 'position_change',
            'data': event['data'],
            'timestamp': event.get('timestamp')
        }))

    async def new_participant(self, event):
        """Enviar notificación de nuevo participante"""
        await self.send(text_data=json.dumps({
            'type': 'new_participant',
            'data': event['data'],
            'timestamp': event.get('timestamp')
        }))

    # Helper methods

    @database_sync_to_async
    def check_ranking_exists(self, ranking_id):
        """Verificar si el ranking existe"""
        try:
            LiveRanking.objects.get(id=ranking_id)
            return True
        except LiveRanking.DoesNotExist:
            return False

    @database_sync_to_async
    def check_user_permissions(self, ranking_id):
        """Verificar permisos del usuario para ver el ranking"""
        try:
            user = self.scope['user']

            if isinstance(user, AnonymousUser):
                # Usuarios anónimos solo pueden ver rankings públicos
                ranking = LiveRanking.objects.get(id=ranking_id)
                return ranking.is_public

            # Usuarios autenticados pueden ver más rankings
            ranking = LiveRanking.objects.get(id=ranking_id)

            # Staff puede ver todos
            if user.is_staff:
                return True

            # Organizadores pueden ver rankings de sus competencias
            if hasattr(user, 'organizer_profile'):
                return ranking.competition.organizers.filter(id=user.id).exists()

            # Jueces pueden ver rankings donde participan
            if hasattr(user, 'judge_profile'):
                return ranking.competition.judges.filter(id=user.id).exists()

            # Para el resto, solo rankings públicos
            return ranking.is_public

        except LiveRanking.DoesNotExist:
            return False

    async def send_initial_data(self):
        """Enviar datos iniciales al conectarse"""
        try:
            ranking_data = await self.get_ranking_data()

            await self.send(text_data=json.dumps({
                'type': 'initial_data',
                'data': ranking_data,
                'timestamp': ranking_data.get('last_updated')
            }))

        except Exception as e:
            logger.error(f"Error sending initial data: {e}")
            await self.send_error("Error loading initial data")

    async def send_ranking_data(self):
        """Enviar datos actualizados del ranking"""
        try:
            ranking_data = await self.get_ranking_data()

            await self.send(text_data=json.dumps({
                'type': 'ranking_data',
                'data': ranking_data,
                'timestamp': ranking_data.get('last_updated')
            }))

        except Exception as e:
            logger.error(f"Error sending ranking data: {e}")
            await self.send_error("Error loading ranking data")

    @database_sync_to_async
    def get_ranking_data(self):
        """Obtener datos del ranking desde la base de datos"""
        try:
            ranking = LiveRanking.objects.select_related('competition', 'category').get(id=self.ranking_id)

            # Serializar el ranking
            ranking_serializer = LiveRankingSerializer(ranking)
            ranking_data = ranking_serializer.data

            # Obtener entradas del ranking (top 20 para WebSocket)
            entries = ranking.entries.select_related('participant__user').order_by('position')[:20]
            entries_serializer = LiveRankingEntrySerializer(entries, many=True)

            ranking_data['entries'] = entries_serializer.data
            ranking_data['total_entries'] = ranking.entries.count()

            return ranking_data

        except LiveRanking.DoesNotExist:
            return None

    async def subscribe_to_entries(self, entry_ids):
        """Suscribirse a actualizaciones de entradas específicas"""
        # Aquí se podría implementar suscripción granular a entradas específicas
        # Por simplicidad, por ahora todas las actualizaciones van al grupo principal
        pass

    async def send_error(self, message):
        """Enviar mensaje de error al cliente"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))


class CompetitionRankingsConsumer(AsyncWebsocketConsumer):
    """Consumer para actualizaciones de todos los rankings de una competencia"""

    async def connect(self):
        self.competition_id = self.scope['url_route']['kwargs']['competition_id']
        self.competition_group_name = f'competition_{self.competition_id}'

        # Verificar si la competencia existe
        competition_exists = await self.check_competition_exists(self.competition_id)
        if not competition_exists:
            await self.close(code=4004)
            return

        # Verificar permisos del usuario
        if not await self.check_user_permissions(self.competition_id):
            await self.close(code=4003)
            return

        # Unirse al grupo de la competencia
        await self.channel_layer.group_add(
            self.competition_group_name,
            self.channel_name
        )

        await self.accept()

        # Enviar datos iniciales
        await self.send_initial_data()

        logger.info(f"User {self.scope['user']} connected to competition rankings {self.competition_id}")

    async def disconnect(self, close_code):
        # Salir del grupo de la competencia
        await self.channel_layer.group_discard(
            self.competition_group_name,
            self.channel_name
        )

        logger.info(f"User {self.scope['user']} disconnected from competition {self.competition_id} with code {close_code}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')

            if message_type == 'request_overview':
                await self.send_competition_overview()

            elif message_type == 'subscribe_ranking':
                ranking_id = text_data_json.get('ranking_id')
                if ranking_id:
                    await self.subscribe_to_ranking(ranking_id)

            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))

        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            await self.send_error("Error processing message")

    async def competition_update(self, event):
        """Actualización general de la competencia"""
        await self.send(text_data=json.dumps({
            'type': 'competition_update',
            'data': event['data'],
            'timestamp': event.get('timestamp')
        }))

    async def ranking_created(self, event):
        """Nuevo ranking creado"""
        await self.send(text_data=json.dumps({
            'type': 'ranking_created',
            'data': event['data'],
            'timestamp': event.get('timestamp')
        }))

    async def ranking_updated(self, event):
        """Ranking actualizado"""
        await self.send(text_data=json.dumps({
            'type': 'ranking_updated',
            'data': event['data'],
            'timestamp': event.get('timestamp')
        }))

    # Helper methods

    @database_sync_to_async
    def check_competition_exists(self, competition_id):
        try:
            Competition.objects.get(id=competition_id)
            return True
        except Competition.DoesNotExist:
            return False

    @database_sync_to_async
    def check_user_permissions(self, competition_id):
        try:
            user = self.scope['user']

            if isinstance(user, AnonymousUser):
                # Usuarios anónimos solo pueden ver competencias públicas
                competition = Competition.objects.get(id=competition_id)
                return competition.is_public

            competition = Competition.objects.get(id=competition_id)

            # Staff puede ver todas las competencias
            if user.is_staff:
                return True

            # Organizadores pueden ver sus competencias
            if hasattr(user, 'organizer_profile'):
                return competition.organizers.filter(id=user.id).exists()

            # Jueces pueden ver competencias donde participan
            if hasattr(user, 'judge_profile'):
                return competition.judges.filter(id=user.id).exists()

            # Para el resto, solo competencias públicas
            return competition.is_public

        except Competition.DoesNotExist:
            return False

    async def send_initial_data(self):
        try:
            overview_data = await self.get_competition_overview()

            await self.send(text_data=json.dumps({
                'type': 'initial_data',
                'data': overview_data
            }))

        except Exception as e:
            logger.error(f"Error sending initial data: {e}")
            await self.send_error("Error loading initial data")

    async def send_competition_overview(self):
        try:
            overview_data = await self.get_competition_overview()

            await self.send(text_data=json.dumps({
                'type': 'competition_overview',
                'data': overview_data
            }))

        except Exception as e:
            logger.error(f"Error sending competition overview: {e}")
            await self.send_error("Error loading competition overview")

    @database_sync_to_async
    def get_competition_overview(self):
        try:
            competition = Competition.objects.get(id=self.competition_id)
            rankings = LiveRanking.objects.filter(competition=competition)

            overview = {
                'competition_id': str(competition.id),
                'competition_name': competition.name,
                'total_rankings': rankings.count(),
                'active_rankings': rankings.filter(status='active').count(),
                'public_rankings': rankings.filter(is_public=True).count(),
                'last_update': None
            }

            # Obtener última actualización
            latest_ranking = rankings.order_by('-last_updated').first()
            if latest_ranking and latest_ranking.last_updated:
                overview['last_update'] = latest_ranking.last_updated.isoformat()

            # Resumen de rankings
            rankings_summary = []
            for ranking in rankings.filter(is_public=True)[:10]:  # Top 10 públicos
                rankings_summary.append({
                    'id': str(ranking.id),
                    'name': ranking.name,
                    'status': ranking.status,
                    'total_participants': ranking.entries.count(),
                    'last_updated': ranking.last_updated.isoformat() if ranking.last_updated else None
                })

            overview['rankings'] = rankings_summary

            return overview

        except Competition.DoesNotExist:
            return None

    async def subscribe_to_ranking(self, ranking_id):
        # Suscribirse también al grupo específico del ranking
        ranking_group_name = f'ranking_{ranking_id}'
        await self.channel_layer.group_add(
            ranking_group_name,
            self.channel_name
        )

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))


class AdminRankingConsumer(AsyncWebsocketConsumer):
    """Consumer para administradores con acceso completo"""

    async def connect(self):
        user = self.scope['user']

        # Solo staff puede conectarse
        if isinstance(user, AnonymousUser) or not user.is_staff:
            await self.close(code=4003)
            return

        self.admin_group_name = 'admin_rankings'

        await self.channel_layer.group_add(
            self.admin_group_name,
            self.channel_name
        )

        await self.accept()

        logger.info(f"Admin {user} connected to admin rankings dashboard")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.admin_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')

            if message_type == 'get_system_stats':
                await self.send_system_stats()

            elif message_type == 'monitor_ranking':
                ranking_id = text_data_json.get('ranking_id')
                if ranking_id:
                    await self.monitor_ranking(ranking_id)

        except json.JSONDecodeError:
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error processing admin message: {e}")
            await self.send_error("Error processing message")

    async def system_alert(self, event):
        """Alerta del sistema"""
        await self.send(text_data=json.dumps({
            'type': 'system_alert',
            'data': event['data'],
            'severity': event.get('severity', 'info'),
            'timestamp': event.get('timestamp')
        }))

    async def ranking_error(self, event):
        """Error en ranking específico"""
        await self.send(text_data=json.dumps({
            'type': 'ranking_error',
            'data': event['data'],
            'timestamp': event.get('timestamp')
        }))

    @database_sync_to_async
    def get_system_stats(self):
        """Obtener estadísticas del sistema"""
        total_rankings = LiveRanking.objects.count()
        active_rankings = LiveRanking.objects.filter(status='active').count()
        total_entries = LiveRankingEntry.objects.count()

        return {
            'total_rankings': total_rankings,
            'active_rankings': active_rankings,
            'total_entries': total_entries,
            'system_load': 'normal'  # Placeholder
        }

    async def send_system_stats(self):
        try:
            stats = await self.get_system_stats()

            await self.send(text_data=json.dumps({
                'type': 'system_stats',
                'data': stats
            }))

        except Exception as e:
            logger.error(f"Error sending system stats: {e}")
            await self.send_error("Error loading system stats")

    async def monitor_ranking(self, ranking_id):
        """Monitorear ranking específico"""
        # Suscribirse al grupo del ranking para monitoreo
        ranking_group_name = f'ranking_{ranking_id}'
        await self.channel_layer.group_add(
            ranking_group_name,
            self.channel_name
        )

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))


# Utility functions for sending updates

async def send_ranking_update(ranking_id, update_data):
    """Enviar actualización de ranking a todos los conectados"""
    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    group_name = f'ranking_{ranking_id}'

    await channel_layer.group_send(group_name, {
        'type': 'ranking_update',
        'data': update_data,
        'timestamp': update_data.get('last_updated')
    })

async def send_position_change(ranking_id, change_data):
    """Enviar cambio de posición específico"""
    from channels.layers import get_channel_layer

    channel_layer = get_channel_layer()
    group_name = f'ranking_{ranking_id}'

    await channel_layer.group_send(group_name, {
        'type': 'position_change',
        'data': change_data
    })

async def send_system_alert(message, severity='info'):
    """Enviar alerta del sistema a administradores"""
    from channels.layers import get_channel_layer
    from django.utils import timezone

    channel_layer = get_channel_layer()

    await channel_layer.group_send('admin_rankings', {
        'type': 'system_alert',
        'data': {'message': message},
        'severity': severity,
        'timestamp': timezone.now().isoformat()
    })