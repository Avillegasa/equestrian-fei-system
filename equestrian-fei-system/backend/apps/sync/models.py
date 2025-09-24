import uuid
from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.auth import get_user_model

User = get_user_model()


class ExternalSystem(models.Model):
    """Sistemas externos con los que se puede sincronizar"""
    SYSTEM_TYPES = [
        ('fei', 'FEI Database'),
        ('national_federation', 'Federación Nacional'),
        ('scoring_system', 'Sistema de Puntuación'),
        ('timing_system', 'Sistema de Cronometraje'),
        ('streaming', 'Sistema de Streaming'),
        ('social_media', 'Redes Sociales'),
        ('payment', 'Sistema de Pagos'),
        ('other', 'Otro'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('error', 'Error'),
        ('maintenance', 'Mantenimiento'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name="Nombre del sistema")
    system_type = models.CharField(max_length=20, choices=SYSTEM_TYPES, verbose_name="Tipo de sistema")
    
    # Configuración de conexión
    api_url = models.URLField(verbose_name="URL de API", null=True, blank=True)
    api_key = models.CharField(max_length=255, verbose_name="API Key", null=True, blank=True)
    api_secret = models.CharField(max_length=255, verbose_name="API Secret", null=True, blank=True)
    
    # Configuración adicional
    config = models.JSONField(default=dict, verbose_name="Configuración adicional")
    
    # Estado y monitoreo
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive', verbose_name="Estado")
    is_enabled = models.BooleanField(default=True, verbose_name="Habilitado")
    
    # Configuración de sincronización
    sync_interval = models.IntegerField(default=300, verbose_name="Intervalo de sincronización (segundos)")
    last_sync = models.DateTimeField(null=True, blank=True, verbose_name="Última sincronización")
    next_sync = models.DateTimeField(null=True, blank=True, verbose_name="Próxima sincronización")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_external_systems')
    
    class Meta:
        verbose_name = "Sistema Externo"
        verbose_name_plural = "Sistemas Externos"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_system_type_display()})"
    
    def update_next_sync(self):
        """Actualizar la próxima sincronización"""
        if self.last_sync:
            self.next_sync = self.last_sync + timezone.timedelta(seconds=self.sync_interval)
        else:
            self.next_sync = timezone.now() + timezone.timedelta(seconds=self.sync_interval)
        self.save(update_fields=['next_sync'])
    
    def is_sync_due(self):
        """Verificar si es hora de sincronizar"""
        if not self.is_enabled or self.status != 'active':
            return False
        return self.next_sync and timezone.now() >= self.next_sync


class SyncJob(models.Model):
    """Trabajos de sincronización"""
    JOB_TYPES = [
        ('import', 'Importación'),
        ('export', 'Exportación'),
        ('sync', 'Sincronización'),
        ('backup', 'Respaldo'),
        ('validation', 'Validación'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('running', 'Ejecutándose'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
        ('cancelled', 'Cancelado'),
        ('retrying', 'Reintentando'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('normal', 'Normal'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    external_system = models.ForeignKey(ExternalSystem, on_delete=models.CASCADE, related_name='sync_jobs')
    
    job_type = models.CharField(max_length=20, choices=JOB_TYPES, verbose_name="Tipo de trabajo")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal', verbose_name="Prioridad")
    
    # Configuración del trabajo
    name = models.CharField(max_length=200, verbose_name="Nombre del trabajo")
    description = models.TextField(blank=True, verbose_name="Descripción")
    config = models.JSONField(default=dict, verbose_name="Configuración del trabajo")
    
    # Estado y progreso
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Estado")
    progress = models.IntegerField(default=0, verbose_name="Progreso (%)")
    
    # Resultados
    total_records = models.IntegerField(default=0, verbose_name="Total de registros")
    processed_records = models.IntegerField(default=0, verbose_name="Registros procesados")
    success_count = models.IntegerField(default=0, verbose_name="Exitosos")
    error_count = models.IntegerField(default=0, verbose_name="Con errores")
    
    # Log de ejecución
    log = models.TextField(blank=True, verbose_name="Log de ejecución")
    error_message = models.TextField(blank=True, verbose_name="Mensaje de error")
    
    # Tiempos
    scheduled_at = models.DateTimeField(verbose_name="Programado para", null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="Iniciado en")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Completado en")
    
    # Reintentos
    retry_count = models.IntegerField(default=0, verbose_name="Número de reintentos")
    max_retries = models.IntegerField(default=3, verbose_name="Máximo reintentos")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_sync_jobs')
    
    class Meta:
        verbose_name = "Trabajo de Sincronización"
        verbose_name_plural = "Trabajos de Sincronización"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"
    
    @property
    def duration(self):
        """Duración del trabajo"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        elif self.started_at:
            return timezone.now() - self.started_at
        return None
    
    def can_retry(self):
        """Verificar si se puede reintentar"""
        return self.status == 'failed' and self.retry_count < self.max_retries
    
    def start(self):
        """Marcar trabajo como iniciado"""
        self.status = 'running'
        self.started_at = timezone.now()
        self.save(update_fields=['status', 'started_at'])
    
    def complete(self, success=True):
        """Marcar trabajo como completado"""
        self.status = 'completed' if success else 'failed'
        self.completed_at = timezone.now()
        self.progress = 100 if success else self.progress
        self.save(update_fields=['status', 'completed_at', 'progress'])
    
    def add_log(self, message):
        """Agregar entrada al log"""
        timestamp = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        self.log += log_entry
        self.save(update_fields=['log'])


class SyncRecord(models.Model):
    """Registro de sincronización para tracking de objetos individuales"""
    SYNC_ACTIONS = [
        ('create', 'Crear'),
        ('update', 'Actualizar'),
        ('delete', 'Eliminar'),
        ('skip', 'Omitir'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('success', 'Exitoso'),
        ('failed', 'Fallido'),
        ('skipped', 'Omitido'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sync_job = models.ForeignKey(SyncJob, on_delete=models.CASCADE, related_name='sync_records')
    
    # Objeto sincronizado (GenericForeignKey)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Información de sincronización
    external_id = models.CharField(max_length=255, verbose_name="ID externo")
    action = models.CharField(max_length=10, choices=SYNC_ACTIONS, verbose_name="Acción")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', verbose_name="Estado")
    
    # Datos
    local_data = models.JSONField(null=True, blank=True, verbose_name="Datos locales")
    external_data = models.JSONField(null=True, blank=True, verbose_name="Datos externos")
    
    # Resultado
    error_message = models.TextField(blank=True, verbose_name="Mensaje de error")
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name="Procesado en")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Registro de Sincronización"
        verbose_name_plural = "Registros de Sincronización"
        ordering = ['-created_at']
        unique_together = ['sync_job', 'content_type', 'external_id']
    
    def __str__(self):
        return f"{self.external_id} - {self.get_status_display()}"


class DataMap(models.Model):
    """Mapeo de datos entre sistema local y externos"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    external_system = models.ForeignKey(ExternalSystem, on_delete=models.CASCADE, related_name='data_maps')
    
    # Mapeo
    local_model = models.CharField(max_length=100, verbose_name="Modelo local")
    local_field = models.CharField(max_length=100, verbose_name="Campo local")
    external_field = models.CharField(max_length=100, verbose_name="Campo externo")
    
    # Configuración
    is_required = models.BooleanField(default=False, verbose_name="Requerido")
    is_key_field = models.BooleanField(default=False, verbose_name="Campo clave")
    data_type = models.CharField(max_length=50, verbose_name="Tipo de datos")
    
    # Transformación
    transformation_rule = models.TextField(blank=True, verbose_name="Regla de transformación")
    default_value = models.CharField(max_length=255, blank=True, verbose_name="Valor por defecto")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Mapeo de Datos"
        verbose_name_plural = "Mapeos de Datos"
        ordering = ['local_model', 'local_field']
        unique_together = ['external_system', 'local_model', 'local_field']
    
    def __str__(self):
        return f"{self.local_model}.{self.local_field} -> {self.external_field}"


class CacheEntry(models.Model):
    """Entradas de cache para optimización"""
    CACHE_TYPES = [
        ('api_response', 'Respuesta API'),
        ('query_result', 'Resultado de Consulta'),
        ('computed_value', 'Valor Calculado'),
        ('user_session', 'Sesión de Usuario'),
        ('competition_data', 'Datos de Competencia'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cache_key = models.CharField(max_length=255, unique=True, db_index=True, verbose_name="Clave de cache")
    cache_type = models.CharField(max_length=20, choices=CACHE_TYPES, verbose_name="Tipo de cache")
    
    # Datos
    data = models.JSONField(verbose_name="Datos en cache")
    
    # TTL y expiración
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(verbose_name="Expira en", db_index=True)
    last_accessed = models.DateTimeField(auto_now=True, verbose_name="Último acceso")
    
    # Metadatos
    size_bytes = models.IntegerField(default=0, verbose_name="Tamaño en bytes")
    access_count = models.IntegerField(default=0, verbose_name="Contador de accesos")
    tags = models.JSONField(default=list, verbose_name="Tags para invalidación")
    
    class Meta:
        verbose_name = "Entrada de Cache"
        verbose_name_plural = "Entradas de Cache"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['cache_key']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['cache_type']),
        ]
    
    def __str__(self):
        return f"{self.cache_key} ({self.get_cache_type_display()})"
    
    def is_expired(self):
        """Verificar si el cache ha expirado"""
        return timezone.now() > self.expires_at
    
    def increment_access(self):
        """Incrementar contador de accesos"""
        self.access_count += 1
        self.last_accessed = timezone.now()
        self.save(update_fields=['access_count', 'last_accessed'])


class BackupRecord(models.Model):
    """Registro de respaldos"""
    BACKUP_TYPES = [
        ('full', 'Completo'),
        ('incremental', 'Incremental'),
        ('differential', 'Diferencial'),
        ('schema', 'Solo Esquema'),
        ('data', 'Solo Datos'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('running', 'Ejecutándose'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPES, verbose_name="Tipo de respaldo")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Estado")
    
    # Configuración
    name = models.CharField(max_length=200, verbose_name="Nombre del respaldo")
    description = models.TextField(blank=True, verbose_name="Descripción")
    
    # Ubicación y archivo
    file_path = models.CharField(max_length=500, verbose_name="Ruta del archivo")
    file_size = models.BigIntegerField(default=0, verbose_name="Tamaño del archivo (bytes)")
    checksum = models.CharField(max_length=255, blank=True, verbose_name="Checksum")
    
    # Estadísticas
    total_tables = models.IntegerField(default=0, verbose_name="Total de tablas")
    total_records = models.BigIntegerField(default=0, verbose_name="Total de registros")
    compression_ratio = models.FloatField(default=0, verbose_name="Ratio de compresión")
    
    # Tiempos
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="Iniciado en")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="Completado en")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_backups')
    
    class Meta:
        verbose_name = "Registro de Respaldo"
        verbose_name_plural = "Registros de Respaldos"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"
    
    @property
    def duration(self):
        """Duración del respaldo"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        elif self.started_at:
            return timezone.now() - self.started_at
        return None
    
    def get_file_size_display(self):
        """Formato legible del tamaño de archivo"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} PB"
