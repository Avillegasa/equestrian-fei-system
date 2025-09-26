"""
Views específicos para sincronización offline
"""
import logging
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers

from .models import SyncSession, SyncAction, ConflictResolution, OfflineStorage
try:
    from .managers import SyncManager, ConflictResolver
except ImportError:
    # Temporalmente manejamos casos donde los managers no están disponibles
    SyncManager = None
    ConflictResolver = None

logger = logging.getLogger(__name__)


# Serializers para las vistas offline
class SyncSessionSerializer(serializers.ModelSerializer):
    duration = serializers.ReadOnlyField()
    success_rate = serializers.ReadOnlyField()

    class Meta:
        model = SyncSession
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


class SyncActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncAction
        fields = '__all__'


class ConflictResolutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConflictResolution
        fields = '__all__'
        read_only_fields = ['sync_action', 'resolved_by', 'resolved_at']


class OfflineStorageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfflineStorage
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


class OfflineSyncSessionViewSet(viewsets.ModelViewSet):
    """ViewSet para sesiones de sincronización offline"""
    serializer_class = SyncSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = SyncSession.objects.filter(user=user)

        # Filtrar por estado
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filtrar por dispositivo
        device_id = self.request.query_params.get('device_id', None)
        if device_id:
            queryset = queryset.filter(device_id=device_id)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def start_session(self, request):
        """Iniciar nueva sesión de sincronización"""
        device_id = request.data.get('device_id')
        if not device_id:
            return Response(
                {'error': 'device_id requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not SyncManager:
            return Response(
                {'error': 'SyncManager no disponible'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        sync_manager = SyncManager()
        session = sync_manager.create_sync_session(request.user, device_id)

        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def add_action(self, request, pk=None):
        """Agregar acción a la sesión"""
        session = self.get_object()
        if session.status != 'pending':
            return Response(
                {'error': 'La sesión no está en estado pendiente'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data
        required_fields = ['action_type', 'content_type', 'object_id', 'data']

        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Campo {field} requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            from django.contrib.contenttypes.models import ContentType

            # Obtener content type y objeto
            content_type = ContentType.objects.get(id=data['content_type'])
            model_class = content_type.model_class()
            content_object = model_class.objects.get(id=data['object_id'])

            sync_manager = SyncManager()
            action = sync_manager.add_sync_action(
                session=session,
                action_type=data['action_type'],
                content_object=content_object,
                data=data['data'],
                priority=data.get('priority', 'normal')
            )

            return Response({
                'action_id': action.id,
                'message': 'Acción agregada exitosamente'
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def process_session(self, request, pk=None):
        """Procesar todas las acciones de la sesión"""
        session = self.get_object()

        if session.status not in ['pending', 'in_progress']:
            return Response(
                {'error': 'La sesión no puede ser procesada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            sync_manager = SyncManager()
            results = sync_manager.process_sync_session(session)

            return Response({
                'success': True,
                'results': results,
                'session_status': session.status
            })

        except Exception as e:
            logger.error(f"Error procesando sesión {session.id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SyncActionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para acciones de sincronización"""
    serializer_class = SyncActionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = SyncAction.objects.filter(sync_session__user=user)

        # Filtrar por sesión
        session_id = self.request.query_params.get('session', None)
        if session_id:
            queryset = queryset.filter(sync_session_id=session_id)

        # Filtrar por estado
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filtrar por tipo
        action_type = self.request.query_params.get('action_type', None)
        if action_type:
            queryset = queryset.filter(action_type=action_type)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Reintentar acción fallida"""
        action = self.get_object()

        if not action.can_retry():
            return Response(
                {'error': 'La acción no puede ser reintentada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            sync_manager = SyncManager()
            result = sync_manager._process_action(action)

            return Response({
                'success': True,
                'result': result,
                'action_status': action.status
            })

        except Exception as e:
            logger.error(f"Error reintentando acción {action.id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConflictResolutionViewSet(viewsets.ModelViewSet):
    """ViewSet para resolución de conflictos"""
    serializer_class = ConflictResolutionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ConflictResolution.objects.filter(
            sync_action__sync_session__user=user
        )

        # Filtrar por estado
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolver conflicto manualmente"""
        conflict = self.get_object()

        if conflict.status != 'pending':
            return Response(
                {'error': 'El conflicto ya ha sido resuelto'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data
        strategy = data.get('strategy', 'manual_resolution')
        resolved_data = data.get('resolved_data')
        notes = data.get('notes', '')

        if strategy == 'manual_resolution' and not resolved_data:
            return Response(
                {'error': 'resolved_data requerido para resolución manual'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            conflict_resolver = ConflictResolver()

            # Si es resolución manual, establecer los datos resueltos
            if strategy == 'manual_resolution':
                conflict.resolved_data = resolved_data
                conflict.save()

            success = conflict_resolver.resolve_conflict(
                conflict, strategy, request.user
            )

            if success:
                conflict.resolution_notes = notes
                conflict.save()

                return Response({
                    'success': True,
                    'message': 'Conflicto resuelto exitosamente'
                })
            else:
                return Response(
                    {'error': 'Error resolviendo conflicto'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Error resolviendo conflicto {conflict.id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def auto_resolve(self, request, pk=None):
        """Resolver conflicto automáticamente"""
        conflict = self.get_object()

        if conflict.status != 'pending':
            return Response(
                {'error': 'El conflicto ya ha sido resuelto'},
                status=status.HTTP_400_BAD_REQUEST
            )

        strategy = request.data.get('strategy', 'last_write_wins')

        try:
            conflict_resolver = ConflictResolver()
            success = conflict_resolver.resolve_conflict(
                conflict, strategy, request.user
            )

            if success:
                return Response({
                    'success': True,
                    'message': f'Conflicto resuelto con estrategia: {strategy}'
                })
            else:
                return Response(
                    {'error': 'Error resolviendo conflicto automáticamente'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Error auto-resolviendo conflicto {conflict.id}: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OfflineStorageViewSet(viewsets.ModelViewSet):
    """ViewSet para almacenamiento offline"""
    serializer_class = OfflineStorageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = OfflineStorage.objects.filter(user=user)

        # Filtrar por tipo
        storage_type = self.request.query_params.get('type', None)
        if storage_type:
            queryset = queryset.filter(storage_type=storage_type)

        # Filtrar por dispositivo
        device_id = self.request.query_params.get('device_id', None)
        if device_id:
            queryset = queryset.filter(device_id=device_id)

        # Solo no sincronizados
        unsynced_only = self.request.query_params.get('unsynced', None)
        if unsynced_only == 'true':
            queryset = queryset.filter(is_synced=False)

        return queryset.order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Crear múltiples entradas de almacenamiento"""
        items = request.data.get('items', [])
        if not items:
            return Response(
                {'error': 'items requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_items = []
        errors = []

        for item_data in items:
            try:
                serializer = self.get_serializer(data=item_data)
                if serializer.is_valid():
                    storage_item = serializer.save(user=request.user)
                    created_items.append(storage_item.id)
                else:
                    errors.append(serializer.errors)
            except Exception as e:
                errors.append(str(e))

        return Response({
            'created_count': len(created_items),
            'created_items': created_items,
            'errors': errors
        })

    @action(detail=False, methods=['post'])
    def mark_synced(self, request):
        """Marcar elementos como sincronizados"""
        item_ids = request.data.get('item_ids', [])
        if not item_ids:
            return Response(
                {'error': 'item_ids requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_count = self.get_queryset().filter(
            id__in=item_ids
        ).update(is_synced=True)

        return Response({
            'updated_count': updated_count,
            'message': f'{updated_count} elementos marcados como sincronizados'
        })

    @action(detail=False, methods=['get'])
    def sync_queue(self, request):
        """Obtener cola de sincronización"""
        device_id = request.query_params.get('device_id')

        queryset = self.get_queryset().filter(is_synced=False)
        if device_id:
            queryset = queryset.filter(device_id=device_id)

        queryset = queryset.order_by('sync_priority', 'created_at')

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'queue_size': queryset.count(),
            'items': serializer.data
        })