from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LiveRankingViewSet,
    LiveRankingEntryViewSet,
    RankingSnapshotViewSet,
    RankingRuleViewSet,
    TeamRankingViewSet,
    RankingStatsViewSet
)

app_name = 'rankings'

router = DefaultRouter()
router.register(r'live', LiveRankingViewSet, basename='live-ranking')
router.register(r'entries', LiveRankingEntryViewSet, basename='ranking-entry')
router.register(r'snapshots', RankingSnapshotViewSet, basename='ranking-snapshot')
router.register(r'rules', RankingRuleViewSet, basename='ranking-rule')
router.register(r'teams', TeamRankingViewSet, basename='team-ranking')
router.register(r'stats', RankingStatsViewSet, basename='ranking-stats')

urlpatterns = [
    path('', include(router.urls)),
]