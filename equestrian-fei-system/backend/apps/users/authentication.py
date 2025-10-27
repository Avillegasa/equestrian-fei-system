"""
Custom JWT Authentication Views - Sistema unificado de autenticación
"""
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from apps.users.serializers import UserProfileSerializer, UserRegistrationSerializer
from apps.users.middleware import create_audit_log


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer to include user data in the JWT response
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to token
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['is_active'] = user.is_active
        token['iss'] = 'equestrian-fei-system'

        return token

    def validate(self, attrs):
        # Get the token data from parent
        data = super().validate(attrs)

        # Add user data to response
        try:
            data['user'] = {
                'id': str(self.user.id),
                'username': self.user.username,
                'email': self.user.email,
                'role': self.user.role,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'full_name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username,
                'phone': self.user.phone,
                'nationality': self.user.nationality,
                'is_verified': self.user.is_verified,
                'date_joined': self.user.date_joined.isoformat() if self.user.date_joined else None,
                'last_login': self.user.last_login.isoformat() if self.user.last_login else None,
            }
        except Exception as e:
            print(f"Error serializing user data: {e}")
            data['user'] = {
                'id': str(self.user.id),
                'username': self.user.username,
                'role': self.user.role,
            }

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista de login unificada con JWT y datos de usuario
    Endpoint: /api/auth/login/
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)

            if response.status_code == 200:
                # Verificar datos válidos
                if not response.data or 'access' not in response.data or 'refresh' not in response.data:
                    return Response({
                        'error': 'Missing authentication tokens',
                        'detail': 'Server did not return valid tokens'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # Crear log de auditoría
                try:
                    user = self.request.user if hasattr(self.request, 'user') else None
                    if not user or not user.is_authenticated:
                        # Obtener usuario del serializer
                        serializer = self.get_serializer(data=request.data)
                        if serializer.is_valid():
                            username = request.data.get('username')
                            from apps.users.models import User
                            user = User.objects.filter(username=username).first()

                    if user:
                        create_audit_log(
                            user=user,
                            action='login',
                            model_name='User',
                            object_id=user.id,
                            changes={'action': 'user_login'},
                            request=request
                        )
                except Exception as e:
                    print(f"Error creating audit log: {e}")

                # Retornar formato simplificado y directo
                return Response({
                    'user': response.data['user'],
                    'tokens': {
                        'access': response.data['access'],
                        'refresh': response.data['refresh']
                    }
                }, status=status.HTTP_200_OK)
            else:
                return response

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Login error: {error_details}")
            return Response({
                'error': 'Login failed',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):
    """
    Vista de registro unificada
    Endpoint: /api/auth/register/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            try:
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
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(user)

                # Retornar formato consistente con login
                return Response({
                    'user': {
                        'id': str(user.id),
                        'username': user.username,
                        'email': user.email,
                        'role': user.role,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                        'phone': user.phone,
                        'nationality': user.nationality,
                        'is_verified': user.is_verified,
                        'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                    },
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    }
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                import traceback
                print(f"Registration error: {traceback.format_exc()}")
                return Response({
                    'error': 'Registration failed',
                    'detail': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)