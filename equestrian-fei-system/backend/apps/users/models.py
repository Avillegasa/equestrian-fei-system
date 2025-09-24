from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.validators import RegexValidator
import uuid


class User(AbstractUser):
    """
    Usuario extendido con roles específicos para el sistema FEI
    """
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('organizer', 'Organizador'),
        ('judge', 'Juez'),
        ('viewer', 'Espectador'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    is_verified = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    nationality = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users_user'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def has_role(self, role):
        """Verifica si el usuario tiene un rol específico"""
        return self.role == role
    
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser
    
    def is_organizer(self):
        return self.role == 'organizer'
    
    def is_judge(self):
        return self.role == 'judge'


class JudgeProfile(models.Model):
    """
    Perfil específico para jueces FEI
    """
    CERTIFICATION_LEVELS = [
        ('national', 'Nacional'),
        ('international', 'Internacional'),
        ('fei_3star', 'FEI 3*'),
        ('fei_4star', 'FEI 4*'),
        ('fei_5star', 'FEI 5*'),
    ]
    
    DISCIPLINES = [
        ('dressage', 'Doma'),
        ('jumping', 'Salto'),
        ('eventing', 'Concurso Completo'),
        ('driving', 'Enganches'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='judge_profile')
    license_number = models.CharField(max_length=50, unique=True)
    certification_level = models.CharField(max_length=20, choices=CERTIFICATION_LEVELS)
    specializations = models.JSONField(default=list, help_text="Lista de disciplinas especializadas")
    is_active_judge = models.BooleanField(default=True)
    certification_expiry = models.DateField()
    years_experience = models.PositiveIntegerField(default=0)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Juez'
        verbose_name_plural = 'Perfiles de Jueces'
    
    def __str__(self):
        return f"Juez {self.user.full_name} - {self.license_number}"
    
    @property
    def is_certified(self):
        from django.utils import timezone
        return self.certification_expiry > timezone.now().date()


class OrganizerProfile(models.Model):
    """
    Perfil específico para organizadores de competencias
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='organizer_profile')
    organization_name = models.CharField(max_length=200)
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField()
    is_verified_organizer = models.BooleanField(default=False)
    can_create_competitions = models.BooleanField(default=False)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Organizador'
        verbose_name_plural = 'Perfiles de Organizadores'
    
    def __str__(self):
        return f"Organizador {self.organization_name} - {self.user.full_name}"


class AuditLog(models.Model):
    """
    Log de auditoría para trackear todas las acciones importantes del sistema
    """
    ACTION_CHOICES = [
        ('create', 'Crear'),
        ('update', 'Actualizar'),
        ('delete', 'Eliminar'),
        ('login', 'Iniciar Sesión'),
        ('logout', 'Cerrar Sesión'),
        ('score_submit', 'Enviar Calificación'),
        ('competition_create', 'Crear Competencia'),
        ('competition_start', 'Iniciar Competencia'),
        ('competition_finish', 'Finalizar Competencia'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    changes = models.JSONField(default=dict, help_text="Cambios realizados en formato JSON")
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Generic relation para conectar a cualquier modelo
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    class Meta:
        verbose_name = 'Log de Auditoría'
        verbose_name_plural = 'Logs de Auditoría'
        ordering = ['-timestamp']
    
    def __str__(self):
        user_str = self.user.username if self.user else "Sistema"
        return f"{user_str} - {self.get_action_display()} - {self.timestamp}"
