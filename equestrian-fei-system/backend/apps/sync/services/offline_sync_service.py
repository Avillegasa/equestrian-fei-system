"""
Servicio de sincronización offline para el sistema FEI.
Permite trabajar sin conexión y sincronizar cuando se restablezca la conectividad.
"""

import json
import logging
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import models, transaction
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User
from django.apps import apps
from .cache_service import cache_service
from .notification_service import notification_service

logger = logging.getLogger(__name__)


class OfflineOperation:
    """Operación realizada en modo offline"""
    
    OPERATION_TYPES = [
        'create', 'update', 'delete', 'bulk_create', 'bulk_update'
    ]
    
    def __init__(self, operation_type: str, model_name: str, data: Dict[str, Any],
                 user: User, object_id: str = None, timestamp: datetime = None):
        self.operation_id = self._generate_operation_id()
        self.operation_type = operation_type
        self.model_name = model_name
        self.data = data
        self.user = user
        self.object_id = object_id
        self.timestamp = timestamp or timezone.now()
        self.status = 'pending'  # pending, synced, failed, conflict
        self.sync_attempts = 0
        self.conflict_resolution = None
        self.error_message = None
        self.checksum = self._calculate_checksum()
    
    def _generate_operation_id(self) -> str:
        """Generar ID único para la operación"""
        timestamp = str(int(timezone.now().timestamp() * 1000000))
        return f"offline_{timestamp}_{hash(str(timezone.now()))}"[:32]
    
    def _calculate_checksum(self) -> str:
        """Calcular checksum de los datos"""
        data_str = json.dumps(self.data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertir a diccionario"""
        return {
            'operation_id': self.operation_id,
            'operation_type': self.operation_type,
            'model_name': self.model_name,
            'data': self.data,
            'user_id': self.user.id,
            'object_id': self.object_id,
            'timestamp': self.timestamp.isoformat(),
            'status': self.status,
            'sync_attempts': self.sync_attempts,
            'conflict_resolution': self.conflict_resolution,
            'error_message': self.error_message,
            'checksum': self.checksum
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'OfflineOperation':
        """Crear desde diccionario"""
        user = User.objects.get(id=data['user_id'])
        timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
        
        op = cls(
            operation_type=data['operation_type'],
            model_name=data['model_name'],
            data=data['data'],
            user=user,
            object_id=data.get('object_id'),
            timestamp=timestamp
        )
        
        op.operation_id = data['operation_id']
        op.status = data['status']
        op.sync_attempts = data.get('sync_attempts', 0)
        op.conflict_resolution = data.get('conflict_resolution')
        op.error_message = data.get('error_message')
        op.checksum = data.get('checksum', op._calculate_checksum())
        
        return op


class ConflictResolver:
    """Resolutor de conflictos de sincronización"""
    
    RESOLUTION_STRATEGIES = [
        'client_wins',      # La versión del cliente prevalece
        'server_wins',      # La versión del servidor prevalece
        'merge',           # Fusionar cambios cuando sea posible
        'manual',          # Requiere intervención manual
        'timestamp_wins'   # Gana la versión más reciente
    ]
    
    def __init__(self, offline_service):
        self.offline_service = offline_service
    
    def resolve_conflict(self, operation: OfflineOperation, 
                        server_data: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """Resolver conflicto entre datos offline y del servidor"""
        
        # Estrategia por defecto: timestamp_wins
        strategy = operation.conflict_resolution or 'timestamp_wins'
        
        if strategy == 'client_wins':
            return 'resolved', operation.data
        
        elif strategy == 'server_wins':
            return 'resolved', server_data
        
        elif strategy == 'timestamp_wins':
            client_timestamp = operation.timestamp
            server_timestamp = self._get_server_timestamp(server_data)
            
            if client_timestamp > server_timestamp:
                return 'resolved', operation.data
            else:
                return 'resolved', server_data
        
        elif strategy == 'merge':
            try:
                merged_data = self._merge_data(operation.data, server_data)
                return 'resolved', merged_data
            except Exception as e:
                logger.warning(f"No se pudo fusionar datos: {e}")
                return 'manual', {}
        
        else:  # manual
            return 'manual', {}
    
    def _get_server_timestamp(self, server_data: Dict[str, Any]) -> datetime:
        """Obtener timestamp del servidor"""
        timestamp_fields = ['updated_at', 'modified_at', 'last_modified', 'timestamp']
        
        for field in timestamp_fields:
            if field in server_data:
                timestamp_str = server_data[field]
                if isinstance(timestamp_str, str):
                    try:
                        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    except:
                        continue
                elif isinstance(timestamp_str, datetime):
                    return timestamp_str
        
        # Si no se encuentra timestamp, usar época
        return datetime.fromtimestamp(0, tz=timezone.get_current_timezone())
    
    def _merge_data(self, client_data: Dict[str, Any], 
                   server_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fusionar datos del cliente y servidor"""
        merged = server_data.copy()
        
        # Fusionar campos que no generen conflicto
        for key, value in client_data.items():
            if key not in server_data:
                merged[key] = value
            elif key in ['id', 'created_at', 'updated_at']:
                # Mantener valores del servidor para campos críticos
                continue
            elif isinstance(value, dict) and isinstance(server_data.get(key), dict):
                # Fusionar diccionarios recursivamente
                merged[key] = {**server_data[key], **value}
            elif isinstance(value, list) and isinstance(server_data.get(key), list):
                # Combinar listas evitando duplicados
                merged[key] = list(set(server_data[key] + value))
            else:
                # Para otros tipos, usar valor del cliente si es más reciente
                merged[key] = value
        
        return merged


class OfflineStorage:
    """Almacenamiento local para operaciones offline"""
    
    def __init__(self):
        self.storage_key_prefix = "offline_ops"
        self.user_queue_key = "offline_queue"
    
    def save_operation(self, operation: OfflineOperation):
        """Guardar operación offline"""
        # Guardar operación individual
        op_key = f"{self.storage_key_prefix}:{operation.operation_id}"
        cache_service.set(
            op_key,
            operation.to_dict(),
            timeout=86400 * 30,  # 30 días
            tags=['offline', 'operation', f'user_{operation.user.id}']
        )
        
        # Añadir a cola del usuario
        self._add_to_user_queue(operation.user.id, operation.operation_id)
        
        logger.info(f"Operación offline guardada: {operation.operation_id}")
    
    def get_operation(self, operation_id: str) -> Optional[OfflineOperation]:
        """Obtener operación por ID"""
        op_key = f"{self.storage_key_prefix}:{operation_id}"
        data = cache_service.get(op_key)
        
        if data:
            return OfflineOperation.from_dict(data)
        return None
    
    def get_user_operations(self, user_id: int, status: str = None) -> List[OfflineOperation]:
        """Obtener operaciones de un usuario"""
        queue_key = f"{self.user_queue_key}:{user_id}"
        operation_ids = cache_service.get(queue_key, [])
        
        operations = []
        for op_id in operation_ids:
            operation = self.get_operation(op_id)
            if operation and (status is None or operation.status == status):
                operations.append(operation)
        
        return sorted(operations, key=lambda x: x.timestamp)
    
    def update_operation_status(self, operation_id: str, status: str, 
                              error_message: str = None):
        """Actualizar estado de operación"""
        operation = self.get_operation(operation_id)
        if operation:
            operation.status = status
            operation.sync_attempts += 1
            if error_message:
                operation.error_message = error_message
            
            self.save_operation(operation)
    
    def remove_operation(self, operation_id: str, user_id: int):
        """Eliminar operación"""
        op_key = f"{self.storage_key_prefix}:{operation_id}"
        cache_service.delete(op_key)
        
        # Remover de cola del usuario
        self._remove_from_user_queue(user_id, operation_id)
    
    def _add_to_user_queue(self, user_id: int, operation_id: str):
        """Añadir operación a cola del usuario"""
        queue_key = f"{self.user_queue_key}:{user_id}"
        queue = cache_service.get(queue_key, [])
        
        if operation_id not in queue:
            queue.append(operation_id)
            cache_service.set(
                queue_key,
                queue,
                timeout=86400 * 30,
                tags=['offline', 'queue', f'user_{user_id}']
            )
    
    def _remove_from_user_queue(self, user_id: int, operation_id: str):
        """Remover operación de cola del usuario"""
        queue_key = f"{self.user_queue_key}:{user_id}"
        queue = cache_service.get(queue_key, [])
        
        if operation_id in queue:
            queue.remove(operation_id)
            cache_service.set(
                queue_key,
                queue,
                timeout=86400 * 30,
                tags=['offline', 'queue', f'user_{user_id}']
            )
    
    def get_statistics(self) -> Dict[str, Any]:
        """Obtener estadísticas del almacenamiento offline"""
        # Obtener todas las operaciones
        pattern = f"{self.storage_key_prefix}:*"
        operation_keys = cache_service.get_keys_by_pattern(pattern)
        
        stats = {
            'total_operations': len(operation_keys),
            'by_status': {},
            'by_type': {},
            'by_user': {},
            'oldest_operation': None,
            'newest_operation': None
        }
        
        timestamps = []
        
        for key in operation_keys:
            op_data = cache_service.get(key)
            if op_data:
                # Por estado
                status = op_data.get('status', 'unknown')
                stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
                
                # Por tipo
                op_type = op_data.get('operation_type', 'unknown')
                stats['by_type'][op_type] = stats['by_type'].get(op_type, 0) + 1
                
                # Por usuario
                user_id = op_data.get('user_id')
                stats['by_user'][user_id] = stats['by_user'].get(user_id, 0) + 1
                
                # Timestamps
                timestamp_str = op_data.get('timestamp')
                if timestamp_str:
                    try:
                        timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                        timestamps.append(timestamp)
                    except:
                        pass
        
        if timestamps:
            stats['oldest_operation'] = min(timestamps).isoformat()
            stats['newest_operation'] = max(timestamps).isoformat()
        
        return stats


class OfflineSyncService:
    """Servicio principal de sincronización offline"""
    
    SYNCABLE_MODELS = {
        'Competition': 'apps.competitions.models.Competition',
        'Participant': 'apps.competitions.models.Participant',
        'ScoreCard': 'apps.scoring.models.ScoreCard',
        'IndividualScore': 'apps.scoring.models.IndividualScore',
        'Horse': 'apps.competitions.models.Horse'
    }
    
    def __init__(self):
        self.storage = OfflineStorage()
        self.conflict_resolver = ConflictResolver(self)
        self.is_online = True
        self.last_connectivity_check = timezone.now()
    
    def record_offline_operation(self, operation_type: str, model_name: str,
                                data: Dict[str, Any], user: User,
                                object_id: str = None) -> str:
        """Registrar una operación realizada offline"""
        
        if model_name not in self.SYNCABLE_MODELS:
            raise ValueError(f"Modelo {model_name} no sincronizable offline")
        
        operation = OfflineOperation(
            operation_type=operation_type,
            model_name=model_name,
            data=data,
            user=user,
            object_id=object_id
        )
        
        self.storage.save_operation(operation)
        
        # Intentar sincronización inmediata si estamos online
        if self.is_online:
            self._sync_operation(operation)
        
        return operation.operation_id
    
    def sync_pending_operations(self, user_id: int = None) -> Dict[str, Any]:
        """Sincronizar todas las operaciones pendientes"""
        
        # Verificar conectividad
        self.check_connectivity()
        
        if not self.is_online:
            return {
                'success': False,
                'error': 'Sin conectividad a internet',
                'synced_count': 0,
                'failed_count': 0
            }
        
        # Obtener operaciones pendientes
        if user_id:
            pending_operations = self.storage.get_user_operations(user_id, 'pending')
        else:
            # Obtener todas las operaciones pendientes
            pending_operations = []
            for user in User.objects.filter(is_active=True):
                pending_operations.extend(
                    self.storage.get_user_operations(user.id, 'pending')
                )
        
        sync_results = {
            'success': True,
            'synced_count': 0,
            'failed_count': 0,
            'conflict_count': 0,
            'operations': []
        }
        
        # Procesar operaciones en orden cronológico
        pending_operations.sort(key=lambda x: x.timestamp)
        
        for operation in pending_operations:
            try:
                result = self._sync_operation(operation)
                sync_results['operations'].append({
                    'operation_id': operation.operation_id,
                    'status': result['status'],
                    'message': result.get('message', '')
                })
                
                if result['status'] == 'synced':
                    sync_results['synced_count'] += 1
                elif result['status'] == 'conflict':
                    sync_results['conflict_count'] += 1
                else:
                    sync_results['failed_count'] += 1
                    
            except Exception as e:
                logger.error(f"Error sincronizando operación {operation.operation_id}: {e}")
                sync_results['failed_count'] += 1
                sync_results['operations'].append({
                    'operation_id': operation.operation_id,
                    'status': 'failed',
                    'message': str(e)
                })
        
        # Notificar resultados
        if user_id and (sync_results['synced_count'] > 0 or sync_results['failed_count'] > 0):
            notification_service.send_notification(
                'sync_completed',
                recipients=[user_id],
                data={
                    'synced_count': sync_results['synced_count'],
                    'failed_count': sync_results['failed_count'],
                    'conflict_count': sync_results['conflict_count']
                }
            )
        
        return sync_results
    
    def _sync_operation(self, operation: OfflineOperation) -> Dict[str, Any]:
        """Sincronizar una operación específica"""
        
        try:
            # Obtener modelo
            model_path = self.SYNCABLE_MODELS[operation.model_name]
            app_label, model_name = model_path.split('.')[-2:]
            Model = apps.get_model(app_label, model_name.split('.')[-1])
            
            with transaction.atomic():
                if operation.operation_type == 'create':
                    result = self._sync_create(Model, operation)
                elif operation.operation_type == 'update':
                    result = self._sync_update(Model, operation)
                elif operation.operation_type == 'delete':
                    result = self._sync_delete(Model, operation)
                else:
                    result = {'status': 'failed', 'message': 'Tipo de operación no soportado'}
                
                # Actualizar estado de la operación
                if result['status'] == 'synced':
                    self.storage.remove_operation(operation.operation_id, operation.user.id)
                elif result['status'] in ['failed', 'conflict']:
                    self.storage.update_operation_status(
                        operation.operation_id,
                        result['status'],
                        result.get('message')
                    )
                
                return result
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error sincronizando operación {operation.operation_id}: {error_msg}")
            
            self.storage.update_operation_status(
                operation.operation_id,
                'failed',
                error_msg
            )
            
            return {'status': 'failed', 'message': error_msg}
    
    def _sync_create(self, Model, operation: OfflineOperation) -> Dict[str, Any]:
        """Sincronizar operación de creación"""
        
        # Verificar si el objeto ya existe (por ID o campos únicos)
        existing_obj = None
        
        if operation.object_id:
            try:
                existing_obj = Model.objects.get(id=operation.object_id)
            except Model.DoesNotExist:
                pass
        
        if existing_obj:
            # Objeto ya existe, verificar si hay conflicto
            existing_data = self._model_to_dict(existing_obj)
            
            if self._data_changed(operation.data, existing_data):
                # Hay conflicto, resolver
                resolution, resolved_data = self.conflict_resolver.resolve_conflict(
                    operation, existing_data
                )
                
                if resolution == 'manual':
                    return {
                        'status': 'conflict',
                        'message': 'Conflicto requiere resolución manual',
                        'server_data': existing_data
                    }
                
                # Aplicar resolución
                for field, value in resolved_data.items():
                    if hasattr(existing_obj, field):
                        setattr(existing_obj, field, value)
                existing_obj.save()
        else:
            # Crear nuevo objeto
            obj = Model.objects.create(**operation.data)
        
        return {'status': 'synced', 'message': 'Objeto creado/actualizado correctamente'}
    
    def _sync_update(self, Model, operation: OfflineOperation) -> Dict[str, Any]:
        """Sincronizar operación de actualización"""
        
        if not operation.object_id:
            return {'status': 'failed', 'message': 'ID de objeto requerido para actualización'}
        
        try:
            obj = Model.objects.get(id=operation.object_id)
            existing_data = self._model_to_dict(obj)
            
            # Verificar conflictos
            if self._data_changed(operation.data, existing_data):
                resolution, resolved_data = self.conflict_resolver.resolve_conflict(
                    operation, existing_data
                )
                
                if resolution == 'manual':
                    return {
                        'status': 'conflict',
                        'message': 'Conflicto requiere resolución manual',
                        'server_data': existing_data
                    }
                
                # Aplicar cambios resueltos
                for field, value in resolved_data.items():
                    if hasattr(obj, field):
                        setattr(obj, field, value)
            else:
                # Aplicar cambios directamente
                for field, value in operation.data.items():
                    if hasattr(obj, field):
                        setattr(obj, field, value)
            
            obj.save()
            return {'status': 'synced', 'message': 'Objeto actualizado correctamente'}
            
        except Model.DoesNotExist:
            return {'status': 'failed', 'message': 'Objeto no encontrado en el servidor'}
    
    def _sync_delete(self, Model, operation: OfflineOperation) -> Dict[str, Any]:
        """Sincronizar operación de eliminación"""
        
        if not operation.object_id:
            return {'status': 'failed', 'message': 'ID de objeto requerido para eliminación'}
        
        try:
            obj = Model.objects.get(id=operation.object_id)
            obj.delete()
            return {'status': 'synced', 'message': 'Objeto eliminado correctamente'}
            
        except Model.DoesNotExist:
            # El objeto ya no existe, considerarlo como sincronizado
            return {'status': 'synced', 'message': 'Objeto ya había sido eliminado'}
    
    def _model_to_dict(self, obj) -> Dict[str, Any]:
        """Convertir modelo a diccionario"""
        data = {}
        for field in obj._meta.fields:
            value = getattr(obj, field.name)
            if hasattr(value, 'isoformat'):  # datetime
                value = value.isoformat()
            elif hasattr(value, 'pk'):  # foreign key
                value = str(value.pk)
            data[field.name] = value
        return data
    
    def _data_changed(self, new_data: Dict[str, Any], 
                     existing_data: Dict[str, Any]) -> bool:
        """Verificar si los datos han cambiado"""
        for key, value in new_data.items():
            if key in existing_data and existing_data[key] != value:
                return True
        return False
    
    def check_connectivity(self) -> bool:
        """Verificar conectividad a internet"""
        # Evitar verificaciones muy frecuentes
        if (timezone.now() - self.last_connectivity_check).seconds < 30:
            return self.is_online
        
        try:
            # Intentar hacer una consulta simple a la base de datos
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                
            self.is_online = True
            self.last_connectivity_check = timezone.now()
            
        except Exception as e:
            logger.warning(f"Sin conectividad detectada: {e}")
            self.is_online = False
            self.last_connectivity_check = timezone.now()
        
        return self.is_online
    
    def get_sync_status(self, user_id: int = None) -> Dict[str, Any]:
        """Obtener estado de sincronización"""
        
        if user_id:
            pending_ops = self.storage.get_user_operations(user_id, 'pending')
            failed_ops = self.storage.get_user_operations(user_id, 'failed')
            conflict_ops = self.storage.get_user_operations(user_id, 'conflict')
        else:
            # Estadísticas globales
            stats = self.storage.get_statistics()
            pending_count = stats['by_status'].get('pending', 0)
            failed_count = stats['by_status'].get('failed', 0)
            conflict_count = stats['by_status'].get('conflict', 0)
            
            return {
                'is_online': self.is_online,
                'last_connectivity_check': self.last_connectivity_check.isoformat(),
                'pending_operations': pending_count,
                'failed_operations': failed_count,
                'conflict_operations': conflict_count,
                'total_operations': stats['total_operations'],
                'statistics': stats
            }
        
        return {
            'is_online': self.is_online,
            'last_connectivity_check': self.last_connectivity_check.isoformat(),
            'pending_operations': len(pending_ops),
            'failed_operations': len(failed_ops),
            'conflict_operations': len(conflict_ops),
            'needs_sync': len(pending_ops) > 0 or len(failed_ops) > 0,
            'operations': {
                'pending': [op.to_dict() for op in pending_ops],
                'failed': [op.to_dict() for op in failed_ops],
                'conflicts': [op.to_dict() for op in conflict_ops]
            }
        }
    
    def resolve_conflict_manually(self, operation_id: str, resolution_data: Dict[str, Any],
                                 user: User) -> Dict[str, Any]:
        """Resolver conflicto manualmente"""
        
        operation = self.storage.get_operation(operation_id)
        if not operation:
            return {'success': False, 'error': 'Operación no encontrada'}
        
        if operation.status != 'conflict':
            return {'success': False, 'error': 'La operación no está en conflicto'}
        
        # Verificar permisos (solo el usuario propietario o admin)
        if operation.user.id != user.id and user.user_type != 'admin':
            return {'success': False, 'error': 'Sin permisos para resolver este conflicto'}
        
        # Actualizar datos de la operación con la resolución
        operation.data = resolution_data
        operation.status = 'pending'
        operation.conflict_resolution = 'manual'
        
        self.storage.save_operation(operation)
        
        # Intentar sincronizar nuevamente
        result = self._sync_operation(operation)
        
        return {
            'success': True,
            'sync_result': result
        }
    
    def cleanup_old_operations(self, days: int = 30) -> int:
        """Limpiar operaciones antiguas ya sincronizadas"""
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Esta funcionalidad dependería de implementar timestamps en el cache
        # Por ahora, solo retornamos 0
        logger.info(f"Limpieza de operaciones offline anteriores a {cutoff_date}")
        return 0
    
    def export_offline_data(self, user_id: int) -> Dict[str, Any]:
        """Exportar datos offline para backup/migración"""
        operations = self.storage.get_user_operations(user_id)
        
        return {
            'user_id': user_id,
            'export_timestamp': timezone.now().isoformat(),
            'operations_count': len(operations),
            'operations': [op.to_dict() for op in operations]
        }
    
    def import_offline_data(self, data: Dict[str, Any], user: User) -> Dict[str, Any]:
        """Importar datos offline desde backup"""
        
        if data.get('user_id') != user.id and user.user_type != 'admin':
            return {'success': False, 'error': 'Sin permisos para importar estos datos'}
        
        operations = data.get('operations', [])
        imported_count = 0
        
        for op_data in operations:
            try:
                operation = OfflineOperation.from_dict(op_data)
                self.storage.save_operation(operation)
                imported_count += 1
            except Exception as e:
                logger.error(f"Error importando operación: {e}")
        
        return {
            'success': True,
            'imported_count': imported_count,
            'total_operations': len(operations)
        }


# Instancia global del servicio
offline_sync_service = OfflineSyncService()