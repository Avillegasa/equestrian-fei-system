# backend/apps/sync/services.py

from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from typing import Dict, Any, List, Optional
import json
import logging

from .models import SyncSession, SyncAction, SyncConflict, SyncLog
from apps.competitions.models import Competition, Category, Participant
from apps.scoring.models import Score, Evaluation

# Obtener el modelo de usuario personalizado
User = get_user_model()

logger = logging.getLogger(__name__)


class SyncService:
    """Servicio para manejar operaciones de sincronización"""
    
    def __init__(self):
        # Importar dinámicamente para evitar dependencias circulares
        from apps.users.models import Judge
        
        self.model_mapping = {
            'competition': Competition,
            'category': Category,
            'participant': Participant,
            'score': Score,
            'evaluation': Evaluation,
            'judge': Judge,
        }
    
    def process_action(self, session: SyncSession, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesar una acción de sincronización"""
        
        try:
            # Crear registro de acción
            sync_action = SyncAction.objects.create(
                sync_session=session,
                action_type=action_data['action_type'],
                client_id=action_data['client_id'],
                data=action_data.get('data', {}),
                original_data=action_data.get('original_data', {}),
                priority=action_data.get('priority', 0)
            )
            
            sync_action.mark_as_processing()
            
            # Procesar según el tipo de acción
            if action_data['action_type'] == 'score_update':
                result = self._process_score_update(sync_action)
            elif action_data['action_type'] == 'participant_registration':
                result = self._process_participant_registration(sync_action)
            elif action_data['action_type'] == 'judge_assignment':
                result = self._process_judge_assignment(sync_action)
            elif action_data['action_type'] in ['create', 'update', 'delete']:
                result = self._process_crud_action(sync_action)
            else:
                raise ValueError(f"Tipo de acción no soportado: {action_data['action_type']}")
            
            if result.get('conflict'):
                # Si hay conflicto, no marcar como completada
                return result
            
            sync_action.mark_as_completed()
            
            return {
                'client_id': action_data['client_id'],
                'status': 'completed',
                'sync_action_id': str(sync_action.id),
                'result': result
            }
            
        except Exception as e:
            sync_action.mark_as_failed(str(e), {'traceback': str(e)})
            logger.error(f"Error procesando acción {action_data['client_id']}: {str(e)}")
            
            return {
                'client_id': action_data['client_id'],
                'status': 'failed',
                'error': str(e),
                'sync_action_id': str(sync_action.id)
            }
    
    def _process_score_update(self, sync_action: SyncAction) -> Dict[str, Any]:
        """Procesar actualización de puntuación"""
        
        data = sync_action.data
        participant_id = data.get('participant_id')
        judge_id = data.get('judge_id')
        scores = data.get('scores', {})
        
        try:
            participant = Participant.objects.get(id=participant_id)
            # Importar dinámicamente para evitar dependencias circulares
            from apps.users.models import Judge
            judge = Judge.objects.get(id=judge_id)
            
            # Verificar si hay puntuaciones conflictivas
            existing_scores = Score.objects.filter(
                participant=participant,
                judge=judge
            )
            
            conflict_detected = False
            for score in existing_scores:
                # Verificar si ha sido modificado desde la última sincronización
                if (score.updated_at > sync_action.sync_session.last_sync_time and 
                    str(score.id) in scores):
                    
                    conflict_detected = True
                    break
            
            if conflict_detected:
                return self._create_conflict(
                    sync_action,
                    'concurrent_update',
                    'Puntuación modificada concurrentemente por otro usuario',
                    {'existing_scores': [s.to_dict() for s in existing_scores]}
                )
            
            # Actualizar puntuaciones
            with transaction.atomic():
                for score_id, score_data in scores.items():
                    if score_id == 'new':
                        # Crear nueva puntuación
                        evaluation = Evaluation.objects.get(id=score_data['evaluation_id'])
                        Score.objects.create(
                            participant=participant,
                            judge=judge,
                            evaluation=evaluation,
                            value=score_data['value'],
                            notes=score_data.get('notes', ''),
                            justification=score_data.get('justification', '')
                        )
                    else:
                        # Actualizar puntuación existente
                        score = Score.objects.get(id=score_id)
                        score.value = score_data['value']
                        score.notes = score_data.get('notes', score.notes)
                        score.justification = score_data.get('justification', score.justification)
                        score.save()
                
                # Recalcular ranking si es necesario
                self._trigger_ranking_recalculation(participant.competition, participant.category)
            
            return {'success': True, 'updated_scores': len(scores)}
            
        except ObjectDoesNotExist as e:
            raise ValidationError(f"Objeto no encontrado: {str(e)}")
    
    def _process_participant_registration(self, sync_action: SyncAction) -> Dict[str, Any]:
        """Procesar registro de participante"""
        
        data = sync_action.data
        
        try:
            # Verificar si ya existe un participante con el mismo número
            competition_id = data.get('competition_id')
            participant_number = data.get('participant_number')
            
            existing = Participant.objects.filter(
                competition_id=competition_id,
                participant_number=participant_number
            ).first()
            
            if existing:
                return self._create_conflict(
                    sync_action,
                    'data_mismatch',
                    f'Ya existe un participante con el número {participant_number}',
                    {'existing_participant': existing.to_dict()}
                )
            
            # Crear participante
            participant = Participant.objects.create(**data)
            
            return {
                'success': True,
                'participant_id': participant.id,
                'participant_number': participant.participant_number
            }
            
        except ValidationError as e:
            return self._create_conflict(
                sync_action,
                'validation_error',
                f'Error de validación: {str(e)}',
                {'validation_errors': e.message_dict if hasattr(e, 'message_dict') else str(e)}
            )
    
    def _process_judge_assignment(self, sync_action: SyncAction) -> Dict[str, Any]:
        """Procesar asignación de juez"""
        
        data = sync_action.data
        
        try:
            competition_id = data.get('competition_id')
            judge_id = data.get('judge_id')
            category_ids = data.get('category_ids', [])
            
            competition = Competition.objects.get(id=competition_id)
            # Importar dinámicamente para evitar dependencias circulares
            from apps.users.models import Judge
            judge = Judge.objects.get(id=judge_id)
            
            # Verificar permisos
            if not self._can_assign_judge(judge, competition):
                return self._create_conflict(
                    sync_action,
                    'permission_denied',
                    'No se puede asignar este juez a la competencia',
                    {'judge_level': judge.certification_level, 'competition_level': competition.level}
                )
            
            # Asignar juez a categorías
            assigned_categories = []
            with transaction.atomic():
                for category_id in category_ids:
                    category = Category.objects.get(id=category_id)
                    
                    # Verificar si ya está asignado
                    if not category.judges.filter(id=judge_id).exists():
                        category.judges.add(judge)
                        assigned_categories.append(category_id)
            
            return {
                'success': True,
                'assigned_categories': assigned_categories,
                'judge_id': judge.id
            }
            
        except ObjectDoesNotExist as e:
            raise ValidationError(f"Objeto no encontrado: {str(e)}")
    
    def _process_crud_action(self, sync_action: SyncAction) -> Dict[str, Any]:
        """Procesar acción CRUD genérica"""
        
        action_type = sync_action.action_type
        data = sync_action.data
        model_name = data.get('model')
        object_id = data.get('object_id')
        
        if model_name not in self.model_mapping:
            raise ValueError(f"Modelo no soportado: {model_name}")
        
        model_class = self.model_mapping[model_name]
        
        try:
            if action_type == 'create':
                # Crear nuevo objeto
                obj = model_class.objects.create(**data.get('fields', {}))
                return {
                    'success': True,
                    'action': 'created',
                    'object_id': obj.id
                }
            
            elif action_type == 'update':
                # Actualizar objeto existente
                obj = model_class.objects.get(id=object_id)
                
                # Verificar conflictos de concurrencia
                if (hasattr(obj, 'updated_at') and 
                    obj.updated_at > sync_action.sync_session.last_sync_time):
                    
                    return self._create_conflict(
                        sync_action,
                        'concurrent_update',
                        'Objeto modificado concurrentemente',
                        {'current_data': self._serialize_object(obj)}
                    )
                
                # Actualizar campos
                for field, value in data.get('fields', {}).items():
                    setattr(obj, field, value)
                obj.save()
                
                return {
                    'success': True,
                    'action': 'updated',
                    'object_id': obj.id
                }
            
            elif action_type == 'delete':
                # Eliminar objeto
                obj = model_class.objects.get(id=object_id)
                obj.delete()
                
                return {
                    'success': True,
                    'action': 'deleted',
                    'object_id': object_id
                }
            
        except ObjectDoesNotExist as e:
            raise ValidationError(f"Objeto no encontrado: {str(e)}")
    
    def _create_conflict(self, sync_action: SyncAction, conflict_type: str, 
                        description: str, server_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crear un conflicto de sincronización"""
        
        conflict = SyncConflict.objects.create(
            sync_action=sync_action,
            conflict_type=conflict_type,
            description=description,
            client_data=sync_action.data,
            server_data=server_data
        )
        
        # Log del conflicto
        SyncLog.objects.create(
            sync_session=sync_action.sync_session,
            event_type='conflict_detected',
            message=f'Conflicto detectado: {description}',
            details={
                'conflict_id': str(conflict.id),
                'conflict_type': conflict_type,
                'action_type': sync_action.action_type,
                'client_id': sync_action.client_id
            }
        )
        
        return {
            'conflict': {
                'id': str(conflict.id),
                'type': conflict_type,
                'description': description,
                'client_data': sync_action.data,
                'server_data': server_data,
                'suggested_resolution': self._suggest_resolution(conflict_type)
            }
        }
    
    def _suggest_resolution(self, conflict_type: str) -> str:
        """Sugerir estrategia de resolución para un tipo de conflicto"""
        
        suggestions = {
            'concurrent_update': 'merge',
            'data_mismatch': 'manual',
            'validation_error': 'client_wins',
            'permission_denied': 'server_wins'
        }
        
        return suggestions.get(conflict_type, 'manual')
    
    def _can_assign_judge(self, judge, competition: Competition) -> bool:
        """Verificar si un juez puede ser asignado a una competencia"""
        
        # Verificar nivel de certificación
        required_levels = {
            'NATIONAL': ['NATIONAL', 'INTERNATIONAL', 'FEI'],
            'INTERNATIONAL': ['INTERNATIONAL', 'FEI'],
            'FEI': ['FEI']
        }
        
        competition_level = getattr(competition, 'level', 'NATIONAL')
        allowed_levels = required_levels.get(competition_level, ['NATIONAL', 'INTERNATIONAL', 'FEI'])
        
        return judge.certification_level in allowed_levels
    
    def _trigger_ranking_recalculation(self, competition: Competition, category: Category):
        """Disparar recálculo de ranking"""
        
        # Aquí puedes implementar la lógica para recalcular rankings
        # Por ejemplo, usando Celery para procesamiento asíncrono
        try:
            from apps.rankings.tasks import recalculate_ranking
            recalculate_ranking.delay(competition.id, category.id)
        except ImportError:
            # Si no está configurado Celery, calcular sincrónicamente
            from apps.rankings.services import RankingService
            ranking_service = RankingService()
            ranking_service.calculate_ranking(competition, category)
    
    def _serialize_object(self, obj) -> Dict[str, Any]:
        """Serializar objeto para incluir en conflictos"""
        
        from django.core import serializers
        serialized = serializers.serialize('json', [obj])
        return json.loads(serialized)[0]['fields']
    
    def process_resolved_action(self, conflict: SyncConflict) -> Dict[str, Any]:
        """Procesar acción después de resolver conflicto"""
        
        if not conflict.is_resolved():
            raise ValueError("El conflicto no ha sido resuelto")
        
        sync_action = conflict.sync_action
        
        try:
            # Actualizar datos de la acción con los datos resueltos
            if conflict.resolution_strategy == 'client_wins':
                resolved_data = conflict.client_data
            elif conflict.resolution_strategy == 'server_wins':
                resolved_data = conflict.server_data
            elif conflict.resolution_strategy == 'merge':
                resolved_data = conflict.resolved_data
            else:  # manual
                resolved_data = conflict.resolved_data
            
            # Actualizar la acción con los datos resueltos
            sync_action.data = resolved_data
            sync_action.status = 'pending'  # Volver a intentar
            sync_action.save()
            
            # Procesar la acción nuevamente
            if sync_action.action_type == 'score_update':
                result = self._process_score_update(sync_action)
            elif sync_action.action_type == 'participant_registration':
                result = self._process_participant_registration(sync_action)
            elif sync_action.action_type == 'judge_assignment':
                result = self._process_judge_assignment(sync_action)
            elif sync_action.action_type in ['create', 'update', 'delete']:
                result = self._process_crud_action(sync_action)
            else:
                raise ValueError(f"Tipo de acción no soportado: {sync_action.action_type}")
            
            if not result.get('conflict'):
                sync_action.mark_as_completed()
            
            # Log de resolución
            SyncLog.objects.create(
                sync_session=sync_action.sync_session,
                event_type='conflict_resolved',
                message=f'Conflicto resuelto: {conflict.description}',
                details={
                    'conflict_id': str(conflict.id),
                    'resolution_strategy': conflict.resolution_strategy,
                    'resolved_by': conflict.resolved_by.username if conflict.resolved_by else None
                }
            )
            
            return result
            
        except Exception as e:
            sync_action.mark_as_failed(str(e))
            raise


class OfflineDataService:
    """Servicio para manejar datos offline"""
    
    def __init__(self):
        pass
    
    def prepare_competition_data(self, competition_id: str) -> Dict[str, Any]:
        """Preparar datos de competencia para cache offline"""
        
        try:
            competition = Competition.objects.get(id=competition_id)
            
            # Datos básicos de la competencia
            competition_data = {
                'id': competition.id,
                'name': competition.name,
                'description': competition.description,
                'venue': competition.venue,
                'start_date': competition.start_date.isoformat(),
                'end_date': competition.end_date.isoformat(),
                'status': competition.status,
            }
            
            # Categorías
            categories = []
            for category in competition.categories.all():
                categories.append({
                    'id': category.id,
                    'name': category.name,
                    'code': category.code,
                    'level': category.level,
                    'evaluations': [
                        {
                            'id': eval.id,
                            'name': eval.name,
                            'coefficient': str(eval.coefficient),
                            'max_score': str(eval.max_score),
                            'min_score': str(eval.min_score)
                        }
                        for eval in category.evaluations.all()
                    ]
                })
            
            # Participantes
            participants = []
            for participant in competition.participants.all():
                participants.append({
                    'id': participant.id,
                    'participant_number': participant.participant_number,
                    'rider_name': participant.rider_name,
                    'horse_name': participant.horse_name,
                    'category_id': participant.category_id,
                    'scores': [
                        {
                            'id': score.id,
                            'judge_id': score.judge_id,
                            'evaluation_id': score.evaluation_id,
                            'value': str(score.value),
                            'notes': score.notes,
                            'justification': score.justification
                        }
                        for score in participant.scores.all()
                    ]
                })
            
            # Jueces
            judges = []
            for judge in competition.judges.all():
                judges.append({
                    'id': judge.id,
                    'full_name': judge.full_name,
                    'certification_level': judge.certification_level,
                    'license_number': judge.license_number,
                    'specialties': judge.specialties
                })
            
            return {
                'competition': competition_data,
                'categories': categories,
                'participants': participants,
                'judges': judges,
                'cache_timestamp': timezone.now().isoformat()
            }
            
        except Competition.DoesNotExist:
            raise ValueError(f"Competencia {competition_id} no encontrada")
    
    def validate_offline_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validar integridad de datos offline"""
        
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': []
        }
        
        try:
            # Validar estructura básica
            required_keys = ['competition', 'categories', 'participants', 'judges']
            for key in required_keys:
                if key not in data:
                    validation_result['errors'].append(f"Falta clave requerida: {key}")
                    validation_result['is_valid'] = False
            
            # Validar participantes tienen categorías válidas
            category_ids = {cat['id'] for cat in data.get('categories', [])}
            for participant in data.get('participants', []):
                if participant['category_id'] not in category_ids:
                    validation_result['warnings'].append(
                        f"Participante {participant['participant_number']} tiene categoría inválida"
                    )
            
            # Validar timestamps
            cache_timestamp = data.get('cache_timestamp')
            if cache_timestamp:
                from datetime import datetime
                cache_time = datetime.fromisoformat(cache_timestamp.replace('Z', '+00:00'))
                age_hours = (timezone.now() - cache_time).total_seconds() / 3600
                
                if age_hours > 24:
                    validation_result['warnings'].append(
                        f"Datos cacheados hace {age_hours:.1f} horas, considerar actualizar"
                    )
            
        except Exception as e:
            validation_result['errors'].append(f"Error en validación: {str(e)}")
            validation_result['is_valid'] = False
        
        return validation_result