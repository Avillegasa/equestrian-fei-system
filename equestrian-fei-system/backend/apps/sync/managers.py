"""
Managers para sincronización offline
"""
import json
import logging
from typing import Dict, List, Any, Optional
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import SyncSession, SyncAction, ConflictResolution, OfflineStorage
try:
    from ..scoring.models import ScoreCard, IndividualScore
except ImportError:
    # Temporalmente manejamos casos donde los modelos no están disponibles
    ScoreCard = None
    IndividualScore = None

logger = logging.getLogger(__name__)


class SyncManager:
    """Manager principal para coordinar sincronización"""

    def __init__(self):
        self.conflict_resolver = ConflictResolver()
        self.data_validator = DataValidator()

    def create_sync_session(self, user, device_id: str) -> SyncSession:
        """Crear nueva sesión de sincronización"""
        session = SyncSession.objects.create(
            user=user,
            device_id=device_id,
            status='pending'
        )
        logger.info(f"Sesión de sync creada: {session.id} para usuario {user.id}")
        return session

    def add_sync_action(self, session: SyncSession, action_type: str,
                       content_object: Any, data: Dict,
                       priority: str = 'normal') -> SyncAction:
        """Agregar acción a la cola de sincronización"""
        content_type = ContentType.objects.get_for_model(content_object)

        action = SyncAction.objects.create(
            sync_session=session,
            action_type=action_type,
            priority=priority,
            content_type=content_type,
            object_id=content_object.id,
            data=data,
            original_data=self._get_current_data(content_object)
        )

        # Actualizar contador de acciones en la sesión
        session.actions_count += 1
        session.save(update_fields=['actions_count'])

        logger.info(f"Acción de sync agregada: {action.id} tipo {action_type}")
        return action

    def process_sync_session(self, session: SyncSession) -> Dict:
        """Procesar todas las acciones de una sesión"""
        session.status = 'in_progress'
        session.save()

        results = {
            'total': session.actions_count,
            'successful': 0,
            'failed': 0,
            'conflicts': 0,
            'errors': []
        }

        try:
            with transaction.atomic():
                # Procesar acciones por prioridad
                actions = session.sync_actions.filter(
                    status='pending'
                ).order_by('priority', 'created_at')

                for action in actions:
                    try:
                        result = self._process_action(action)
                        if result['status'] == 'completed':
                            results['successful'] += 1
                        elif result['status'] == 'conflict':
                            results['conflicts'] += 1
                        else:
                            results['failed'] += 1
                    except Exception as e:
                        action.mark_failed(str(e))
                        results['failed'] += 1
                        results['errors'].append(str(e))
                        logger.error(f"Error procesando acción {action.id}: {e}")

                # Actualizar estadísticas de la sesión
                session.successful_actions = results['successful']
                session.failed_actions = results['failed']
                session.complete(success=results['failed'] == 0)

        except Exception as e:
            session.complete(success=False)
            logger.error(f"Error en sesión de sync {session.id}: {e}")
            results['errors'].append(str(e))

        return results

    def _process_action(self, action: SyncAction) -> Dict:
        """Procesar una acción individual"""
        action.mark_processing()

        # Validar datos
        if not self.data_validator.validate_action_data(action):
            action.mark_failed("Datos inválidos")
            return {'status': 'failed', 'error': 'Datos inválidos'}

        # Detectar conflictos
        if self._has_conflict(action):
            conflict = self._create_conflict_resolution(action)
            action.mark_conflict("Conflicto detectado")
            return {'status': 'conflict', 'conflict_id': conflict.id}

        # Aplicar cambios
        try:
            self._apply_action(action)
            action.mark_completed()
            return {'status': 'completed'}
        except Exception as e:
            action.mark_failed(str(e))
            return {'status': 'failed', 'error': str(e)}

    def _has_conflict(self, action: SyncAction) -> bool:
        """Detectar si hay conflicto con datos del servidor"""
        try:
            current_object = action.content_object
            if not current_object:
                return False

            current_data = self._get_current_data(current_object)
            original_data = action.original_data

            # Si los datos originales son diferentes a los actuales,
            # significa que hubo cambios en el servidor
            return current_data != original_data
        except:
            return False

    def _create_conflict_resolution(self, action: SyncAction) -> ConflictResolution:
        """Crear registro de resolución de conflicto"""
        current_data = self._get_current_data(action.content_object)

        conflict = ConflictResolution.objects.create(
            sync_action=action,
            strategy='last_write_wins',  # Estrategia por defecto
            server_data=current_data,
            client_data=action.data,
            conflict_fields=self._identify_conflict_fields(current_data, action.data)
        )

        return conflict

    def _identify_conflict_fields(self, server_data: Dict, client_data: Dict) -> List[str]:
        """Identificar campos específicos en conflicto"""
        conflict_fields = []

        for key in set(server_data.keys()) | set(client_data.keys()):
            if server_data.get(key) != client_data.get(key):
                conflict_fields.append(key)

        return conflict_fields

    def _apply_action(self, action: SyncAction):
        """Aplicar los cambios de una acción"""
        if action.action_type == 'create':
            self._apply_create_action(action)
        elif action.action_type == 'update':
            self._apply_update_action(action)
        elif action.action_type == 'delete':
            self._apply_delete_action(action)
        elif action.action_type == 'score_update':
            self._apply_score_update_action(action)
        else:
            raise ValueError(f"Tipo de acción no soportado: {action.action_type}")

    def _apply_create_action(self, action: SyncAction):
        """Aplicar acción de creación"""
        model_class = action.content_type.model_class()
        data = action.data.copy()

        # Remover campos que no deben ser incluidos en la creación
        data.pop('id', None)
        data.pop('created_at', None)
        data.pop('updated_at', None)

        obj = model_class.objects.create(**data)
        logger.info(f"Objeto creado: {model_class.__name__} {obj.id}")

    def _apply_update_action(self, action: SyncAction):
        """Aplicar acción de actualización"""
        obj = action.content_object
        if not obj:
            raise ValueError("Objeto no encontrado para actualización")

        data = action.data.copy()

        # Actualizar campos permitidos
        for field, value in data.items():
            if hasattr(obj, field) and field not in ['id', 'created_at']:
                setattr(obj, field, value)

        obj.save()
        logger.info(f"Objeto actualizado: {obj.__class__.__name__} {obj.id}")

    def _apply_delete_action(self, action: SyncAction):
        """Aplicar acción de eliminación"""
        obj = action.content_object
        if obj:
            obj.delete()
            logger.info(f"Objeto eliminado: {obj.__class__.__name__} {action.object_id}")

    def _apply_score_update_action(self, action: SyncAction):
        """Aplicar actualización de puntuación"""
        if not ScoreCard or not IndividualScore:
            raise ValueError("Modelos de scoring no disponibles")

        score_card = action.content_object
        if not isinstance(score_card, ScoreCard):
            raise ValueError("La acción score_update requiere ScoreCard")

        data = action.data
        scores_data = data.get('scores', [])

        # Actualizar puntuaciones
        for score_data in scores_data:
            individual_score = IndividualScore.objects.filter(
                id=score_data.get('id')
            ).first()

            if individual_score:
                individual_score.score = score_data.get('score')
                individual_score.notes = score_data.get('justification', '')
                individual_score.save()

        # Recalcular totales si el método existe
        if hasattr(score_card, 'calculate_totals'):
            score_card.calculate_totals()
        score_card.save()

        logger.info(f"Puntuaciones actualizadas para score card {score_card.id}")

    def _get_current_data(self, obj) -> Dict:
        """Obtener datos actuales de un objeto como diccionario"""
        if not obj:
            return {}

        data = {}
        for field in obj._meta.fields:
            if field.name not in ['password']:  # Excluir campos sensibles
                value = getattr(obj, field.name)
                if hasattr(value, 'isoformat'):  # Fechas
                    value = value.isoformat()
                elif hasattr(value, 'id'):  # ForeignKeys
                    value = value.id
                data[field.name] = value

        return data


class ConflictResolver:
    """Resolver conflictos de sincronización"""

    def resolve_conflict(self, conflict: ConflictResolution,
                        strategy: str = None, resolved_by=None) -> bool:
        """Resolver un conflicto usando la estrategia especificada"""
        if strategy:
            conflict.strategy = strategy

        try:
            if conflict.strategy == 'server_wins':
                resolved_data = conflict.server_data
            elif conflict.strategy == 'client_wins':
                resolved_data = conflict.client_data
            elif conflict.strategy == 'last_write_wins':
                resolved_data = self._apply_last_write_wins(conflict)
            elif conflict.strategy == 'manual_resolution':
                # Esperamos que resolved_data ya esté establecido manualmente
                resolved_data = conflict.resolved_data
                if not resolved_data:
                    return False
            else:
                resolved_data = self._apply_merge_strategy(conflict)

            conflict.resolve(resolved_data, resolved_by)
            return True

        except Exception as e:
            logger.error(f"Error resolviendo conflicto {conflict.id}: {e}")
            return False

    def _apply_last_write_wins(self, conflict: ConflictResolution) -> Dict:
        """Aplicar estrategia 'última escritura gana'"""
        action = conflict.sync_action

        # Comparar timestamps si están disponibles
        server_timestamp = conflict.server_data.get('updated_at')
        client_timestamp = action.data.get('updated_at')

        if server_timestamp and client_timestamp:
            if client_timestamp > server_timestamp:
                return conflict.client_data
            else:
                return conflict.server_data

        # Si no hay timestamps, priorizar cliente
        return conflict.client_data

    def _apply_merge_strategy(self, conflict: ConflictResolution) -> Dict:
        """Aplicar estrategia de fusión"""
        merged_data = conflict.server_data.copy()

        # Para campos específicos, usar lógica de fusión
        for field in conflict.conflict_fields:
            client_value = conflict.client_data.get(field)
            server_value = conflict.server_data.get(field)

            # Lógica específica por tipo de campo
            if field in ['score', 'total_score', 'percentage']:
                # Para puntuaciones, usar el valor del cliente (juez)
                merged_data[field] = client_value
            elif field in ['notes', 'justification']:
                # Para textos, combinar si ambos tienen contenido
                if client_value and server_value:
                    merged_data[field] = f"{server_value}\n[Offline]: {client_value}"
                else:
                    merged_data[field] = client_value or server_value
            else:
                # Por defecto, usar valor del cliente
                merged_data[field] = client_value

        return merged_data


class DataValidator:
    """Validador de datos para sincronización"""

    def validate_action_data(self, action: SyncAction) -> bool:
        """Validar datos de una acción de sincronización"""
        try:
            if action.action_type == 'score_update':
                return self._validate_score_data(action.data)
            elif action.action_type in ['create', 'update']:
                return self._validate_model_data(action)
            return True
        except Exception as e:
            logger.error(f"Error validando datos de acción {action.id}: {e}")
            return False

    def _validate_score_data(self, data: Dict) -> bool:
        """Validar datos de puntuación"""
        scores = data.get('scores', [])

        for score_data in scores:
            score = score_data.get('score')
            if score is not None:
                # Validar rango FEI (0.0-10.0)
                if not (0.0 <= score <= 10.0):
                    return False
                # Validar incrementos de 0.5
                if (score * 2) % 1 != 0:
                    return False

        return True

    def _validate_model_data(self, action: SyncAction) -> bool:
        """Validar datos de modelo"""
        model_class = action.content_type.model_class()
        data = action.data

        # Validaciones básicas de tipo de campo
        for field in model_class._meta.fields:
            if field.name in data:
                value = data[field.name]

                # Validar campos requeridos
                if not field.null and value is None:
                    return False

                # Validar longitud de campos de texto
                if hasattr(field, 'max_length') and field.max_length:
                    if isinstance(value, str) and len(value) > field.max_length:
                        return False

        return True