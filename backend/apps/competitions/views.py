from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, Avg
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import random
import uuid

from .models import (
    Discipline, Category, Competition, CompetitionCategory,
    Horse, Rider, Registration, JudgeAssignment
)
from .serializers import (
    DisciplineSerializer, CategoryListSerializer, CategoryDetailSerializer,
    CompetitionListSerializer, CompetitionDetailSerializer, CompetitionCreateSerializer,
    HorseListSerializer, HorseDetailSerializer, RiderListSerializer, RiderDetailSerializer,
    RegistrationListSerializer, RegistrationDetailSerializer,
    JudgeAssignmentSerializer, CompetitionCategorySerializer
)


class DisciplineViewSet(ModelViewSet):
    queryset = Discipline.objects.filter(is_active=True)
    serializer_class = DisciplineSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CategoryListSerializer
        return CategoryDetailSerializer
    
    def get_queryset(self):
        queryset = Category.objects.filter(is_active=True).select_related('discipline')
        discipline_id = self.request.query_params.get('discipline_id')
        level = self.request.query_params.get('level')
        
        if discipline_id:
            queryset = queryset.filter(discipline_id=discipline_id)
        if level:
            queryset = queryset.filter(level=level)
        
        return queryset


class HorseViewSet(ModelViewSet):
    queryset = Horse.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return HorseListSerializer
        return HorseDetailSerializer
    
    def get_queryset(self):
        queryset = Horse.objects.filter(is_active=True)
        owner = self.request.query_params.get('owner')
        country = self.request.query_params.get('country')
        
        if owner:
            queryset = queryset.filter(owner__icontains=owner)
        if country:
            queryset = queryset.filter(country_of_birth__icontains=country)
        
        return queryset


class RiderViewSet(ModelViewSet):
    queryset = Rider.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RiderListSerializer
        return RiderDetailSerializer
    
    def get_queryset(self):
        queryset = Rider.objects.filter(is_active=True).select_related('user')
        nationality = self.request.query_params.get('nationality')
        license_type = self.request.query_params.get('license_type')
        
        if nationality:
            queryset = queryset.filter(nationality__icontains=nationality)
        if license_type:
            queryset = queryset.filter(license_type__icontains=license_type)
        
        return queryset


class CompetitionViewSet(ModelViewSet):
    queryset = Competition.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CompetitionCreateSerializer
        elif self.action == 'list':
            return CompetitionListSerializer
        return CompetitionDetailSerializer
    
    def get_queryset(self):
        queryset = Competition.objects.select_related('organizer').prefetch_related('categories')
        
        # Filtros
        status_filter = self.request.query_params.get('status')
        organizer_id = self.request.query_params.get('organizer_id')
        start_date_from = self.request.query_params.get('start_date_from')
        start_date_to = self.request.query_params.get('start_date_to')
        search = self.request.query_params.get('search')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if organizer_id:
            queryset = queryset.filter(organizer_id=organizer_id)
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(venue__icontains=search) |
                Q(address__icontains=search)
            )
        
        return queryset.order_by('-start_date', 'name')
    
    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user, created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Cambiar estado de la competencia"""
        competition = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Competition.STATUS_CHOICES):
            return Response(
                {'error': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        competition.status = new_status
        competition.save()
        
        return Response({
            'status': new_status,
            'message': f'Estado cambiado a {competition.get_status_display()}'
        })


class CompetitionCategoryViewSet(ModelViewSet):
    queryset = CompetitionCategory.objects.all()
    serializer_class = CompetitionCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        competition_id = self.request.query_params.get('competition_id')
        if competition_id:
            return CompetitionCategory.objects.filter(
                competition_id=competition_id
            ).select_related('category', 'competition')
        return CompetitionCategory.objects.select_related('category', 'competition')


class RegistrationViewSet(ModelViewSet):
    queryset = Registration.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RegistrationListSerializer
        return RegistrationDetailSerializer
    
    def get_queryset(self):
        queryset = Registration.objects.select_related(
            'rider__user', 'horse', 'competition_category__competition', 'competition_category__category'
        )
        
        # Filtros
        competition_id = self.request.query_params.get('competition_id')
        rider_id = self.request.query_params.get('rider_id')
        horse_id = self.request.query_params.get('horse_id')
        status_filter = self.request.query_params.get('status')
        
        if competition_id:
            queryset = queryset.filter(competition_category__competition_id=competition_id)
        if rider_id:
            queryset = queryset.filter(rider_id=rider_id)
        if horse_id:
            queryset = queryset.filter(horse_id=horse_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-registered_at')


# Vistas básicas adicionales
@api_view(['GET'])
def public_competitions(request):
    """Competencias públicas (sin autenticación)"""
    competitions = Competition.objects.filter(
        status__in=['OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED']
    ).select_related('organizer')
    
    # Filtros públicos
    upcoming = request.query_params.get('upcoming')
    if upcoming:
        competitions = competitions.filter(start_date__gte=timezone.now().date())
    
    search = request.query_params.get('search')
    if search:
        competitions = competitions.filter(
            Q(name__icontains=search) | Q(venue__icontains=search)
        )
    
    serializer = CompetitionListSerializer(competitions[:20], many=True)
    return Response(serializer.data)


@api_view(['GET'])
def public_competition_detail(request, competition_id):
    """Detalle público de competencia"""
    competition = get_object_or_404(
        Competition, 
        id=competition_id,
        status__in=['OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED']
    )
    
    # Datos públicos limitados
    data = {
        'competition': {
            'id': competition.id,
            'name': competition.name,
            'description': competition.description,
            'venue': competition.venue,
            'start_date': competition.start_date,
            'end_date': competition.end_date,
            'status': competition.status,
            'status_display': competition.get_status_display(),
            'is_registration_open': competition.is_registration_open,
            'contact_email': competition.contact_email,
            'website': competition.website,
            'is_fei_sanctioned': competition.is_fei_sanctioned,
            'fei_code': competition.fei_code
        },
        'categories': [],
        'total_participants': Registration.objects.filter(
            competition_category__competition=competition,
            status__in=['CONFIRMED', 'PAID']
        ).count()
    }
    
    # Categorías públicas
    for comp_cat in competition.competitioncategory_set.filter(is_active=True):
        category_data = {
            'id': comp_cat.id,
            'name': comp_cat.category.name,
            'level': comp_cat.category.level,
            'max_participants': comp_cat.max_participants,
            'registered_participants': comp_cat.registered_participants,
            'available_spots': comp_cat.available_spots,
            'entry_fee': comp_cat.effective_entry_fee,
            'start_time': comp_cat.start_time
        }
        data['categories'].append(category_data)
    
    return Response(data)