# backend/apps/sync/views.py

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from typing import Dict, List, Any
import json
import time

from .models import SyncSession, SyncAction, SyncConflict, SyncLog, OfflineData
from .serializers import (
    SyncSessionSerializer, SyncActionSerializer, SyncConflictSerializer,
    SyncLogSerializer, OfflineDataSerializer
)
from .services import SyncService


class SyncViewSet(viewsets.ViewSet):
    """ViewSet para operaciones de sincronización"""
    
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.sync_service = SyncService()
    
    @action(detail=False, methods=['post'])
    def start_session(self, request):
        """Iniciar sesión de sincronización"""
        try:
            device_id = request.data.get('device_id')
            device_type = request.data.get('device_type', 'desktop')
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            ip_address = self.get_client_ip(request)
            
            if not device_id:
                return Response({
                    'error': 'device_id es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear o actualizar sesión
            session, created = SyncSession.objects.get_or_create(
                user=request.user,
                device_id=device_id,
                defaults={
                    'device_type': device_type,
                    'user_agent': user_agent,
                    'ip_address': ip_address,
                    'session_token': '',
                }
            )
            
            if not created:
                session.device_type = device_type
                session.user_agent = user_agent
                session.ip_address = ip_address
                session.is_active = True
            
            session.session_token = session.generate_token()
            session.save()
            
            # Log del evento
            SyncLog.objects.create(
                sync_session=session,
                event_type='sync_start',
                message=f'Sesión iniciada para dispositivo {device_id}',
                details={'device_type': device_type, 'created': created}
            )
            
            return Response({
                'session_token': session.session_token,
                'session_id': str(session.id),
                'last_sync_time': session.last_sync_time,
                'created': created
            })
            
        except Exception as e:
            return Response({
                'error': f'Error iniciando sesión: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def sync_actions(self, request):
        """Sincronizar acciones pendientes"""
        start_time = time.time()
        
        try:
            session_token = request.data.get('session_token')
            actions_data = request.data.get('actions', [])
            
            if not session_token:
                return Response({
                    'error': 'session_token es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Obtener sesión
            try:
                session = SyncSession.objects.get(
                    session_token=session_token,
                    is_active=True
                )
            except SyncSession.DoesNotExist:
                return Response({
                    'error': 'Sesión no válida'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            results = []
            conflicts = []
            
            with transaction.atomic():
                for action_data in actions_data:
                    try:
                        result = self.sync_service.process_action(session, action_data)
                        results.append(result)
                        
                        if result.get('conflict'):
                            conflicts.append(result['conflict'])
                            
                    except Exception as e:
                        results.append({
                            'client_id': action_data.get('client_id'),
                            'status': 'failed',
                            'error': str(e)
                        })
                
                # Actualizar tiempo de sincronización
                session.last_sync_time = timezone.now()
                session.save()
            
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Log del evento
            SyncLog.objects.create(
                sync_session=session,
                event_type='sync_complete',
                message=f'Sincronización completada: {len(results)} acciones procesadas',
                details={
                    'actions_processed': len(results),
                    'conflicts_detected': len(conflicts),
                    'success_count': len([r for r in results if r.get('status') == 'completed']),
                    'failed_count': len([r for r in results if r.get('status') == 'failed'])
                },
                duration_ms=duration_ms,
                actions_processed=len(results)
            )
            
            return Response({
                'results': results,
                'conflicts': conflicts,
                'sync_time': session.last_sync_time,
                'duration_ms': duration_ms
            })
            
        except Exception as e:
            return Response({
                'error': f'Error en sincronización: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def resolve_conflict(self, request):
        """Resolver conflicto de sincronización"""
        try:
            conflict_id = request.data.get('conflict_id')
            resolution_strategy = request.data.get('resolution_strategy')
            resolved_data = request.data.get('resolved_data')
            
            if not all([conflict_id, resolution_strategy]):
                return Response({
                    'error': 'conflict_id y resolution_strategy son requeridos'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                conflict = SyncConflict.objects.get(id=conflict_id)
            except SyncConflict.DoesNotExist:
                return Response({
                    'error': 'Conflicto no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if conflict.is_resolved():
                return Response({
                    'error': 'Conflicto ya resuelto'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Resolver conflicto
            conflict.resolve(resolution_strategy, resolved_data, request.user)
            
            # Procesar la acción con los datos resueltos
            if resolution_strategy != 'manual':
                result = self.sync_service.process_resolved_action(conflict)
                
                return Response({
                    'status': 'resolved',
                    'conflict_id': str(conflict.id),
                    'action_result': result
                })
            
            return Response({
                'status': 'resolved',
                'conflict_id': str(conflict.id),
                'message': 'Conflicto marcado para resolución manual'
            })
            
        except Exception as e:
            return Response({
                'error': f'Error resolviendo conflicto: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def get_pending_conflicts(self, request):
        """Obtener conflictos pendientes para el usuario"""
        try:
            session_token = request.query_params.get('session_token')
            
            if not session_token:
                return Response({
                    'error': 'session_token es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                session = SyncSession.objects.get(
                    session_token=session_token,
                    is_active=True
                )
            except SyncSession.DoesNotExist:
                return Response({
                    'error': 'Sesión no válida'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            conflicts = SyncConflict.objects.filter(
                sync_action__sync_session=session,
                resolved_at__isnull=True
            ).select_related('sync_action')
            
            serializer = SyncConflictSerializer(conflicts, many=True)
            
            return Response({
                'conflicts': serializer.data,
                'count': conflicts.count()
            })
            
        except Exception as e:
            return Response({
                'error': f'Error obteniendo conflictos: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def cache_data(self, request):
        """Cachear datos para uso offline"""
        try:
            session_token = request.data.get('session_token')
            data_to_cache = request.data.get('data', [])
            
            if not session_token:
                return Response({
                    'error': 'session_token es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                session = SyncSession.objects.get(
                    session_token=session_token,
                    is_active=True
                )
            except SyncSession.DoesNotExist:
                return Response({
                    'error': 'Sesión no válida'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            cached_items = []
            
            for item in data_to_cache:
                cached_data, created = OfflineData.objects.update_or_create(
                    sync_session=session,
                    data_type=item['data_type'],
                    object_id=item['object_id'],
                    defaults={
                        'data': item['data'],
                        'version': item.get('version', 1),
                        'expires_at': item.get('expires_at')
                    }
                )
                
                cached_items.append({
                    'id': str(cached_data.id),
                    'data_type': cached_data.data_type,
                    'object_id': cached_data.object_id,
                    'created': created
                })
            
            # Log del evento
            SyncLog.objects.create(
                sync_session=session,
                event_type='data_cached',
                message=f'{len(cached_items)} elementos cacheados',
                details={'cached_items': cached_items}
            )
            
            return Response({
                'cached_items': cached_items,
                'total_cached': len(cached_items)
            })
            
        except Exception as e:
            return Response({
                'error': f'Error cacheando datos: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def get_cached_data(self, request):
        """Obtener datos cacheados"""
        try:
            session_token = request.query_params.get('session_token')
            data_type = request.query_params.get('data_type')
            
            if not session_token:
                return Response({
                    'error': 'session_token es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                session = SyncSession.objects.get(
                    session_token=session_token,
                    is_active=True
                )
            except SyncSession.DoesNotExist:
                return Response({
                    'error': 'Sesión no válida'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            queryset = OfflineData.objects.filter(sync_session=session)
            
            if data_type:
                queryset = queryset.filter(data_type=data_type)
            
            # Filtrar datos no expirados
            queryset = queryset.exclude(
                expires_at__lt=timezone.now()
            )
            
            serializer = OfflineDataSerializer(queryset, many=True)
            
            return Response({
                'cached_data': serializer.data,
                'count': queryset.count()
            })
            
        except Exception as e:
            return Response({
                'error': f'Error obteniendo datos cacheados: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def clear_cache(self, request):
        """Limpiar cache de datos offline"""
        try:
            session_token = request.data.get('session_token')
            data_type = request.data.get('data_type')  # Opcional
            
            if not session_token:
                return Response({
                    'error': 'session_token es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                session = SyncSession.objects.get(
                    session_token=session_token,
                    is_active=True
                )
            except SyncSession.DoesNotExist:
                return Response({
                    'error': 'Sesión no válida'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            queryset = OfflineData.objects.filter(sync_session=session)
            
            if data_type:
                queryset = queryset.filter(data_type=data_type)
            
            deleted_count = queryset.count()
            queryset.delete()
            
            # Log del evento
            SyncLog.objects.create(
                sync_session=session,
                event_type='cache_cleared',
                message=f'{deleted_count} elementos eliminados del cache',
                details={'data_type': data_type, 'deleted_count': deleted_count}
            )
            
            return Response({
                'deleted_count': deleted_count,
                'message': f'Cache limpiado: {deleted_count} elementos eliminados'
            })
            
        except Exception as e:
            return Response({
                'error': f'Error limpiando cache: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def sync_status(self, request):
        """Obtener estado de sincronización"""
        try:
            session_token = request.query_params.get('session_token')
            
            if not session_token:
                return Response({
                    'error': 'session_token es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                session = SyncSession.objects.get(
                    session_token=session_token,
                    is_active=True
                )
            except SyncSession.DoesNotExist:
                return Response({
                    'error': 'Sesión no válida'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Obtener estadísticas
            pending_actions = SyncAction.objects.filter(
                sync_session=session,
                status='pending'
            ).count()
            
            failed_actions = SyncAction.objects.filter(
                sync_session=session,
                status='failed'
            ).count()
            
            pending_conflicts = SyncConflict.objects.filter(
                sync_action__sync_session=session,
                resolved_at__isnull=True
            ).count()
            
            cached_data_count = OfflineData.objects.filter(
                sync_session=session
            ).exclude(
                expires_at__lt=timezone.now()
            ).count()
            
            return Response({
                'session_id': str(session.id),
                'last_sync_time': session.last_sync_time,
                'is_active': session.is_active,
                'pending_actions': pending_actions,
                'failed_actions': failed_actions,
                'pending_conflicts': pending_conflicts,
                'cached_data_count': cached_data_count,
                'device_info': {
                    'device_id': session.device_id,
                    'device_type': session.device_type,
                }
            })
            
        except Exception as e:
            return Response({
                'error': f'Error obteniendo estado: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Obtener IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip