"""
Servicio de monitoreo y logging avanzado para el sistema FEI.
Proporciona métricas en tiempo real, seguimiento de rendimiento y alertas.
"""

import time
import psutil
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict, deque
from django.core.cache import cache
from django.db import connection, connections
from django.conf import settings
from django.utils import timezone
from .cache_service import cache_service

logger = logging.getLogger(__name__)


class SystemMetrics:
    """Recopila métricas del sistema"""
    
    def __init__(self):
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.response_times = deque(maxlen=1000)
        self.active_connections = 0
        self.lock = threading.Lock()
    
    def record_request(self, response_time: float, status_code: int):
        """Registra una petición"""
        with self.lock:
            self.request_count += 1
            self.response_times.append(response_time)
            
            if status_code >= 400:
                self.error_count += 1
    
    def record_connection(self, active: bool):
        """Registra conexiones activas"""
        with self.lock:
            if active:
                self.active_connections += 1
            else:
                self.active_connections = max(0, self.active_connections - 1)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Obtiene métricas actuales"""
        with self.lock:
            uptime = time.time() - self.start_time
            
            # Métricas de respuesta
            avg_response_time = 0
            if self.response_times:
                avg_response_time = sum(self.response_times) / len(self.response_times)
            
            return {
                'uptime': uptime,
                'request_count': self.request_count,
                'error_count': self.error_count,
                'error_rate': (self.error_count / max(1, self.request_count)) * 100,
                'avg_response_time': avg_response_time,
                'active_connections': self.active_connections,
                'requests_per_second': self.request_count / max(1, uptime)
            }


class DatabaseMonitor:
    """Monitor de base de datos"""
    
    @staticmethod
    def get_connection_stats() -> Dict[str, Any]:
        """Obtiene estadísticas de conexiones"""
        stats = {}
        
        for alias, conn in connections.all():
            try:
                with conn.cursor() as cursor:
                    # PostgreSQL específico
                    if conn.vendor == 'postgresql':
                        cursor.execute("""
                            SELECT 
                                numbackends,
                                xact_commit,
                                xact_rollback,
                                blks_read,
                                blks_hit,
                                tup_returned,
                                tup_fetched,
                                tup_inserted,
                                tup_updated,
                                tup_deleted
                            FROM pg_stat_database 
                            WHERE datname = current_database()
                        """)
                        
                        row = cursor.fetchone()
                        if row:
                            stats[alias] = {
                                'active_connections': row[0],
                                'transactions_committed': row[1],
                                'transactions_rolled_back': row[2],
                                'blocks_read': row[3],
                                'blocks_hit': row[4],
                                'tuples_returned': row[5],
                                'tuples_fetched': row[6],
                                'tuples_inserted': row[7],
                                'tuples_updated': row[8],
                                'tuples_deleted': row[9],
                                'cache_hit_ratio': (row[4] / max(1, row[3] + row[4])) * 100
                            }
                    
                    # SQLite específico
                    elif conn.vendor == 'sqlite':
                        stats[alias] = {
                            'vendor': 'sqlite',
                            'file_size': DatabaseMonitor._get_sqlite_file_size(),
                            'page_count': DatabaseMonitor._get_sqlite_page_count(cursor),
                            'pragma_stats': DatabaseMonitor._get_sqlite_pragma_stats(cursor)
                        }
                    
            except Exception as e:
                logger.warning(f"Error obteniendo estadísticas de DB {alias}: {e}")
                stats[alias] = {'error': str(e)}
        
        return stats
    
    @staticmethod
    def _get_sqlite_file_size() -> int:
        """Obtiene el tamaño del archivo SQLite"""
        try:
            import os
            db_path = settings.DATABASES['default']['NAME']
            return os.path.getsize(db_path) if os.path.exists(db_path) else 0
        except:
            return 0
    
    @staticmethod
    def _get_sqlite_page_count(cursor) -> int:
        """Obtiene el número de páginas SQLite"""
        try:
            cursor.execute("PRAGMA page_count")
            return cursor.fetchone()[0]
        except:
            return 0
    
    @staticmethod
    def _get_sqlite_pragma_stats(cursor) -> Dict[str, Any]:
        """Obtiene estadísticas PRAGMA de SQLite"""
        stats = {}
        pragmas = ['cache_size', 'page_size', 'journal_mode', 'synchronous']
        
        for pragma in pragmas:
            try:
                cursor.execute(f"PRAGMA {pragma}")
                stats[pragma] = cursor.fetchone()[0]
            except:
                stats[pragma] = 'N/A'
        
        return stats
    
    @staticmethod
    def get_slow_queries() -> List[Dict[str, Any]]:
        """Obtiene consultas lentas (PostgreSQL)"""
        slow_queries = []
        
        try:
            with connection.cursor() as cursor:
                if connection.vendor == 'postgresql':
                    cursor.execute("""
                        SELECT 
                            query,
                            calls,
                            total_time,
                            mean_time,
                            max_time
                        FROM pg_stat_statements 
                        WHERE mean_time > 100
                        ORDER BY mean_time DESC 
                        LIMIT 10
                    """)
                    
                    for row in cursor.fetchall():
                        slow_queries.append({
                            'query': row[0][:200] + '...' if len(row[0]) > 200 else row[0],
                            'calls': row[1],
                            'total_time': row[2],
                            'mean_time': row[3],
                            'max_time': row[4]
                        })
                        
        except Exception as e:
            logger.debug(f"No se pudo obtener consultas lentas: {e}")
        
        return slow_queries


class AlertManager:
    """Gestor de alertas del sistema"""
    
    ALERT_TYPES = {
        'critical': {'level': 'critical', 'color': '#dc3545'},
        'warning': {'level': 'warning', 'color': '#ffc107'},
        'info': {'level': 'info', 'color': '#17a2b8'}
    }
    
    def __init__(self):
        self.alerts = deque(maxlen=100)
        self.alert_rules = self._load_default_rules()
        self.lock = threading.Lock()
    
    def _load_default_rules(self) -> Dict[str, Dict]:
        """Carga reglas de alerta por defecto"""
        return {
            'high_error_rate': {
                'condition': lambda metrics: metrics.get('error_rate', 0) > 5,
                'message': 'Tasa de error alta: {error_rate:.1f}%',
                'type': 'warning'
            },
            'slow_response': {
                'condition': lambda metrics: metrics.get('avg_response_time', 0) > 2,
                'message': 'Tiempo de respuesta lento: {avg_response_time:.2f}s',
                'type': 'warning'
            },
            'high_cpu': {
                'condition': lambda metrics: metrics.get('cpu_percent', 0) > 80,
                'message': 'Uso de CPU alto: {cpu_percent:.1f}%',
                'type': 'critical'
            },
            'high_memory': {
                'condition': lambda metrics: metrics.get('memory_percent', 0) > 85,
                'message': 'Uso de memoria alto: {memory_percent:.1f}%',
                'type': 'critical'
            },
            'disk_space': {
                'condition': lambda metrics: metrics.get('disk_usage', 0) > 90,
                'message': 'Espacio en disco bajo: {disk_usage:.1f}%',
                'type': 'critical'
            }
        }
    
    def check_alerts(self, metrics: Dict[str, Any]):
        """Verifica y genera alertas"""
        active_alerts = []
        
        for rule_name, rule in self.alert_rules.items():
            try:
                if rule['condition'](metrics):
                    alert = {
                        'id': f"{rule_name}_{int(time.time())}",
                        'rule': rule_name,
                        'type': rule['type'],
                        'message': rule['message'].format(**metrics),
                        'timestamp': timezone.now(),
                        'metrics': metrics.copy()
                    }
                    
                    active_alerts.append(alert)
                    self._add_alert(alert)
                    
            except Exception as e:
                logger.error(f"Error evaluando regla {rule_name}: {e}")
        
        return active_alerts
    
    def _add_alert(self, alert: Dict[str, Any]):
        """Añade una alerta"""
        with self.lock:
            self.alerts.append(alert)
    
    def get_active_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtiene alertas activas"""
        with self.lock:
            return list(self.alerts)[-limit:]
    
    def clear_alerts(self):
        """Limpia todas las alertas"""
        with self.lock:
            self.alerts.clear()


class PerformanceProfiler:
    """Perfilador de rendimiento"""
    
    def __init__(self):
        self.profiles = defaultdict(list)
        self.lock = threading.Lock()
    
    def profile(self, operation: str):
        """Decorador para perfilar operaciones"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    success = True
                    error = None
                except Exception as e:
                    result = None
                    success = False
                    error = str(e)
                    raise
                finally:
                    end_time = time.time()
                    duration = end_time - start_time
                    
                    self._record_profile(operation, duration, success, error)
                
                return result
            return wrapper
        return decorator
    
    def _record_profile(self, operation: str, duration: float, success: bool, error: str = None):
        """Registra un perfil de rendimiento"""
        with self.lock:
            profile_data = {
                'timestamp': timezone.now(),
                'duration': duration,
                'success': success,
                'error': error
            }
            
            self.profiles[operation].append(profile_data)
            
            # Mantener solo los últimos 1000 registros por operación
            if len(self.profiles[operation]) > 1000:
                self.profiles[operation] = self.profiles[operation][-1000:]
    
    def get_profile_stats(self, operation: str = None) -> Dict[str, Any]:
        """Obtiene estadísticas de rendimiento"""
        with self.lock:
            if operation:
                return self._calculate_stats(operation, self.profiles[operation])
            
            stats = {}
            for op, profiles in self.profiles.items():
                stats[op] = self._calculate_stats(op, profiles)
            
            return stats
    
    def _calculate_stats(self, operation: str, profiles: List[Dict]) -> Dict[str, Any]:
        """Calcula estadísticas de una operación"""
        if not profiles:
            return {'operation': operation, 'count': 0}
        
        durations = [p['duration'] for p in profiles]
        successes = [p for p in profiles if p['success']]
        errors = [p for p in profiles if not p['success']]
        
        return {
            'operation': operation,
            'count': len(profiles),
            'success_count': len(successes),
            'error_count': len(errors),
            'success_rate': (len(successes) / len(profiles)) * 100,
            'avg_duration': sum(durations) / len(durations),
            'min_duration': min(durations),
            'max_duration': max(durations),
            'total_duration': sum(durations),
            'recent_errors': [e['error'] for e in errors[-5:]]
        }


class MonitoringService:
    """Servicio principal de monitoreo"""
    
    def __init__(self):
        self.system_metrics = SystemMetrics()
        self.alert_manager = AlertManager()
        self.profiler = PerformanceProfiler()
        self.is_monitoring = False
        self.monitor_thread = None
    
    def start_monitoring(self, interval: int = 60):
        """Inicia el monitoreo continuo"""
        if self.is_monitoring:
            return
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(
            target=self._monitoring_loop,
            args=(interval,),
            daemon=True
        )
        self.monitor_thread.start()
        logger.info("Sistema de monitoreo iniciado")
    
    def stop_monitoring(self):
        """Detiene el monitoreo"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        logger.info("Sistema de monitoreo detenido")
    
    def _monitoring_loop(self, interval: int):
        """Bucle principal de monitoreo"""
        while self.is_monitoring:
            try:
                metrics = self.collect_all_metrics()
                alerts = self.alert_manager.check_alerts(metrics)
                
                # Guardar métricas en cache
                cache_service.set(
                    'monitoring:metrics',
                    metrics,
                    timeout=300,
                    tags=['monitoring', 'metrics']
                )
                
                if alerts:
                    cache_service.set(
                        'monitoring:alerts',
                        alerts,
                        timeout=300,
                        tags=['monitoring', 'alerts']
                    )
                
                time.sleep(interval)
                
            except Exception as e:
                logger.error(f"Error en bucle de monitoreo: {e}")
                time.sleep(interval)
    
    def collect_all_metrics(self) -> Dict[str, Any]:
        """Recopila todas las métricas del sistema"""
        metrics = {}
        
        try:
            # Métricas del sistema
            metrics.update(self.system_metrics.get_metrics())
            
            # Métricas de sistema operativo
            metrics.update(self._get_system_metrics())
            
            # Métricas de base de datos
            metrics['database'] = DatabaseMonitor.get_connection_stats()
            
            # Métricas de cache
            metrics['cache'] = cache_service.get_stats()
            
            # Métricas de rendimiento
            metrics['performance'] = self.profiler.get_profile_stats()
            
            metrics['timestamp'] = timezone.now().isoformat()
            
        except Exception as e:
            logger.error(f"Error recopilando métricas: {e}")
            metrics['error'] = str(e)
        
        return metrics
    
    def _get_system_metrics(self) -> Dict[str, Any]:
        """Obtiene métricas del sistema operativo"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memoria
            memory = psutil.virtual_memory()
            
            # Disco
            disk = psutil.disk_usage('/')
            
            # Red
            network = psutil.net_io_counters()
            
            # Procesos
            process_count = len(psutil.pids())
            
            return {
                'cpu_percent': cpu_percent,
                'cpu_count': cpu_count,
                'memory_total': memory.total,
                'memory_available': memory.available,
                'memory_used': memory.used,
                'memory_percent': memory.percent,
                'disk_total': disk.total,
                'disk_used': disk.used,
                'disk_free': disk.free,
                'disk_usage': (disk.used / disk.total) * 100,
                'network_bytes_sent': network.bytes_sent,
                'network_bytes_recv': network.bytes_recv,
                'network_packets_sent': network.packets_sent,
                'network_packets_recv': network.packets_recv,
                'process_count': process_count
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo métricas del sistema: {e}")
            return {'system_error': str(e)}
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Obtiene datos para dashboard"""
        # Intentar obtener desde cache primero
        cached_metrics = cache_service.get('monitoring:metrics')
        cached_alerts = cache_service.get('monitoring:alerts', [])
        
        if cached_metrics:
            metrics = cached_metrics
        else:
            metrics = self.collect_all_metrics()
        
        # Consultas lentas
        slow_queries = DatabaseMonitor.get_slow_queries()
        
        # Alertas activas
        active_alerts = self.alert_manager.get_active_alerts()
        
        return {
            'metrics': metrics,
            'alerts': active_alerts,
            'slow_queries': slow_queries,
            'performance_stats': self.profiler.get_profile_stats(),
            'last_update': timezone.now().isoformat()
        }
    
    def get_health_check(self) -> Dict[str, Any]:
        """Verificación de salud del sistema"""
        health = {
            'status': 'healthy',
            'checks': {},
            'timestamp': timezone.now().isoformat()
        }
        
        try:
            # Verificar base de datos
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                health['checks']['database'] = 'ok'
        except Exception as e:
            health['checks']['database'] = f'error: {e}'
            health['status'] = 'unhealthy'
        
        try:
            # Verificar cache
            cache_stats = cache_service.get_stats()
            if cache_stats.get('active_entries', 0) >= 0:
                health['checks']['cache'] = 'ok'
            else:
                health['checks']['cache'] = 'warning: no entries'
        except Exception as e:
            health['checks']['cache'] = f'error: {e}'
            health['status'] = 'unhealthy'
        
        try:
            # Verificar métricas del sistema
            sys_metrics = self._get_system_metrics()
            if 'system_error' not in sys_metrics:
                health['checks']['system'] = 'ok'
            else:
                health['checks']['system'] = 'error'
                health['status'] = 'unhealthy'
        except Exception as e:
            health['checks']['system'] = f'error: {e}'
            health['status'] = 'unhealthy'
        
        return health


# Instancia global del servicio
monitoring_service = MonitoringService()

# Decoradores para facilitar el uso
def monitor_performance(operation: str):
    """Decorador para monitorear rendimiento"""
    return monitoring_service.profiler.profile(operation)

def record_request(response_time: float, status_code: int):
    """Registra una petición HTTP"""
    monitoring_service.system_metrics.record_request(response_time, status_code)

def record_connection(active: bool):
    """Registra una conexión activa"""
    monitoring_service.system_metrics.record_connection(active)