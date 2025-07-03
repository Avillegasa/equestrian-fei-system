""" from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EvaluationParameterViewSet,
    ScoreEntryViewSet,
    JudgeEvaluationViewSet,
    CompetitionRankingView
)

app_name = 'scoring'

# Router para ViewSets - SIN prefijo /api/ porque ya está en config/urls.py
router = DefaultRouter()
router.register(r'parameters', EvaluationParameterViewSet, basename='parameters')
router.register(r'scores', ScoreEntryViewSet, basename='scores')
router.register(r'evaluations', JudgeEvaluationViewSet, basename='evaluations')
router.register(r'rankings', CompetitionRankingView, basename='rankings')

urlpatterns = [
    # Incluir las rutas del router directamente (SIN /api/ adicional)
    path('', include(router.urls)),
    
    # Endpoints específicos adicionales
    path('scores/judge-scorecard/', 
         ScoreEntryViewSet.as_view({'get': 'judge_scorecard'}), 
         name='judge-scorecard'),
    
    path('scores/bulk-update/', 
         ScoreEntryViewSet.as_view({'post': 'bulk_update'}), 
         name='bulk-update'),
    
    path('rankings/live/', 
         CompetitionRankingView.as_view({'get': 'live_rankings'}), 
         name='live-rankings'),
    
    path('rankings/participant-detail/', 
         CompetitionRankingView.as_view({'get': 'participant_detail'}), 
         name='participant-detail'),
    
    path('rankings/anomaly-detection/', 
         CompetitionRankingView.as_view({'get': 'anomaly_detection'}), 
         name='anomaly-detection'),
    
    path('evaluations/competition-progress/', 
         JudgeEvaluationViewSet.as_view({'get': 'competition_progress'}), 
         name='competition-progress'),
     # Endpoints públicos para pruebas
    path('test/', 
         'apps.scoring.views.public_scoring_test', 
         name='public-test'),
    
    path('test/parameters/', 
         'apps.scoring.views.public_parameters_test', 
         name='public-parameters-test'),
    
    path('test/calculator/', 
         'apps.scoring.views.public_calculator_test', 
         name='public-calculator-test'),
] """

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EvaluationParameterViewSet,
    ScoreEntryViewSet,
    JudgeEvaluationViewSet,
    CompetitionRankingView,
    # Importar las vistas públicas
    public_scoring_test,
    public_parameters_test,
    public_calculator_test
)

app_name = 'scoring'

# Router para ViewSets - SIN prefijo /api/ porque ya está en config/urls.py
router = DefaultRouter()
router.register(r'parameters', EvaluationParameterViewSet, basename='parameters')
router.register(r'scores', ScoreEntryViewSet, basename='scores')
router.register(r'evaluations', JudgeEvaluationViewSet, basename='evaluations')
router.register(r'rankings', CompetitionRankingView, basename='rankings')

urlpatterns = [
    # Incluir las rutas del router directamente (SIN /api/ adicional)
    path('', include(router.urls)),
    
    # Endpoints específicos adicionales
    path('scores/judge-scorecard/', 
         ScoreEntryViewSet.as_view({'get': 'judge_scorecard'}), 
         name='judge-scorecard'),
    
    path('scores/bulk-update/', 
         ScoreEntryViewSet.as_view({'post': 'bulk_update'}), 
         name='bulk-update'),
    
    path('rankings/live/', 
         CompetitionRankingView.as_view({'get': 'live_rankings'}), 
         name='live-rankings'),
    
    path('rankings/participant-detail/', 
         CompetitionRankingView.as_view({'get': 'participant_detail'}), 
         name='participant-detail'),
    
    path('rankings/anomaly-detection/', 
         CompetitionRankingView.as_view({'get': 'anomaly_detection'}), 
         name='anomaly-detection'),
    
    path('evaluations/competition-progress/', 
         JudgeEvaluationViewSet.as_view({'get': 'competition_progress'}), 
         name='competition-progress'),
    
    # Endpoints públicos para pruebas - CORREGIDOS
    path('test/', 
         public_scoring_test, 
         name='public-test'),
    
    path('test/parameters/', 
         public_parameters_test, 
         name='public-parameters-test'),
    
    path('test/calculator/', 
         public_calculator_test, 
         name='public-calculator-test'),
]