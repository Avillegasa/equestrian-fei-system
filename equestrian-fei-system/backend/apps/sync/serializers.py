from rest_framework import serializers
from .models import (
    ExternalSystem, SyncJob, SyncRecord, DataMap, 
    CacheEntry, BackupRecord
)


class ExternalSystemSerializer(serializers.ModelSerializer):
    """Serializer para sistemas externos"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    system_type_display = serializers.CharField(source='get_system_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ExternalSystem
        fields = [
            'id', 'name', 'system_type', 'system_type_display',
            'api_url', 'config', 'status', 'status_display',
            'is_enabled', 'sync_interval', 'last_sync', 'next_sync',
            'created_at', 'updated_at', 'created_by_name'
        ]
        read_only_fields = ['id', 'last_sync', 'next_sync', 'created_at', 'updated_at']
        extra_kwargs = {
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True}
        }
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ExternalSystemListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para lista de sistemas externos"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    system_type_display = serializers.CharField(source='get_system_type_display', read_only=True)
    
    class Meta:
        model = ExternalSystem
        fields = [
            'id', 'name', 'system_type', 'system_type_display',
            'status', 'status_display', 'is_enabled', 'last_sync'
        ]


class SyncJobSerializer(serializers.ModelSerializer):
    """Serializer para trabajos de sincronización"""
    external_system_name = serializers.CharField(source='external_system.name', read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    duration = serializers.CharField(read_only=True)
    
    class Meta:
        model = SyncJob
        fields = [
            'id', 'external_system', 'external_system_name',
            'job_type', 'job_type_display', 'priority', 'priority_display',
            'name', 'description', 'config', 'status', 'status_display',
            'progress', 'total_records', 'processed_records',
            'success_count', 'error_count', 'log', 'error_message',
            'scheduled_at', 'started_at', 'completed_at', 'duration',
            'retry_count', 'max_retries', 'created_at', 'updated_at',
            'created_by_name'
        ]
        read_only_fields = [
            'id', 'status', 'progress', 'total_records', 'processed_records',
            'success_count', 'error_count', 'log', 'error_message',
            'started_at', 'completed_at', 'duration', 'retry_count',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class SyncJobListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para lista de trabajos"""
    external_system_name = serializers.CharField(source='external_system.name', read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration = serializers.CharField(read_only=True)
    
    class Meta:
        model = SyncJob
        fields = [
            'id', 'external_system_name', 'job_type', 'job_type_display',
            'name', 'status', 'status_display', 'progress',
            'created_at', 'duration'
        ]


class SyncRecordSerializer(serializers.ModelSerializer):
    """Serializer para registros de sincronización"""
    sync_job_name = serializers.CharField(source='sync_job.name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    content_type_name = serializers.CharField(source='content_type.name', read_only=True)
    
    class Meta:
        model = SyncRecord
        fields = [
            'id', 'sync_job', 'sync_job_name', 'content_type',
            'content_type_name', 'object_id', 'external_id',
            'action', 'action_display', 'status', 'status_display',
            'local_data', 'external_data', 'error_message',
            'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DataMapSerializer(serializers.ModelSerializer):
    """Serializer para mapeo de datos"""
    external_system_name = serializers.CharField(source='external_system.name', read_only=True)
    
    class Meta:
        model = DataMap
        fields = [
            'id', 'external_system', 'external_system_name',
            'local_model', 'local_field', 'external_field',
            'is_required', 'is_key_field', 'data_type',
            'transformation_rule', 'default_value',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CacheEntrySerializer(serializers.ModelSerializer):
    """Serializer para entradas de cache"""
    cache_type_display = serializers.CharField(source='get_cache_type_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CacheEntry
        fields = [
            'id', 'cache_key', 'cache_type', 'cache_type_display',
            'data', 'created_at', 'expires_at', 'last_accessed',
            'size_bytes', 'size_display', 'access_count', 'tags',
            'is_expired'
        ]
        read_only_fields = [
            'id', 'created_at', 'last_accessed', 'access_count', 'is_expired'
        ]
    
    def get_size_display(self, obj):
        """Formato legible del tamaño"""
        size = obj.size_bytes
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"


class BackupRecordSerializer(serializers.ModelSerializer):
    """Serializer para registros de backup"""
    backup_type_display = serializers.CharField(source='get_backup_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    duration = serializers.CharField(read_only=True)
    file_size_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = BackupRecord
        fields = [
            'id', 'backup_type', 'backup_type_display',
            'status', 'status_display', 'name', 'description',
            'file_path', 'file_size', 'file_size_display',
            'checksum', 'total_tables', 'total_records',
            'compression_ratio', 'started_at', 'completed_at',
            'duration', 'created_at', 'created_by_name'
        ]
        read_only_fields = [
            'id', 'file_size', 'checksum', 'total_tables',
            'total_records', 'compression_ratio', 'started_at',
            'completed_at', 'duration', 'created_at'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


# Serializers para operaciones específicas
class TestConnectionSerializer(serializers.Serializer):
    """Serializer para probar conexión"""
    system_id = serializers.UUIDField()


class CreateSyncJobSerializer(serializers.Serializer):
    """Serializer para crear trabajo de sincronización"""
    system_id = serializers.UUIDField()
    job_type = serializers.ChoiceField(choices=SyncJob.JOB_TYPES)
    priority = serializers.ChoiceField(choices=SyncJob.PRIORITY_CHOICES, default='normal')
    name = serializers.CharField(max_length=200, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    config = serializers.JSONField(default=dict)
    scheduled_at = serializers.DateTimeField(required=False)


class ExecuteSyncJobSerializer(serializers.Serializer):
    """Serializer para ejecutar trabajo de sincronización"""
    job_id = serializers.UUIDField()


class CacheOperationSerializer(serializers.Serializer):
    """Serializer para operaciones de cache"""
    action = serializers.ChoiceField(choices=[
        ('get', 'Get'),
        ('set', 'Set'),
        ('delete', 'Delete'),
        ('clear_namespace', 'Clear Namespace'),
        ('invalidate_tags', 'Invalidate Tags')
    ])
    key = serializers.CharField(required=False)
    value = serializers.JSONField(required=False)
    timeout = serializers.IntegerField(required=False, default=3600)
    namespace = serializers.CharField(required=False)
    cache_type = serializers.CharField(required=False, default='api_response')
    tags = serializers.ListField(child=serializers.CharField(), required=False)


class SyncStatusSerializer(serializers.Serializer):
    """Serializer para estado de sincronización"""
    system_id = serializers.UUIDField(required=False)


class ImportDataSerializer(serializers.Serializer):
    """Serializer para importar datos"""
    system_id = serializers.UUIDField()
    model = serializers.CharField(max_length=100)
    endpoint = serializers.CharField(max_length=200)
    filters = serializers.JSONField(default=dict)
    batch_size = serializers.IntegerField(default=100, min_value=1, max_value=1000)


class ExportDataSerializer(serializers.Serializer):
    """Serializer para exportar datos"""
    system_id = serializers.UUIDField()
    model = serializers.CharField(max_length=100)
    endpoint = serializers.CharField(max_length=200)
    filters = serializers.JSONField(default=dict)
    batch_size = serializers.IntegerField(default=100, min_value=1, max_value=1000)


class BackupCreateSerializer(serializers.Serializer):
    """Serializer para crear backup"""
    backup_type = serializers.ChoiceField(choices=BackupRecord.BACKUP_TYPES)
    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    include_tables = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    exclude_tables = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    compress = serializers.BooleanField(default=True)


class SystemStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas del sistema"""
    total_systems = serializers.IntegerField()
    active_systems = serializers.IntegerField()
    systems_with_errors = serializers.IntegerField()
    pending_jobs = serializers.IntegerField()
    running_jobs = serializers.IntegerField()
    failed_jobs = serializers.IntegerField()
    cache_entries = serializers.IntegerField()
    cache_hit_rate = serializers.FloatField()
    total_backups = serializers.IntegerField()
    last_backup = serializers.DateTimeField(allow_null=True)