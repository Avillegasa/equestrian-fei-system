from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django.db import transaction
import logging

from .models import (
    ExternalSystem, SyncJob, SyncRecord, DataMap,
    CacheEntry, BackupRecord, SyncSession, SyncAction,
    ConflictResolution, OfflineStorage
)
from .serializers import (
    ExternalSystemSerializer, ExternalSystemListSerializer,
    SyncJobSerializer, SyncJobListSerializer, SyncRecordSerializer,
    DataMapSerializer, CacheEntrySerializer, BackupRecordSerializer,
    TestConnectionSerializer, CreateSyncJobSerializer,
    ExecuteSyncJobSerializer, CacheOperationSerializer,
    SyncStatusSerializer, ImportDataSerializer, ExportDataSerializer,
    BackupCreateSerializer, SystemStatsSerializer
)
from .services.sync_service import sync_service
from .services.cache_service import cache_service
from .services.monitoring_service import monitoring_service
from .services.logging_service import logging_service
from .services.notification_service import notification_service
from .services.import_export_service import import_export_service
from .services.offline_sync_service import offline_sync_service
# from .managers import SyncManager, ConflictResolver  # Temporalmente comentado
from apps.users.permissions import IsAdminUser

logger = logging.getLogger(__name__)


class ExternalSystemViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar sistemas externos"""
    queryset = ExternalSystem.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ExternalSystemListSerializer
        return ExternalSystemSerializer
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Filtrar por tipo de sistema
        system_type = self.request.query_params.get('type', None)
        if system_type:
            queryset = queryset.filter(system_type=system_type)
        
        # Filtrar por estado
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Solo sistemas habilitados
        enabled_only = self.request.query_params.get('enabled', None)
        if enabled_only == 'true':
            queryset = queryset.filter(is_enabled=True)
        
        return queryset.order_by('name')
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Probar conexión con sistema externo"""
        system = self.get_object()
        
        success, message = sync_service.test_connection(system)
        
        return Response({
            'success': success,
            'message': message,
            'system_status': system.status
        })
    
    @action(detail=True, methods=['post'])
    def sync_now(self, request, pk=None):
        """Ejecutar sincronización inmediata"""
        system = self.get_object()
        
        try:
            # Crear trabajo de sincronización
            config = request.data.get('config', {})
            job = sync_service.create_sync_job(
                system=system,
                job_type='sync',
                config=config,
                priority='high',
                name=f"Sincronización manual - {system.name}",
                user=request.user
            )
            
            # Ejecutar trabajo
            success = sync_service.execute_sync_job(job)
            
            return Response({
                'success': success,
                'job_id': job.id,
                'message': 'Sincronización completada' if success else 'Error en sincronización'
            })
            
        except Exception as e:
            logger.error(f"Error en sincronización manual: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def sync_status(self, request, pk=None):
        """Obtener estado de sincronización del sistema"""
        system = self.get_object()
        sync_status = sync_service.get_sync_status(str(system.id))
        
        return Response(sync_status)


class SyncJobViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar trabajos de sincronización"""
    queryset = SyncJob.objects.select_related('external_system', 'created_by').all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SyncJobListSerializer
        elif self.action == 'create':
            return CreateSyncJobSerializer
        return SyncJobSerializer
    
    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user
        
        # Los usuarios normales solo ven sus propios trabajos
        if user.user_type != 'admin':
            queryset = queryset.filter(created_by=user)
        
        # Filtrar por sistema externo
        system_id = self.request.query_params.get('system', None)
        if system_id:
            queryset = queryset.filter(external_system_id=system_id)
        
        # Filtrar por tipo de trabajo
        job_type = self.request.query_params.get('type', None)
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        
        # Filtrar por estado
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Crear nuevo trabajo de sincronización"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        system = sync_service.get_external_system(str(data['system_id']))
        
        if not system:
            return Response(
                {'error': 'Sistema externo no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        job = sync_service.create_sync_job(
            system=system,
            job_type=data['job_type'],
            config=data.get('config', {}),
            priority=data.get('priority', 'normal'),
            name=data.get('name'),
            user=request.user
        )
        
        response_serializer = SyncJobSerializer(job)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Ejecutar trabajo de sincronización"""
        job = self.get_object()
        
        if job.status not in ['pending', 'failed']:
            return Response(
                {'error': 'El trabajo no está en estado ejecutable'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success = sync_service.execute_sync_job(job)
            
            return Response({
                'success': success,
                'message': 'Trabajo ejecutado correctamente' if success else 'Error en ejecución'
            })
            
        except Exception as e:
            logger.error(f"Error ejecutando trabajo {job.id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Reintentar trabajo fallido"""
        job = self.get_object()
        
        if not job.can_retry():
            return Response(
                {'error': 'El trabajo no puede ser reintentado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        job.retry_count += 1
        job.status = 'pending'
        job.error_message = ''
        job.save()
        
        return Response({'message': 'Trabajo programado para reintento'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar trabajo"""
        job = self.get_object()
        
        if job.status not in ['pending', 'running']:
            return Response(
                {'error': 'El trabajo no puede ser cancelado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        job.status = 'cancelled'
        job.save()
        
        return Response({'message': 'Trabajo cancelado'})


class SyncRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para ver registros de sincronización"""
    queryset = SyncRecord.objects.select_related(
        'sync_job', 'content_type'
    ).all()
    serializer_class = SyncRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Filtrar por trabajo de sincronización
        job_id = self.request.query_params.get('job', None)
        if job_id:
            queryset = queryset.filter(sync_job_id=job_id)
        
        # Filtrar por estado
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtrar por tipo de contenido
        content_type = self.request.query_params.get('content_type', None)
        if content_type:
            queryset = queryset.filter(content_type__model=content_type.lower())
        
        return queryset.order_by('-created_at')


class DataMapViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar mapeo de datos"""
    queryset = DataMap.objects.select_related('external_system').all()
    serializer_class = DataMapSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Filtrar por sistema externo
        system_id = self.request.query_params.get('system', None)
        if system_id:
            queryset = queryset.filter(external_system_id=system_id)
        
        # Filtrar por modelo local
        model = self.request.query_params.get('model', None)
        if model:
            queryset = queryset.filter(local_model=model)
        
        return queryset.order_by('external_system__name', 'local_model', 'local_field')


class CacheManagementViewSet(viewsets.ViewSet):
    """ViewSet para gestionar cache"""
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """Listar entradas de cache"""
        queryset = CacheEntry.objects.all()
        
        # Filtrar por tipo
        cache_type = request.query_params.get('type', None)
        if cache_type:
            queryset = queryset.filter(cache_type=cache_type)
        
        # Solo entradas activas
        active_only = request.query_params.get('active', None)
        if active_only == 'true':
            queryset = queryset.filter(expires_at__gt=timezone.now())
        
        queryset = queryset.order_by('-created_at')[:100]  # Limitar resultados
        serializer = CacheEntrySerializer(queryset, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de cache"""
        stats = cache_service.get_stats()
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """Limpiar entradas expiradas"""
        deleted_count = cache_service.cleanup_expired()
        
        return Response({
            'deleted_count': deleted_count,
            'message': f'Eliminadas {deleted_count} entradas expiradas'
        })
    
    @action(detail=False, methods=['post'])
    def clear_namespace(self, request):
        """Limpiar namespace completo"""
        namespace = request.data.get('namespace')
        
        if not namespace:
            return Response(
                {'error': 'Namespace requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = cache_service.clear_namespace(namespace)
        
        return Response({
            'success': success,
            'message': f'Namespace {namespace} limpiado' if success else 'Error limpiando namespace'
        })
    
    @action(detail=False, methods=['post'])
    def invalidate_tags(self, request):
        """Invalidar por tags"""
        tags = request.data.get('tags', [])
        
        if not tags:
            return Response(
                {'error': 'Tags requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        count = cache_service.invalidate_by_tags(tags)
        
        return Response({
            'invalidated_count': count,
            'message': f'Invalidadas {count} entradas'
        })


class BackupViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar respaldos"""
    queryset = BackupRecord.objects.select_related('created_by').all()
    serializer_class = BackupRecordSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = self.queryset
        
        # Filtrar por tipo
        backup_type = self.request.query_params.get('type', None)
        if backup_type:
            queryset = queryset.filter(backup_type=backup_type)
        
        # Filtrar por estado
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def create_backup(self, request):
        """Crear nuevo respaldo"""
        serializer = BackupCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Implementar lógica de creación de backup
        # Por ahora, solo crear el registro
        backup = BackupRecord.objects.create(
            backup_type=data['backup_type'],
            name=data['name'],
            description=data.get('description', ''),
            file_path=f"/backups/{data['name']}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.sql",
            created_by=request.user
        )
        
        return Response({
            'backup_id': backup.id,
            'message': 'Respaldo programado correctamente'
        })
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restaurar desde respaldo"""
        backup = self.get_object()
        
        if backup.status != 'completed':
            return Response(
                {'error': 'El respaldo no está completo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Implementar lógica de restauración
        # Por seguridad, esta operación debe ser muy cuidadosa
        
        return Response({
            'message': 'Restauración programada (implementación pendiente)'
        })


class SystemStatsViewSet(viewsets.ViewSet):
    """ViewSet para estadísticas del sistema"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def list(self, request):
        """Obtener estadísticas generales"""
        try:
            # Estadísticas de sistemas externos
            total_systems = ExternalSystem.objects.count()
            active_systems = ExternalSystem.objects.filter(status='active').count()
            systems_with_errors = ExternalSystem.objects.filter(status='error').count()
            
            # Estadísticas de trabajos
            pending_jobs = SyncJob.objects.filter(status='pending').count()
            running_jobs = SyncJob.objects.filter(status='running').count()
            failed_jobs = SyncJob.objects.filter(status='failed').count()
            
            # Estadísticas de cache
            cache_stats = cache_service.get_stats()
            cache_entries = cache_stats.get('active_entries', 0)
            
            # Estadísticas de respaldos
            total_backups = BackupRecord.objects.count()
            last_backup = BackupRecord.objects.filter(
                status='completed'
            ).order_by('-completed_at').first()
            
            stats = {
                'total_systems': total_systems,
                'active_systems': active_systems,
                'systems_with_errors': systems_with_errors,
                'pending_jobs': pending_jobs,
                'running_jobs': running_jobs,
                'failed_jobs': failed_jobs,
                'cache_entries': cache_entries,
                'cache_hit_rate': 0.0,  # Implementar cálculo real
                'total_backups': total_backups,
                'last_backup': last_backup.completed_at if last_backup else None
            }
            
            serializer = SystemStatsSerializer(stats)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas del sistema: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MonitoringViewSet(viewsets.ViewSet):
    """ViewSet para monitoreo del sistema"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def list(self, request):
        """Obtener dashboard de monitoreo"""
        try:
            dashboard_data = monitoring_service.get_dashboard_data()
            return Response(dashboard_data)
            
        except Exception as e:
            logger.error(f"Error obteniendo dashboard de monitoreo: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def health(self, request):
        """Verificación de salud del sistema"""
        try:
            health_data = monitoring_service.get_health_check()
            status_code = status.HTTP_200_OK if health_data['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
            return Response(health_data, status=status_code)
            
        except Exception as e:
            logger.error(f"Error en verificación de salud: {e}")
            return Response(
                {'status': 'unhealthy', 'error': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
    
    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """Obtener métricas del sistema"""
        try:
            metrics = monitoring_service.collect_all_metrics()
            return Response(metrics)
            
        except Exception as e:
            logger.error(f"Error obteniendo métricas: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Obtener alertas activas"""
        try:
            alerts = monitoring_service.alert_manager.get_active_alerts()
            return Response({'alerts': alerts})
            
        except Exception as e:
            logger.error(f"Error obteniendo alertas: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def clear_alerts(self, request):
        """Limpiar todas las alertas"""
        try:
            monitoring_service.alert_manager.clear_alerts()
            return Response({'message': 'Alertas limpiadas correctamente'})
            
        except Exception as e:
            logger.error(f"Error limpiando alertas: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def performance(self, request):
        """Obtener estadísticas de rendimiento"""
        try:
            operation = request.query_params.get('operation')
            performance_stats = monitoring_service.profiler.get_profile_stats(operation)
            return Response(performance_stats)
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de rendimiento: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def start_monitoring(self, request):
        """Iniciar monitoreo continuo"""
        try:
            interval = int(request.data.get('interval', 60))
            monitoring_service.start_monitoring(interval)
            return Response({'message': 'Monitoreo iniciado correctamente'})
            
        except Exception as e:
            logger.error(f"Error iniciando monitoreo: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def stop_monitoring(self, request):
        """Detener monitoreo continuo"""
        try:
            monitoring_service.stop_monitoring()
            return Response({'message': 'Monitoreo detenido correctamente'})
            
        except Exception as e:
            logger.error(f"Error deteniendo monitoreo: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoggingViewSet(viewsets.ViewSet):
    """ViewSet para gestión de logs"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def list(self, request):
        """Obtener dashboard de logging"""
        try:
            dashboard_data = logging_service.get_dashboard_data()
            return Response(dashboard_data)
            
        except Exception as e:
            logger.error(f"Error obteniendo dashboard de logging: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def files(self, request):
        """Obtener lista de archivos de log"""
        try:
            files = logging_service.analyzer.get_log_files()
            return Response({'files': files})
            
        except Exception as e:
            logger.error(f"Error obteniendo archivos de log: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def analyze(self, request):
        """Analizar logs recientes"""
        try:
            hours = int(request.query_params.get('hours', 24))
            filename = request.query_params.get('file')
            
            if filename:
                analysis = logging_service.analyzer.analyze_log_file(filename, hours)
            else:
                analysis = logging_service.analyzer.analyze_recent_events(hours)
            
            return Response(analysis)
            
        except Exception as e:
            logger.error(f"Error analizando logs: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """Limpiar logs antiguos"""
        try:
            days = int(request.data.get('days', 30))
            deleted_count = logging_service.analyzer.cleanup_old_logs(days)
            
            return Response({
                'deleted_count': deleted_count,
                'message': f'Eliminados {deleted_count} archivos de log antiguos'
            })
            
        except Exception as e:
            logger.error(f"Error limpiando logs: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class NotificationViewSet(viewsets.ViewSet):
    """ViewSet para gestión de notificaciones"""
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """Obtener notificaciones del usuario"""
        try:
            user_id = request.user.id
            limit = int(request.query_params.get('limit', 20))
            
            notifications = notification_service.get_user_notifications(user_id, limit)
            return Response({'notifications': notifications})
            
        except Exception as e:
            logger.error(f"Error obteniendo notificaciones: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def preferences(self, request):
        """Obtener preferencias de notificación del usuario"""
        try:
            user_id = request.user.id
            preferences = notification_service.get_user_preferences(user_id)
            return Response(preferences)
            
        except Exception as e:
            logger.error(f"Error obteniendo preferencias: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def update_preferences(self, request):
        """Actualizar preferencias de notificación"""
        try:
            user_id = request.user.id
            preferences = request.data
            
            notification_service.update_user_preferences(user_id, preferences)
            return Response({'message': 'Preferencias actualizadas correctamente'})
            
        except Exception as e:
            logger.error(f"Error actualizando preferencias: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def send(self, request):
        """Enviar notificación personalizada (solo admins)"""
        if request.user.user_type != 'admin':
            return Response(
                {'error': 'Permisos insuficientes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            data = request.data
            
            result = notification_service.send_custom_notification(
                title=data['title'],
                message=data['message'],
                recipients=data.get('recipients', []),
                channels=data.get('channels', ['websocket']),
                priority=data.get('priority', 'normal'),
                data=data.get('data', {}),
                groups=data.get('groups', [])
            )
            
            return Response({
                'success': True,
                'results': result,
                'message': 'Notificación enviada'
            })
            
        except Exception as e:
            logger.error(f"Error enviando notificación: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def broadcast(self, request):
        """Enviar notificación a todos los usuarios (solo admins)"""
        if request.user.user_type != 'admin':
            return Response(
                {'error': 'Permisos insuficientes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            data = request.data
            
            result = notification_service.broadcast_to_all_users(
                title=data['title'],
                message=data['message'],
                channels=data.get('channels', ['websocket', 'web_push']),
                priority=data.get('priority', 'normal'),
                data=data.get('data', {})
            )
            
            return Response({
                'success': True,
                'results': result,
                'message': 'Broadcast enviado'
            })
            
        except Exception as e:
            logger.error(f"Error enviando broadcast: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marcar notificación como leída"""
        try:
            user_id = request.user.id
            notification_id = pk
            
            notification_service.mark_notification_read(user_id, notification_id)
            return Response({'message': 'Notificación marcada como leída'})
            
        except Exception as e:
            logger.error(f"Error marcando notificación como leída: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Obtener historial de notificaciones (solo admins)"""
        if request.user.user_type != 'admin':
            return Response(
                {'error': 'Permisos insuficientes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            limit = int(request.query_params.get('limit', 50))
            history = notification_service.get_notification_history(limit)
            
            return Response({'history': history})
            
        except Exception as e:
            logger.error(f"Error obteniendo historial: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de canales (solo admins)"""
        if request.user.user_type != 'admin':
            return Response(
                {'error': 'Permisos insuficientes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            stats = notification_service.get_channel_stats()
            return Response({'stats': stats})
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ImportExportViewSet(viewsets.ViewSet):
    """ViewSet para importación y exportación de datos"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Exportar datos"""
        try:
            data = request.data
            
            job = import_export_service.export_data(
                model_name=data['model_name'],
                format=data['format'],
                user=request.user,
                filters=data.get('filters', {}),
                fields=data.get('fields')
            )
            
            return Response({
                'success': True,
                'job_id': job.job_id,
                'message': 'Exportación iniciada'
            })
            
        except Exception as e:
            logger.error(f"Error iniciando exportación: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def import_data(self, request):
        """Importar datos desde archivo"""
        try:
            # Obtener archivo subido
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response(
                    {'error': 'Archivo requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Leer contenido del archivo
            file_content = uploaded_file.read()
            
            job = import_export_service.import_data(
                model_name=request.data['model_name'],
                format=request.data['format'],
                user=request.user,
                file_content=file_content,
                update_existing=request.data.get('update_existing', False)
            )
            
            return Response({
                'success': True,
                'job_id': job.job_id,
                'message': 'Importación iniciada'
            })
            
        except Exception as e:
            logger.error(f"Error iniciando importación: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def job_status(self, request, pk=None):
        """Obtener estado de trabajo de importación/exportación"""
        try:
            job_data = import_export_service.get_job_status(pk)
            
            if not job_data:
                return Response(
                    {'error': 'Trabajo no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(job_data)
            
        except Exception as e:
            logger.error(f"Error obteniendo estado del trabajo: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def jobs(self, request):
        """Obtener trabajos del usuario"""
        try:
            limit = int(request.query_params.get('limit', 20))
            jobs = import_export_service.get_user_jobs(request.user.id, limit)
            
            return Response({'jobs': jobs})
            
        except Exception as e:
            logger.error(f"Error obteniendo trabajos: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def models(self, request):
        """Obtener modelos disponibles"""
        try:
            models = import_export_service.get_available_models()
            return Response({'models': models})
            
        except Exception as e:
            logger.error(f"Error obteniendo modelos: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def formats(self, request):
        """Obtener formatos soportados"""
        try:
            formats = import_export_service.get_supported_formats()
            return Response({'formats': formats})
            
        except Exception as e:
            logger.error(f"Error obteniendo formatos: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OfflineSyncViewSet(viewsets.ViewSet):
    """ViewSet para sincronización offline"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def record_operation(self, request):
        """Registrar operación offline"""
        try:
            data = request.data
            
            operation_id = offline_sync_service.record_offline_operation(
                operation_type=data['operation_type'],
                model_name=data['model_name'],
                data=data['data'],
                user=request.user,
                object_id=data.get('object_id')
            )
            
            return Response({
                'success': True,
                'operation_id': operation_id,
                'message': 'Operación offline registrada'
            })
            
        except Exception as e:
            logger.error(f"Error registrando operación offline: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def sync_pending(self, request):
        """Sincronizar operaciones pendientes"""
        try:
            user_id = request.user.id
            if request.user.user_type == 'admin':
                user_id = request.data.get('user_id', user_id)
            
            result = offline_sync_service.sync_pending_operations(user_id)
            return Response(result)
            
        except Exception as e:
            logger.error(f"Error sincronizando operaciones: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Obtener estado de sincronización"""
        try:
            user_id = request.user.id
            if request.user.user_type == 'admin':
                user_id = request.query_params.get('user_id', user_id)
                if user_id != request.user.id:
                    user_id = int(user_id) if user_id != 'all' else None
            
            status_data = offline_sync_service.get_sync_status(user_id)
            return Response(status_data)
            
        except Exception as e:
            logger.error(f"Error obteniendo estado de sincronización: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def resolve_conflict(self, request, pk=None):
        """Resolver conflicto manualmente"""
        try:
            resolution_data = request.data.get('resolution_data', {})
            
            result = offline_sync_service.resolve_conflict_manually(
                operation_id=pk,
                resolution_data=resolution_data,
                user=request.user
            )
            
            return Response(result)
            
        except Exception as e:
            logger.error(f"Error resolviendo conflicto: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def connectivity(self, request):
        """Verificar conectividad"""
        try:
            is_online = offline_sync_service.check_connectivity()
            
            return Response({
                'is_online': is_online,
                'last_check': offline_sync_service.last_connectivity_check.isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error verificando conectividad: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def export_offline_data(self, request):
        """Exportar datos offline para backup"""
        try:
            user_id = request.user.id
            export_data = offline_sync_service.export_offline_data(user_id)
            
            return Response({
                'success': True,
                'data': export_data
            })
            
        except Exception as e:
            logger.error(f"Error exportando datos offline: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def import_offline_data(self, request):
        """Importar datos offline desde backup"""
        try:
            import_data = request.data.get('data')
            if not import_data:
                return Response(
                    {'error': 'Datos requeridos'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = offline_sync_service.import_offline_data(
                data=import_data,
                user=request.user
            )
            
            return Response(result)
            
        except Exception as e:
            logger.error(f"Error importando datos offline: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
