from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DisciplineViewSet, CategoryViewSet, VenueViewSet, CompetitionViewSet,
    HorseViewSet, ParticipantViewSet
)

router = DefaultRouter()
router.register(r'disciplines', DisciplineViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'venues', VenueViewSet)
router.register(r'competitions', CompetitionViewSet, basename='competition')
router.register(r'horses', HorseViewSet, basename='horse')
router.register(r'participants', ParticipantViewSet, basename='participant')

urlpatterns = [
    path('', include(router.urls)),
]