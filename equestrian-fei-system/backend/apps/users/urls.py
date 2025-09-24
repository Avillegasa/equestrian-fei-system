from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'users'

# Router para ViewSets
router = DefaultRouter()
router.register('users', views.UserViewSet)
router.register('judge-profiles', views.JudgeProfileViewSet)
router.register('organizer-profiles', views.OrganizerProfileViewSet)
router.register('audit-logs', views.AuditLogViewSet)

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health_check'),
    
    # Authentication endpoints
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    path('auth/login/', views.UserLoginView.as_view(), name='login'),
    path('auth/logout/', views.UserLogoutView.as_view(), name='logout'),
    
    # Profile management
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # Include router URLs
    path('', include(router.urls)),
]