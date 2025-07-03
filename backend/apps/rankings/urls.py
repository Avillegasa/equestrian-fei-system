from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RankingViewSet, RankingEntryViewSet, RankingCalculationViewSet,
    LiveRankingUpdateViewSet, RankingConfigurationViewSet
)

# Router para APIs REST
router = DefaultRouter()
router.register(r'rankings', RankingViewSet, basename='ranking')
router.register(r'entries', RankingEntryViewSet, basename='ranking-entry')
router.register(r'calculations', RankingCalculationViewSet, basename='ranking-calculation')
router.register(r'updates', LiveRankingUpdateViewSet, basename='ranking-update')
router.register(r'configurations', RankingConfigurationViewSet, basename='ranking-configuration')

app_name = 'rankings'

urlpatterns = [
    # APIs REST
    path('api/', include(router.urls)),
    
    # Endpoints específicos adicionales
    path('api/live-ranking/', RankingViewSet.as_view({'get': 'live'}), name='live-ranking'),
    path('api/calculate-ranking/', RankingViewSet.as_view({'post': 'calculate'}), name='calculate-ranking'),
    path('api/ranking-progress/', RankingViewSet.as_view({'get': 'progress'}), name='ranking-progress'),
    path('api/ranking-history/', RankingViewSet.as_view({'get': 'history'}), name='ranking-history'),
    
    # Configuración
    path('api/default-config/', RankingConfigurationViewSet.as_view({'get': 'default_config'}), name='default-config'),
    
    # Actualizaciones en tiempo real
    path('api/broadcast-pending/', LiveRankingUpdateViewSet.as_view({'post': 'broadcast_pending'}), name='broadcast-pending'),
    
    # Estadísticas
    path('api/calculation-stats/', RankingCalculationViewSet.as_view({'get': 'stats'}), name='calculation-stats'),
]