from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()


class IsOrganizerOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo a organizadores y admins
    crear/editar competencias. Los demás pueden ver.
    """

    def has_permission(self, request, view):
        # Lectura para todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Escritura solo para organizadores y admins
        return (
            request.user and 
            request.user.is_authenticated and
            request.user.role in ['organizer', 'admin']
        )

    def has_object_permission(self, request, view, obj):
        # Lectura para todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Escritura solo para el organizador de la competencia o admins
        return (
            request.user and 
            request.user.is_authenticated and
            (obj.organizer == request.user or request.user.role == 'admin')
        )


class IsCompetitionOrganizer(permissions.BasePermission):
    """
    Permiso para verificar que el usuario es el organizador de la competencia
    """

    def has_object_permission(self, request, view, obj):
        return (
            request.user and 
            request.user.is_authenticated and
            obj.organizer == request.user
        )


class CanManageCompetitionStaff(permissions.BasePermission):
    """
    Permiso para gestionar personal de competencias
    """

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and
            request.user.role in ['organizer', 'admin']
        )

    def has_object_permission(self, request, view, obj):
        # Para CompetitionStaff, verificar que el usuario pueda gestionar la competencia
        competition = obj.competition if hasattr(obj, 'competition') else obj
        return (
            request.user and 
            request.user.is_authenticated and
            (competition.organizer == request.user or request.user.role == 'admin')
        )


class CanRegisterParticipant(permissions.BasePermission):
    """
    Permiso para registrar participantes en competencias
    """

    def has_permission(self, request, view):
        # Los usuarios autenticados pueden registrarse
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Lectura para todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Para modificar/eliminar participaciones
        if hasattr(obj, 'rider'):  # Es un Participant
            return (
                request.user and 
                request.user.is_authenticated and
                (
                    obj.rider == request.user or  # El propio participante
                    obj.competition.organizer == request.user or  # Organizador
                    request.user.role == 'admin'  # Admin
                )
            )
        
        return False


class CanManageHorses(permissions.BasePermission):
    """
    Permiso para gestionar caballos
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Lectura para todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Escritura solo para el propietario, entrenador o admin
        return (
            request.user and 
            request.user.is_authenticated and
            (
                obj.owner == request.user or
                obj.trainer == request.user or
                request.user.role == 'admin'
            )
        )


class CanManageVenues(permissions.BasePermission):
    """
    Permiso para gestionar sedes
    """

    def has_permission(self, request, view):
        # Lectura para todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Escritura solo para organizadores y admins
        return (
            request.user and 
            request.user.is_authenticated and
            request.user.role in ['organizer', 'admin']
        )


class CanManageCompetitionSchedule(permissions.BasePermission):
    """
    Permiso para gestionar horarios de competencias
    """

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and
            request.user.role in ['organizer', 'admin']
        )

    def has_object_permission(self, request, view, obj):
        # Verificar que el usuario pueda gestionar la competencia
        competition = obj.competition if hasattr(obj, 'competition') else obj
        return (
            request.user and 
            request.user.is_authenticated and
            (competition.organizer == request.user or request.user.role == 'admin')
        )


class IsAdminOrOrganizer(permissions.BasePermission):
    """
    Permiso para verificar que el usuario es admin u organizador
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'organizer']
        )


class IsOrganizerOrAdmin(permissions.BasePermission):
    """
    Permiso para verificar que el usuario es organizador o admin (alias de IsAdminOrOrganizer)
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['organizer', 'admin']
        )


class IsJudgeOrAdmin(permissions.BasePermission):
    """
    Permiso para verificar que el usuario es juez o admin
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['judge', 'admin']
        )


class IsAssignedJudge(permissions.BasePermission):
    """
    Permiso para verificar que el usuario es un juez asignado a la competencia
    """

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin siempre puede
        if request.user.role == 'admin':
            return True
        
        # Verificar si es juez asignado
        competition = obj.competition if hasattr(obj, 'competition') else obj
        return competition.staff.filter(
            staff_member=request.user,
            role__in=['judge', 'chief_judge'],
            is_confirmed=True
        ).exists()


class CanViewCompetitionDetails(permissions.BasePermission):
    """
    Permiso para ver detalles completos de competencias
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Todos pueden ver competencias publicadas
        if obj.status in ['published', 'open_registration', 'registration_closed', 'in_progress', 'completed']:
            return True
        
        # Solo organizador y admin pueden ver borradores
        return (
            obj.organizer == request.user or 
            request.user.role == 'admin'
        )


class CanParticipateInCompetition(permissions.BasePermission):
    """
    Permiso para verificar si un usuario puede participar en una competencia
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Verificar si la competencia permite inscripciones
        if not obj.is_registration_open:
            return False
        
        # Verificar si ya alcanzó el máximo de participantes
        if obj.max_participants:
            current_participants = obj.participants.filter(is_confirmed=True).count()
            if current_participants >= obj.max_participants:
                return False
        
        # Verificar si el usuario ya está inscrito
        if obj.participants.filter(rider=request.user).exists():
            return False
        
        return True


# Clase de utilidad para verificar permisos específicos
class CompetitionPermissionChecker:
    """
    Clase de utilidad para verificar permisos relacionados con competencias
    """

    @staticmethod
    def can_manage_competition(user, competition):
        """Verificar si el usuario puede gestionar la competencia"""
        return (
            user.is_authenticated and
            (competition.organizer == user or user.role == 'admin')
        )

    @staticmethod
    def can_view_competition(user, competition):
        """Verificar si el usuario puede ver la competencia"""
        if not user.is_authenticated:
            return False
        
        # Competencias públicas
        if competition.status in ['published', 'open_registration', 'registration_closed', 'in_progress', 'completed']:
            return True
        
        # Borradores solo para organizador y admin
        return competition.organizer == user or user.role == 'admin'

    @staticmethod
    def can_register_in_competition(user, competition):
        """Verificar si el usuario puede registrarse en la competencia"""
        if not user.is_authenticated:
            return False
        
        # Verificar estado de inscripciones
        if not competition.is_registration_open:
            return False
        
        # Verificar límite de participantes
        if competition.max_participants:
            current_participants = competition.participants.filter(is_confirmed=True).count()
            if current_participants >= competition.max_participants:
                return False
        
        # Verificar si ya está inscrito
        return not competition.participants.filter(rider=user).exists()

    @staticmethod
    def can_judge_competition(user, competition):
        """Verificar si el usuario puede juzgar la competencia"""
        if not user.is_authenticated:
            return False
        
        if user.role == 'admin':
            return True
        
        # Verificar si es juez asignado y confirmado
        return competition.staff.filter(
            staff_member=user,
            role__in=['judge', 'chief_judge'],
            is_confirmed=True
        ).exists()

    @staticmethod
    def can_manage_horse(user, horse):
        """Verificar si el usuario puede gestionar el caballo"""
        if not user.is_authenticated:
            return False
        
        return (
            horse.owner == user or
            horse.trainer == user or
            user.role == 'admin'
        )