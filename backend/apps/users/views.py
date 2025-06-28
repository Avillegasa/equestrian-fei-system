from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import User, JudgeProfile, OrganizerProfile, UserPermission, AuditLog
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserListSerializer,
    JudgeProfileSerializer,
    OrganizerProfileSerializer,
    CreateJudgeProfileSerializer,
    CreateOrganizerProfileSerializer,
    UserPermissionSerializer,
    PasswordChangeSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    AuditLogSerializer,
    UserRoleUpdateSerializer,
)
from .permissions import IsAdminUser, IsOwnerOrAdmin, CanManageUsers


def get_client_ip(request):
    """Obtiene la IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_user_action(user, action, resource_type='user', resource_id='', description='', request=None):
    """Registra acciones del usuario en el log de auditoría"""
    audit_data = {
        'user': user,
        'action': action,
        'resource_type': resource_type,
        'resource_id': str(resource_id),
        'description': description,
    }
    
    if request:
        audit_data['ip_address'] = get_client_ip(request)
        audit_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
    
    AuditLog.objects.create(**audit_data)


class UserRegistrationView(generics.CreateAPIView):
    """Vista para registro de nuevos usuarios"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def perform_create(self, serializer):
        with transaction.atomic():
            user = serializer.save()
            log_user_action(
                user=user,
                action=AuditLog.Action.CREATE,
                resource_type='user',
                resource_id=user.id,
                description=f'Usuario registrado: {user.email}',
                request=self.request
            )


class UserLoginView(APIView):
    """Vista para login de usuarios con JWT"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generar tokens JWT
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Actualizar last_login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Log de auditoría
            log_user_action(
                user=user,
                action=AuditLog.Action.LOGIN,
                description=f'Usuario conectado: {user.email}',
                request=request
            )
            
            # Serializar datos del usuario
            user_data = UserProfileSerializer(user).data
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': user_data,
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    """Vista para logout de usuarios"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Log de auditoría
            log_user_action(
                user=request.user,
                action=AuditLog.Action.LOGOUT,
                description=f'Usuario desconectado: {request.user.email}',
                request=request
            )
            
            return Response({"message": "Logout exitoso"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Vista para ver y actualizar perfil de usuario"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def perform_update(self, serializer):
        user = serializer.save()
        log_user_action(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
            resource_type='user',
            resource_id=user.id,
            description=f'Perfil actualizado: {user.email}',
            request=self.request
        )


class UserListView(generics.ListAPIView):
    """Vista para listar usuarios (solo admins y organizadores)"""
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        
        # Filtros opcionales
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        is_verified = self.request.query_params.get('is_verified')
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )
        
        return queryset


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para gestionar usuario específico (solo admins)"""
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def perform_update(self, serializer):
        user = serializer.save()
        log_user_action(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
            resource_type='user',
            resource_id=user.id,
            description=f'Usuario modificado por admin: {user.email}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        log_user_action(
            user=self.request.user,
            action=AuditLog.Action.DELETE,
            resource_type='user',
            resource_id=instance.id,
            description=f'Usuario eliminado: {instance.email}',
            request=self.request
        )
        instance.delete()


class JudgeProfileView(generics.RetrieveUpdateAPIView):
    """Vista para perfil de juez"""
    serializer_class = JudgeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        user = self.request.user
        if user.role != User.UserRole.JUDGE:
            raise permissions.PermissionDenied("Solo jueces pueden acceder a este perfil")
        
        profile, created = JudgeProfile.objects.get_or_create(user=user)
        return profile
    
    def perform_update(self, serializer):
        profile = serializer.save()
        log_user_action(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
            resource_type='judge_profile',
            resource_id=profile.id,
            description=f'Perfil de juez actualizado: {profile.user.email}',
            request=self.request
        )


class CreateJudgeProfileView(generics.CreateAPIView):
    """Vista para crear perfil de juez"""
    serializer_class = CreateJudgeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.role != User.UserRole.JUDGE:
            raise permissions.PermissionDenied("Solo usuarios con rol de juez pueden crear este perfil")
        
        if hasattr(user, 'judgeprofile'):
            raise serializers.ValidationError("El usuario ya tiene un perfil de juez")
        
        profile = serializer.save(user=user)
        log_user_action(
            user=user,
            action=AuditLog.Action.CREATE,
            resource_type='judge_profile',
            resource_id=profile.id,
            description=f'Perfil de juez creado: {user.email}',
            request=self.request
        )


class OrganizerProfileView(generics.RetrieveUpdateAPIView):
    """Vista para perfil de organizador"""
    serializer_class = OrganizerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        user = self.request.user
        if user.role != User.UserRole.ORGANIZER:
            raise permissions.PermissionDenied("Solo organizadores pueden acceder a este perfil")
        
        profile, created = OrganizerProfile.objects.get_or_create(user=user)
        return profile
    
    def perform_update(self, serializer):
        profile = serializer.save()
        log_user_action(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
            resource_type='organizer_profile',
            resource_id=profile.id,
            description=f'Perfil de organizador actualizado: {profile.user.email}',
            request=self.request
        )


class CreateOrganizerProfileView(generics.CreateAPIView):
    """Vista para crear perfil de organizador"""
    serializer_class = CreateOrganizerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.role != User.UserRole.ORGANIZER:
            raise permissions.PermissionDenied("Solo usuarios con rol de organizador pueden crear este perfil")
        
        if hasattr(user, 'organizerprofile'):
            raise serializers.ValidationError("El usuario ya tiene un perfil de organizador")
        
        profile = serializer.save(user=user)
        log_user_action(
            user=user,
            action=AuditLog.Action.CREATE,
            resource_type='organizer_profile',
            resource_id=profile.id,
            description=f'Perfil de organizador creado: {user.email}',
            request=self.request
        )


class UserPermissionListView(generics.ListCreateAPIView):
    """Vista para listar y crear permisos de usuario"""
    serializer_class = UserPermissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        return UserPermission.objects.all().order_by('-granted_at')
    
    def perform_create(self, serializer):
        permission = serializer.save(granted_by=self.request.user)
        log_user_action(
            user=self.request.user,
            action=AuditLog.Action.PERMISSION_GRANT,
            resource_type='user_permission',
            resource_id=permission.id,
            description=f'Permiso otorgado: {permission.user.email} - {permission.module} - {permission.permission}',
            request=self.request
        )


class UserPermissionDetailView(generics.RetrieveDestroyAPIView):
    """Vista para gestionar permiso específico"""
    queryset = UserPermission.objects.all()
    serializer_class = UserPermissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def perform_destroy(self, instance):
        log_user_action(
            user=self.request.user,
            action=AuditLog.Action.PERMISSION_REVOKE,
            resource_type='user_permission',
            resource_id=instance.id,
            description=f'Permiso revocado: {instance.user.email} - {instance.module} - {instance.permission}',
            request=self.request
        )
        instance.delete()


class PasswordChangeView(APIView):
    """Vista para cambio de contraseña"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            log_user_action(
                user=request.user,
                action=AuditLog.Action.UPDATE,
                resource_type='user',
                resource_id=request.user.id,
                description=f'Contraseña cambiada: {request.user.email}',
                request=request
            )
            return Response({"message": "Contraseña actualizada exitosamente"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    """Vista para solicitar reset de contraseña"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Generar token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Enviar email (simplificado - en producción usar templates)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
            
            send_mail(
                'Restablecer Contraseña - Sistema FEI',
                f'Use este enlace para restablecer su contraseña: {reset_url}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return Response({"message": "Email de recuperación enviado"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """Vista para confirmar reset de contraseña"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not default_token_generator.check_token(user, token):
            return Response({"error": "Token expirado o inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            log_user_action(
                user=user,
                action=AuditLog.Action.UPDATE,
                resource_type='user',
                resource_id=user.id,
                description=f'Contraseña restablecida: {user.email}',
                request=request
            )
            
            return Response({"message": "Contraseña restablecida exitosamente"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserRoleUpdateView(generics.UpdateAPIView):
    """Vista para actualizar rol de usuario (solo admins)"""
    queryset = User.objects.all()
    serializer_class = UserRoleUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def perform_update(self, serializer):
        user = serializer.save()
        old_role = User.objects.get(pk=user.pk).role  # Obtener rol anterior
        log_user_action(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
            resource_type='user',
            resource_id=user.id,
            description=f'Rol cambiado de {old_role} a {user.role}: {user.email}',
            request=self.request
        )


class AuditLogListView(generics.ListAPIView):
    """Vista para listar logs de auditoría"""
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = AuditLog.objects.all().order_by('-timestamp')
        
        # Filtros opcionales
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
        return queryset


class UserStatsView(APIView):
    """Vista para estadísticas de usuarios"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        from django.db.models import Count
        
        stats = {
            'total_users': User.objects.count(),
            'users_by_role': dict(
                User.objects.values('role').annotate(count=Count('role')).values_list('role', 'count')
            ),
            'verified_users': User.objects.filter(is_verified=True).count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'judges_with_profile': JudgeProfile.objects.count(),
            'organizers_with_profile': OrganizerProfile.objects.count(),
            'recent_registrations': User.objects.filter(
                date_joined__gte=timezone.now() - timezone.timedelta(days=30)
            ).count(),
        }
        
        return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """Endpoint para obtener información del usuario actual"""
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def verify_user(request, user_id):
    """Endpoint para verificar un usuario"""
    user = get_object_or_404(User, id=user_id)
    user.is_verified = True
    user.save()
    
    log_user_action(
        user=request.user,
        action=AuditLog.Action.UPDATE,
        resource_type='user',
        resource_id=user.id,
        description=f'Usuario verificado: {user.email}',
        request=request
    )
    
    return Response({"message": f"Usuario {user.email} verificado exitosamente"})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def toggle_user_status(request, user_id):
    """Endpoint para activar/desactivar usuario"""
    user = get_object_or_404(User, id=user_id)
    user.is_active = not user.is_active
    user.save()
    
    status_text = "activado" if user.is_active else "desactivado"
    log_user_action(
        user=request.user,
        action=AuditLog.Action.UPDATE,
        resource_type='user',
        resource_id=user.id,
        description=f'Usuario {status_text}: {user.email}',
        request=request
    )
    
    return Response({"message": f"Usuario {user.email} {status_text} exitosamente"})


# Vistas específicas para jueces

class JudgeListView(generics.ListAPIView):
    """Vista para listar jueces activos"""
    serializer_class = JudgeProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return JudgeProfile.objects.filter(
            is_active_judge=True,
            user__is_active=True
        ).order_by('user__first_name', 'user__last_name')


class JudgesByDisciplineView(APIView):
    """Vista para obtener jueces por disciplina"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, discipline):
        judges = JudgeProfile.objects.filter(
            disciplines__contains=[discipline],
            is_active_judge=True,
            user__is_active=True
        )
        serializer = JudgeProfileSerializer(judges, many=True)
        return Response(serializer.data)