from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from .filters import (
    CompetitionFilterBackend, CategoryFilterBackend, VenueFilterBackend,
    HorseFilterBackend, ParticipantFilterBackend
)
from django.db.models import Q, Count
from django.utils import timezone

from .models import (
    Discipline, Category, Venue, Competition, 
    CompetitionStaff, Horse, Participant, CompetitionSchedule
)
from .serializers import (
    DisciplineSerializer, CategorySerializer, VenueSerializer,
    CompetitionListSerializer, CompetitionDetailSerializer, CompetitionCreateSerializer,
    CompetitionStaffSerializer, HorseSerializer, ParticipantSerializer,
    CompetitionScheduleSerializer, SimpleCompetitionSerializer
)
from .permissions import (
    IsOrganizerOrReadOnly, CanManageCompetitionStaff, CanRegisterParticipant,
    CanManageHorses, CanManageVenues, CanManageCompetitionSchedule,
    CanViewCompetitionDetails, CompetitionPermissionChecker, IsOrganizerOrAdmin
)
from apps.users.middleware import AuditMiddleware


class DisciplineViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar disciplinas"""
    queryset = Discipline.objects.filter(is_active=True)
    serializer_class = DisciplineSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        """Permisos dinámicos: lectura pública, escritura solo para admin"""
        if self.action in ['list', 'retrieve', 'active']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Obtener solo disciplinas activas"""
        disciplines = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(disciplines, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar categorías"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    filter_backends = [CategoryFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'category_type', 'level', 'created_at']
    ordering = ['category_type', 'level', 'name']

    def get_permissions(self):
        """Permisos dinámicos: lectura pública, escritura solo para organizadores/admin"""
        if self.action in ['list', 'retrieve', 'by_type']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Obtener categorías agrupadas por tipo"""
        categories = self.queryset.all()
        grouped = {}
        for category in categories:
            category_type = category.get_category_type_display()
            if category_type not in grouped:
                grouped[category_type] = []
            grouped[category_type].append(CategorySerializer(category).data)
        
        return Response(grouped)


class VenueViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar sedes"""
    queryset = Venue.objects.filter(is_active=True)
    serializer_class = VenueSerializer
    filter_backends = [VenueFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'city', 'country', 'address']
    ordering_fields = ['name', 'city', 'country', 'created_at']
    ordering = ['country', 'city', 'name']

    def get_permissions(self):
        """Permisos dinámicos: lectura pública, escritura solo para organizadores/admin"""
        if self.action in ['list', 'retrieve', 'by_country']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def by_country(self, request):
        """Obtener sedes agrupadas por país"""
        venues = self.queryset.all()
        grouped = {}
        for venue in venues:
            country = venue.country
            if country not in grouped:
                grouped[country] = []
            grouped[country].append(VenueSerializer(venue).data)
        
        return Response(grouped)


class CompetitionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar competencias"""
    filter_backends = [CompetitionFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'short_name', 'description', 'venue__name', 'venue__city']
    ordering_fields = ['name', 'start_date', 'created_at', 'status']
    ordering = ['-start_date']

    def get_permissions(self):
        """Permisos dinámicos: lectura pública, escritura solo para organizadores/admin"""
        if self.action in ['list', 'retrieve', 'participants', 'my_assigned']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filtrar competencias según permisos del usuario"""
        user = self.request.user

        # Usuarios no autenticados solo ven competencias públicas completadas
        if not user.is_authenticated:
            return Competition.objects.filter(
                status__in=['published', 'open_registration', 'registration_closed', 'in_progress', 'completed']
            ).select_related('organizer', 'venue').prefetch_related(
                'disciplines', 'categories', 'participants', 'staff'
            )

        # Admin ve todas
        if user.role == 'admin':
            return Competition.objects.select_related('organizer', 'venue').prefetch_related(
                'disciplines', 'categories', 'participants', 'staff'
            )

        # Organizadores ven las suyas + las públicas
        if user.role == 'organizer':
            return Competition.objects.filter(
                Q(organizer=user) | Q(status__in=['published', 'open_registration', 'registration_closed', 'in_progress', 'completed'])
            ).select_related('organizer', 'venue').prefetch_related(
                'disciplines', 'categories', 'participants', 'staff'
            )

        # Otros usuarios solo ven las públicas
        return Competition.objects.filter(
            status__in=['published', 'open_registration', 'registration_closed', 'in_progress', 'completed']
        ).select_related('organizer', 'venue').prefetch_related(
            'disciplines', 'categories', 'participants', 'staff'
        )

    def get_serializer_class(self):
        """Usar diferentes serializers según la acción"""
        if self.action == 'list':
            # Usar serializer simple para evitar problemas con choices
            return SimpleCompetitionSerializer
        elif self.action == 'create':
            return CompetitionCreateSerializer
        else:
            # Para retrieve también usar simple por ahora
            return SimpleCompetitionSerializer

    def perform_create(self, serializer):
        """Crear competencia con el usuario actual como organizador"""
        # Verificar que el usuario sea organizador o admin
        user = self.request.user
        if user.role not in ['organizer', 'admin']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Solo organizadores y administradores pueden crear competencias")

        # El organizador se asigna en el serializer usando el context
        competition = serializer.save()

        # Auditar la creación
        AuditMiddleware.log_action(
            self.request.user,
            'create',
            'Competition',
            str(competition.id),
            f"Competencia '{competition.name}' creada"
        )

    def perform_update(self, serializer):
        """Actualizar competencia con auditoría"""
        user = self.request.user
        old_instance = self.get_object()

        # Verificar permisos: organizador de la competencia o admin
        if user.role == 'admin' or old_instance.organizer == user:
            competition = serializer.save()

            # Auditar la actualización
            AuditMiddleware.log_action(
                self.request.user,
                'update',
                'Competition',
                str(competition.id),
                f"Competencia '{competition.name}' actualizada"
            )
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Solo el organizador de la competencia o un administrador puede editarla")

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publicar una competencia"""
        competition = self.get_object()
        
        if competition.status != 'draft':
            return Response(
                {'error': 'Solo se pueden publicar competencias en borrador'},
                status=status.HTTP_400_BAD_REQUEST
            )

        competition.status = 'published'
        competition.save()

        # Auditar la publicación
        AuditMiddleware.log_action(
            request.user,
            'publish',
            'Competition',
            str(competition.id),
            f"Competencia '{competition.name}' publicada"
        )

        return Response({'message': 'Competencia publicada exitosamente'})

    @action(detail=True, methods=['post'])
    def open_registration(self, request, pk=None):
        """Abrir inscripciones de una competencia"""
        competition = self.get_object()
        
        if competition.status not in ['published', 'registration_closed']:
            return Response(
                {'error': 'La competencia debe estar publicada para abrir inscripciones'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar fechas
        now = timezone.now()
        if now < competition.registration_start:
            return Response(
                {'error': 'Aún no es la fecha de inicio de inscripciones'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if now > competition.registration_end:
            return Response(
                {'error': 'Ya pasó la fecha límite de inscripciones'},
                status=status.HTTP_400_BAD_REQUEST
            )

        competition.status = 'open_registration'
        competition.save()

        return Response({'message': 'Inscripciones abiertas exitosamente'})

    @action(detail=True, methods=['post'])
    def close_registration(self, request, pk=None):
        """Cerrar inscripciones de una competencia"""
        competition = self.get_object()
        
        if competition.status != 'open_registration':
            return Response(
                {'error': 'La competencia debe tener inscripciones abiertas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        competition.status = 'registration_closed'
        competition.save()

        return Response({'message': 'Inscripciones cerradas exitosamente'})

    @action(detail=False, methods=['get'])
    def my_assigned(self, request):
        """Obtener competencias donde el usuario es juez asignado"""
        user = request.user

        if not user.is_authenticated:
            return Response([], status=status.HTTP_200_OK)

        # Admin puede ver todas
        if user.role == 'admin':
            competitions = Competition.objects.all()
        # Jueces ven competencias donde están asignados
        elif user.role == 'judge':
            staff_assignments = CompetitionStaff.objects.filter(
                staff_member=user,
                role__in=['judge', 'chief_judge'],
                is_confirmed=True
            )
            competition_ids = staff_assignments.values_list('competition_id', flat=True)
            competitions = Competition.objects.filter(id__in=competition_ids)
        else:
            # Otros roles no tienen competencias asignadas
            competitions = Competition.objects.none()

        # Usar el serializer simple
        competitions = competitions.select_related('organizer', 'venue').prefetch_related(
            'disciplines', 'categories', 'participants', 'staff'
        ).order_by('-start_date')

        serializer = SimpleCompetitionSerializer(competitions, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Obtener participantes de una competencia"""
        competition = self.get_object()
        participants = competition.participants.all()
        serializer = ParticipantSerializer(participants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Obtener estadísticas de una competencia"""
        competition = self.get_object()
        
        stats = {
            'total_participants': competition.participants.count(),
            'confirmed_participants': competition.participants.filter(is_confirmed=True).count(),
            'paid_participants': competition.participants.filter(is_paid=True).count(),
            'staff_assigned': competition.staff.count(),
            'staff_confirmed': competition.staff.filter(is_confirmed=True).count(),
            'disciplines_count': competition.disciplines.count(),
            'categories_count': competition.categories.count(),
        }
        
        return Response(stats)

    @action(detail=False, methods=['get'])
    def my_competitions(self, request):
        """Obtener competencias del usuario actual (organizador)"""
        if request.user.role not in ['organizer', 'admin']:
            return Response(
                {'error': 'Solo organizadores pueden ver sus competencias'},
                status=status.HTTP_403_FORBIDDEN
            )

        competitions = Competition.objects.filter(organizer=request.user)
        serializer = CompetitionListSerializer(competitions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Obtener competencias próximas"""
        now = timezone.now()
        competitions = self.get_queryset().filter(
            start_date__gte=now,
            status__in=['published', 'open_registration', 'registration_closed']
        ).order_by('start_date')[:10]
        
        serializer = CompetitionListSerializer(competitions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Obtener competencias en progreso"""
        now = timezone.now()
        competitions = self.get_queryset().filter(
            start_date__lte=now,
            end_date__gte=now,
            status='in_progress'
        ).order_by('start_date')
        
        serializer = CompetitionListSerializer(competitions, many=True)
        return Response(serializer.data)


class HorseViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar caballos"""
    serializer_class = HorseSerializer
    permission_classes = [CanManageHorses]
    filter_backends = [HorseFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'registration_number', 'breed', 'color']
    ordering_fields = ['name', 'birth_date', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Filtrar caballos según permisos del usuario"""
        user = self.request.user
        if not user.is_authenticated:
            return Horse.objects.none()

        if user.role == 'admin':
            return Horse.objects.select_related('owner', 'trainer')

        # Usuarios ven sus caballos (como propietario o entrenador)
        return Horse.objects.filter(
            Q(owner=user) | Q(trainer=user)
        ).select_related('owner', 'trainer')

    def perform_create(self, serializer):
        """Crear caballo con el usuario actual como propietario por defecto"""
        if not serializer.validated_data.get('owner'):
            serializer.save(owner=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def my_horses(self, request):
        """Obtener caballos del usuario actual"""
        horses = Horse.objects.filter(
            Q(owner=request.user) | Q(trainer=request.user)
        ).distinct()
        serializer = self.get_serializer(horses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Obtener caballos disponibles para competencia"""
        horses = self.get_queryset().filter(is_available_for_competition=True)
        serializer = self.get_serializer(horses, many=True)
        return Response(serializer.data)


class CompetitionStaffViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar personal de competencias"""
    serializer_class = CompetitionStaffSerializer
    permission_classes = [CanManageCompetitionStaff]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['staff_member__first_name', 'staff_member__last_name', 'role']
    ordering_fields = ['assigned_date', 'role', 'staff_member__last_name']
    ordering = ['assigned_date']

    def get_queryset(self):
        """Filtrar personal según permisos del usuario"""
        user = self.request.user
        if not user.is_authenticated:
            return CompetitionStaff.objects.none()

        # Filtrar por competencia si se proporciona
        competition_id = self.request.query_params.get('competition')

        if user.role == 'admin':
            queryset = CompetitionStaff.objects.select_related('competition', 'staff_member')
        elif user.role == 'organizer':
            # Organizadores ven staff de sus competencias
            queryset = CompetitionStaff.objects.filter(
                competition__organizer=user
            ).select_related('competition', 'staff_member')
        else:
            # Otros usuarios no tienen acceso
            queryset = CompetitionStaff.objects.none()

        # Aplicar filtro de competencia con validación UUID
        if competition_id:
            try:
                # Validar que sea un UUID válido
                import uuid
                uuid.UUID(competition_id)
                queryset = queryset.filter(competition_id=competition_id)
            except (ValueError, AttributeError, TypeError):
                # Si no es UUID válido, retornar queryset vacío en lugar de error 500
                return CompetitionStaff.objects.none()

        return queryset

    def perform_create(self, serializer):
        """Crear asignación de personal con auditoría"""
        staff = serializer.save()

        # Auditar la creación
        AuditMiddleware.log_action(
            self.request.user,
            'create',
            'CompetitionStaff',
            str(staff.id),
            f"Personal '{staff.staff_member.get_full_name()}' asignado a competencia '{staff.competition.name}' como {staff.get_role_display()}"
        )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmar asignación de personal"""
        staff = self.get_object()
        staff.is_confirmed = True
        staff.save()

        return Response({'message': 'Asignación confirmada exitosamente'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rechazar asignación de personal"""
        staff = self.get_object()
        notes = request.data.get('notes', '')

        if notes:
            staff.notes = f"{staff.notes}\n\nRechazado: {notes}" if staff.notes else f"Rechazado: {notes}"
            staff.save()

        staff.delete()

        return Response({'message': 'Asignación rechazada exitosamente'})


class ParticipantViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar participantes"""
    serializer_class = ParticipantSerializer
    permission_classes = [CanRegisterParticipant]
    filter_backends = [ParticipantFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['rider__first_name', 'rider__last_name', 'horse__name']
    ordering_fields = ['bib_number', 'registration_date', 'rider__last_name']
    ordering = ['bib_number', 'rider__last_name']

    def get_queryset(self):
        """Filtrar participantes según permisos del usuario"""
        user = self.request.user
        if not user.is_authenticated:
            return Participant.objects.none()

        if user.role == 'admin':
            return Participant.objects.select_related('competition', 'rider', 'horse', 'category')

        # Organizadores ven participantes de sus competencias
        if user.role == 'organizer':
            return Participant.objects.filter(
                Q(competition__organizer=user) | Q(rider=user)
            ).select_related('competition', 'rider', 'horse', 'category')

        # Otros usuarios ven solo sus propias participaciones
        return Participant.objects.filter(
            rider=user
        ).select_related('competition', 'rider', 'horse', 'category')

    def perform_create(self, serializer):
        """Crear participación con validaciones"""
        from rest_framework import serializers as drf_serializers
        
        competition = serializer.validated_data['competition']
        
        # Verificar que la inscripción esté abierta
        if not competition.is_registration_open:
            raise drf_serializers.ValidationError("La inscripción no está abierta para esta competencia")
        
        # Verificar límite de participantes
        if competition.max_participants:
            current_participants = competition.participants.filter(is_confirmed=True).count()
            if current_participants >= competition.max_participants:
                raise drf_serializers.ValidationError("La competencia ha alcanzado el límite de participantes")
        
        # Crear participación con el usuario actual como jinete por defecto
        if not serializer.validated_data.get('rider'):
            serializer.save(rider=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmar participación"""
        participant = self.get_object()
        participant.is_confirmed = True
        participant.save()

        return Response({'message': 'Participación confirmada exitosamente'})

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Marcar como pagado"""
        participant = self.get_object()
        participant.is_paid = True
        participant.save()

        return Response({'message': 'Pago registrado exitosamente'})
