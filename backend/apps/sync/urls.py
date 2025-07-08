# backend/apps/sync/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SyncViewSet

router = DefaultRouter()
router.register(r'sync', SyncViewSet, basename='sync')

urlpatterns = [
    path('api/', include(router.urls)),
    
    # URLs específicas para sincronización
    path('api/sync/start-session/', SyncViewSet.as_view({'post': 'start_session'}), name='sync-start-session'),
    path('api/sync/sync-actions/', SyncViewSet.as_view({'post': 'sync_actions'}), name='sync-actions'),
    path('api/sync/resolve-conflict/', SyncViewSet.as_view({'post': 'resolve_conflict'}), name='sync-resolve-conflict'),
    path('api/sync/pending-conflicts/', SyncViewSet.as_view({'get': 'get_pending_conflicts'}), name='sync-pending-conflicts'),
    path('api/sync/cache-data/', SyncViewSet.as_view({'post': 'cache_data'}), name='sync-cache-data'),
    path('api/sync/cached-data/', SyncViewSet.as_view({'get': 'get_cached_data'}), name='sync-cached-data'),
    path('api/sync/clear-cache/', SyncViewSet.as_view({'post': 'clear_cache'}), name='sync-clear-cache'),
    path('api/sync/status/', SyncViewSet.as_view({'get': 'sync_status'}), name='sync-status'),
]

# ===================================
# backend/apps/sync/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
import json

from .models import SyncSession, SyncAction, SyncConflict, SyncLog, OfflineData


@admin.register(SyncSession)
class SyncSessionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'device_type', 'device_id', 
        'is_active', 'last_sync_time', 'created_at'
    ]
    list_filter = ['device_type', 'is_active', 'created_at', 'last_sync_time']
    search_fields = ['user__username', 'device_id', 'session_token']
    readonly_fields = ['id', 'session_token', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'user', 'device_id', 'device_type', 'session_token')
        }),
        ('Estado', {
            'fields': ('is_active', 'last_sync_time')
        }),
        ('Información Técnica', {
            'fields': ('user_agent', 'ip_address'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(SyncAction)
class SyncActionAdmin(admin.ModelAdmin):
    list_display = [
        'client_id', 'action_type', 'sync_session', 'status', 
        'priority', 'retry_count', 'created_at'
    ]
    list_filter = [
        'action_type', 'status', 'sync_session__device_type', 
        'created_at', 'processed_at'
    ]
    search_fields = [
        'client_id', 'sync_session__user__username', 
        'sync_session__device_id'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'processed_at', 
        'formatted_data', 'formatted_error_details'
    ]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'sync_session', 'action_type', 'client_id')
        }),
        ('Estado', {
            'fields': ('status', 'priority', 'retry_count', 'max_retries')
        }),
        ('Datos', {
            'fields': ('content_type', 'object_id', 'formatted_data', 'original_data'),
            'classes': ('collapse',)
        }),
        ('Errores', {
            'fields': ('error_message', 'formatted_error_details'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'processed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def formatted_data(self, obj):
        if obj.data:
            return format_html(
                '<pre style="white-space: pre-wrap;">{}</pre>',
                json.dumps(obj.data, indent=2, ensure_ascii=False)
            )
        return 'No data'
    formatted_data.short_description = 'Datos (Formateado)'
    
    def formatted_error_details(self, obj):
        if obj.error_details:
            return format_html(
                '<pre style="white-space: pre-wrap;">{}</pre>',
                json.dumps(obj.error_details, indent=2, ensure_ascii=False)
            )
        return 'No error details'
    formatted_error_details.short_description = 'Detalles de Error (Formateado)'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'sync_session__user', 'content_type'
        )


@admin.register(SyncConflict)
class SyncConflictAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'sync_action', 'conflict_type', 'is_resolved_display', 
        'resolved_by', 'created_at'
    ]
    list_filter = [
        'conflict_type', 'resolution_strategy', 'resolved_at', 'created_at'
    ]
    search_fields = [
        'sync_action__client_id', 'description', 
        'sync_action__sync_session__user__username'
    ]
    readonly_fields = [
        'id', 'sync_action', 'created_at', 'updated_at', 
        'formatted_client_data', 'formatted_server_data',
        'formatted_resolved_data'
    ]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'sync_action', 'conflict_type', 'description')
        }),
        ('Datos en Conflicto', {
            'fields': ('formatted_client_data', 'formatted_server_data'),
            'classes': ('collapse',)
        }),
        ('Resolución', {
            'fields': (
                'resolution_strategy', 'formatted_resolved_data', 
                'resolved_by', 'resolved_at'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_resolved_display(self, obj):
        if obj.is_resolved():
            return format_html(
                '<span style="color: green;">✓ Resuelto</span>'
            )
        return format_html(
            '<span style="color: red;">✗ Pendiente</span>'
        )
    is_resolved_display.short_description = 'Estado'
    
    def formatted_client_data(self, obj):
        return format_html(
            '<pre style="white-space: pre-wrap;">{}</pre>',
            json.dumps(obj.client_data, indent=2, ensure_ascii=False)
        )
    formatted_client_data.short_description = 'Datos del Cliente'
    
    def formatted_server_data(self, obj):
        return format_html(
            '<pre style="white-space: pre-wrap;">{}</pre>',
            json.dumps(obj.server_data, indent=2, ensure_ascii=False)
        )
    formatted_server_data.short_description = 'Datos del Servidor'
    
    def formatted_resolved_data(self, obj):
        if obj.resolved_data:
            return format_html(
                '<pre style="white-space: pre-wrap;">{}</pre>',
                json.dumps(obj.resolved_data, indent=2, ensure_ascii=False)
            )
        return 'No resuelto'
    formatted_resolved_data.short_description = 'Datos Resueltos'


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = [
        'sync_session', 'event_type', 'message', 'duration_ms', 
        'actions_processed', 'created_at'
    ]
    list_filter = ['event_type', 'created_at']
    search_fields = [
        'sync_session__user__username', 'message', 
        'sync_session__device_id'
    ]
    readonly_fields = [
        'id', 'formatted_details', 'created_at'
    ]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'sync_session', 'event_type', 'message')
        }),
        ('Métricas', {
            'fields': ('duration_ms', 'actions_processed', 'errors_count')
        }),
        ('Detalles', {
            'fields': ('formatted_details',),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    def formatted_details(self, obj):
        if obj.details:
            return format_html(
                '<pre style="white-space: pre-wrap;">{}</pre>',
                json.dumps(obj.details, indent=2, ensure_ascii=False)
            )
        return 'No details'
    formatted_details.short_description = 'Detalles (Formateado)'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('sync_session__user')


@admin.register(OfflineData)
class OfflineDataAdmin(admin.ModelAdmin):
    list_display = [
        'sync_session', 'data_type', 'object_id', 'version', 
        'is_expired_display', 'created_at'
    ]
    list_filter = ['data_type', 'expires_at', 'created_at']
    search_fields = [
        'sync_session__user__username', 'object_id', 
        'sync_session__device_id'
    ]
    readonly_fields = [
        'id', 'checksum', 'created_at', 'updated_at', 
        'formatted_data', 'data_size'
    ]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'sync_session', 'data_type', 'object_id')
        }),
        ('Versión y Cache', {
            'fields': ('version', 'checksum', 'expires_at')
        }),
        ('Datos', {
            'fields': ('formatted_data', 'data_size'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_expired_display(self, obj):
        if obj.is_expired():
            return format_html(
                '<span style="color: red;">✗ Expirado</span>'
            )
        return format_html(
            '<span style="color: green;">✓ Válido</span>'
        )
    is_expired_display.short_description = 'Estado'
    
    def formatted_data(self, obj):
        # Mostrar solo un preview de los datos para evitar sobrecargar la interfaz
        data_str = json.dumps(obj.data, indent=2, ensure_ascii=False)
        if len(data_str) > 1000:
            preview = data_str[:1000] + '\n... (truncado)'
        else:
            preview = data_str
        
        return format_html(
            '<pre style="white-space: pre-wrap;">{}</pre>',
            preview
        )
    formatted_data.short_description = 'Datos (Preview)'
    
    def data_size(self, obj):
        size_bytes = len(json.dumps(obj.data).encode('utf-8'))
        if size_bytes < 1024:
            return f"{size_bytes} bytes"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
    data_size.short_description = 'Tamaño'

# ===================================
# backend/apps/sync/apps.py

from django.apps import AppConfig


class SyncConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sync'
    verbose_name = 'Sincronización'
    
    def ready(self):
        # Importar señales si las hay
        try:
            import apps.sync.signals
        except ImportError:
            pass

# ===================================
# backend/apps/sync/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model

from .models import SyncLog
from apps.competitions.models import Competition, Participant
from apps.scoring.models import Score

User = get_user_model()


@receiver(post_save, sender=Score)
def score_updated_signal(sender, instance, created, **kwargs):
    """Señal cuando se actualiza una puntuación"""
    
    # Buscar sesiones activas que puedan estar interesadas en este cambio
    from .models import SyncSession
    
    # Obtener sesiones de jueces de la misma competencia
    sessions = SyncSession.objects.filter(
        user__judge__categories__competition=instance.participant.competition,
        is_active=True
    )
    
    for session in sessions:
        SyncLog.objects.create(
            sync_session=session,
            event_type='score_updated',
            message=f'Puntuación actualizada para {instance.participant.rider_name}',
            details={
                'participant_id': instance.participant.id,
                'score_id': instance.id,
                'judge_id': instance.judge.id,
                'value': str(instance.value),
                'created': created
            }
        )


@receiver(post_save, sender=Participant)
def participant_updated_signal(sender, instance, created, **kwargs):
    """Señal cuando se actualiza un participante"""
    
    from .models import SyncSession
    
    # Obtener sesiones de la competencia
    sessions = SyncSession.objects.filter(
        user__organized_competitions=instance.competition,
        is_active=True
    )
    
    for session in sessions:
        SyncLog.objects.create(
            sync_session=session,
            event_type='participant_updated',
            message=f'Participante {"creado" if created else "actualizado"}: {instance.rider_name}',
            details={
                'participant_id': instance.id,
                'participant_number': instance.participant_number,
                'competition_id': instance.competition.id,
                'created': created
            }
        )

# ===================================
# backend/apps/sync/management/commands/cleanup_sync_data.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from apps.sync.models import SyncSession, SyncAction, SyncLog, OfflineData


class Command(BaseCommand):
    help = 'Limpiar datos de sincronización antiguos'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Número de días de datos a mantener (default: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué se eliminaría sin eliminar realmente'
        )
    
    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        cutoff_date = timezone.now() - timedelta(days=days)
        
        self.stdout.write(f"Limpiando datos anteriores a {cutoff_date}")
        
        # Limpiar sesiones inactivas antiguas
        old_sessions = SyncSession.objects.filter(
            last_sync_time__lt=cutoff_date,
            is_active=False
        )
        
        if dry_run:
            self.stdout.write(f"Se eliminarían {old_sessions.count()} sesiones antiguas")
        else:
            deleted_sessions = old_sessions.delete()
            self.stdout.write(f"Eliminadas {deleted_sessions[0]} sesiones antiguas")
        
        # Limpiar acciones completadas antiguas
        old_actions = SyncAction.objects.filter(
            created_at__lt=cutoff_date,
            status='completed'
        )
        
        if dry_run:
            self.stdout.write(f"Se eliminarían {old_actions.count()} acciones completadas")
        else:
            deleted_actions = old_actions.delete()
            self.stdout.write(f"Eliminadas {deleted_actions[0]} acciones completadas")
        
        # Limpiar logs antiguos
        old_logs = SyncLog.objects.filter(
            created_at__lt=cutoff_date
        )
        
        if dry_run:
            self.stdout.write(f"Se eliminarían {old_logs.count()} logs antiguos")
        else:
            deleted_logs = old_logs.delete()
            self.stdout.write(f"Eliminados {deleted_logs[0]} logs antiguos")
        
        # Limpiar datos offline expirados
        expired_data = OfflineData.objects.filter(
            expires_at__lt=timezone.now()
        )
        
        if dry_run:
            self.stdout.write(f"Se eliminarían {expired_data.count()} datos offline expirados")
        else:
            deleted_data = expired_data.delete()
            self.stdout.write(f"Eliminados {deleted_data[0]} datos offline expirados")
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING("Ejecución en modo dry-run. No se eliminó nada realmente.")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("Limpieza completada exitosamente.")
            )

# ===================================
# backend/config/settings.py (Agregar configuraciones)

# Configuraciones para Sincronización Offline
SYNC_SETTINGS = {
    # Tiempo de expiración de sesiones en horas
    'SESSION_EXPIRY_HOURS': 24,
    
    # Número máximo de reintentos para acciones fallidas
    'MAX_RETRY_ATTEMPTS': 3,
    
    # Intervalo de limpieza automática en días
    'CLEANUP_INTERVAL_DAYS': 30,
    
    # Tamaño máximo de cache por sesión en MB
    'MAX_CACHE_SIZE_MB': 100,
    
    # Tiempo de expiración de datos offline en horas
    'OFFLINE_DATA_EXPIRY_HOURS': 72,
    
    # Habilitar logs detallados
    'ENABLE_DETAILED_LOGGING': True,
    
    # Compresión de datos en cache
    'ENABLE_CACHE_COMPRESSION': False,
}

# Agregar a INSTALLED_APPS
INSTALLED_APPS = [
    # ... otras apps
    'apps.sync',
]

# Configuración de Celery para procesamiento asíncrono (opcional)
CELERY_BEAT_SCHEDULE = {
    'cleanup-sync-data': {
        'task': 'apps.sync.tasks.cleanup_old_sync_data',
        'schedule': crontab(hour=2, minute=0),  # Ejecutar diariamente a las 2 AM
    },
}