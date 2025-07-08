# backend/apps/sync/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.serializers.json import DjangoJSONEncoder
import json
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional


class SyncSession(models.Model):
    """Sesión de sincronización para un dispositivo/usuario"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    device_id = models.CharField(max_length=255, help_text="ID único del dispositivo")
    session_token = models.CharField(max_length=255, unique=True)
    
    # Información del dispositivo
    device_type = models.CharField(max_length=50, choices=[
        ('mobile', 'Móvil'),
        ('tablet', 'Tablet'),
        ('desktop', 'Escritorio'),
        ('other', 'Otro'),
    ])
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Estado de sincronización
    last_sync_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'device_id']
        indexes = [
            models.Index(fields=['user', 'device_id']),
            models.Index(fields=['session_token']),
            models.Index(fields=['last_sync_time']),
        ]
    
    def __str__(self):
        return f"Sesión {self.device_type} - {self.user.username}"
    
    def generate_token(self):
        """Generar token único para la sesión"""
        import hashlib
        import time
        
        data = f"{self.user.id}-{self.device_id}-{time.time()}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def is_expired(self, hours: int = 24) -> bool:
        """Verificar si la sesión ha expirado"""
        if not self.last_sync_time:
            return True
        
        expiry_time = self.last_sync_time + timedelta(hours=hours)
        return datetime.now() > expiry_time


class SyncAction(models.Model):
    """Acción de sincronización pendiente"""
    
    ACTION_TYPES = [
        ('create', 'Crear'),
        ('update', 'Actualizar'),
        ('delete', 'Eliminar'),
        ('score_update', 'Actualizar Puntuación'),
        ('participant_registration', 'Registrar Participante'),
        ('judge_assignment', 'Asignar Juez'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('processing', 'Procesando'),
        ('completed', 'Completada'),
        ('failed', 'Fallida'),
        ('cancelled', 'Cancelada'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sync_session = models.ForeignKey(SyncSession, on_delete=models.CASCADE, related_name='actions')
    
    # Información de la acción
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    client_id = models.CharField(max_length=255, help_text="ID único del cliente")
    
    # Objeto afectado (usando GenericForeignKey para flexibilidad)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Datos de la acción
    data = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    original_data = models.JSONField(default=dict, encoder=DjangoJSONEncoder, help_text="Datos originales antes de la modificación")
    
    # Estado y control
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.IntegerField(default=0, help_text="Prioridad de procesamiento (mayor = más prioritario)")
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    
    # Información de errores
    error_message = models.TextField(blank=True)
    error_details = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['sync_session', 'status']),
            models.Index(fields=['action_type', 'status']),
            models.Index(fields=['priority', 'created_at']),
            models.Index(fields=['client_id']),
        ]
        ordering = ['-priority', 'created_at']
    
    def __str__(self):
        return f"{self.action_type} - {self.client_id} ({self.status})"
    
    def can_retry(self) -> bool:
        """Verificar si la acción puede ser reintentada"""
        return (
            self.status == 'failed' and 
            self.retry_count < self.max_retries
        )
    
    def mark_as_processing(self):
        """Marcar acción como en procesamiento"""
        self.status = 'processing'
        self.save(update_fields=['status', 'updated_at'])
    
    def mark_as_completed(self):
        """Marcar acción como completada"""
        self.status = 'completed'
        self.processed_at = datetime.now()
        self.save(update_fields=['status', 'processed_at', 'updated_at'])
    
    def mark_as_failed(self, error_message: str, error_details: Dict[str, Any] = None):
        """Marcar acción como fallida"""
        self.status = 'failed'
        self.error_message = error_message
        self.error_details = error_details or {}
        self.retry_count += 1
        self.save(update_fields=['status', 'error_message', 'error_details', 'retry_count', 'updated_at'])


class SyncConflict(models.Model):
    """Conflicto de sincronización que requiere resolución manual"""
    
    CONFLICT_TYPES = [
        ('concurrent_update', 'Actualización Concurrente'),
        ('data_mismatch', 'Datos Inconsistentes'),
        ('validation_error', 'Error de Validación'),
        ('permission_denied', 'Permisos Insuficientes'),
    ]
    
    RESOLUTION_STRATEGIES = [
        ('client_wins', 'Cliente Gana'),
        ('server_wins', 'Servidor Gana'),
        ('merge', 'Fusionar'),
        ('manual', 'Resolución Manual'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sync_action = models.OneToOneField(SyncAction, on_delete=models.CASCADE, related_name='conflict')
    
    # Información del conflicto
    conflict_type = models.CharField(max_length=50, choices=CONFLICT_TYPES)
    description = models.TextField()
    
    # Datos en conflicto
    client_data = models.JSONField(encoder=DjangoJSONEncoder)
    server_data = models.JSONField(encoder=DjangoJSONEncoder)
    
    # Resolución
    resolution_strategy = models.CharField(max_length=20, choices=RESOLUTION_STRATEGIES, null=True, blank=True)
    resolved_data = models.JSONField(null=True, blank=True, encoder=DjangoJSONEncoder)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['conflict_type', 'resolved_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Conflicto {self.conflict_type} - {self.sync_action.client_id}"
    
    def is_resolved(self) -> bool:
        """Verificar si el conflicto ha sido resuelto"""
        return self.resolved_at is not None
    
    def resolve(self, strategy: str, resolved_data: Dict[str, Any], resolved_by):
        """Resolver el conflicto"""
        self.resolution_strategy = strategy
        self.resolved_data = resolved_data
        self.resolved_by = resolved_by
        self.resolved_at = datetime.now()
        self.save()


class SyncLog(models.Model):
    """Log de eventos de sincronización"""
    
    EVENT_TYPES = [
        ('sync_start', 'Inicio de Sincronización'),
        ('sync_complete', 'Sincronización Completada'),
        ('sync_error', 'Error de Sincronización'),
        ('action_processed', 'Acción Procesada'),
        ('conflict_detected', 'Conflicto Detectado'),
        ('conflict_resolved', 'Conflicto Resuelto'),
        ('data_cached', 'Datos Cacheados'),
        ('cache_cleared', 'Cache Limpiado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sync_session = models.ForeignKey(SyncSession, on_delete=models.CASCADE, related_name='logs')
    
    # Información del evento
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    message = models.TextField()
    details = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    
    # Métricas
    duration_ms = models.IntegerField(null=True, blank=True, help_text="Duración en milisegundos")
    actions_processed = models.IntegerField(null=True, blank=True)
    errors_count = models.IntegerField(default=0)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['sync_session', 'event_type']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.event_type} - {self.sync_session.user.username} ({self.created_at})"


class OfflineData(models.Model):
    """Datos cacheados para uso offline"""
    
    DATA_TYPES = [
        ('competition', 'Competencia'),
        ('category', 'Categoría'),
        ('participant', 'Participante'),
        ('judge', 'Juez'),
        ('score', 'Puntuación'),
        ('ranking', 'Ranking'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sync_session = models.ForeignKey(SyncSession, on_delete=models.CASCADE, related_name='cached_data')
    
    # Información del dato
    data_type = models.CharField(max_length=50, choices=DATA_TYPES)
    object_id = models.CharField(max_length=255, help_text="ID del objeto original")
    data = models.JSONField(encoder=DjangoJSONEncoder)
    
    # Control de versión
    version = models.IntegerField(default=1)
    checksum = models.CharField(max_length=64, help_text="Hash MD5 de los datos")
    
    # Metadatos
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['sync_session', 'data_type', 'object_id']
        indexes = [
            models.Index(fields=['sync_session', 'data_type']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['checksum']),
        ]
    
    def __str__(self):
        return f"{self.data_type} {self.object_id} - {self.sync_session.user.username}"
    
    def is_expired(self) -> bool:
        """Verificar si los datos han expirado"""
        if not self.expires_at:
            return False
        return datetime.now() > self.expires_at
    
    def generate_checksum(self) -> str:
        """Generar checksum de los datos"""
        import hashlib
        data_str = json.dumps(self.data, sort_keys=True)
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def save(self, *args, **kwargs):
        """Sobreescribir save para generar checksum automáticamente"""
        self.checksum = self.generate_checksum()
        super().save(*args, **kwargs)