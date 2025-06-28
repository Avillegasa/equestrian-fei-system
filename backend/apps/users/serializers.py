from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, JudgeProfile, OrganizerProfile, UserPermission, AuditLog


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuarios"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'email', 'username', 'first_name', 'last_name', 
            'phone', 'country', 'role', 'password', 'password_confirm'
        )
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        return value.lower()
    
    def validate_username(self, value):
        if User.objects.filter(username=value.lower()).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        return value.lower()
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer para login de usuarios"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email').lower()
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                # Intentar con username si no funciona con email
                try:
                    user_obj = User.objects.get(email=email)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise serializers.ValidationError("Credenciales inválidas")
            
            if not user.is_active:
                raise serializers.ValidationError("Cuenta desactivada")
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError("Email y contraseña son requeridos")


class JudgeProfileSerializer(serializers.ModelSerializer):
    """Serializer para perfil de juez"""
    user_info = serializers.SerializerMethodField()
    is_certification_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = JudgeProfile
        fields = '__all__'
        read_only_fields = ('user',)
    
    def get_user_info(self, obj):
        return {
            'full_name': obj.user.full_name,
            'email': obj.user.email,
            'country': obj.user.country,
        }
    
    def validate_fei_id(self, value):
        if value and JudgeProfile.objects.filter(fei_id=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Este ID FEI ya está registrado")
        return value
    
    def validate_disciplines(self, value):
        valid_disciplines = [choice[0] for choice in JudgeProfile.Discipline.choices]
        for discipline in value:
            if discipline not in valid_disciplines:
                raise serializers.ValidationError(f"Disciplina inválida: {discipline}")
        return value


class OrganizerProfileSerializer(serializers.ModelSerializer):
    """Serializer para perfil de organizador"""
    user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = OrganizerProfile
        fields = '__all__'
        read_only_fields = ('user',)
    
    def get_user_info(self, obj):
        return {
            'full_name': obj.user.full_name,
            'email': obj.user.email,
            'country': obj.user.country,
        }
    
    def validate_contact_email(self, value):
        return value.lower()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para perfil básico de usuario"""
    judge_profile = JudgeProfileSerializer(source='judgeprofile', read_only=True)
    organizer_profile = OrganizerProfileSerializer(source='organizerprofile', read_only=True)
    has_judge_profile = serializers.ReadOnlyField()
    has_organizer_profile = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 
            'phone', 'country', 'role', 'is_verified', 'full_name',
            'has_judge_profile', 'has_organizer_profile',
            'judge_profile', 'organizer_profile',
            'date_joined', 'last_login'
        )
        read_only_fields = ('id', 'email', 'username', 'is_verified', 'date_joined', 'last_login')


class UserListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de usuarios"""
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'full_name', 'role', 'role_display',
            'country', 'is_verified', 'is_active', 'date_joined', 'last_login'
        )


class UserPermissionSerializer(serializers.ModelSerializer):
    """Serializer para permisos de usuario"""
    user_info = serializers.SerializerMethodField()
    granted_by_info = serializers.SerializerMethodField()
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    permission_display = serializers.CharField(source='get_permission_display', read_only=True)
    
    class Meta:
        model = UserPermission
        fields = '__all__'
    
    def get_user_info(self, obj):
        return {
            'id': obj.user.id,
            'full_name': obj.user.full_name,
            'email': obj.user.email,
        }
    
    def get_granted_by_info(self, obj):
        return {
            'id': obj.granted_by.id,
            'full_name': obj.granted_by.full_name,
            'email': obj.granted_by.email,
        }


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta")
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Las nuevas contraseñas no coinciden")
        return attrs
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetSerializer(serializers.Serializer):
    """Serializer para solicitud de reset de contraseña"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            User.objects.get(email=value.lower())
        except User.DoesNotExist:
            raise serializers.ValidationError("No existe usuario con este email")
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer para confirmación de reset de contraseña"""
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de auditoría"""
    user_info = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = '__all__'
    
    def get_user_info(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'full_name': obj.user.full_name,
                'email': obj.user.email,
            }
        return None


# Serializadores específicos para creación de perfiles

class CreateJudgeProfileSerializer(serializers.ModelSerializer):
    """Serializer para crear perfil de juez"""
    
    class Meta:
        model = JudgeProfile
        exclude = ('user',)
    
    def validate_fei_id(self, value):
        if value and JudgeProfile.objects.filter(fei_id=value).exists():
            raise serializers.ValidationError("Este ID FEI ya está registrado")
        return value


class CreateOrganizerProfileSerializer(serializers.ModelSerializer):
    """Serializer para crear perfil de organizador"""
    
    class Meta:
        model = OrganizerProfile
        exclude = ('user',)
    
    def validate_contact_email(self, value):
        return value.lower()


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar rol de usuario (solo admins)"""
    
    class Meta:
        model = User
        fields = ('role',)
    
    def validate_role(self, value):
        # Solo admins pueden asignar roles de admin
        request_user = self.context['request'].user
        if value == User.UserRole.ADMIN and request_user.role != User.UserRole.ADMIN:
            raise serializers.ValidationError("Solo administradores pueden asignar rol de administrador")
        return value