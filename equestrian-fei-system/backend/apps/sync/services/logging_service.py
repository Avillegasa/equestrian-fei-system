"""
Servicio de logging avanzado para el sistema FEI.
Proporciona logging estructurado, rotación de logs y análisis de eventos.
"""

import os
import json
import logging
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User
from .cache_service import cache_service


class StructuredLogger:
    """Logger con formato estructurado JSON"""
    
    def __init__(self, name: str, log_dir: str = None):
        self.logger = logging.getLogger(name)
        self.log_dir = log_dir or os.path.join(settings.BASE_DIR, 'logs')
        self.setup_handlers()
    
    def setup_handlers(self):
        """Configura los handlers de logging"""
        # Crear directorio de logs si no existe
        os.makedirs(self.log_dir, exist_ok=True)
        
        # Handler para archivo rotativo por tamaño
        file_handler = RotatingFileHandler(
            os.path.join(self.log_dir, f'{self.logger.name}.log'),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        
        # Handler para archivo rotativo por tiempo (diario)
        daily_handler = TimedRotatingFileHandler(
            os.path.join(self.log_dir, f'{self.logger.name}_daily.log'),
            when='midnight',
            interval=1,
            backupCount=30
        )
        
        # Formatter JSON estructurado
        formatter = StructuredFormatter()
        file_handler.setFormatter(formatter)
        daily_handler.setFormatter(formatter)
        
        # Configurar niveles
        file_handler.setLevel(logging.INFO)
        daily_handler.setLevel(logging.DEBUG)
        
        # Añadir handlers
        self.logger.addHandler(file_handler)
        self.logger.addHandler(daily_handler)
        self.logger.setLevel(logging.DEBUG)
    
    def log_event(self, level: str, event_type: str, message: str, 
                  user: User = None, extra_data: Dict = None, 
                  exception: Exception = None):
        """Registra un evento estructurado"""
        
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'event_type': event_type,
            'message': message,
            'level': level.upper(),
            'user_id': user.id if user else None,
            'username': user.username if user else None,
            'extra_data': extra_data or {}
        }
        
        if exception:
            log_data['exception'] = {
                'type': type(exception).__name__,
                'message': str(exception),
                'traceback': traceback.format_exc()
            }
        
        # Registrar en logger
        getattr(self.logger, level.lower())(json.dumps(log_data))
        
        # Guardar en cache para análisis inmediato
        self._cache_event(log_data)
    
    def _cache_event(self, log_data: Dict):
        """Guarda el evento en cache para análisis"""
        cache_key = f"log_events:{log_data['event_type']}:{int(timezone.now().timestamp())}"
        cache_service.set(
            cache_key,
            log_data,
            timeout=3600,  # 1 hora
            tags=['logging', 'events', log_data['event_type']]
        )


class StructuredFormatter(logging.Formatter):
    """Formateador JSON estructurado"""
    
    def format(self, record):
        """Formatea el registro como JSON"""
        # Si el mensaje ya es JSON, parsearlo
        try:
            if record.msg.startswith('{'):
                log_data = json.loads(record.msg)
            else:
                log_data = {
                    'timestamp': datetime.fromtimestamp(record.created).isoformat(),
                    'level': record.levelname,
                    'logger': record.name,
                    'message': record.msg,
                    'module': record.module,
                    'function': record.funcName,
                    'line': record.lineno
                }
        except:
            log_data = {
                'timestamp': datetime.fromtimestamp(record.created).isoformat(),
                'level': record.levelname,
                'logger': record.name,
                'message': str(record.msg),
                'module': record.module,
                'function': record.funcName,
                'line': record.lineno
            }
        
        return json.dumps(log_data, ensure_ascii=False)


class LogAnalyzer:
    """Analizador de logs para generar métricas e insights"""
    
    def __init__(self, log_dir: str = None):
        self.log_dir = log_dir or os.path.join(settings.BASE_DIR, 'logs')
    
    def analyze_recent_events(self, hours: int = 24) -> Dict[str, Any]:
        """Analiza eventos recientes desde cache"""
        since = timezone.now() - timedelta(hours=hours)
        
        # Obtener eventos desde cache
        events = []
        cache_keys = cache_service.get_keys_by_pattern("log_events:*")
        
        for key in cache_keys:
            event = cache_service.get(key)
            if event and event.get('timestamp'):
                event_time = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
                if event_time >= since:
                    events.append(event)
        
        return self._analyze_events(events)
    
    def analyze_log_file(self, filename: str, hours: int = 24) -> Dict[str, Any]:
        """Analiza un archivo de log específico"""
        file_path = os.path.join(self.log_dir, filename)
        
        if not os.path.exists(file_path):
            return {'error': f'Archivo {filename} no encontrado'}
        
        events = []
        since = timezone.now() - timedelta(hours=hours)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        event = json.loads(line.strip())
                        event_time = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
                        
                        if event_time >= since:
                            events.append(event)
                            
                    except (json.JSONDecodeError, KeyError, ValueError):
                        continue
        
        except Exception as e:
            return {'error': f'Error leyendo archivo: {str(e)}'}
        
        return self._analyze_events(events)
    
    def _analyze_events(self, events: List[Dict]) -> Dict[str, Any]:
        """Analiza una lista de eventos"""
        if not events:
            return {
                'total_events': 0,
                'events_by_level': {},
                'events_by_type': {},
                'events_by_user': {},
                'timeline': [],
                'top_errors': []
            }
        
        # Contadores
        level_counts = {}
        type_counts = {}
        user_counts = {}
        error_messages = []
        
        # Timeline por hora
        timeline = {}
        
        for event in events:
            # Por nivel
            level = event.get('level', 'UNKNOWN')
            level_counts[level] = level_counts.get(level, 0) + 1
            
            # Por tipo de evento
            event_type = event.get('event_type', 'unknown')
            type_counts[event_type] = type_counts.get(event_type, 0) + 1
            
            # Por usuario
            username = event.get('username', 'anonymous')
            user_counts[username] = user_counts.get(username, 0) + 1
            
            # Errores
            if level in ['ERROR', 'CRITICAL'] and 'exception' in event:
                error_messages.append({
                    'timestamp': event['timestamp'],
                    'message': event['message'],
                    'exception': event['exception']['message'],
                    'user': username
                })
            
            # Timeline
            try:
                timestamp = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
                hour_key = timestamp.strftime('%Y-%m-%d %H:00')
                timeline[hour_key] = timeline.get(hour_key, 0) + 1
            except:
                continue
        
        return {
            'total_events': len(events),
            'events_by_level': level_counts,
            'events_by_type': type_counts,
            'events_by_user': user_counts,
            'timeline': sorted([
                {'hour': k, 'count': v} for k, v in timeline.items()
            ]),
            'top_errors': sorted(error_messages, 
                               key=lambda x: x['timestamp'], 
                               reverse=True)[:10]
        }
    
    def get_log_files(self) -> List[Dict[str, Any]]:
        """Obtiene información de los archivos de log"""
        if not os.path.exists(self.log_dir):
            return []
        
        files = []
        for filename in os.listdir(self.log_dir):
            if filename.endswith('.log'):
                file_path = os.path.join(self.log_dir, filename)
                try:
                    stat = os.stat(file_path)
                    files.append({
                        'name': filename,
                        'size': stat.st_size,
                        'size_mb': round(stat.st_size / (1024 * 1024), 2),
                        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        'lines': self._count_lines(file_path)
                    })
                except:
                    continue
        
        return sorted(files, key=lambda x: x['modified'], reverse=True)
    
    def _count_lines(self, file_path: str) -> int:
        """Cuenta las líneas de un archivo"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return sum(1 for _ in f)
        except:
            return 0
    
    def cleanup_old_logs(self, days: int = 30):
        """Limpia logs antiguos"""
        if not os.path.exists(self.log_dir):
            return 0
        
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count = 0
        
        for filename in os.listdir(self.log_dir):
            if filename.endswith('.log'):
                file_path = os.path.join(self.log_dir, filename)
                try:
                    stat = os.stat(file_path)
                    file_date = datetime.fromtimestamp(stat.st_mtime)
                    
                    if file_date < cutoff_date.replace(tzinfo=None):
                        os.remove(file_path)
                        deleted_count += 1
                        
                except Exception as e:
                    logging.error(f"Error eliminando archivo {filename}: {e}")
        
        return deleted_count


class AuditLogger:
    """Logger especializado para auditoría de eventos críticos"""
    
    def __init__(self):
        self.logger = StructuredLogger('audit')
    
    def log_user_action(self, user: User, action: str, resource: str, 
                       resource_id: str = None, details: Dict = None):
        """Registra acciones de usuario"""
        self.logger.log_event(
            level='info',
            event_type='user_action',
            message=f"Usuario {user.username} realizó {action} en {resource}",
            user=user,
            extra_data={
                'action': action,
                'resource': resource,
                'resource_id': resource_id,
                'details': details or {}
            }
        )
    
    def log_system_event(self, event: str, severity: str = 'info', 
                        details: Dict = None):
        """Registra eventos del sistema"""
        self.logger.log_event(
            level=severity,
            event_type='system_event',
            message=f"Evento del sistema: {event}",
            extra_data={
                'event': event,
                'details': details or {}
            }
        )
    
    def log_security_event(self, event: str, severity: str = 'warning',
                          user: User = None, ip_address: str = None, 
                          details: Dict = None):
        """Registra eventos de seguridad"""
        self.logger.log_event(
            level=severity,
            event_type='security_event',
            message=f"Evento de seguridad: {event}",
            user=user,
            extra_data={
                'event': event,
                'ip_address': ip_address,
                'details': details or {}
            }
        )
    
    def log_data_change(self, user: User, model: str, object_id: str,
                       action: str, old_values: Dict = None, 
                       new_values: Dict = None):
        """Registra cambios en datos"""
        self.logger.log_event(
            level='info',
            event_type='data_change',
            message=f"Cambio en {model} ID {object_id}: {action}",
            user=user,
            extra_data={
                'model': model,
                'object_id': object_id,
                'action': action,
                'old_values': old_values or {},
                'new_values': new_values or {}
            }
        )


class LoggingService:
    """Servicio principal de logging"""
    
    def __init__(self):
        self.system_logger = StructuredLogger('system')
        self.api_logger = StructuredLogger('api')
        self.sync_logger = StructuredLogger('sync')
        self.audit_logger = AuditLogger()
        self.analyzer = LogAnalyzer()
    
    def log_api_call(self, endpoint: str, method: str, user: User = None,
                    response_code: int = None, duration: float = None,
                    error: Exception = None):
        """Registra llamadas a la API"""
        level = 'error' if error or (response_code and response_code >= 400) else 'info'
        
        self.api_logger.log_event(
            level=level,
            event_type='api_call',
            message=f"{method} {endpoint}",
            user=user,
            extra_data={
                'endpoint': endpoint,
                'method': method,
                'response_code': response_code,
                'duration_ms': round(duration * 1000, 2) if duration else None
            },
            exception=error
        )
    
    def log_sync_operation(self, operation: str, system_id: str = None,
                          status: str = None, records_processed: int = None,
                          user: User = None, error: Exception = None):
        """Registra operaciones de sincronización"""
        level = 'error' if error or status == 'failed' else 'info'
        
        self.sync_logger.log_event(
            level=level,
            event_type='sync_operation',
            message=f"Sincronización {operation}: {status}",
            user=user,
            extra_data={
                'operation': operation,
                'system_id': system_id,
                'status': status,
                'records_processed': records_processed
            },
            exception=error
        )
    
    def log_system_startup(self):
        """Registra el inicio del sistema"""
        self.system_logger.log_event(
            level='info',
            event_type='system_startup',
            message='Sistema iniciado correctamente'
        )
    
    def log_system_shutdown(self):
        """Registra el cierre del sistema"""
        self.system_logger.log_event(
            level='info',
            event_type='system_shutdown',
            message='Sistema detenido correctamente'
        )
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Obtiene datos de logging para dashboard"""
        return {
            'recent_analysis': self.analyzer.analyze_recent_events(24),
            'log_files': self.analyzer.get_log_files(),
            'cache_events_count': len(cache_service.get_keys_by_pattern("log_events:*")),
            'last_update': timezone.now().isoformat()
        }


# Instancias globales
logging_service = LoggingService()
audit_logger = logging_service.audit_logger