# backend/apps/sync/serializers.py

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import SyncSession, SyncAction, SyncConflict, SyncLog, OfflineData


class SyncSessionSerializer(serializers.ModelSerializer):
    """Serializer para sesiones de sincronización"""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    is_expired = serializers.SerializerMethodField()
    pending_actions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SyncSession
        fields = [
            'id', 'user', 'user_username', 'device_id', 'device_type',
            'last_sync_time', 'is_active', 'session_token',
            'created_at', 'updated_at', 'is_expired', 'pending_actions_count'
        ]
        read_only_fields = ['id', 'session_token', 'created_at', 'updated_at']
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_pending_actions_count(self, obj):
        return obj.actions.filter(status='pending').count()


class SyncActionSerializer(serializers.ModelSerializer):
    """Serializer para acciones de sincronización"""
    
    sync_session_id = serializers.UUIDField(source='sync_session.id', read_only=True)
    content_type_name = serializers.SerializerMethodField()
    can_retry = serializers.SerializerMethodField()
    
    class Meta:
        model = SyncAction
        fields = [
            'id', 'sync_session_id', 'action_type', 'client_id',
            'content_type', 'content_type_name', 'object_id',
            'data', 'original_data', 'status', 'priority',
            'retry_count', 'max_retries', 'error_message', 'error_details',
            'created_at', 'updated_at', 'processed_at', 'can_retry'
        ]
        read_only_fields = [
            'id', 'sync_session_id', 'status', 'retry_count',
            'error_message', 'error_details', 'created_at', 
            'updated_at', 'processed_at'
        ]
    
    def get_content_type_name(self, obj):
        if obj.content_type:
            return f"{obj.content_type.app_label}.{obj.content_type.model}"
        return None
    
    def get_can_retry(self, obj):
        return obj.can_retry()


class SyncConflictSerializer(serializers.ModelSerializer):
    """Serializer para conflictos de sincronización"""
    
    sync_action = SyncActionSerializer(read_only=True)
    resolved_by_username = serializers.CharField(
        source='resolved_by.username', 
        read_only=True
    )
    is_resolved = serializers.SerializerMethodField()
    age_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = SyncConflict
        fields = [
            'id', 'sync_action', 'conflict_type', 'description',
            'client_data', 'server_data', 'resolution_strategy',
            'resolved_data', 'resolved_by', 'resolved_by_username',
            'resolved_at', 'created_at', 'updated_at',
            'is_resolved', 'age_hours'
        ]
        read_only_fields = [
            'id', 'sync_action', 'resolved_by', 'resolved_at',
            'created_at', 'updated_at'
        ]
    
    def get_is_resolved(self, obj):
        return obj.is_resolved()
    
    def get_age_hours(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.created_at
        return delta.total_seconds() / 3600


class SyncLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de sincronización"""
    
    sync_session_id = serializers.UUIDField(source='sync_session.id', read_only=True)
    user_username = serializers.CharField(
        source='sync_session.user.username', 
        read_only=True
    )
    
    class Meta:
        model = SyncLog
        fields = [
            'id', 'sync_session_id', 'user_username', 'event_type',
            'message', 'details', 'duration_ms', 'actions_processed',
            'errors_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class OfflineDataSerializer(serializers.ModelSerializer):
    """Serializer para datos offline"""
    
    sync_session_id = serializers.UUIDField(source='sync_session.id', read_only=True)
    is_expired = serializers.SerializerMethodField()
    size_bytes = serializers.SerializerMethodField()
    
    class Meta:
        model = OfflineData
        fields = [
            'id', 'sync_session_id', 'data_type', 'object_id',
            'data', 'version', 'checksum', 'expires_at',
            'created_at', 'updated_at', 'is_expired', 'size_bytes'
        ]
        read_only_fields = [
            'id', 'sync_session_id', 'checksum', 'created_at', 'updated_at'
        ]
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_size_bytes(self, obj):
        import json
        return len(json.dumps(obj.data).encode('utf-8'))


class SyncStatusSerializer(serializers.Serializer):
    """Serializer para el estado general de sincronización"""
    
    session_id = serializers.UUIDField()
    user_id = serializers.IntegerField()
    device_id = serializers.CharField()
    device_type = serializers.CharField()
    
    # Estado de conexión
    is_online = serializers.BooleanField()
    last_sync_time = serializers.DateTimeField(allow_null=True)
    
    # Estadísticas de acciones
    total_actions = serializers.IntegerField()
    pending_actions = serializers.IntegerField()
    completed_actions = serializers.IntegerField()
    failed_actions = serializers.IntegerField()
    
    # Conflictos
    total_conflicts = serializers.IntegerField()
    pending_conflicts = serializers.IntegerField()
    resolved_conflicts = serializers.IntegerField()
    
    # Cache
    cached_data_count = serializers.IntegerField()
    cache_size_mb = serializers.FloatField()
    
    # Rendimiento
    avg_sync_duration_ms = serializers.FloatField(allow_null=True)
    last_sync_duration_ms = serializers.IntegerField(allow_null=True)


class ConflictResolutionSerializer(serializers.Serializer):
    """Serializer para resolver conflictos"""
    
    conflict_id = serializers.UUIDField()
    resolution_strategy = serializers.ChoiceField(choices=[
        ('client_wins', 'Cliente Gana'),
        ('server_wins', 'Servidor Gana'),
        ('merge', 'Fusionar'),
        ('manual', 'Resolución Manual'),
    ])
    resolved_data = serializers.JSONField(required=False, allow_null=True)
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    def validate(self, data):
        strategy = data.get('resolution_strategy')
        resolved_data = data.get('resolved_data')
        
        if strategy in ['merge', 'manual'] and not resolved_data:
            raise serializers.ValidationError(
                "resolved_data es requerido para estrategias 'merge' y 'manual'"
            )
        
        return data


class SyncRequestSerializer(serializers.Serializer):
    """Serializer para solicitudes de sincronización"""
    
    session_token = serializers.CharField(max_length=255)
    actions = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True
    )
    
    def validate_actions(self, value):
        """Validar estructura de acciones"""
        required_fields = ['action_type', 'client_id', 'data']
        
        for i, action in enumerate(value):
            for field in required_fields:
                if field not in action:
                    raise serializers.ValidationError(
                        f"Acción {i}: falta campo requerido '{field}'"
                    )
            
            # Validar tipos de acción
            valid_types = [
                'create', 'update', 'delete', 'score_update',
                'participant_registration', 'judge_assignment'
            ]
            if action['action_type'] not in valid_types:
                raise serializers.ValidationError(
                    f"Acción {i}: tipo '{action['action_type']}' no válido"
                )
        
        return value


class CacheRequestSerializer(serializers.Serializer):
    """Serializer para solicitudes de cache"""
    
    session_token = serializers.CharField(max_length=255)
    data = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=True
    )
    
    def validate_data(self, value):
        """Validar estructura de datos para cachear"""
        required_fields = ['data_type', 'object_id', 'data']
        valid_types = ['competition', 'category', 'participant', 'judge', 'score', 'ranking']
        
        for i, item in enumerate(value):
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(
                        f"Elemento {i}: falta campo requerido '{field}'"
                    )
            
            if item['data_type'] not in valid_types:
                raise serializers.ValidationError(
                    f"Elemento {i}: tipo '{item['data_type']}' no válido"
                )
        
        return value


class SyncResponseSerializer(serializers.Serializer):
    """Serializer para respuestas de sincronización"""
    
    results = serializers.ListField(child=serializers.DictField())
    conflicts = serializers.ListField(child=serializers.DictField(), required=False)
    sync_time = serializers.DateTimeField()
    duration_ms = serializers.IntegerField()
    
    # Estadísticas opcionales
    success_count = serializers.IntegerField(required=False)
    failed_count = serializers.IntegerField(required=False)
    conflict_count = serializers.IntegerField(required=False)


class DeviceInfoSerializer(serializers.Serializer):
    """Serializer para información del dispositivo"""
    
    device_id = serializers.CharField(max_length=255)
    device_type = serializers.ChoiceField(choices=[
        ('mobile', 'Móvil'),
        ('tablet', 'Tablet'),
        ('desktop', 'Escritorio'),
        ('other', 'Otro'),
    ])
    user_agent = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    screen_resolution = serializers.CharField(max_length=50, required=False, allow_blank=True)
    timezone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    language = serializers.CharField(max_length=10, required=False, allow_blank=True)
    
    # Capacidades del dispositivo
    supports_service_worker = serializers.BooleanField(default=False)
    supports_local_storage = serializers.BooleanField(default=False)
    supports_indexed_db = serializers.BooleanField(default=False)
    supports_web_sockets = serializers.BooleanField(default=False)