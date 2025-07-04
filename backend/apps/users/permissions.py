from rest_framework import permissions
from .models import User, UserPermission
from rest_framework.permissions import BasePermission


class IsAdminUser(permissions.BasePermission):
    """Permiso solo para administradores"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == User.UserRole.ADMIN
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permiso para el propietario del objeto o administradores"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Administradores pueden acceder a todo
        if request.user.role == User.UserRole.ADMIN:
            return True
        
        # El propietario puede acceder a su propio objeto
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Si el objeto es un usuario, verificar que sea el mismo
        if isinstance(obj, User):
            return obj == request.user
        
        return False


class CanManageUsers(permissions.BasePermission):
    """Permiso para gestionar usuarios (admins y organizadores)"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in [User.UserRole.ADMIN, User.UserRole.ORGANIZER]
        )


class IsJudgeUser(permissions.BasePermission):
    """Permiso solo para jueces"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == User.UserRole.JUDGE
        )


class IsOrganizerUser(permissions.BasePermission):
    """Permiso solo para organizadores"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == User.UserRole.ORGANIZER
        )


class HasModulePermission(permissions.BasePermission):
    """Permiso basado en permisos específicos de módulo"""
    
    def __init__(self, module, permission_type):
        self.module = module
        self.permission_type = permission_type
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Administradores tienen todos los permisos
        if request.user.role == User.UserRole.ADMIN:
            return True
        
        # Verificar permiso específico
        return UserPermission.objects.filter(
            user=request.user,
            module=self.module,
            permission=self.permission_type
        ).exists()


class CanViewCompetitions(HasModulePermission):
    """Permiso para ver competencias"""
    def __init__(self):
        super().__init__(UserPermission.Module.COMPETITIONS, UserPermission.Permission.VIEW)


class CanCreateCompetitions(HasModulePermission):
    """Permiso para crear competencias"""
    def __init__(self):
        super().__init__(UserPermission.Module.COMPETITIONS, UserPermission.Permission.CREATE)


class CanEditCompetitions(HasModulePermission):
    """Permiso para editar competencias"""
    def __init__(self):
        super().__init__(UserPermission.Module.COMPETITIONS, UserPermission.Permission.EDIT)


class CanManageCompetitions(HasModulePermission):
    """Permiso para administrar competencias"""
    def __init__(self):
        super().__init__(UserPermission.Module.COMPETITIONS, UserPermission.Permission.MANAGE)


class CanViewScoring(HasModulePermission):
    """Permiso para ver puntuaciones"""
    def __init__(self):
        super().__init__(UserPermission.Module.SCORING, UserPermission.Permission.VIEW)


class CanCreateScoring(HasModulePermission):
    """Permiso para crear puntuaciones"""
    def __init__(self):
        super().__init__(UserPermission.Module.SCORING, UserPermission.Permission.CREATE)


class CanEditScoring(HasModulePermission):
    """Permiso para editar puntuaciones"""
    def __init__(self):
        super().__init__(UserPermission.Module.SCORING, UserPermission.Permission.EDIT)


class CanViewRankings(HasModulePermission):
    """Permiso para ver rankings"""
    def __init__(self):
        super().__init__(UserPermission.Module.RANKINGS, UserPermission.Permission.VIEW)


class CanManageRankings(HasModulePermission):
    """Permiso para administrar rankings"""
    def __init__(self):
        super().__init__(UserPermission.Module.RANKINGS, UserPermission.Permission.MANAGE)


class CanViewReports(HasModulePermission):
    """Permiso para ver reportes"""
    def __init__(self):
        super().__init__(UserPermission.Module.REPORTS, UserPermission.Permission.VIEW)


class CanCreateReports(HasModulePermission):
    """Permiso para crear reportes"""
    def __init__(self):
        super().__init__(UserPermission.Module.REPORTS, UserPermission.Permission.CREATE)


class CanViewAudit(HasModulePermission):
    """Permiso para ver auditoría"""
    def __init__(self):
        super().__init__(UserPermission.Module.AUDIT, UserPermission.Permission.VIEW)


class RoleBasedPermission(permissions.BasePermission):
    """Permiso basado en roles con lógica específica"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Mapeo de roles y permisos por defecto
        role_permissions = {
            User.UserRole.ADMIN: {
                'competitions': ['view', 'create', 'edit', 'delete', 'manage'],
                'scoring': ['view', 'create', 'edit', 'delete', 'manage'],
                'rankings': ['view', 'manage'],
                'users': ['view', 'create', 'edit', 'delete', 'manage'],
                'reports': ['view', 'create', 'manage'],
                'audit': ['view', 'manage'],
            },
            User.UserRole.ORGANIZER: {
                'competitions': ['view', 'create', 'edit', 'manage'],
                'scoring': ['view'],
                'rankings': ['view'],
                'users': ['view'],
                'reports': ['view', 'create'],
                'audit': ['view'],
            },
            User.UserRole.JUDGE: {
                'competitions': ['view'],
                'scoring': ['view', 'create', 'edit'],
                'rankings': ['view'],
                'users': ['view'],
                'reports': ['view'],
            },
            User.UserRole.SPECTATOR: {
                'competitions': ['view'],
                'rankings': ['view'],
            },
        }
        
        user_role = request.user.role
        return user_role in role_permissions


class IsVerifiedUser(permissions.BasePermission):
    """Permiso solo para usuarios verificados"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_verified
        )


class IsActiveJudge(permissions.BasePermission):
    """Permiso para jueces activos con perfil válido"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.user.role != User.UserRole.JUDGE:
            return False
        
        if not hasattr(request.user, 'judgeprofile'):
            return False
        
        judge_profile = request.user.judgeprofile
        return (
            judge_profile.is_active_judge and 
            judge_profile.is_certification_valid
        )


class IsVerifiedOrganizer(permissions.BasePermission):
    """Permiso para organizadores verificados"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.user.role != User.UserRole.ORGANIZER:
            return False
        
        if not hasattr(request.user, 'organizerprofile'):
            return False
        
        return request.user.organizerprofile.is_verified_organizer


class DynamicPermission(permissions.BasePermission):
    """Permiso dinámico que se puede configurar por vista"""
    
    def __init__(self, required_role=None, required_permissions=None, require_verification=False):
        self.required_role = required_role
        self.required_permissions = required_permissions or []
        self.require_verification = require_verification
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Verificar rol si es requerido
        if self.required_role and request.user.role != self.required_role:
            return False
        
        # Verificar verificación si es requerida
        if self.require_verification and not request.user.is_verified:
            return False
        
        # Verificar permisos específicos
        if self.required_permissions:
            for module, permission in self.required_permissions:
                if not UserPermission.objects.filter(
                    user=request.user,
                    module=module,
                    permission=permission
                ).exists():
                    return False
        
        return True


# Decoradores para facilitar el uso de permisos

def admin_required(view_func):
    """Decorador que requiere rol de administrador"""
    def wrapper(request, *args, **kwargs):
        if not (request.user and request.user.is_authenticated and request.user.role == User.UserRole.ADMIN):
            from django.http import JsonResponse
            return JsonResponse({'error': 'Permiso denegado'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper


def judge_required(view_func):
    """Decorador que requiere rol de juez"""
    def wrapper(request, *args, **kwargs):
        if not (request.user and request.user.is_authenticated and request.user.role == User.UserRole.JUDGE):
            from django.http import JsonResponse
            return JsonResponse({'error': 'Permiso denegado'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper


def organizer_required(view_func):
    """Decorador que requiere rol de organizador"""
    def wrapper(request, *args, **kwargs):
        if not (request.user and request.user.is_authenticated and request.user.role == User.UserRole.ORGANIZER):
            from django.http import JsonResponse
            return JsonResponse({'error': 'Permiso denegado'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper


def verified_required(view_func):
    """Decorador que requiere usuario verificado"""
    def wrapper(request, *args, **kwargs):
        if not (request.user and request.user.is_authenticated and request.user.is_verified):
            from django.http import JsonResponse
            return JsonResponse({'error': 'Usuario no verificado'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper

class IsJudge(BasePermission):
    """
    Permiso para verificar si el usuario es un juez
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'judgeprofile')


class IsOrganizer(BasePermission):
    """
    Permiso para verificar si el usuario es un organizador
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'organizerprofile') or request.user.is_staff


class IsJudgeOrOrganizer(BasePermission):
    """
    Permiso para verificar si el usuario es un juez o organizador
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (hasattr(request.user, 'judgeprofile') or 
                hasattr(request.user, 'organizerprofile') or 
                request.user.is_staff)


class IsOwnerOrOrganizer(BasePermission):
    """
    Permiso para verificar si el usuario es el propietario del objeto o un organizador
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Los administradores y organizadores tienen acceso completo
        if request.user.is_staff or hasattr(request.user, 'organizerprofile'):
            return True
        
        # Verificar si el usuario es el propietario del objeto
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'organizer'):
            return obj.organizer == request.user
        
        return False


class CanManageCompetition(BasePermission):
    """
    Permiso para gestionar competencias
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (hasattr(request.user, 'organizerprofile') or 
                request.user.is_staff)
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Los administradores pueden gestionar cualquier competencia
        if request.user.is_staff:
            return True
        
        # Los organizadores solo pueden gestionar sus propias competencias
        if hasattr(request.user, 'organizerprofile'):
            if hasattr(obj, 'organizer'):
                return obj.organizer == request.user
            if hasattr(obj, 'created_by'):
                return obj.created_by == request.user
        
        return False


class CanScore(BasePermission):
    """
    Permiso para calificar en competencias
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (hasattr(request.user, 'judgeprofile') or 
                hasattr(request.user, 'organizerprofile') or
                request.user.is_staff)


class ReadOnlyIfPublic(BasePermission):
    """
    Permiso de solo lectura para competencias públicas
    """
    def has_permission(self, request, view):
        # Permitir lectura sin autenticación para GET, HEAD, OPTIONS
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Requerir autenticación para otros métodos
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Permitir lectura para competencias públicas
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            if hasattr(obj, 'is_public') and obj.is_public:
                return True
        
        # Verificar autenticación para otros casos
        return request.user and request.user.is_authenticated