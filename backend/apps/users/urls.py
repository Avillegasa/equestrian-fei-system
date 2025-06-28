from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Autenticación
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    path('auth/login/', views.UserLoginView.as_view(), name='login'),
    path('auth/logout/', views.UserLogoutView.as_view(), name='logout'),
    
    # Gestión de contraseñas
    path('auth/password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('auth/password/reset/', views.PasswordResetView.as_view(), name='password_reset'),
    path('auth/password/reset/confirm/<str:uidb64>/<str:token>/', 
         views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Perfil de usuario
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('current/', views.current_user, name='current_user'),
    
    # Gestión de usuarios (admin)
    path('', views.UserListView.as_view(), name='user_list'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('<int:user_id>/verify/', views.verify_user, name='verify_user'),
    path('<int:user_id>/toggle-status/', views.toggle_user_status, name='toggle_user_status'),
    path('<int:pk>/role/', views.UserRoleUpdateView.as_view(), name='user_role_update'),
    
    # Perfiles específicos
    path('judge/profile/', views.JudgeProfileView.as_view(), name='judge_profile'),
    path('judge/profile/create/', views.CreateJudgeProfileView.as_view(), name='create_judge_profile'),
    path('organizer/profile/', views.OrganizerProfileView.as_view(), name='organizer_profile'),
    path('organizer/profile/create/', views.CreateOrganizerProfileView.as_view(), name='create_organizer_profile'),
    
    # Listados específicos
    path('judges/', views.JudgeListView.as_view(), name='judge_list'),
    path('judges/discipline/<str:discipline>/', views.JudgesByDisciplineView.as_view(), name='judges_by_discipline'),
    
    # Permisos de usuario (admin)
    path('permissions/', views.UserPermissionListView.as_view(), name='user_permission_list'),
    path('permissions/<int:pk>/', views.UserPermissionDetailView.as_view(), name='user_permission_detail'),
    
    # Auditoría (admin)
    path('audit/', views.AuditLogListView.as_view(), name='audit_log_list'),
    
    # Estadísticas (admin)
    path('stats/', views.UserStatsView.as_view(), name='user_stats'),
]