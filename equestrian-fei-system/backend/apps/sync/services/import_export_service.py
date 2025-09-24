"""
Servicio de importación y exportación de datos para el sistema FEI.
Soporta múltiples formatos: CSV, Excel, JSON, XML, FEI XML.
"""

import os
import csv
import json
import logging
from typing import Dict, List, Any, Optional, IO, Union
from datetime import datetime, timedelta
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone
from django.contrib.auth.models import User
from django.apps import apps
from django.db import transaction
from django.core.serializers import serialize, deserialize
from .cache_service import cache_service
from .notification_service import notification_service

logger = logging.getLogger(__name__)

try:
    import pandas as pd
    import openpyxl
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    logger.warning("Pandas/openpyxl no disponible. Funcionalidad Excel limitada.")

try:
    import xml.etree.ElementTree as ET
    from xml.dom import minidom
    XML_AVAILABLE = True
except ImportError:
    XML_AVAILABLE = False
    logger.warning("XML no disponible.")


class DataFormatter:
    """Formateador de datos para diferentes formatos"""
    
    @staticmethod
    def to_csv(data: List[Dict[str, Any]], filename: str = None) -> str:
        """Convierte datos a formato CSV"""
        if not data:
            return ""
        
        import io
        output = io.StringIO()
        
        # Usar las claves del primer registro como headers
        fieldnames = data[0].keys()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        
        writer.writeheader()
        for row in data:
            # Convertir valores complejos a string
            clean_row = {}
            for key, value in row.items():
                if isinstance(value, (dict, list)):
                    clean_row[key] = json.dumps(value)
                elif value is None:
                    clean_row[key] = ""
                else:
                    clean_row[key] = str(value)
            writer.writerow(clean_row)
        
        return output.getvalue()
    
    @staticmethod
    def to_excel(data: List[Dict[str, Any]], filename: str = None) -> bytes:
        """Convierte datos a formato Excel"""
        if not PANDAS_AVAILABLE:
            raise ValueError("Pandas no disponible para exportar Excel")
        
        if not data:
            return b""
        
        # Crear DataFrame
        df = pd.DataFrame(data)
        
        # Convertir valores complejos a string
        for col in df.columns:
            df[col] = df[col].apply(
                lambda x: json.dumps(x) if isinstance(x, (dict, list)) else x
            )
        
        # Escribir a bytes
        import io
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        
        return output.getvalue()
    
    @staticmethod
    def to_json(data: List[Dict[str, Any]], filename: str = None) -> str:
        """Convierte datos a formato JSON"""
        return json.dumps(data, ensure_ascii=False, indent=2, default=str)
    
    @staticmethod
    def to_xml(data: List[Dict[str, Any]], root_name: str = "data", 
               item_name: str = "item") -> str:
        """Convierte datos a formato XML"""
        if not XML_AVAILABLE:
            raise ValueError("XML no disponible")
        
        root = ET.Element(root_name)
        
        for item in data:
            item_element = ET.SubElement(root, item_name)
            DataFormatter._dict_to_xml(item, item_element)
        
        # Formatear XML
        rough_string = ET.tostring(root, 'unicode')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")
    
    @staticmethod
    def _dict_to_xml(data: Dict, parent: ET.Element):
        """Convierte diccionario a elementos XML"""
        for key, value in data.items():
            # Limpiar nombre del elemento
            key = str(key).replace(" ", "_").replace("-", "_")
            
            if isinstance(value, dict):
                child = ET.SubElement(parent, key)
                DataFormatter._dict_to_xml(value, child)
            elif isinstance(value, list):
                for item in value:
                    child = ET.SubElement(parent, key)
                    if isinstance(item, dict):
                        DataFormatter._dict_to_xml(item, child)
                    else:
                        child.text = str(item)
            else:
                child = ET.SubElement(parent, key)
                child.text = str(value) if value is not None else ""
    
    @staticmethod
    def from_csv(csv_content: str) -> List[Dict[str, Any]]:
        """Convierte CSV a lista de diccionarios"""
        import io
        reader = csv.DictReader(io.StringIO(csv_content))
        
        data = []
        for row in reader:
            # Intentar deserializar valores JSON
            clean_row = {}
            for key, value in row.items():
                try:
                    clean_row[key] = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    clean_row[key] = value
            data.append(clean_row)
        
        return data
    
    @staticmethod
    def from_excel(excel_content: bytes) -> List[Dict[str, Any]]:
        """Convierte Excel a lista de diccionarios"""
        if not PANDAS_AVAILABLE:
            raise ValueError("Pandas no disponible para importar Excel")
        
        import io
        df = pd.read_excel(io.BytesIO(excel_content))
        
        # Convertir NaN a None
        df = df.where(pd.notnull(df), None)
        
        return df.to_dict('records')
    
    @staticmethod
    def from_json(json_content: str) -> List[Dict[str, Any]]:
        """Convierte JSON a lista de diccionarios"""
        data = json.loads(json_content)
        
        # Si no es una lista, convertir a lista
        if not isinstance(data, list):
            data = [data]
        
        return data


class FEIXMLFormatter:
    """Formateador específico para formato XML de la FEI"""
    
    @staticmethod
    def to_fei_xml(competitions_data: List[Dict], results_data: List[Dict] = None) -> str:
        """Convierte datos a formato XML FEI estándar"""
        if not XML_AVAILABLE:
            raise ValueError("XML no disponible")
        
        # Crear estructura XML FEI
        root = ET.Element("FEI_Document")
        root.set("version", "1.0")
        root.set("created", timezone.now().isoformat())
        
        # Header
        header = ET.SubElement(root, "Header")
        ET.SubElement(header, "CreationDate").text = timezone.now().strftime("%Y-%m-%d")
        ET.SubElement(header, "CreationTime").text = timezone.now().strftime("%H:%M:%S")
        ET.SubElement(header, "Source").text = "Equestrian FEI System"
        
        # Competitions
        competitions_elem = ET.SubElement(root, "Competitions")
        
        for comp in competitions_data:
            comp_elem = ET.SubElement(competitions_elem, "Competition")
            comp_elem.set("id", str(comp.get('id', '')))
            
            ET.SubElement(comp_elem, "Name").text = comp.get('name', '')
            ET.SubElement(comp_elem, "Date").text = str(comp.get('date', ''))
            ET.SubElement(comp_elem, "Discipline").text = comp.get('discipline', '')
            ET.SubElement(comp_elem, "Level").text = comp.get('level', '')
            ET.SubElement(comp_elem, "Status").text = comp.get('status', '')
            
            # Venue
            venue_elem = ET.SubElement(comp_elem, "Venue")
            ET.SubElement(venue_elem, "Name").text = comp.get('venue_name', '')
            ET.SubElement(venue_elem, "Country").text = comp.get('venue_country', '')
            ET.SubElement(venue_elem, "City").text = comp.get('venue_city', '')
        
        # Results (si se proporcionan)
        if results_data:
            results_elem = ET.SubElement(root, "Results")
            
            for result in results_data:
                result_elem = ET.SubElement(results_elem, "Result")
                result_elem.set("competition_id", str(result.get('competition_id', '')))
                
                ET.SubElement(result_elem, "ParticipantId").text = str(result.get('participant_id', ''))
                ET.SubElement(result_elem, "RiderName").text = result.get('rider_name', '')
                ET.SubElement(result_elem, "HorseName").text = result.get('horse_name', '')
                ET.SubElement(result_elem, "FinalScore").text = str(result.get('final_score', ''))
                ET.SubElement(result_elem, "Position").text = str(result.get('position', ''))
                ET.SubElement(result_elem, "Status").text = result.get('status', '')
        
        # Formatear XML
        rough_string = ET.tostring(root, 'unicode')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")
    
    @staticmethod
    def from_fei_xml(xml_content: str) -> Dict[str, List[Dict]]:
        """Convierte XML FEI a datos del sistema"""
        if not XML_AVAILABLE:
            raise ValueError("XML no disponible")
        
        root = ET.fromstring(xml_content)
        data = {'competitions': [], 'results': []}
        
        # Parsear competencias
        competitions_elem = root.find('Competitions')
        if competitions_elem:
            for comp_elem in competitions_elem.findall('Competition'):
                competition = {
                    'id': comp_elem.get('id'),
                    'name': comp_elem.findtext('Name', ''),
                    'date': comp_elem.findtext('Date', ''),
                    'discipline': comp_elem.findtext('Discipline', ''),
                    'level': comp_elem.findtext('Level', ''),
                    'status': comp_elem.findtext('Status', ''),
                }
                
                # Venue
                venue_elem = comp_elem.find('Venue')
                if venue_elem:
                    competition.update({
                        'venue_name': venue_elem.findtext('Name', ''),
                        'venue_country': venue_elem.findtext('Country', ''),
                        'venue_city': venue_elem.findtext('City', ''),
                    })
                
                data['competitions'].append(competition)
        
        # Parsear resultados
        results_elem = root.find('Results')
        if results_elem:
            for result_elem in results_elem.findall('Result'):
                result = {
                    'competition_id': result_elem.get('competition_id'),
                    'participant_id': result_elem.findtext('ParticipantId', ''),
                    'rider_name': result_elem.findtext('RiderName', ''),
                    'horse_name': result_elem.findtext('HorseName', ''),
                    'final_score': result_elem.findtext('FinalScore', ''),
                    'position': result_elem.findtext('Position', ''),
                    'status': result_elem.findtext('Status', ''),
                }
                data['results'].append(result)
        
        return data


class ImportExportJob:
    """Trabajo de importación/exportación"""
    
    def __init__(self, job_type: str, user: User, model_name: str = None, 
                 format: str = 'csv', filters: Dict = None):
        self.job_type = job_type  # 'import' o 'export'
        self.user = user
        self.model_name = model_name
        self.format = format
        self.filters = filters or {}
        self.job_id = f"{job_type}_{int(timezone.now().timestamp())}"
        self.status = 'pending'
        self.progress = 0
        self.total_records = 0
        self.processed_records = 0
        self.success_count = 0
        self.error_count = 0
        self.errors = []
        self.result_file_path = None
        self.created_at = timezone.now()
        self.started_at = None
        self.completed_at = None
    
    def start(self):
        """Iniciar trabajo"""
        self.status = 'running'
        self.started_at = timezone.now()
        self._save_to_cache()
    
    def complete(self):
        """Completar trabajo"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.progress = 100
        self._save_to_cache()
    
    def fail(self, error_message: str):
        """Marcar como fallido"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        self.errors.append(error_message)
        self._save_to_cache()
    
    def update_progress(self, processed: int, total: int = None):
        """Actualizar progreso"""
        self.processed_records = processed
        if total:
            self.total_records = total
        
        if self.total_records > 0:
            self.progress = (self.processed_records / self.total_records) * 100
        
        self._save_to_cache()
    
    def add_error(self, error: str):
        """Añadir error"""
        self.errors.append(error)
        self.error_count += 1
        self._save_to_cache()
    
    def _save_to_cache(self):
        """Guardar estado en cache"""
        cache_key = f"import_export_job:{self.job_id}"
        job_data = {
            'job_id': self.job_id,
            'job_type': self.job_type,
            'user_id': self.user.id,
            'model_name': self.model_name,
            'format': self.format,
            'filters': self.filters,
            'status': self.status,
            'progress': self.progress,
            'total_records': self.total_records,
            'processed_records': self.processed_records,
            'success_count': self.success_count,
            'error_count': self.error_count,
            'errors': self.errors,
            'result_file_path': self.result_file_path,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
        
        cache_service.set(
            cache_key,
            job_data,
            timeout=86400,  # 24 horas
            tags=['import_export', 'jobs', f'user_{self.user.id}']
        )


class ImportExportService:
    """Servicio principal de importación/exportación"""
    
    SUPPORTED_FORMATS = ['csv', 'json', 'xlsx', 'xml', 'fei_xml']
    EXPORTABLE_MODELS = {
        'Competition': 'apps.competitions.models.Competition',
        'Participant': 'apps.competitions.models.Participant',
        'ScoreCard': 'apps.scoring.models.ScoreCard',
        'CompetitionRanking': 'apps.scoring.models.CompetitionRanking',
        'User': 'django.contrib.auth.models.User',
        'Horse': 'apps.competitions.models.Horse',
        'ExternalSystem': 'apps.sync.models.ExternalSystem',
        'SyncJob': 'apps.sync.models.SyncJob'
    }
    
    def __init__(self):
        self.formatter = DataFormatter()
        self.fei_formatter = FEIXMLFormatter()
    
    def export_data(self, model_name: str, format: str, user: User,
                   filters: Dict = None, fields: List[str] = None) -> ImportExportJob:
        """Exportar datos del modelo especificado"""
        
        # Validar formato
        if format not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Formato {format} no soportado")
        
        # Validar modelo
        if model_name not in self.EXPORTABLE_MODELS:
            raise ValueError(f"Modelo {model_name} no exportable")
        
        # Crear trabajo
        job = ImportExportJob(
            job_type='export',
            user=user,
            model_name=model_name,
            format=format,
            filters=filters or {}
        )
        
        try:
            job.start()
            
            # Obtener modelo
            model_path = self.EXPORTABLE_MODELS[model_name]
            app_label, model_name_internal = model_path.split('.')[-2:]
            Model = apps.get_model(app_label, model_name_internal.split('.')[-1])
            
            # Aplicar filtros
            queryset = Model.objects.all()
            if filters:
                queryset = queryset.filter(**filters)
            
            # Aplicar campos específicos si se especifican
            if fields:
                queryset = queryset.only(*fields)
            
            # Obtener datos
            total_records = queryset.count()
            job.update_progress(0, total_records)
            
            # Serializar datos por lotes para manejar grandes datasets
            batch_size = 1000
            all_data = []
            
            for i in range(0, total_records, batch_size):
                batch = queryset[i:i+batch_size]
                
                # Serializar lote
                if format == 'json':
                    # Usar Django serializer para mantener relaciones
                    serialized = serialize('json', batch)
                    batch_data = json.loads(serialized)
                    all_data.extend([item['fields'] for item in batch_data])
                else:
                    # Convertir a diccionario simple
                    for obj in batch:
                        item_data = {}
                        for field in obj._meta.fields:
                            value = getattr(obj, field.name)
                            if hasattr(value, 'isoformat'):  # datetime
                                value = value.isoformat()
                            elif hasattr(value, 'pk'):  # foreign key
                                value = str(value.pk)
                            item_data[field.name] = value
                        all_data.append(item_data)
                
                job.update_progress(i + len(batch))
            
            # Formatear datos según formato solicitado
            if format == 'csv':
                content = self.formatter.to_csv(all_data)
                content_type = 'text/csv'
                file_ext = 'csv'
            elif format == 'json':
                content = self.formatter.to_json(all_data)
                content_type = 'application/json'
                file_ext = 'json'
            elif format == 'xlsx':
                content = self.formatter.to_excel(all_data)
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                file_ext = 'xlsx'
            elif format == 'xml':
                content = self.formatter.to_xml(all_data, root_name=f"{model_name}List")
                content_type = 'application/xml'
                file_ext = 'xml'
            elif format == 'fei_xml':
                if model_name == 'Competition':
                    content = self.fei_formatter.to_fei_xml(all_data)
                    content_type = 'application/xml'
                    file_ext = 'xml'
                else:
                    raise ValueError("Formato FEI XML solo disponible para competencias")
            
            # Guardar archivo
            filename = f"{model_name}_{job.job_id}.{file_ext}"
            file_path = f"exports/{filename}"
            
            if isinstance(content, str):
                content = content.encode('utf-8')
            
            saved_path = default_storage.save(file_path, ContentFile(content))
            job.result_file_path = saved_path
            job.success_count = len(all_data)
            
            job.complete()
            
            # Notificar usuario
            notification_service.send_notification(
                'export_completed',
                recipients=[user.id],
                data={
                    'model_name': model_name,
                    'format': format,
                    'record_count': len(all_data),
                    'file_path': saved_path
                }
            )
            
        except Exception as e:
            logger.error(f"Error en exportación {job.job_id}: {e}")
            job.fail(str(e))
            
            # Notificar error
            notification_service.send_notification(
                'export_failed',
                recipients=[user.id],
                data={
                    'model_name': model_name,
                    'format': format,
                    'error': str(e)
                }
            )
        
        return job
    
    def import_data(self, model_name: str, format: str, user: User,
                   file_content: Union[str, bytes], 
                   update_existing: bool = False) -> ImportExportJob:
        """Importar datos al modelo especificado"""
        
        # Validar formato
        if format not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Formato {format} no soportado")
        
        # Validar modelo
        if model_name not in self.EXPORTABLE_MODELS:
            raise ValueError(f"Modelo {model_name} no importable")
        
        # Crear trabajo
        job = ImportExportJob(
            job_type='import',
            user=user,
            model_name=model_name,
            format=format
        )
        
        try:
            job.start()
            
            # Parsear contenido según formato
            if format == 'csv':
                if isinstance(file_content, bytes):
                    file_content = file_content.decode('utf-8')
                data = self.formatter.from_csv(file_content)
            elif format == 'json':
                if isinstance(file_content, bytes):
                    file_content = file_content.decode('utf-8')
                data = self.formatter.from_json(file_content)
            elif format == 'xlsx':
                data = self.formatter.from_excel(file_content)
            elif format == 'xml':
                if isinstance(file_content, bytes):
                    file_content = file_content.decode('utf-8')
                # Para XML genérico, asumir estructura simple
                root = ET.fromstring(file_content)
                data = []
                for item in root:
                    item_data = {}
                    for child in item:
                        item_data[child.tag] = child.text
                    data.append(item_data)
            elif format == 'fei_xml':
                if isinstance(file_content, bytes):
                    file_content = file_content.decode('utf-8')
                parsed_data = self.fei_formatter.from_fei_xml(file_content)
                # Usar datos de competencias por defecto
                data = parsed_data.get('competitions', [])
            
            total_records = len(data)
            job.update_progress(0, total_records)
            
            # Obtener modelo
            model_path = self.EXPORTABLE_MODELS[model_name]
            app_label, model_name_internal = model_path.split('.')[-2:]
            Model = apps.get_model(app_label, model_name_internal.split('.')[-1])
            
            # Importar datos por lotes con transacción
            batch_size = 100
            
            for i in range(0, total_records, batch_size):
                batch = data[i:i+batch_size]
                
                with transaction.atomic():
                    for item in batch:
                        try:
                            # Limpiar y preparar datos
                            clean_data = self._prepare_model_data(Model, item)
                            
                            if update_existing:
                                # Intentar actualizar o crear
                                obj, created = Model.objects.update_or_create(
                                    id=clean_data.get('id'),
                                    defaults=clean_data
                                )
                            else:
                                # Solo crear nuevos
                                obj = Model.objects.create(**clean_data)
                            
                            job.success_count += 1
                            
                        except Exception as e:
                            error_msg = f"Error importando registro {job.processed_records + 1}: {str(e)}"
                            job.add_error(error_msg)
                            logger.warning(error_msg)
                        
                        job.update_progress(job.processed_records + 1)
            
            job.complete()
            
            # Notificar usuario
            notification_service.send_notification(
                'import_completed',
                recipients=[user.id],
                data={
                    'model_name': model_name,
                    'format': format,
                    'success_count': job.success_count,
                    'error_count': job.error_count,
                    'total_records': total_records
                }
            )
            
        except Exception as e:
            logger.error(f"Error en importación {job.job_id}: {e}")
            job.fail(str(e))
            
            # Notificar error
            notification_service.send_notification(
                'import_failed',
                recipients=[user.id],
                data={
                    'model_name': model_name,
                    'format': format,
                    'error': str(e)
                }
            )
        
        return job
    
    def _prepare_model_data(self, Model, raw_data: Dict) -> Dict:
        """Preparar datos para el modelo Django"""
        clean_data = {}
        
        for field in Model._meta.fields:
            field_name = field.name
            raw_value = raw_data.get(field_name)
            
            if raw_value is None or raw_value == '':
                if not field.null:
                    # Usar valor por defecto si existe
                    if field.default != field.default.__class__():
                        clean_data[field_name] = field.default
                continue
            
            # Conversión según tipo de campo
            try:
                if field.get_internal_type() == 'DateTimeField':
                    if isinstance(raw_value, str):
                        clean_data[field_name] = datetime.fromisoformat(
                            raw_value.replace('Z', '+00:00')
                        )
                    else:
                        clean_data[field_name] = raw_value
                
                elif field.get_internal_type() == 'DateField':
                    if isinstance(raw_value, str):
                        clean_data[field_name] = datetime.strptime(
                            raw_value, '%Y-%m-%d'
                        ).date()
                    else:
                        clean_data[field_name] = raw_value
                
                elif field.get_internal_type() in ['IntegerField', 'PositiveIntegerField']:
                    clean_data[field_name] = int(raw_value)
                
                elif field.get_internal_type() == 'DecimalField':
                    clean_data[field_name] = float(raw_value)
                
                elif field.get_internal_type() == 'BooleanField':
                    if isinstance(raw_value, str):
                        clean_data[field_name] = raw_value.lower() in ['true', '1', 'yes']
                    else:
                        clean_data[field_name] = bool(raw_value)
                
                elif field.get_internal_type() == 'JSONField':
                    if isinstance(raw_value, str):
                        clean_data[field_name] = json.loads(raw_value)
                    else:
                        clean_data[field_name] = raw_value
                
                else:
                    clean_data[field_name] = str(raw_value)
                    
            except (ValueError, TypeError, json.JSONDecodeError) as e:
                logger.warning(f"Error convirtiendo campo {field_name}: {e}")
                continue
        
        return clean_data
    
    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Obtener estado de un trabajo"""
        cache_key = f"import_export_job:{job_id}"
        return cache_service.get(cache_key)
    
    def get_user_jobs(self, user_id: int, limit: int = 20) -> List[Dict]:
        """Obtener trabajos de un usuario"""
        pattern = "import_export_job:*"
        cache_keys = cache_service.get_keys_by_pattern(pattern)
        
        user_jobs = []
        for key in cache_keys:
            job_data = cache_service.get(key)
            if job_data and job_data.get('user_id') == user_id:
                user_jobs.append(job_data)
        
        # Ordenar por fecha de creación (más recientes primero)
        user_jobs.sort(
            key=lambda x: x.get('created_at', ''),
            reverse=True
        )
        
        return user_jobs[:limit]
    
    def get_available_models(self) -> List[Dict[str, str]]:
        """Obtener modelos disponibles para importación/exportación"""
        models = []
        for name, path in self.EXPORTABLE_MODELS.items():
            models.append({
                'name': name,
                'path': path,
                'description': f"Modelo {name}"
            })
        return models
    
    def get_supported_formats(self) -> List[Dict[str, Any]]:
        """Obtener formatos soportados"""
        formats = [
            {
                'name': 'csv',
                'description': 'Valores separados por comas',
                'extensions': ['.csv'],
                'import': True,
                'export': True
            },
            {
                'name': 'json',
                'description': 'Formato JSON',
                'extensions': ['.json'],
                'import': True,
                'export': True
            },
            {
                'name': 'xlsx',
                'description': 'Microsoft Excel',
                'extensions': ['.xlsx', '.xls'],
                'import': PANDAS_AVAILABLE,
                'export': PANDAS_AVAILABLE
            },
            {
                'name': 'xml',
                'description': 'XML genérico',
                'extensions': ['.xml'],
                'import': XML_AVAILABLE,
                'export': XML_AVAILABLE
            },
            {
                'name': 'fei_xml',
                'description': 'XML formato FEI estándar',
                'extensions': ['.xml'],
                'import': XML_AVAILABLE,
                'export': XML_AVAILABLE
            }
        ]
        return formats


# Instancia global del servicio
import_export_service = ImportExportService()