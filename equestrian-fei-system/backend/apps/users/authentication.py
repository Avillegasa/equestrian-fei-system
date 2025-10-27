"""
Custom JWT Authentication Views
"""
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from apps.users.serializers import UserProfileSerializer


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
        
        return token
    
    def validate(self, attrs):
        # Get the token data from parent
        data = super().validate(attrs)

        # Add user data to response (simplified to avoid serializer issues)
        try:
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'role': self.user.role,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'full_name': f"{self.user.first_name} {self.user.last_name}",
                'phone': self.user.phone,
                'nationality': self.user.nationality,
                'is_verified': self.user.is_verified,
                'date_joined': self.user.date_joined.isoformat() if self.user.date_joined else None,
                'last_login': self.user.last_login.isoformat() if self.user.last_login else None,
            }
        except Exception as e:
            # Fallback: datos mínimos si algo falla
            print(f"Error serializing user data: {e}")
            data['user'] = {
                'id': self.user.id,
                'username': self.user.username,
                'role': self.user.role,
            }

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT login view that includes user data
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                # Verificar que response.data tiene los campos necesarios
                if not response.data:
                    return Response({
                        'success': False,
                        'message': 'Empty response data',
                        'error': 'Server returned empty response'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # Verificar que tiene access, refresh y user
                if 'access' not in response.data or 'refresh' not in response.data:
                    return Response({
                        'success': False,
                        'message': 'Missing tokens in response',
                        'error': 'Server did not return authentication tokens'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                return Response({
                    'success': True,
                    'message': 'Login successful',
                    'data': response.data
                }, status=status.HTTP_200_OK)
            else:
                return response
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Login error: {error_details}")  # Log para debugging
            return Response({
                'success': False,
                'message': 'Login failed',
                'error': str(e),
                'details': error_details if request.user.is_staff else None
            }, status=status.HTTP_400_BAD_REQUEST)