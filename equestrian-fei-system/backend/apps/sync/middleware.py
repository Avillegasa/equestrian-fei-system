"""
Middleware para monitoreo automático del sistema.
"""

import time
import logging
from django.utils.deprecation import MiddlewareMixin
from .services.monitoring_service import monitoring_service

logger = logging.getLogger(__name__)


class MonitoringMiddleware(MiddlewareMixin):
    """Middleware para monitorear automáticamente las peticiones HTTP"""
    
    def process_request(self, request):
        """Inicia el seguimiento de la petición"""
        request._monitoring_start_time = time.time()
        monitoring_service.system_metrics.record_connection(True)
        return None
    
    def process_response(self, request, response):
        """Procesa la respuesta y registra métricas"""
        if hasattr(request, '_monitoring_start_time'):
            response_time = time.time() - request._monitoring_start_time
            monitoring_service.system_metrics.record_request(
                response_time,
                response.status_code
            )
        
        monitoring_service.system_metrics.record_connection(False)
        return response
    
    def process_exception(self, request, exception):
        """Procesa excepciones"""
        if hasattr(request, '_monitoring_start_time'):
            response_time = time.time() - request._monitoring_start_time
            monitoring_service.system_metrics.record_request(response_time, 500)
        
        monitoring_service.system_metrics.record_connection(False)
        logger.error(f"Excepción en {request.path}: {exception}")
        return None


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """Middleware avanzado para monitoreo de rendimiento"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def __call__(self, request):
        # Código que se ejecuta para cada petición antes de la vista
        start_time = time.time()
        
        # Registrar información de la petición
        request_info = {
            'method': request.method,
            'path': request.path,
            'user': getattr(request.user, 'username', 'anonymous') if hasattr(request, 'user') else 'anonymous',
            'ip': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200]
        }
        
        response = self.get_response(request)
        
        # Código que se ejecuta para cada petición/respuesta después de la vista
        end_time = time.time()
        duration = end_time - start_time
        
        # Registrar métricas detalladas
        self._log_request_details(request_info, response, duration)
        
        return response
    
    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _log_request_details(self, request_info, response, duration):
        """Registra detalles de la petición"""
        # Solo registrar peticiones lentas o con errores
        if duration > 1.0 or response.status_code >= 400:
            log_data = {
                **request_info,
                'status_code': response.status_code,
                'duration': duration,
                'response_size': len(response.content) if hasattr(response, 'content') else 0
            }
            
            if response.status_code >= 400:
                logger.warning(f"Petición lenta/error: {log_data}")
            else:
                logger.info(f"Petición lenta: {log_data}")


class SecurityMonitoringMiddleware(MiddlewareMixin):
    """Middleware para monitoreo de seguridad"""
    
    SUSPICIOUS_PATTERNS = [
        '.php', '.asp', '.jsp', 'admin', 'wp-admin', 'phpmyadmin',
        'SELECT', 'UNION', 'INSERT', 'DELETE', 'DROP', 'script>',
        '<script', 'javascript:', 'eval(', 'alert('
    ]
    
    def process_request(self, request):
        """Verifica patrones sospechosos en peticiones"""
        path = request.path.lower()
        query_string = request.META.get('QUERY_STRING', '').lower()
        
        # Verificar patrones sospechosos
        suspicious = False
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern in path or pattern in query_string:
                suspicious = True
                break
        
        if suspicious:
            logger.warning(f"Petición sospechosa detectada: {request.method} {request.path} "
                         f"desde {self._get_client_ip(request)}")
        
        # Verificar intentos de fuerza bruta (muchas peticiones de la misma IP)
        client_ip = self._get_client_ip(request)
        self._check_rate_limiting(client_ip, request.path)
        
        return None
    
    def _get_client_ip(self, request):
        """Obtiene la IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _check_rate_limiting(self, client_ip, path):
        """Verifica límites de velocidad por IP"""
        from django.core.cache import cache
        
        # Clave para contar peticiones por IP
        cache_key = f"rate_limit:{client_ip}"
        current_requests = cache.get(cache_key, 0)
        
        # Incrementar contador
        cache.set(cache_key, current_requests + 1, timeout=300)  # 5 minutos
        
        # Alertar si excede el límite
        if current_requests > 100:  # Más de 100 peticiones en 5 minutos
            logger.warning(f"Posible ataque de fuerza bruta desde {client_ip}: "
                         f"{current_requests} peticiones en 5 minutos")