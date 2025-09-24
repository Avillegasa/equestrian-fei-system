"""
URLs para el sistema de reportes FEI
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FEIReportsViewSet, ReportsStatsViewSet

# Router para ViewSets
router = DefaultRouter()
router.register(r'', FEIReportsViewSet, basename='fei-reports')
router.register(r'stats', ReportsStatsViewSet, basename='reports-stats')

urlpatterns = [
    path('', include(router.urls)),
]