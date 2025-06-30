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
    RegistrationListSerializer, RegistrationDetailSerializer, RegistrationCreateSerializer,
    JudgeAssignmentSerializer, CompetitionCategorySerializer,
    CompetitionStatisticsSerializer, RegistrationBulkUpdateSerializer,
    StartNumberAssignmentSerializer
)
from apps.users.permissions import IsJudge, IsOrganizer, IsAdmin


class DisciplineViewSet(ModelViewSet):
    queryset = Discipline.objects.filter(is_active=True)
    serializer_class = DisciplineSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsAdmin]
        else:
            permission_classes = [IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CategoryListSerializer
        return CategoryDetailSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsAdmin]
        else:
            permission_classes = [IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]
    
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
    
    @action(detail=True, methods=['get'])
    def competitions(self, request, pk=None):
        """Obtener competencias del caballo"""
        horse = self.get_object()
        registrations = Registration.objects.filter(
            horse=horse
        ).select_related('competition_category__competition')
        
        competitions = []
        for reg in registrations:
            competitions.append({
                'competition': CompetitionListSerializer(reg.competition_category.competition).data,
                'category': reg.competition_category.category.name,
                'status': reg.status,
                'start_number': reg.start_number,
                'registered_at': reg.registered_at
            })
        
        return Response(competitions)


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
    
    @action(detail=True, methods=['get'])
    def competitions(self, request, pk=None):
        """Obtener competencias del jinete"""
        rider = self.get_object()
        registrations = Registration.objects.filter(
            rider=rider
        ).select_related('competition_category__competition', 'horse')
        
        competitions = []
        for reg in registrations:
            competitions.append({
                'competition': CompetitionListSerializer(reg.competition_category.competition).data,
                'category': reg.competition_category.category.name,
                'horse': HorseListSerializer(reg.horse).data,
                'status': reg.status,
                'start_number': reg.start_number,
                'registered_at': reg.registered_at
            })
        
        return Response(competitions)


class CompetitionViewSet(ModelViewSet):
    queryset = Competition.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CompetitionCreateSerializer
        elif self.action == 'list':
            return CompetitionListSerializer
        return CompetitionDetailSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [IsAuthenticated, IsOrganizer]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]
    
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
    
    def perform_update(self, serializer):
        competition = self.get_object()
        # Solo el organizador o admin puede modificar
        if competition.organizer != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied("Solo el organizador puede modificar esta competencia")
        serializer.save()
    
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
        
        # Validaciones específicas por estado
        if new_status == 'OPEN' and competition.status == 'DRAFT':
            # Verificar que tiene categorías
            if not competition.competitioncategory_set.exists():
                return Response(
                    {'error': 'La competencia debe tener al menos una categoría'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        competition.status = new_status
        competition.save()
        
        return Response({
            'status': new_status,
            'message': f'Estado cambiado a {competition.get_status_display()}'
        })
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Estadísticas de la competencia"""
        competition = self.get_object()
        
        registrations = Registration.objects.filter(
            competition_category__competition=competition
        )
        
        # Estadísticas básicas
        total_participants = registrations.count()
        participants_by_category = {}
        participants_by_status = {}
        revenue_total = Decimal('0.00')
        revenue_by_category = {}
        
        for comp_cat in competition.competitioncategory_set.all():
            cat_registrations = registrations.filter(competition_category=comp_cat)
            cat_count = cat_registrations.count()
            cat_revenue = cat_registrations.aggregate(
                total=Sum('entry_fee_paid')
            )['total'] or Decimal('0.00')
            
            participants_by_category[comp_cat.category.name] = cat_count
            revenue_by_category[comp_cat.category.name] = str(cat_revenue)
            revenue_total += cat_revenue
        
        # Por estado
        for status_choice in Registration.STATUS_CHOICES:
            status_code = status_choice[0]
            count = registrations.filter(status=status_code).count()
            participants_by_status[status_choice[1]] = count
        
        # Pagos pendientes
        pending_payments = Decimal('0.00')
        for reg in registrations:
            pending_payments += reg.outstanding_balance
        
        # Asignaciones de jueces
        judge_assignments = JudgeAssignment.objects.filter(
            competition_category__competition=competition
        ).count()
        
        # Porcentaje de completitud
        total_categories = competition.competitioncategory_set.count()
        categories_with_judges = competition.competitioncategory_set.filter(
            judge_assignments__isnull=False
        ).distinct().count()
        
        completion_percentage = (categories_with_judges / total_categories * 100) if total_categories > 0 else 0
        
        stats_data = {
            'total_participants': total_participants,
            'participants_by_category': participants_by_category,
            'participants_by_status': participants_by_status,
            'revenue_total': revenue_total,
            'revenue_by_category': revenue_by_category,
            'pending_payments': pending_payments,
            'judge_assignments': judge_assignments,
            'completion_percentage': completion_percentage
        }
        
        serializer = CompetitionStatisticsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def registrations(self, request, pk=None):
        """Obtener inscripciones de la competencia"""
        competition = self.get_object()
        registrations = Registration.objects.filter(
            competition_category__competition=competition
        ).select_related('rider__user', 'horse', 'competition_category__category')
        
        # Filtros
        category_id = request.query_params.get('category_id')
        status_filter = request.query_params.get('status')
        
        if category_id:
            registrations = registrations.filter(competition_category__category_id=category_id)
        if status_filter:
            registrations = registrations.filter(status=status_filter)
        
        serializer = RegistrationListSerializer(registrations, many=True)
        return Response(serializer.data)


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
    
    @action(detail=True, methods=['post'])
    def assign_judges(self, request, pk=None):
        """Asignar jueces a una categoría de competencia"""
        competition_category = self.get_object()
        judges_data = request.data.get('judges', [])
        
        with transaction.atomic():
            # Eliminar asignaciones existentes
            JudgeAssignment.objects.filter(
                competition_category=competition_category
            ).delete()
            
            # Crear nuevas asignaciones
            for judge_data in judges_data:
                JudgeAssignment.objects.create(
                    competition_category=competition_category,
                    judge_id=judge_data['judge_id'],
                    role=judge_data['role'],
                    order=judge_data.get('order', 1),
                    fee=judge_data.get('fee'),
                    travel_allowance=judge_data.get('travel_allowance', Decimal('0.00')),
                    accommodation_provided=judge_data.get('accommodation_provided', False),
                    notes=judge_data.get('notes', ''),
                    created_by=request.user
                )
        
        # Devolver asignaciones actualizadas
        assignments = JudgeAssignment.objects.filter(
            competition_category=competition_category
        )
        serializer = JudgeAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def judges(self, request, pk=None):
        """Obtener jueces asignados a una categoría"""
        competition_category = self.get_object()
        assignments = JudgeAssignment.objects.filter(
            competition_category=competition_category
        ).select_related('judge')
        
        serializer = JudgeAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)


class RegistrationViewSet(ModelViewSet):
    queryset = Registration.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RegistrationCreateSerializer
        elif self.action == 'list':
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
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmar inscripción"""
        registration = self.get_object()
        
        if registration.status != 'PENDING':
            return Response(
                {'error': 'Solo se pueden confirmar inscripciones pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        registration.status = 'CONFIRMED'
        registration.confirmed_at = timezone.now()
        registration.save()
        
        return Response({
            'message': 'Inscripción confirmada',
            'status': registration.status
        })
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Marcar como pagada"""
        registration = self.get_object()
        amount = request.data.get('amount')
        payment_reference = request.data.get('payment_reference', '')
        
        if not amount:
            return Response(
                {'error': 'Debe especificar el monto pagado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        registration.entry_fee_paid = Decimal(str(amount))
        registration.payment_reference = payment_reference
        registration.payment_date = timezone.now()
        registration.status = 'PAID'
        registration.save()
        
        return Response({
            'message': 'Pago registrado exitosamente',
            'status': registration.status,
            'amount_paid': registration.entry_fee_paid
        })
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Actualización masiva de inscripciones"""
        serializer = RegistrationBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        registration_ids = serializer.validated_data['registration_ids']
        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')
        
        updated_count = Registration.objects.filter(
            id__in=registration_ids
        ).update(
            status=new_status,
            notes=notes,
            updated_at=timezone.now()
        )
        
        return Response({
            'message': f'{updated_count} inscripciones actualizadas',
            'updated_count': updated_count
        })
    
    @action(detail=False, methods=['post'])
    def assign_start_numbers(self, request):
        """Asignar números de dorsal"""
        serializer = StartNumberAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        competition_category_id = serializer.validated_data['competition_category_id']
        assignment_method = serializer.validated_data['assignment_method']
        manual_assignments = serializer.validated_data.get('manual_assignments', {})
        
        competition_category = get_object_or_404(CompetitionCategory, id=competition_category_id)
        
        registrations = Registration.objects.filter(
            competition_category=competition_category,
            status__in=['CONFIRMED', 'PAID']
        ).select_related('rider__user')
        
        if not registrations.exists():
            return Response(
                {'error': 'No hay inscripciones confirmadas para asignar números'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            if assignment_method == 'RANDOM':
                # Asignación aleatoria
                registrations_list = list(registrations)
                random.shuffle(registrations_list)
                for i, reg in enumerate(registrations_list, 1):
                    reg.start_number = i
                    reg.save()
            
            elif assignment_method == 'REGISTRATION_ORDER':
                # Por orden de inscripción
                for i, reg in enumerate(registrations.order_by('registered_at'), 1):
                    reg.start_number = i
                    reg.save()
            
            elif assignment_method == 'ALPHABETICAL':
                # Orden alfabético por jinete
                for i, reg in enumerate(registrations.order_by('rider__user__last_name', 'rider__user__first_name'), 1):
                    reg.start_number = i
                    reg.save()
            
            elif assignment_method == 'MANUAL':
                # Asignación manual
                for reg_id, start_number in manual_assignments.items():
                    Registration.objects.filter(id=reg_id).update(start_number=start_number)
        
        return Response({
            'message': f'Números de dorsal asignados usando método: {assignment_method}',
            'total_assigned': registrations.count()
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def competition_dashboard(request, competition_id):
    """Dashboard de competencia para organizadores"""
    competition = get_object_or_404(Competition, id=competition_id)
    
    # Verificar permisos
    if competition.organizer != request.user and not request.user.is_staff:
        return Response(
            {'error': 'Sin permisos para ver este dashboard'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Datos del dashboard
    registrations = Registration.objects.filter(
        competition_category__competition=competition
    )
    
    dashboard_data = {
        'competition': CompetitionDetailSerializer(competition).data,
        'summary': {
            'total_registrations': registrations.count(),
            'confirmed_registrations': registrations.filter(status='CONFIRMED').count(),
            'paid_registrations': registrations.filter(status='PAID').count(),
            'pending_registrations': registrations.filter(status='PENDING').count(),
            'total_revenue': registrations.aggregate(total=Sum('entry_fee_paid'))['total'] or Decimal('0.00'),
            'categories_count': competition.competitioncategory_set.count(),
            'judges_assigned': JudgeAssignment.objects.filter(
                competition_category__competition=competition
            ).count()
        },
        'categories': [],
        'recent_registrations': RegistrationListSerializer(
            registrations.order_by('-registered_at')[:10], many=True
        ).data
    }
    
    # Datos por categoría
    for comp_cat in competition.competitioncategory_set.all():
        cat_registrations = registrations.filter(competition_category=comp_cat)
        category_data = {
            'category': CompetitionCategorySerializer(comp_cat).data,
            'registrations_count': cat_registrations.count(),
            'available_spots': comp_cat.available_spots,
            'judges_assigned': comp_cat.judge_assignments.count(),
            'revenue': cat_registrations.aggregate(total=Sum('entry_fee_paid'))['total'] or Decimal('0.00')
        }
        dashboard_data['categories'].append(category_data)
    
    return Response(dashboard_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def judge_competitions(request):
    """Competencias asignadas a un juez"""
    if not hasattr(request.user, 'judge_profile'):
        return Response(
            {'error': 'Usuario no es un juez'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    assignments = JudgeAssignment.objects.filter(
        judge=request.user
    ).select_related('competition_category__competition', 'competition_category__category')
    
    competitions_data = []
    for assignment in assignments:
        competition = assignment.competition_category.competition
        competitions_data.append({
            'assignment': JudgeAssignmentSerializer(assignment).data,
            'competition': CompetitionListSerializer(competition).data,
            'category': assignment.competition_category.category.name,
            'participants_count': Registration.objects.filter(
                competition_category=assignment.competition_category,
                status__in=['CONFIRMED', 'PAID']
            ).count()
        })
    
    return Response(competitions_data)


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quick_registration(request):
    """Inscripción rápida para jinetes"""
    if not hasattr(request.user, 'rider_profile'):
        return Response(
            {'error': 'Usuario no es un jinete'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    competition_category_id = request.data.get('competition_category_id')
    horse_id = request.data.get('horse_id')
    
    if not competition_category_id or not horse_id:
        return Response(
            {'error': 'Debe especificar categoría de competencia y caballo'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        competition_category = CompetitionCategory.objects.get(id=competition_category_id)
        horse = Horse.objects.get(id=horse_id)
        rider = request.user.rider_profile
        
        # Crear inscripción
        registration_data = {
            'competition_category_id': competition_category_id,
            'rider_id': rider.id,
            'horse_id': horse_id,
            'special_requirements': request.data.get('special_requirements', ''),
            'notes': request.data.get('notes', '')
        }
        
        serializer = RegistrationCreateSerializer(
            data=registration_data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        registration = serializer.save()
        
        return Response({
            'message': 'Inscripción creada exitosamente',
            'registration': RegistrationDetailSerializer(registration).data
        }, status=status.HTTP_201_CREATED)
        
    except (CompetitionCategory.DoesNotExist, Horse.DoesNotExist) as e:
        return Response(
            {'error': 'Recursos no encontrados'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_participants(request):
    """Búsqueda de participantes (jinetes y caballos)"""
    query = request.query_params.get('q', '')
    participant_type = request.query_params.get('type', 'all')  # 'riders', 'horses', 'all'
    
    if len(query) < 2:
        return Response({
            'riders': [],
            'horses': [],
            'message': 'Mínimo 2 caracteres para búsqueda'
        })
    
    results = {'riders': [], 'horses': []}
    
    if participant_type in ['all', 'riders']:
        riders = Rider.objects.filter(
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(license_number__icontains=query) |
            Q(fei_id__icontains=query),
            is_active=True
        ).select_related('user')[:10]
        
        results['riders'] = RiderListSerializer(riders, many=True).data
    
    if participant_type in ['all', 'horses']:
        horses = Horse.objects.filter(
            Q(name__icontains=query) |
            Q(registration_number__icontains=query) |
            Q(passport_number__icontains=query) |
            Q(fei_id__icontains=query),
            is_active=True
        )[:10]
        
        results['horses'] = HorseListSerializer(horses, many=True).data
    
    return Response(results)