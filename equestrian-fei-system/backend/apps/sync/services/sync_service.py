import logging
import requests
import json
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError

from ..models import ExternalSystem, SyncJob, SyncRecord, DataMap
from .cache_service import cache_service

logger = logging.getLogger(__name__)


class SyncService:
    """Servicio principal para sincronización con sistemas externos"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Equestrian-FEI-System/1.0',
            'Content-Type': 'application/json'
        })
    
    def get_external_system(self, system_id: str) -> Optional[ExternalSystem]:
        """Obtener sistema externo por ID"""
        try:
            return ExternalSystem.objects.get(id=system_id, is_enabled=True)
        except ExternalSystem.DoesNotExist:
            logger.error(f"Sistema externo {system_id} no encontrado")
            return None
    
    def test_connection(self, system: ExternalSystem) -> Tuple[bool, str]:
        """Probar conexión con sistema externo"""
        try:
            if not system.api_url:
                return False, "URL de API no configurada"
            
            # Preparar headers de autenticación
            headers = {}
            if system.api_key:
                headers['Authorization'] = f"Bearer {system.api_key}"
                # o según el tipo de auth del sistema
                if system.system_type == 'fei':
                    headers['X-API-Key'] = system.api_key
            
            # Endpoint de health check o similar
            test_url = f"{system.api_url.rstrip('/')}/health"
            if system.system_type == 'fei':
                test_url = f"{system.api_url.rstrip('/')}/api/v1/status"
            
            response = self.session.get(
                test_url,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                system.status = 'active'
                system.last_sync = timezone.now()
                system.save(update_fields=['status', 'last_sync'])
                return True, "Conexión exitosa"
            else:
                return False, f"Error HTTP {response.status_code}: {response.text}"
                
        except requests.exceptions.Timeout:
            return False, "Timeout de conexión"
        except requests.exceptions.ConnectionError:
            return False, "Error de conexión"
        except Exception as e:
            return False, f"Error inesperado: {str(e)}"
    
    def create_sync_job(self, system: ExternalSystem, job_type: str, 
                       config: Dict[str, Any], priority: str = 'normal',
                       name: str = None, user = None) -> SyncJob:
        """Crear trabajo de sincronización"""
        job_name = name or f"{job_type.title()} - {system.name}"
        
        job = SyncJob.objects.create(
            external_system=system,
            job_type=job_type,
            priority=priority,
            name=job_name,
            config=config,
            created_by=user
        )
        
        logger.info(f"Trabajo de sincronización creado: {job.id}")
        return job
    
    def execute_sync_job(self, job: SyncJob) -> bool:
        """Ejecutar trabajo de sincronización"""
        try:
            job.start()
            job.add_log(f"Iniciando trabajo de tipo {job.job_type}")
            
            success = False
            
            if job.job_type == 'import':
                success = self._execute_import_job(job)
            elif job.job_type == 'export':
                success = self._execute_export_job(job)
            elif job.job_type == 'sync':
                success = self._execute_sync_job(job)
            elif job.job_type == 'validation':
                success = self._execute_validation_job(job)
            else:
                job.error_message = f"Tipo de trabajo no soportado: {job.job_type}"
                job.add_log(job.error_message)
            
            job.complete(success)
            
            if success:
                job.add_log("Trabajo completado exitosamente")
                # Actualizar timestamp de sincronización del sistema
                job.external_system.last_sync = timezone.now()
                job.external_system.update_next_sync()
            else:
                job.add_log("Trabajo falló")
                
            return success
            
        except Exception as e:
            job.error_message = str(e)
            job.add_log(f"Error ejecutando trabajo: {e}")
            job.complete(False)
            logger.error(f"Error en trabajo de sincronización {job.id}: {e}")
            return False
    
    def _execute_import_job(self, job: SyncJob) -> bool:
        """Ejecutar trabajo de importación"""
        try:
            config = job.config
            model_name = config.get('model')
            endpoint = config.get('endpoint', '')
            
            if not model_name:
                raise ValueError("Modelo no especificado en configuración")
            
            # Obtener URL completa
            url = f"{job.external_system.api_url.rstrip('/')}/{endpoint.lstrip('/')}"
            
            # Preparar headers
            headers = self._prepare_headers(job.external_system)
            
            job.add_log(f"Importando desde: {url}")
            
            # Realizar petición
            response = self.session.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Procesar datos según el formato
            records = data.get('data', data.get('results', data))
            if not isinstance(records, list):
                records = [records] if records else []
            
            job.total_records = len(records)
            job.processed_records = 0
            job.success_count = 0
            job.error_count = 0
            job.save()
            
            # Procesar cada registro
            for record in records:
                try:
                    self._process_import_record(job, model_name, record)
                    job.success_count += 1
                except Exception as e:
                    job.error_count += 1
                    job.add_log(f"Error procesando registro: {e}")
                
                job.processed_records += 1
                job.progress = int((job.processed_records / job.total_records) * 100)
                job.save(update_fields=['processed_records', 'success_count', 'error_count', 'progress'])
            
            return job.error_count == 0
            
        except Exception as e:
            job.add_log(f"Error en importación: {e}")
            raise
    
    def _execute_export_job(self, job: SyncJob) -> bool:
        """Ejecutar trabajo de exportación"""
        try:
            config = job.config
            model_name = config.get('model')
            endpoint = config.get('endpoint', '')
            
            if not model_name:
                raise ValueError("Modelo no especificado en configuración")
            
            # Obtener modelo Django
            content_type = ContentType.objects.get(model=model_name.lower())
            model_class = content_type.model_class()
            
            # Obtener registros a exportar
            queryset = model_class.objects.all()
            
            # Aplicar filtros si existen
            filters = config.get('filters', {})
            if filters:
                queryset = queryset.filter(**filters)
            
            records = list(queryset.values())
            job.total_records = len(records)
            job.save()
            
            job.add_log(f"Exportando {job.total_records} registros de {model_name}")
            
            # URL de destino
            url = f"{job.external_system.api_url.rstrip('/')}/{endpoint.lstrip('/')}"
            headers = self._prepare_headers(job.external_system)
            
            # Exportar en lotes
            batch_size = config.get('batch_size', 100)
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                
                try:
                    response = self.session.post(
                        url,
                        headers=headers,
                        json={'data': batch},
                        timeout=30
                    )
                    response.raise_for_status()
                    
                    job.success_count += len(batch)
                except Exception as e:
                    job.error_count += len(batch)
                    job.add_log(f"Error exportando lote: {e}")
                
                job.processed_records += len(batch)
                job.progress = int((job.processed_records / job.total_records) * 100)
                job.save(update_fields=['processed_records', 'success_count', 'error_count', 'progress'])
            
            return job.error_count == 0
            
        except Exception as e:
            job.add_log(f"Error en exportación: {e}")
            raise
    
    def _execute_sync_job(self, job: SyncJob) -> bool:
        """Ejecutar trabajo de sincronización bidireccional"""
        try:
            # Implementar lógica de sincronización bidireccional
            # 1. Comparar timestamps
            # 2. Identificar cambios
            # 3. Resolver conflictos
            # 4. Aplicar cambios
            
            job.add_log("Iniciando sincronización bidireccional")
            
            config = job.config
            models_to_sync = config.get('models', [])
            
            for model_name in models_to_sync:
                job.add_log(f"Sincronizando modelo: {model_name}")
                
                # Obtener cambios locales y remotos
                local_changes = self._get_local_changes(job, model_name)
                remote_changes = self._get_remote_changes(job, model_name)
                
                # Resolver conflictos
                resolved_changes = self._resolve_conflicts(local_changes, remote_changes)
                
                # Aplicar cambios
                self._apply_sync_changes(job, model_name, resolved_changes)
            
            return True
            
        except Exception as e:
            job.add_log(f"Error en sincronización: {e}")
            raise
    
    def _execute_validation_job(self, job: SyncJob) -> bool:
        """Ejecutar trabajo de validación"""
        try:
            job.add_log("Iniciando validación de datos")
            
            config = job.config
            model_name = config.get('model')
            validation_rules = config.get('rules', [])
            
            # Implementar validaciones específicas
            # Por ejemplo: verificar integridad de datos FEI
            
            return True
            
        except Exception as e:
            job.add_log(f"Error en validación: {e}")
            raise
    
    def _prepare_headers(self, system: ExternalSystem) -> Dict[str, str]:
        """Preparar headers para autenticación"""
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Equestrian-FEI-System/1.0'
        }
        
        if system.api_key:
            if system.system_type == 'fei':
                headers['X-API-Key'] = system.api_key
            else:
                headers['Authorization'] = f"Bearer {system.api_key}"
        
        # Headers adicionales desde configuración
        additional_headers = system.config.get('headers', {})
        headers.update(additional_headers)
        
        return headers
    
    def _process_import_record(self, job: SyncJob, model_name: str, record_data: Dict) -> None:
        """Procesar registro individual de importación"""
        try:
            # Obtener mapeo de datos
            data_maps = DataMap.objects.filter(
                external_system=job.external_system,
                local_model=model_name
            )
            
            # Transformar datos según mapeo
            transformed_data = {}
            external_id = None
            
            for data_map in data_maps:
                external_value = record_data.get(data_map.external_field)
                
                if external_value is not None:
                    # Aplicar transformaciones si existen
                    if data_map.transformation_rule:
                        # Implementar lógica de transformación
                        external_value = self._apply_transformation(
                            external_value, 
                            data_map.transformation_rule
                        )
                    
                    transformed_data[data_map.local_field] = external_value
                    
                    if data_map.is_key_field:
                        external_id = str(external_value)
                elif data_map.is_required:
                    if data_map.default_value:
                        transformed_data[data_map.local_field] = data_map.default_value
                    else:
                        raise ValidationError(f"Campo requerido faltante: {data_map.local_field}")
            
            if not external_id:
                external_id = record_data.get('id', record_data.get('uuid'))
            
            # Crear registro de sincronización
            content_type = ContentType.objects.get(model=model_name.lower())
            
            sync_record = SyncRecord.objects.create(
                sync_job=job,
                content_type=content_type,
                external_id=external_id or f"import_{timezone.now().timestamp()}",
                action='create',
                external_data=record_data,
                local_data=transformed_data
            )
            
            # Crear o actualizar objeto local
            model_class = content_type.model_class()
            
            # Verificar si ya existe
            existing_obj = None
            if external_id:
                # Buscar por ID externo en tabla de mapeo o campo específico
                # Esto dependerá de la implementación específica del modelo
                pass
            
            if existing_obj:
                # Actualizar objeto existente
                for field, value in transformed_data.items():
                    setattr(existing_obj, field, value)
                existing_obj.save()
                sync_record.action = 'update'
                sync_record.object_id = existing_obj.id
            else:
                # Crear nuevo objeto
                new_obj = model_class.objects.create(**transformed_data)
                sync_record.object_id = new_obj.id
            
            sync_record.status = 'success'
            sync_record.processed_at = timezone.now()
            sync_record.save()
            
        except Exception as e:
            if 'sync_record' in locals():
                sync_record.status = 'failed'
                sync_record.error_message = str(e)
                sync_record.processed_at = timezone.now()
                sync_record.save()
            raise
    
    def _apply_transformation(self, value: Any, rule: str) -> Any:
        """Aplicar regla de transformación a un valor"""
        try:
            # Implementar diferentes tipos de transformaciones
            # Por ejemplo: formato de fechas, conversiones de unidades, etc.
            
            if rule.startswith('date:'):
                format_str = rule.split(':', 1)[1]
                if isinstance(value, str):
                    return datetime.strptime(value, format_str)
                return value
            
            elif rule.startswith('upper'):
                return str(value).upper() if value else value
            
            elif rule.startswith('lower'):
                return str(value).lower() if value else value
            
            elif rule.startswith('strip'):
                return str(value).strip() if value else value
            
            # Más transformaciones según necesidad
            return value
            
        except Exception as e:
            logger.warning(f"Error aplicando transformación '{rule}' a valor '{value}': {e}")
            return value
    
    def _get_local_changes(self, job: SyncJob, model_name: str) -> List[Dict]:
        """Obtener cambios locales desde la última sincronización"""
        # Implementar lógica para detectar cambios locales
        # usando timestamps, triggers, o logs de auditoría
        return []
    
    def _get_remote_changes(self, job: SyncJob, model_name: str) -> List[Dict]:
        """Obtener cambios remotos desde la última sincronización"""
        # Implementar lógica para obtener cambios del sistema externo
        return []
    
    def _resolve_conflicts(self, local_changes: List[Dict], remote_changes: List[Dict]) -> List[Dict]:
        """Resolver conflictos entre cambios locales y remotos"""
        # Implementar estrategias de resolución de conflictos
        # Por ejemplo: last-write-wins, merge, manual review, etc.
        return []
    
    def _apply_sync_changes(self, job: SyncJob, model_name: str, changes: List[Dict]) -> None:
        """Aplicar cambios de sincronización"""
        # Implementar aplicación de cambios resueltos
        pass
    
    def schedule_periodic_sync(self, system: ExternalSystem) -> None:
        """Programar sincronización periódica"""
        try:
            if system.is_sync_due():
                # Crear trabajo de sincronización automática
                config = {
                    'models': ['competition', 'participant', 'result'],
                    'mode': 'incremental'
                }
                
                job = self.create_sync_job(
                    system=system,
                    job_type='sync',
                    config=config,
                    name=f"Sync automática - {system.name}"
                )
                
                # Ejecutar trabajo
                self.execute_sync_job(job)
                
        except Exception as e:
            logger.error(f"Error en sincronización periódica para {system.name}: {e}")
    
    def get_sync_status(self, system_id: str = None) -> Dict[str, Any]:
        """Obtener estado de sincronización"""
        try:
            if system_id:
                system = self.get_external_system(system_id)
                if not system:
                    return {'error': 'Sistema no encontrado'}
                
                recent_jobs = SyncJob.objects.filter(
                    external_system=system
                ).order_by('-created_at')[:10]
                
                return {
                    'system': {
                        'id': system.id,
                        'name': system.name,
                        'status': system.status,
                        'last_sync': system.last_sync,
                        'next_sync': system.next_sync
                    },
                    'recent_jobs': [
                        {
                            'id': job.id,
                            'type': job.job_type,
                            'status': job.status,
                            'progress': job.progress,
                            'created_at': job.created_at,
                            'duration': str(job.duration) if job.duration else None
                        }
                        for job in recent_jobs
                    ]
                }
            else:
                # Estado general de todos los sistemas
                systems = ExternalSystem.objects.filter(is_enabled=True)
                return {
                    'total_systems': systems.count(),
                    'active_systems': systems.filter(status='active').count(),
                    'systems_with_errors': systems.filter(status='error').count(),
                    'systems': [
                        {
                            'id': system.id,
                            'name': system.name,
                            'type': system.system_type,
                            'status': system.status,
                            'last_sync': system.last_sync
                        }
                        for system in systems
                    ]
                }
                
        except Exception as e:
            logger.error(f"Error obteniendo estado de sincronización: {e}")
            return {'error': str(e)}


# Instancia singleton del servicio de sincronización
sync_service = SyncService()