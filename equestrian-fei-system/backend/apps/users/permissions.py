from rest_framework.permissions import BasePermission


class IsOwnerOrReadOnly(BasePermission):
    """
    Permiso personalizado para permitir solo al propietario editar sus datos
    """
    def has_object_permission(self, request, view, obj):
        # Permisos de lectura para cualquier request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Permisos de escritura solo para el propietario del objeto
        return obj == request.user


class IsAdminUser(BasePermission):
    """
    Permite acceso solo a usuarios administradores
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin()


class CanCreateCompetition(BasePermission):
    """
    Permite crear competencias solo a organizadores verificados o admins
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_admin():
            return True
        
        if request.user.is_organizer():
            # Verificar si tiene perfil de organizador y está verificado
            if hasattr(request.user, 'organizer_profile'):
                return request.user.organizer_profile.can_create_competitions
        
        return False


class CanJudgeCompetition(BasePermission):
    """
    Permite calificar competencias solo a jueces certificados o admins
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_admin():
            return True
        
        if request.user.is_judge():
            # Verificar si tiene perfil de juez y está certificado
            if hasattr(request.user, 'judge_profile'):
                return request.user.judge_profile.is_active_judge and request.user.judge_profile.is_certified
        
        return False


class CanViewResults(BasePermission):
    """
    Permite ver resultados - todos los usuarios autenticados
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated


class CanModifyResults(BasePermission):
    """
    Permite modificar resultados solo a admins y jueces que crearon las calificaciones
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return request.user.is_admin() or request.user.is_judge()
    
    def has_object_permission(self, request, view, obj):
        # Admins pueden modificar cualquier resultado
        if request.user.is_admin():
            return True
        
        # Jueces solo pueden modificar sus propias calificaciones
        if request.user.is_judge():
            # Esto dependerá de la estructura del objeto resultado
            # Por ahora asumimos que tiene un campo 'judge'
            return hasattr(obj, 'judge') and obj.judge == request.user
        
        return False


class IsVerifiedOrganizer(BasePermission):
    """
    Permite acceso solo a organizadores verificados
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_admin():
            return True
        
        if request.user.is_organizer():
            if hasattr(request.user, 'organizer_profile'):
                return request.user.organizer_profile.is_verified_organizer
        
        return False


class IsActiveJudge(BasePermission):
    """
    Permite acceso solo a jueces activos y certificados
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_admin():
            return True
        
        if request.user.is_judge():
            if hasattr(request.user, 'judge_profile'):
                profile = request.user.judge_profile
                return profile.is_active_judge and profile.is_certified
        
        return False


class CanManageUsers(BasePermission):
    """
    Permite gestionar usuarios solo a admins
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin()


class CanViewAuditLogs(BasePermission):
    """
    Permite ver logs de auditoría solo a admins
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin()


class RoleBasedPermission(BasePermission):
    """
    Permiso basado en roles - configurable por view
    """
    required_roles = []  # Será configurado en la view
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin siempre tiene acceso
        if request.user.is_admin():
            return True
        
        # Verificar roles requeridos
        required_roles = getattr(view, 'required_roles', self.required_roles)
        if not required_roles:
            return True
        
        return request.user.role in required_roles


class IsJudge(BasePermission):
    """
    Permite acceso solo a usuarios con tipo 'judge'
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin siempre tiene acceso
        if request.user.is_admin():
            return True
            
        return request.user.user_type == 'judge'


class IsOrganizer(BasePermission):
    """
    Permite acceso solo a usuarios con tipo 'organizer'
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin siempre tiene acceso
        if request.user.is_admin():
            return True
            
        return request.user.user_type == 'organizer'


class IsParticipant(BasePermission):
    """
    Permite acceso solo a usuarios con tipo 'participant'
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin siempre tiene acceso
        if request.user.is_admin():
            return True
            
        return request.user.user_type == 'participant'