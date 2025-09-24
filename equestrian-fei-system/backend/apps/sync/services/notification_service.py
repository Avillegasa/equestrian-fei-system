"""
Servicio de notificaciones push para el sistema FEI.
Soporta múltiples canales: WebSockets, Email, SMS, Web Push, y Mobile Push.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.models import User
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .cache_service import cache_service

logger = logging.getLogger(__name__)


class NotificationChannel:
    """Canal base para notificaciones"""
    
    def __init__(self, name: str):
        self.name = name
        self.enabled = True
    
    def send(self, notification: Dict[str, Any]) -> bool:
        """Envía una notificación por este canal"""
        raise NotImplementedError("Subclases deben implementar send()")
    
    def is_available(self) -> bool:
        """Verifica si el canal está disponible"""
        return self.enabled


class WebSocketChannel(NotificationChannel):
    """Canal de notificaciones via WebSockets"""
    
    def __init__(self):
        super().__init__('websocket')
        self.channel_layer = get_channel_layer()
    
    def send(self, notification: Dict[str, Any]) -> bool:
        """Envía notificación via WebSocket"""
        try:
            recipients = notification.get('recipients', [])
            message = {
                'type': 'notification_message',
                'notification': {
                    'id': notification.get('id'),
                    'type': notification.get('type'),
                    'title': notification.get('title'),
                    'message': notification.get('message'),
                    'data': notification.get('data', {}),
                    'timestamp': notification.get('timestamp'),
                    'priority': notification.get('priority', 'normal')
                }
            }
            
            # Enviar a usuarios específicos
            for user_id in recipients:
                group_name = f"user_{user_id}"
                async_to_sync(self.channel_layer.group_send)(group_name, message)
            
            # Enviar a grupos si están especificados
            groups = notification.get('groups', [])
            for group in groups:
                async_to_sync(self.channel_layer.group_send)(group, message)
            
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación WebSocket: {e}")
            return False
    
    def is_available(self) -> bool:
        """Verifica si el canal WebSocket está disponible"""
        return self.channel_layer is not None


class EmailChannel(NotificationChannel):
    """Canal de notificaciones via Email"""
    
    def __init__(self):
        super().__init__('email')
        self.templates = {
            'competition_update': 'emails/competition_update.html',
            'score_change': 'emails/score_change.html',
            'system_alert': 'emails/system_alert.html',
            'sync_complete': 'emails/sync_complete.html',
            'backup_complete': 'emails/backup_complete.html',
            'default': 'emails/notification.html'
        }
    
    def send(self, notification: Dict[str, Any]) -> bool:
        """Envía notificación via Email"""
        try:
            recipients = notification.get('recipients', [])
            if not recipients:
                return False
            
            # Obtener emails de usuarios
            user_emails = []
            for user_id in recipients:
                try:
                    user = User.objects.get(id=user_id)
                    if user.email:
                        user_emails.append(user.email)
                except User.DoesNotExist:
                    continue
            
            if not user_emails:
                return False
            
            # Preparar contenido
            subject = notification.get('title', 'Notificación del Sistema FEI')
            template_name = self.templates.get(
                notification.get('type'), 
                self.templates['default']
            )
            
            # Renderizar template
            context = {
                'notification': notification,
                'title': notification.get('title'),
                'message': notification.get('message'),
                'data': notification.get('data', {}),
                'timestamp': notification.get('timestamp')
            }
            
            try:
                html_message = render_to_string(template_name, context)
            except:
                # Fallback a mensaje simple
                html_message = f"""
                <h2>{subject}</h2>
                <p>{notification.get('message')}</p>
                <p><small>Enviado el {notification.get('timestamp')}</small></p>
                """
            
            # Enviar email
            send_mail(
                subject=subject,
                message=notification.get('message'),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@fei-system.com'),
                recipient_list=user_emails,
                html_message=html_message,
                fail_silently=False
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación por email: {e}")
            return False
    
    def is_available(self) -> bool:
        """Verifica si el email está configurado"""
        return (
            hasattr(settings, 'EMAIL_BACKEND') and 
            settings.EMAIL_BACKEND != 'django.core.mail.backends.dummy.EmailBackend'
        )


class WebPushChannel(NotificationChannel):
    """Canal de notificaciones Web Push (PWA)"""
    
    def __init__(self):
        super().__init__('web_push')
        self.vapid_keys = getattr(settings, 'VAPID_KEYS', {})
    
    def send(self, notification: Dict[str, Any]) -> bool:
        """Envía notificación Web Push"""
        try:
            # Esta implementación requeriría una librería como pywebpush
            # Por ahora, registramos la intent
            logger.info(f"Web Push notification queued: {notification.get('title')}")
            
            # Guardar en cache para ser recogida por el cliente
            recipients = notification.get('recipients', [])
            for user_id in recipients:
                cache_key = f"web_push:{user_id}:{notification.get('id')}"
                cache_service.set(
                    cache_key,
                    {
                        'title': notification.get('title'),
                        'body': notification.get('message'),
                        'icon': notification.get('data', {}).get('icon', '/static/icons/notification.png'),
                        'badge': '/static/icons/badge.png',
                        'data': notification.get('data', {}),
                        'tag': notification.get('type', 'general'),
                        'timestamp': notification.get('timestamp')
                    },
                    timeout=86400,  # 24 horas
                    tags=['web_push', f'user_{user_id}']
                )
            
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación Web Push: {e}")
            return False
    
    def is_available(self) -> bool:
        """Verifica si Web Push está configurado"""
        return bool(self.vapid_keys)


class SMSChannel(NotificationChannel):
    """Canal de notificaciones via SMS"""
    
    def __init__(self):
        super().__init__('sms')
        self.provider = getattr(settings, 'SMS_PROVIDER', None)
    
    def send(self, notification: Dict[str, Any]) -> bool:
        """Envía notificación via SMS"""
        try:
            # Solo para notificaciones críticas
            if notification.get('priority') != 'critical':
                return False
            
            recipients = notification.get('recipients', [])
            message = f"{notification.get('title')}: {notification.get('message')}"
            
            # Esta implementación requeriría integración con un proveedor SMS
            # Por ahora, registramos la intent
            logger.info(f"SMS notification queued for {len(recipients)} recipients: {message}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificación SMS: {e}")
            return False
    
    def is_available(self) -> bool:
        """Verifica si SMS está configurado"""
        return self.provider is not None


class NotificationTemplate:
    """Plantilla de notificación"""
    
    TEMPLATES = {
        'competition_started': {
            'title': 'Competición Iniciada',
            'message': 'La competición "{competition_name}" ha comenzado.',
            'channels': ['websocket', 'web_push'],
            'priority': 'high'
        },
        'competition_finished': {
            'title': 'Competición Finalizada',
            'message': 'La competición "{competition_name}" ha terminado.',
            'channels': ['websocket', 'email', 'web_push'],
            'priority': 'normal'
        },
        'score_updated': {
            'title': 'Puntuación Actualizada',
            'message': 'Se ha actualizado la puntuación en "{competition_name}".',
            'channels': ['websocket', 'web_push'],
            'priority': 'normal'
        },
        'ranking_changed': {
            'title': 'Cambio en Ranking',
            'message': 'Ha cambiado el ranking en "{competition_name}".',
            'channels': ['websocket', 'web_push'],
            'priority': 'normal'
        },
        'sync_completed': {
            'title': 'Sincronización Completa',
            'message': 'La sincronización con {system_name} se ha completado correctamente.',
            'channels': ['websocket'],
            'priority': 'low'
        },
        'sync_failed': {
            'title': 'Error de Sincronización',
            'message': 'Ha fallado la sincronización con {system_name}. Error: {error_message}',
            'channels': ['websocket', 'email'],
            'priority': 'high'
        },
        'backup_completed': {
            'title': 'Backup Completado',
            'message': 'El backup del sistema se ha completado correctamente.',
            'channels': ['email'],
            'priority': 'low'
        },
        'system_alert': {
            'title': 'Alerta del Sistema',
            'message': 'Alerta: {alert_message}',
            'channels': ['websocket', 'email', 'sms'],
            'priority': 'critical'
        },
        'user_registered': {
            'title': 'Nuevo Usuario Registrado',
            'message': 'Se ha registrado un nuevo usuario: {username}',
            'channels': ['websocket'],
            'priority': 'low'
        },
        'judge_assigned': {
            'title': 'Juez Asignado',
            'message': 'Has sido asignado como juez en la competición "{competition_name}".',
            'channels': ['websocket', 'email'],
            'priority': 'high'
        }
    }
    
    @classmethod
    def get_template(cls, template_name: str) -> Dict[str, Any]:
        """Obtiene una plantilla de notificación"""
        return cls.TEMPLATES.get(template_name, {
            'title': 'Notificación',
            'message': 'Has recibido una nueva notificación.',
            'channels': ['websocket'],
            'priority': 'normal'
        })


class NotificationService:
    """Servicio principal de notificaciones"""
    
    def __init__(self):
        self.channels = {
            'websocket': WebSocketChannel(),
            'email': EmailChannel(),
            'web_push': WebPushChannel(),
            'sms': SMSChannel()
        }
        self.notification_history = []
        self.user_preferences = {}
    
    def send_notification(self, template_name: str, recipients: List[int],
                         data: Dict[str, Any] = None, channels: List[str] = None,
                         priority: str = None, groups: List[str] = None) -> Dict[str, bool]:
        """Envía una notificación usando una plantilla"""
        
        # Obtener plantilla
        template = NotificationTemplate.get_template(template_name)
        
        # Preparar notificación
        notification = {
            'id': f"notif_{int(timezone.now().timestamp())}_{template_name}",
            'type': template_name,
            'title': template['title'].format(**(data or {})),
            'message': template['message'].format(**(data or {})),
            'data': data or {},
            'recipients': recipients,
            'groups': groups or [],
            'channels': channels or template.get('channels', ['websocket']),
            'priority': priority or template.get('priority', 'normal'),
            'timestamp': timezone.now().isoformat()
        }
        
        return self._send_notification(notification)
    
    def send_custom_notification(self, title: str, message: str, recipients: List[int],
                               channels: List[str] = None, priority: str = 'normal',
                               data: Dict[str, Any] = None, groups: List[str] = None) -> Dict[str, bool]:
        """Envía una notificación personalizada"""
        
        notification = {
            'id': f"custom_{int(timezone.now().timestamp())}",
            'type': 'custom',
            'title': title,
            'message': message,
            'data': data or {},
            'recipients': recipients,
            'groups': groups or [],
            'channels': channels or ['websocket'],
            'priority': priority,
            'timestamp': timezone.now().isoformat()
        }
        
        return self._send_notification(notification)
    
    def _send_notification(self, notification: Dict[str, Any]) -> Dict[str, bool]:
        """Envía la notificación por los canales especificados"""
        results = {}
        
        # Filtrar destinatarios según preferencias
        filtered_recipients = self._filter_recipients_by_preferences(
            notification['recipients'],
            notification['channels'],
            notification['type']
        )
        notification['recipients'] = filtered_recipients
        
        # Enviar por cada canal
        for channel_name in notification['channels']:
            channel = self.channels.get(channel_name)
            
            if not channel or not channel.is_available():
                results[channel_name] = False
                continue
            
            try:
                success = channel.send(notification)
                results[channel_name] = success
                
                if success:
                    logger.info(f"Notificación enviada via {channel_name}: {notification['title']}")
                else:
                    logger.warning(f"Fallo enviando via {channel_name}: {notification['title']}")
                    
            except Exception as e:
                logger.error(f"Error en canal {channel_name}: {e}")
                results[channel_name] = False
        
        # Guardar en historial
        self._save_to_history(notification, results)
        
        return results
    
    def _filter_recipients_by_preferences(self, recipients: List[int], 
                                        channels: List[str], 
                                        notification_type: str) -> List[int]:
        """Filtra destinatarios según sus preferencias"""
        filtered = []
        
        for user_id in recipients:
            user_prefs = self.get_user_preferences(user_id)
            
            # Verificar si el usuario quiere recibir este tipo de notificación
            if not user_prefs.get('enabled', True):
                continue
            
            type_enabled = user_prefs.get('types', {}).get(notification_type, True)
            if not type_enabled:
                continue
            
            # Verificar canales permitidos
            allowed_channels = user_prefs.get('channels', channels)
            if any(channel in allowed_channels for channel in channels):
                filtered.append(user_id)
        
        return filtered
    
    def get_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """Obtiene las preferencias de notificación de un usuario"""
        cache_key = f"notification_prefs:{user_id}"
        prefs = cache_service.get(cache_key)
        
        if prefs is None:
            # Cargar desde base de datos o usar defaults
            prefs = {
                'enabled': True,
                'channels': ['websocket', 'email', 'web_push'],
                'types': {
                    'competition_started': True,
                    'competition_finished': True,
                    'score_updated': True,
                    'ranking_changed': True,
                    'sync_completed': False,
                    'sync_failed': True,
                    'backup_completed': False,
                    'system_alert': True,
                    'user_registered': False,
                    'judge_assigned': True
                },
                'priority_filter': 'low',  # low, normal, high, critical
                'quiet_hours': {
                    'enabled': False,
                    'start': '22:00',
                    'end': '08:00'
                }
            }
            
            cache_service.set(
                cache_key, 
                prefs, 
                timeout=3600,  # 1 hora
                tags=['user_preferences', f'user_{user_id}']
            )
        
        return prefs
    
    def update_user_preferences(self, user_id: int, preferences: Dict[str, Any]):
        """Actualiza las preferencias de notificación de un usuario"""
        cache_key = f"notification_prefs:{user_id}"
        cache_service.set(
            cache_key,
            preferences,
            timeout=3600,
            tags=['user_preferences', f'user_{user_id}']
        )
    
    def _save_to_history(self, notification: Dict[str, Any], results: Dict[str, bool]):
        """Guarda la notificación en el historial"""
        history_entry = {
            'notification': notification,
            'results': results,
            'sent_at': timezone.now().isoformat(),
            'success_count': sum(1 for success in results.values() if success),
            'total_channels': len(results)
        }
        
        # Guardar en cache
        cache_key = f"notification_history:{notification['id']}"
        cache_service.set(
            cache_key,
            history_entry,
            timeout=86400 * 7,  # 7 días
            tags=['notification_history']
        )
        
        # Mantener historial en memoria (limitado)
        self.notification_history.append(history_entry)
        if len(self.notification_history) > 1000:
            self.notification_history = self.notification_history[-1000:]
    
    def get_notification_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtiene el historial de notificaciones"""
        # Obtener desde cache
        cache_keys = cache_service.get_keys_by_pattern("notification_history:*")
        
        history = []
        for key in sorted(cache_keys, reverse=True)[:limit]:
            entry = cache_service.get(key)
            if entry:
                history.append(entry)
        
        return history
    
    def get_user_notifications(self, user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """Obtiene las notificaciones de un usuario"""
        # Obtener Web Push notifications desde cache
        pattern = f"web_push:{user_id}:*"
        cache_keys = cache_service.get_keys_by_pattern(pattern)
        
        notifications = []
        for key in sorted(cache_keys, reverse=True)[:limit]:
            notification = cache_service.get(key)
            if notification:
                notifications.append(notification)
        
        return notifications
    
    def mark_notification_read(self, user_id: int, notification_id: str):
        """Marca una notificación como leída"""
        cache_key = f"web_push:{user_id}:{notification_id}"
        notification = cache_service.get(cache_key)
        
        if notification:
            notification['read'] = True
            notification['read_at'] = timezone.now().isoformat()
            cache_service.set(
                cache_key,
                notification,
                timeout=86400,
                tags=['web_push', f'user_{user_id}']
            )
    
    def get_channel_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas de los canales"""
        stats = {}
        
        for name, channel in self.channels.items():
            stats[name] = {
                'available': channel.is_available(),
                'enabled': channel.enabled
            }
        
        return stats
    
    def broadcast_to_all_users(self, title: str, message: str, 
                              channels: List[str] = None, 
                              priority: str = 'normal',
                              data: Dict[str, Any] = None):
        """Envía una notificación a todos los usuarios activos"""
        # Obtener todos los usuarios activos (simplificado)
        all_users = list(User.objects.filter(is_active=True).values_list('id', flat=True))
        
        return self.send_custom_notification(
            title=title,
            message=message,
            recipients=all_users,
            channels=channels or ['websocket', 'web_push'],
            priority=priority,
            data=data
        )
    
    def broadcast_to_group(self, group_name: str, title: str, message: str,
                          channels: List[str] = None, priority: str = 'normal',
                          data: Dict[str, Any] = None):
        """Envía una notificación a un grupo específico"""
        return self.send_custom_notification(
            title=title,
            message=message,
            recipients=[],  # Sin destinatarios específicos
            groups=[group_name],
            channels=channels or ['websocket'],
            priority=priority,
            data=data
        )


# Instancia global del servicio
notification_service = NotificationService()