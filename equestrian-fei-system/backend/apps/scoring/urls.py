from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ScoringCriteriaViewSet, ScoreCardViewSet, IndividualScoreViewSet,
    JumpingFaultViewSet, DressageMovementViewSet, EventingPhaseViewSet,
    CompetitionRankingViewSet, ScoringStatisticsViewSet
)

app_name = 'scoring'

router = DefaultRouter()
router.register(r'scoring-criteria', ScoringCriteriaViewSet)
router.register(r'scorecards', ScoreCardViewSet)
router.register(r'individual-scores', IndividualScoreViewSet)
router.register(r'jumping-faults', JumpingFaultViewSet)
router.register(r'dressage-movements', DressageMovementViewSet)
router.register(r'eventing-phases', EventingPhaseViewSet)
router.register(r'rankings', CompetitionRankingViewSet)
router.register(r'statistics', ScoringStatisticsViewSet, basename='scoring-statistics')

urlpatterns = [
    path('', include(router.urls)),
]