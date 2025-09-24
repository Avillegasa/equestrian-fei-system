import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone
from asgiref.sync import sync_to_async

from apps.competitions.models import Competition
from apps.scoring.models import ScoreCard, CompetitionRanking
from apps.users.models import User

logger = logging.getLogger(__name__)


class BaseConsumer(AsyncWebsocketConsumer):
    """Consumidor base con autenticación y utilidades comunes"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.groups = []
    
    async def connect(self):
        """Establecer conexión WebSocket"""
        # Obtener usuario de la sesión
        self.user = self.scope.get('user')
        
        if isinstance(self.user, AnonymousUser):
            await self.close(code=4001)  # Unauthorized
            return
        
        await self.accept()
        
        # Log de conexión
        logger.info(f"WebSocket conectado para usuario: {self.user.id}")
        
        # Unirse al grupo personal de notificaciones
        await self.join_group(f"user_{self.user.id}")
        
        # Lógica específica del consumidor
        await self.handle_connect()
    
    async def disconnect(self, close_code):
        """Desconectar WebSocket"""
        # Salir de todos los grupos
        for group in self.groups:
            await self.channel_layer.group_discard(group, self.channel_name)
        
        logger.info(f"WebSocket desconectado para usuario: {self.user.id if self.user else 'unknown'}")
        
        await self.handle_disconnect(close_code)
    
    async def receive(self, text_data):
        """Recibir mensaje del cliente"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            payload = data.get('payload', {})
            
            await self.handle_message(message_type, payload)
            
        except json.JSONDecodeError:
            await self.send_error("Formato de mensaje inválido")
        except Exception as e:
            logger.error(f"Error procesando mensaje WebSocket: {e}")
            await self.send_error("Error interno del servidor")
    
    async def handle_connect(self):
        """Manejar conexión específica del consumidor"""
        pass
    
    async def handle_disconnect(self, close_code):
        """Manejar desconexión específica del consumidor"""
        pass
    
    async def handle_message(self, message_type, payload):
        """Manejar mensaje específico del consumidor"""
        await self.send_error("Tipo de mensaje no soportado")
    
    async def join_group(self, group_name):
        """Unirse a un grupo"""
        await self.channel_layer.group_add(group_name, self.channel_name)
        self.groups.append(group_name)
    
    async def leave_group(self, group_name):
        """Salir de un grupo"""
        await self.channel_layer.group_discard(group_name, self.channel_name)
        if group_name in self.groups:
            self.groups.remove(group_name)
    
    async def send_message(self, message_type, payload):
        """Enviar mensaje al cliente"""
        await self.send(text_data=json.dumps({
            'type': message_type,
            'payload': payload,
            'timestamp': timezone.now().isoformat()
        }))
    
    async def send_error(self, error_message):
        """Enviar mensaje de error"""
        await self.send_message('error', {'message': error_message})
    
    async def send_success(self, message, data=None):
        """Enviar mensaje de éxito"""
        payload = {'message': message}
        if data:
            payload['data'] = data
        await self.send_message('success', payload)


class CompetitionConsumer(BaseConsumer):
    """Consumidor para actualizaciones de competencias en tiempo real"""
    
    async def handle_connect(self):
        """Configurar grupos de competencias"""
        # Unirse al grupo general de competencias
        await self.join_group("competitions_general")
        
        # Si es organizador o admin, unirse a grupos adicionales
        if self.user.user_type in ['organizer', 'admin']:
            await self.join_group("competitions_admin")
    
    async def handle_message(self, message_type, payload):
        """Manejar mensajes de competencias"""
        if message_type == 'subscribe_competition':
            competition_id = payload.get('competition_id')
            if competition_id:
                # Verificar acceso a la competencia
                has_access = await self.check_competition_access(competition_id)
                if has_access:
                    await self.join_group(f"competition_{competition_id}")
                    await self.send_success(f"Suscrito a competencia {competition_id}")
                else:
                    await self.send_error("Sin acceso a esta competencia")
            else:
                await self.send_error("ID de competencia requerido")
        
        elif message_type == 'unsubscribe_competition':
            competition_id = payload.get('competition_id')
            if competition_id:
                await self.leave_group(f"competition_{competition_id}")
                await self.send_success(f"Desuscrito de competencia {competition_id}")
        
        elif message_type == 'get_competition_status':
            competition_id = payload.get('competition_id')
            if competition_id:
                status = await self.get_competition_status(competition_id)
                await self.send_message('competition_status', status)
        
        else:
            await super().handle_message(message_type, payload)
    
    @database_sync_to_async
    def check_competition_access(self, competition_id):
        """Verificar acceso a competencia"""
        try:
            competition = Competition.objects.get(id=competition_id)
            
            # Admin siempre tiene acceso
            if self.user.user_type == 'admin':
                return True
            
            # Organizadores tienen acceso a sus competencias
            if self.user.user_type == 'organizer':
                return competition.organizer == self.user
            
            # Jueces tienen acceso si están asignados
            if self.user.user_type == 'judge':
                return competition.judges.filter(id=self.user.id).exists()
            
            # Participantes tienen acceso si están inscritos
            if self.user.user_type == 'participant':
                return competition.participants.filter(user=self.user).exists()
            
            return False
        except Competition.DoesNotExist:
            return False
    
    @database_sync_to_async
    def get_competition_status(self, competition_id):
        """Obtener estado actual de la competencia"""
        try:
            competition = Competition.objects.get(id=competition_id)
            
            # Obtener estadísticas básicas
            participant_count = competition.participants.count()
            
            return {
                'competition_id': str(competition.id),
                'name': competition.name,
                'status': competition.status,
                'participant_count': participant_count,
                'start_date': competition.start_date.isoformat() if competition.start_date else None,
                'end_date': competition.end_date.isoformat() if competition.end_date else None,
            }
        except Competition.DoesNotExist:
            return {'error': 'Competencia no encontrada'}
    
    # Manejadores para mensajes del grupo
    async def competition_updated(self, event):
        """Competencia actualizada"""
        await self.send_message('competition_updated', event['data'])
    
    async def participant_registered(self, event):
        """Participante registrado"""
        await self.send_message('participant_registered', event['data'])
    
    async def competition_status_changed(self, event):
        """Estado de competencia cambió"""
        await self.send_message('competition_status_changed', event['data'])


class ScoringConsumer(BaseConsumer):
    """Consumidor para actualizaciones de puntuación en tiempo real"""
    
    async def handle_connect(self):
        """Configurar grupos de puntuación"""
        # Solo jueces y organizadores pueden recibir actualizaciones de scoring
        if self.user.user_type in ['judge', 'organizer', 'admin']:
            await self.join_group("scoring_updates")
    
    async def handle_message(self, message_type, payload):
        """Manejar mensajes de puntuación"""
        if message_type == 'subscribe_scorecard':
            scorecard_id = payload.get('scorecard_id')
            if scorecard_id:
                has_access = await self.check_scorecard_access(scorecard_id)
                if has_access:
                    await self.join_group(f"scorecard_{scorecard_id}")
                    await self.send_success(f"Suscrito a scorecard {scorecard_id}")
                else:
                    await self.send_error("Sin acceso a este scorecard")
        
        elif message_type == 'subscribe_ranking':
            competition_id = payload.get('competition_id')
            if competition_id:
                await self.join_group(f"ranking_{competition_id}")
                await self.send_success(f"Suscrito a rankings de competencia {competition_id}")
        
        elif message_type == 'get_live_scores':
            competition_id = payload.get('competition_id')
            if competition_id:
                scores = await self.get_live_scores(competition_id)
                await self.send_message('live_scores', scores)
        
        else:
            await super().handle_message(message_type, payload)
    
    @database_sync_to_async
    def check_scorecard_access(self, scorecard_id):
        """Verificar acceso a scorecard"""
        try:
            scorecard = ScoreCard.objects.select_related('judge', 'competition').get(id=scorecard_id)
            
            # Admin siempre tiene acceso
            if self.user.user_type == 'admin':
                return True
            
            # Juez que creó el scorecard
            if self.user.user_type == 'judge' and scorecard.judge == self.user:
                return True
            
            # Organizador de la competencia
            if self.user.user_type == 'organizer' and scorecard.competition.organizer == self.user:
                return True
            
            return False
        except ScoreCard.DoesNotExist:
            return False
    
    @database_sync_to_async
    def get_live_scores(self, competition_id):
        """Obtener puntuaciones en vivo"""
        try:
            scorecards = ScoreCard.objects.filter(
                competition_id=competition_id,
                status__in=['in_progress', 'completed']
            ).select_related('participant__user', 'participant__horse').order_by('-final_score')
            
            scores_data = []
            for scorecard in scorecards:
                scores_data.append({
                    'scorecard_id': str(scorecard.id),
                    'participant_name': scorecard.participant.user.get_full_name(),
                    'horse_name': scorecard.participant.horse.name,
                    'final_score': float(scorecard.final_score) if scorecard.final_score else 0,
                    'status': scorecard.status,
                    'position': scorecard.position,
                    'is_disqualified': scorecard.is_disqualified
                })
            
            return {
                'competition_id': competition_id,
                'scores': scores_data,
                'total_participants': len(scores_data)
            }
        except Exception as e:
            return {'error': str(e)}
    
    # Manejadores para mensajes del grupo
    async def score_updated(self, event):
        """Puntuación actualizada"""
        await self.send_message('score_updated', event['data'])
    
    async def ranking_updated(self, event):
        """Ranking actualizado"""
        await self.send_message('ranking_updated', event['data'])
    
    async def scorecard_completed(self, event):
        """Scorecard completado"""
        await self.send_message('scorecard_completed', event['data'])


class NotificationConsumer(BaseConsumer):
    """Consumidor para notificaciones en tiempo real"""
    
    async def handle_connect(self):
        """Configurar grupos de notificaciones"""
        # Cada usuario tiene su propio grupo de notificaciones
        await self.join_group(f"user_{self.user.id}")
        
        # Grupos adicionales según el tipo de usuario
        if self.user.user_type == 'organizer':
            await self.join_group("organizer_notifications")
        elif self.user.user_type == 'judge':
            await self.join_group("judge_notifications")
        elif self.user.user_type == 'participant':
            await self.join_group("participant_notifications")
    
    async def handle_message(self, message_type, payload):
        """Manejar mensajes de notificaciones"""
        if message_type == 'mark_read':
            notification_id = payload.get('notification_id')
            if notification_id:
                await self.mark_notification_read(notification_id)
                await self.send_success("Notificación marcada como leída")
        
        elif message_type == 'get_unread_count':
            count = await self.get_unread_count()
            await self.send_message('unread_count', {'count': count})
        
        else:
            await super().handle_message(message_type, payload)
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Marcar notificación como leída"""
        # Implementar lógica de notificaciones
        pass
    
    @database_sync_to_async
    def get_unread_count(self):
        """Obtener cantidad de notificaciones no leídas"""
        # Implementar lógica de conteo
        return 0
    
    # Manejadores para mensajes del grupo
    async def new_notification(self, event):
        """Nueva notificación"""
        await self.send_message('new_notification', event['data'])
    
    async def notification_read(self, event):
        """Notificación leída"""
        await self.send_message('notification_read', event['data'])


class AdminConsumer(BaseConsumer):
    """Consumidor para administradores - monitoreo del sistema"""
    
    async def handle_connect(self):
        """Solo admins pueden conectarse"""
        if self.user.user_type != 'admin':
            await self.close(code=4003)  # Forbidden
            return
        
        await self.join_group("admin_monitoring")
    
    async def handle_message(self, message_type, payload):
        """Manejar mensajes de administración"""
        if message_type == 'get_system_stats':
            stats = await self.get_system_stats()
            await self.send_message('system_stats', stats)
        
        elif message_type == 'get_active_sessions':
            sessions = await self.get_active_sessions()
            await self.send_message('active_sessions', sessions)
        
        else:
            await super().handle_message(message_type, payload)
    
    @database_sync_to_async
    def get_system_stats(self):
        """Obtener estadísticas del sistema"""
        # Implementar estadísticas en tiempo real
        return {
            'active_competitions': Competition.objects.filter(status='in_progress').count(),
            'total_users': User.objects.filter(is_active=True).count(),
            'active_scorecards': ScoreCard.objects.filter(status='in_progress').count(),
        }
    
    @database_sync_to_async
    def get_active_sessions(self):
        """Obtener sesiones activas"""
        # Implementar conteo de sesiones WebSocket activas
        return {'active_sessions': 0}
    
    # Manejadores para mensajes del grupo
    async def system_alert(self, event):
        """Alerta del sistema"""
        await self.send_message('system_alert', event['data'])
    
    async def performance_update(self, event):
        """Actualización de rendimiento"""
        await self.send_message('performance_update', event['data'])


# Utilidades para enviar mensajes a grupos desde otras partes del código
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

channel_layer = get_channel_layer()

def send_competition_update(competition_id, data):
    """Enviar actualización de competencia"""
    async_to_sync(channel_layer.group_send)(
        f"competition_{competition_id}",
        {
            'type': 'competition_updated',
            'data': data
        }
    )

def send_score_update(scorecard_id, data):
    """Enviar actualización de puntuación"""
    async_to_sync(channel_layer.group_send)(
        f"scorecard_{scorecard_id}",
        {
            'type': 'score_updated',
            'data': data
        }
    )

def send_ranking_update(competition_id, data):
    """Enviar actualización de ranking"""
    async_to_sync(channel_layer.group_send)(
        f"ranking_{competition_id}",
        {
            'type': 'ranking_updated',
            'data': data
        }
    )

    # Manejador para notificaciones
    async def notification_message(self, event):
        """Enviar notificación al usuario"""
        await self.send_message('notification', event['notification'])


def send_user_notification(user_id, notification_data):
    """Enviar notificación a usuario específico"""
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            'type': 'new_notification',
            'data': notification_data
        }
    )

def send_system_alert(alert_data):
    """Enviar alerta del sistema a administradores"""
    async_to_sync(channel_layer.group_send)(
        "admin_monitoring",
        {
            'type': 'system_alert',
            'data': alert_data
        }
    )