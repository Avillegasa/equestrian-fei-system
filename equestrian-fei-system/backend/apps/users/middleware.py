import json
import uuid
from django.utils.deprecation import MiddlewareMixin
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware para registrar automáticamente acciones importantes en AuditLog
    """
    
    # Acciones que queremos auditar automáticamente
    AUDIT_ACTIONS = {
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'update', 
        'DELETE': 'delete',
    }
    
    # Paths que queremos auditar
    AUDIT_PATHS = [
        '/api/auth/',
        '/api/users/',
        '/api/competitions/',
        '/api/scoring/',
        '/api/rankings/',
    ]
    
    def process_request(self, request):
        """
        Capturar información de la request para auditoría
        """
        # Generar un ID único para esta request
        request.audit_id = str(uuid.uuid4())
        
        # Capturar información de la request
        request.audit_info = {
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'method': request.method,
            'path': request.path,
            'user': request.user if hasattr(request, 'user') and request.user.is_authenticated else None
        }
        
        return None
    
    def process_response(self, request, response):
        """
        Registrar auditoría después de procesar la response
        """
        # Solo auditar si tenemos información de auditoría
        if not hasattr(request, 'audit_info'):
            return response
        
        # Solo auditar paths específicos
        if not any(request.path.startswith(path) for path in self.AUDIT_PATHS):
            return response
        
        # Solo auditar ciertos métodos HTTP
        if request.method not in self.AUDIT_ACTIONS:
            return response
        
        # Solo auditar responses exitosas
        if not (200 <= response.status_code < 300):
            return response
        
        try:
            self.create_audit_log(request, response)
        except Exception:
            # No fallar si hay error en auditoría
            pass
        
        return response
    
    def create_audit_log(self, request, response):
        """
        Crear entrada de auditoría
        """
        audit_info = request.audit_info
        
        # Solo crear log si hay usuario autenticado
        if not audit_info['user']:
            return
        
        # Determinar acción
        action = self.AUDIT_ACTIONS.get(request.method)
        
        # Determinar modelo afectado basado en path
        model_name = self.extract_model_from_path(request.path)
        
        # Crear log
        AuditLog.objects.create(
            user=audit_info['user'],
            action=action,
            model_name=model_name,
            ip_address=audit_info['ip_address'],
            user_agent=audit_info['user_agent'],
            changes={
                'method': audit_info['method'],
                'path': audit_info['path'],
                'status_code': response.status_code
            }
        )
    
    @staticmethod
    def get_client_ip(request):
        """
        Obtener IP real del cliente considerando proxies
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def extract_model_from_path(self, path):
        """
        Extraer nombre del modelo del path de la API
        """
        # Mapeo de paths a nombres de modelo
        path_mappings = {
            'users': 'User',
            'competitions': 'Competition',
            'scoring': 'Scoring',
            'rankings': 'Rankings',
            'auth': 'Authentication'
        }
        
        for key, value in path_mappings.items():
            if key in path:
                return value
        
        return 'Unknown'


def create_audit_log(user, action, model_name=None, object_id=None, changes=None, request=None):
    """
    Función helper para crear logs de auditoría manualmente
    """
    audit_data = {
        'user': user,
        'action': action,
        'model_name': model_name or 'Manual',
        'object_id': str(object_id) if object_id else None,
        'changes': changes or {},
    }
    
    if request:
        audit_data.update({
            'ip_address': AuditMiddleware.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        })
    
    return AuditLog.objects.create(**audit_data)