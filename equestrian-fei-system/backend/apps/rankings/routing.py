"""
Routing configuration for Rankings WebSocket consumers
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Ranking específico
    re_path(r'ws/rankings/(?P<ranking_id>[0-9a-f-]+)/$', consumers.RankingConsumer.as_asgi()),

    # Todos los rankings de una competencia
    re_path(r'ws/competitions/(?P<competition_id>[0-9a-f-]+)/rankings/$', consumers.CompetitionRankingsConsumer.as_asgi()),

    # Dashboard de administración
    re_path(r'ws/admin/rankings/$', consumers.AdminRankingConsumer.as_asgi()),
]