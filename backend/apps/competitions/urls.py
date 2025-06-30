from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para ViewSets
router = DefaultRouter()
router.register(r'disciplines', views.DisciplineViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'competitions', views.CompetitionViewSet)
router.register(r'competition-categories', views.CompetitionCategoryViewSet)
router.register(r'horses', views.HorseViewSet)
router.register(r'riders', views.RiderViewSet)
router.register(r'registrations', views.RegistrationViewSet)

app_name = 'competitions'

urlpatterns = [
    # ViewSets URLs
    path('', include(router.urls)),
    
    # URLs específicas con function-based views
    path('competition/<uuid:competition_id>/dashboard/', 
         views.competition_dashboard, 
         name='competition-dashboard'),
    
    path('judge/competitions/', 
         views.judge_competitions, 
         name='judge-competitions'),
    
    path('public/competitions/', 
         views.public_competitions, 
         name='public-competitions'),
    
    path('public/competitions/<uuid:competition_id>/', 
         views.public_competition_detail, 
         name='public-competition-detail'),
    
    path('quick-registration/', 
         views.quick_registration, 
         name='quick-registration'),
    
    path('search/participants/', 
         views.search_participants, 
         name='search-participants'),
]