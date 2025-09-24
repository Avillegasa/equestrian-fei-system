from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExternalSystemViewSet, SyncJobViewSet, SyncRecordViewSet,
    DataMapViewSet, CacheManagementViewSet, BackupViewSet,
    SystemStatsViewSet, MonitoringViewSet, LoggingViewSet,
    NotificationViewSet, ImportExportViewSet, OfflineSyncViewSet
)

app_name = 'sync'

router = DefaultRouter()
router.register(r'external-systems', ExternalSystemViewSet)
router.register(r'sync-jobs', SyncJobViewSet)
router.register(r'sync-records', SyncRecordViewSet)
router.register(r'data-maps', DataMapViewSet)
router.register(r'cache', CacheManagementViewSet, basename='cache-management')
router.register(r'backups', BackupViewSet)
router.register(r'stats', SystemStatsViewSet, basename='system-stats')
router.register(r'monitoring', MonitoringViewSet, basename='monitoring')
router.register(r'logging', LoggingViewSet, basename='logging')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'import-export', ImportExportViewSet, basename='import-export')
router.register(r'offline-sync', OfflineSyncViewSet, basename='offline-sync')

urlpatterns = [
    path('', include(router.urls)),
]