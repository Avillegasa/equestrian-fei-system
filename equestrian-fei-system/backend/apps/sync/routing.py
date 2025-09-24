from django.urls import path, re_path
from . import consumers

websocket_urlpatterns = [
    # Competencias en tiempo real
    path('ws/competitions/', consumers.CompetitionConsumer.as_asgi()),
    
    # Puntuaciones en tiempo real
    path('ws/scoring/', consumers.ScoringConsumer.as_asgi()),
    
    # Notificaciones
    path('ws/notifications/', consumers.NotificationConsumer.as_asgi()),
    
    # Panel de administración
    path('ws/admin/', consumers.AdminConsumer.as_asgi()),
]