from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EvaluationParameterViewSet,
    ScoreEntryViewSet,
    JudgeEvaluationViewSet,
    CompetitionRankingView
)

app_name = 'scoring'

# Router para ViewSets
router = DefaultRouter()
router.register(r'parameters', EvaluationParameterViewSet, basename='parameters')
router.register(r'scores', ScoreEntryViewSet, basename='scores')
router.register(r'evaluations', JudgeEvaluationViewSet, basename='evaluations')
router.register(r'rankings', CompetitionRankingView, basename='rankings')

urlpatterns = [
    # API endpoints
    path('api/', include(router.urls)),
    
    # Endpoints específicos adicionales
    path('api/scores/judge-scorecard/', 
         ScoreEntryViewSet.as_view({'get': 'judge_scorecard'}), 
         name='judge-scorecard'),
    
    path('api/scores/bulk-update/', 
         ScoreEntryViewSet.as_view({'post': 'bulk_update'}), 
         name='bulk-update'),
    
    path('api/rankings/live/', 
         CompetitionRankingView.as_view({'get': 'live_rankings'}), 
         name='live-rankings'),
    
    path('api/rankings/participant-detail/', 
         CompetitionRankingView.as_view({'get': 'participant_detail'}), 
         name='participant-detail'),
    
    path('api/rankings/anomaly-detection/', 
         CompetitionRankingView.as_view({'get': 'anomaly_detection'}), 
         name='anomaly-detection'),
    
    path('api/evaluations/competition-progress/', 
         JudgeEvaluationViewSet.as_view({'get': 'competition_progress'}), 
         name='competition-progress'),
]