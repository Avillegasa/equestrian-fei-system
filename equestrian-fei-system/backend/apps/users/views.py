from django.http import JsonResponse
from django.contrib.auth import login, logout
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connection
from django.core.cache import cache
import time

from .models import User, JudgeProfile, OrganizerProfile, AuditLog
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    JudgeProfileSerializer, OrganizerProfileSerializer, PasswordChangeSerializer,
    AuditLogSerializer, get_tokens_for_user
)
from .permissions import (
    IsOwnerOrReadOnly, IsAdminUser, CanManageUsers, CanViewAuditLogs
)
from .middleware import create_audit_log


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint para verificar estado del backend.
    Verifica conexión a base de datos y responde información básica.
    """
    # Test database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Test cache connection
    try:
        cache.set('health_check', 'test', 10)
        if cache.get('health_check') == 'test':
            cache_status = "healthy"
        else:
            cache_status = "not working"
    except Exception as e:
        cache_status = f"error: {str(e)}"
    
    return JsonResponse({
        'status': 'ok',
        'message': 'Backend FEI System is running - Hot Reload Test',
        'timestamp': int(time.time()),
        'database': db_status,
        'cache': cache_status,
        'version': '1.0.0',
        'hot_reload': 'working'
    })


class UserRegistrationView(APIView):
    """
    Vista para registro de nuevos usuarios
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Crear log de auditoría
            create_audit_log(
                user=user,
                action='create',
                model_name='User',
                object_id=user.id,
                changes={'action': 'user_registration'},
                request=request
            )
            
            # Generar tokens
            tokens = get_tokens_for_user(user)
            
            return Response({
                'message': 'Usuario registrado exitosamente',
                'user': UserProfileSerializer(user).data,
                'tokens': tokens
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """
    Vista para login de usuarios
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Crear log de auditoría
            create_audit_log(
                user=user,
                action='login',
                model_name='User',
                object_id=user.id,
                changes={'action': 'user_login'},
                request=request
            )
            
            # Generar tokens
            tokens = get_tokens_for_user(user)
            
            return Response({
                'message': 'Login exitoso',
                'user': UserProfileSerializer(user).data,
                'tokens': tokens
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    """
    Vista para logout de usuarios
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Crear log de auditoría
        create_audit_log(
            user=request.user,
            action='logout',
            model_name='User',
            object_id=request.user.id,
            changes={'action': 'user_logout'},
            request=request
        )
        
        return Response({
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """
    Vista para obtener y actualizar perfil del usuario actual
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            user = serializer.save()
            
            # Crear log de auditoría
            create_audit_log(
                user=request.user,
                action='update',
                model_name='User',
                object_id=request.user.id,
                changes={'action': 'profile_update', 'fields': list(request.data.keys())},
                request=request
            )
            
            return Response({
                'message': 'Perfil actualizado exitosamente',
                'user': UserProfileSerializer(user).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Vista para cambiar contraseña del usuario actual
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            # Cambiar contraseña
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            
            # Crear log de auditoría
            create_audit_log(
                user=request.user,
                action='update',
                model_name='User',
                object_id=request.user.id,
                changes={'action': 'password_change'},
                request=request
            )
            
            return Response({
                'message': 'Contraseña cambiada exitosamente'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de usuarios (solo admins)
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserProfileSerializer
    permission_classes = [CanManageUsers]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['created_at', 'last_login', 'username']
    
    @action(detail=True, methods=['post'])
    def verify_user(self, request, pk=None):
        """Verificar usuario"""
        user = self.get_object()
        user.is_verified = True
        user.save()
        
        create_audit_log(
            user=request.user,
            action='update',
            model_name='User',
            object_id=user.id,
            changes={'action': 'user_verified'},
            request=request
        )
        
        return Response({'message': f'Usuario {user.username} verificado'})
    
    @action(detail=True, methods=['post'])
    def deactivate_user(self, request, pk=None):
        """Desactivar usuario"""
        user = self.get_object()
        user.is_active = False
        user.save()
        
        create_audit_log(
            user=request.user,
            action='update',
            model_name='User',
            object_id=user.id,
            changes={'action': 'user_deactivated'},
            request=request
        )
        
        return Response({'message': f'Usuario {user.username} desactivado'})


class JudgeProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de perfiles de jueces
    """
    queryset = JudgeProfile.objects.all().order_by('-created_at')
    serializer_class = JudgeProfileSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    # filterset_fields =['certification_level', 'is_active_judge']
    search_fields = ['user__first_name', 'user__last_name', 'license_number']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Usuarios normales solo ven su propio perfil
        if not self.request.user.is_admin():
            queryset = queryset.filter(user=self.request.user)
        return queryset


class OrganizerProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de perfiles de organizadores
    """
    queryset = OrganizerProfile.objects.all().order_by('-created_at')
    serializer_class = OrganizerProfileSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    # filterset_fields =['is_verified_organizer', 'can_create_competitions']
    search_fields = ['user__first_name', 'user__last_name', 'organization_name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Usuarios normales solo ven su propio perfil
        if not self.request.user.is_admin():
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def verify_organizer(self, request, pk=None):
        """Verificar organizador (solo admins)"""
        profile = self.get_object()
        profile.is_verified_organizer = True
        profile.can_create_competitions = True
        profile.save()
        
        create_audit_log(
            user=request.user,
            action='update',
            model_name='OrganizerProfile',
            object_id=profile.id,
            changes={'action': 'organizer_verified'},
            request=request
        )
        
        return Response({'message': f'Organizador {profile.organization_name} verificado'})


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar logs de auditoría (solo lectura, solo admins)
    """
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [CanViewAuditLogs]
    # filterset_fields =['user', 'action', 'model_name']
    search_fields = ['user__username', 'model_name', 'changes']
    ordering_fields = ['timestamp']
