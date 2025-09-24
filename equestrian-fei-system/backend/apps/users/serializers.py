from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, JudgeProfile, OrganizerProfile, AuditLog


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer para registro de nuevos usuarios
    """
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'phone', 'nationality'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email")
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer para login de usuarios
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Permitir login con username o email
            if '@' in username:
                user = User.objects.filter(email=username).first()
                if user:
                    username = user.username
            
            user = authenticate(username=username, password=password)
            
            if not user:
                raise serializers.ValidationError("Credenciales inválidas")
            
            if not user.is_active:
                raise serializers.ValidationError("Cuenta desactivada")
            
            attrs['user'] = user
            return attrs
        
        raise serializers.ValidationError("Username y password son requeridos")


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para perfil de usuario (lectura y actualización)
    """
    full_name = serializers.ReadOnlyField()
    judge_profile = serializers.SerializerMethodField()
    organizer_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'nationality', 'birth_date', 'is_verified',
            'date_joined', 'last_login', 'judge_profile', 'organizer_profile'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login', 'is_verified']
    
    def get_judge_profile(self, obj):
        if obj.role == 'judge' and hasattr(obj, 'judge_profile'):
            return JudgeProfileSerializer(obj.judge_profile).data
        return None
    
    def get_organizer_profile(self, obj):
        if obj.role == 'organizer' and hasattr(obj, 'organizer_profile'):
            return OrganizerProfileSerializer(obj.organizer_profile).data
        return None


class JudgeProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para perfil de juez
    """
    user_info = serializers.SerializerMethodField(read_only=True)
    is_certified = serializers.ReadOnlyField()
    
    class Meta:
        model = JudgeProfile
        fields = [
            'license_number', 'certification_level', 'specializations',
            'is_active_judge', 'certification_expiry', 'years_experience',
            'bio', 'is_certified', 'user_info', 'created_at', 'updated_at'
        ]
    
    def get_user_info(self, obj):
        return {
            'id': obj.user.id,
            'full_name': obj.user.full_name,
            'email': obj.user.email
        }
    
    def validate_license_number(self, value):
        # Verificar que el número de licencia sea único
        instance = getattr(self, 'instance', None)
        if JudgeProfile.objects.filter(license_number=value).exclude(
            id=instance.id if instance else None
        ).exists():
            raise serializers.ValidationError("Este número de licencia ya está en uso")
        return value


class OrganizerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para perfil de organizador
    """
    user_info = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = OrganizerProfile
        fields = [
            'organization_name', 'contact_phone', 'contact_email',
            'is_verified_organizer', 'can_create_competitions', 'address',
            'website', 'user_info', 'created_at', 'updated_at'
        ]
        read_only_fields = ['is_verified_organizer', 'can_create_competitions']
    
    def get_user_info(self, obj):
        return {
            'id': obj.user.id,
            'full_name': obj.user.full_name,
            'email': obj.user.email
        }


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer para cambio de contraseña
    """
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Las contraseñas nuevas no coinciden")
        return attrs
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta")
        return value


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer para logs de auditoría (solo lectura)
    """
    user_info = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_info', 'action', 'action_display', 'model_name',
            'object_id', 'changes', 'ip_address', 'timestamp'
        ]
    
    def get_user_info(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'full_name': obj.user.full_name
            }
        return None


class TokenResponseSerializer(serializers.Serializer):
    """
    Serializer para respuesta de tokens JWT
    """
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserProfileSerializer()


def get_tokens_for_user(user):
    """
    Función helper para generar tokens JWT para un usuario
    """
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }