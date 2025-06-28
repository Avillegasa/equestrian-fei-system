from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Usuario extendido con roles específicos para el sistema FEI"""
    
    class UserRole(models.TextChoices):
        ADMIN = 'admin', _('Administrador')
        ORGANIZER = 'organizer', _('Organizador')
        JUDGE = 'judge', _('Juez')
        SPECTATOR = 'spectator', _('Espectador')
    
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.SPECTATOR,
        verbose_name=_('Rol')
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r'^\+?[\d\s\-\(\)]{7,20}$')],
        verbose_name=_('Teléfono')
    )
    country = models.CharField(max_length=100, blank=True, verbose_name=_('País'))
    is_verified = models.BooleanField(default=False, verbose_name=_('Verificado'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_verified']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def has_judge_profile(self):
        return hasattr(self, 'judgeprofile')
    
    def has_organizer_profile(self):
        return hasattr(self, 'organizerprofile')


class JudgeProfile(models.Model):
    """Perfil específico para jueces con certificaciones y especialidades"""
    
    class CertificationLevel(models.TextChoices):
        LEVEL_1 = 'level1', _('Nivel 1')
        LEVEL_2 = 'level2', _('Nivel 2')  
        LEVEL_3 = 'level3', _('Nivel 3')
        LEVEL_4 = 'level4', _('Nivel 4')
        LEVEL_5 = 'level5', _('Nivel 5')
        INTERNATIONAL = 'international', _('Internacional')
    
    class Discipline(models.TextChoices):
        DRESSAGE = 'dressage', _('Doma Clásica')
        JUMPING = 'jumping', _('Salto')
        EVENTING = 'eventing', _('Concurso Completo')
        ENDURANCE = 'endurance', _('Resistencia')
        VAULTING = 'vaulting', _('Volteo')
        DRIVING = 'driving', _('Enganche')
        REINING = 'reining', _('Rienda Occidental')
        PARA_DRESSAGE = 'para_dressage', _('Para-Doma')
        PARA_DRIVING = 'para_driving', _('Para-Enganche')
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        verbose_name=_('Usuario')
    )
    fei_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        verbose_name=_('ID FEI')
    )
    certification_level = models.CharField(
        max_length=20,
        choices=CertificationLevel.choices,
        verbose_name=_('Nivel de Certificación')
    )
    disciplines = models.JSONField(
        default=list,
        help_text=_('Lista de disciplinas en las que está certificado'),
        verbose_name=_('Disciplinas')
    )
    certification_date = models.DateField(verbose_name=_('Fecha de Certificación'))
    expiry_date = models.DateField(
        blank=True, 
        null=True,
        verbose_name=_('Fecha de Expiración')
    )
    license_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Número de Licencia')
    )
    biography = models.TextField(
        blank=True,
        max_length=1000,
        verbose_name=_('Biografía')
    )
    years_experience = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Años de Experiencia')
    )
    languages = models.JSONField(
        default=list,
        help_text=_('Idiomas que habla'),
        verbose_name=_('Idiomas')
    )
    is_active_judge = models.BooleanField(
        default=True,
        verbose_name=_('Juez Activo')
    )
    
    class Meta:
        verbose_name = _('Perfil de Juez')
        verbose_name_plural = _('Perfiles de Jueces')
        indexes = [
            models.Index(fields=['fei_id']),
            models.Index(fields=['certification_level']),
            models.Index(fields=['is_active_judge']),
        ]
    
    def __str__(self):
        return f"Juez: {self.user.full_name} ({self.certification_level})"
    
    @property
    def is_certification_valid(self):
        if not self.expiry_date:
            return True
        from django.utils import timezone
        return self.expiry_date > timezone.now().date()
    
    def can_judge_discipline(self, discipline):
        return discipline in self.disciplines


class OrganizerProfile(models.Model):
    """Perfil específico para organizadores de competencias"""
    
    class OrganizationType(models.TextChoices):
        FEDERATION = 'federation', _('Federación')
        CLUB = 'club', _('Club')
        PRIVATE = 'private', _('Organizador Privado')
        EDUCATIONAL = 'educational', _('Institución Educativa')
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        verbose_name=_('Usuario')
    )
    organization_name = models.CharField(
        max_length=200,
        verbose_name=_('Nombre de la Organización')
    )
    organization_type = models.CharField(
        max_length=20,
        choices=OrganizationType.choices,
        verbose_name=_('Tipo de Organización')
    )
    license_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Número de Licencia')
    )
    website = models.URLField(
        blank=True,
        verbose_name=_('Sitio Web')
    )
    address = models.TextField(
        max_length=500,
        verbose_name=_('Dirección')
    )
    contact_person = models.CharField(
        max_length=100,
        verbose_name=_('Persona de Contacto')
    )
    contact_email = models.EmailField(
        verbose_name=_('Email de Contacto')
    )
    contact_phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(r'^\+?[\d\s\-\(\)]{7,20}$')],
        verbose_name=_('Teléfono de Contacto')
    )
    established_date = models.DateField(
        blank=True,
        null=True,
        verbose_name=_('Fecha de Establecimiento')
    )
    description = models.TextField(
        max_length=1000,
        blank=True,
        verbose_name=_('Descripción')
    )
    is_verified_organizer = models.BooleanField(
        default=False,
        verbose_name=_('Organizador Verificado')
    )
    
    class Meta:
        verbose_name = _('Perfil de Organizador')
        verbose_name_plural = _('Perfiles de Organizadores')
        indexes = [
            models.Index(fields=['organization_type']),
            models.Index(fields=['is_verified_organizer']),
        ]
    
    def __str__(self):
        return f"{self.organization_name} - {self.user.full_name}"


class UserPermission(models.Model):
    """Permisos granulares por usuario y módulo"""
    
    class Module(models.TextChoices):
        COMPETITIONS = 'competitions', _('Competencias')
        SCORING = 'scoring', _('Puntuación')
        RANKINGS = 'rankings', _('Rankings')
        USERS = 'users', _('Usuarios')
        REPORTS = 'reports', _('Reportes')
        AUDIT = 'audit', _('Auditoría')
    
    class Permission(models.TextChoices):
        VIEW = 'view', _('Ver')
        CREATE = 'create', _('Crear')
        EDIT = 'edit', _('Editar')
        DELETE = 'delete', _('Eliminar')
        MANAGE = 'manage', _('Administrar')
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='custom_permissions',
        verbose_name=_('Usuario')
    )
    module = models.CharField(
        max_length=20,
        choices=Module.choices,
        verbose_name=_('Módulo')
    )
    permission = models.CharField(
        max_length=10,
        choices=Permission.choices,
        verbose_name=_('Permiso')
    )
    granted_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='granted_permissions',
        verbose_name=_('Otorgado por')
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Permiso de Usuario')
        verbose_name_plural = _('Permisos de Usuarios')
        unique_together = ['user', 'module', 'permission']
        indexes = [
            models.Index(fields=['user', 'module']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.module} - {self.permission}"


class AuditLog(models.Model):
    """Registro de auditoría para cambios importantes"""
    
    class Action(models.TextChoices):
        CREATE = 'create', _('Crear')
        UPDATE = 'update', _('Actualizar')
        DELETE = 'delete', _('Eliminar')
        LOGIN = 'login', _('Iniciar Sesión')
        LOGOUT = 'logout', _('Cerrar Sesión')
        PERMISSION_GRANT = 'permission_grant', _('Otorgar Permiso')
        PERMISSION_REVOKE = 'permission_revoke', _('Revocar Permiso')
    
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        verbose_name=_('Usuario')
    )
    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        verbose_name=_('Acción')
    )
    resource_type = models.CharField(
        max_length=50,
        verbose_name=_('Tipo de Recurso')
    )
    resource_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('ID del Recurso')
    )
    description = models.TextField(
        max_length=500,
        verbose_name=_('Descripción')
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name=_('Dirección IP')
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name=_('User Agent')
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('Registro de Auditoría')
        verbose_name_plural = _('Registros de Auditoría')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['resource_type', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.timestamp}"