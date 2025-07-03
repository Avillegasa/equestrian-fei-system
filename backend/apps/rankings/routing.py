from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # WebSocket para ranking en tiempo real
    re_path(r'ws/ranking/$', consumers.RankingConsumer.as_asgi()),
    
    # WebSocket para broadcasting de rankings
    re_path(r'ws/ranking/broadcast/$', consumers.RankingBroadcastConsumer.as_asgi()),
]