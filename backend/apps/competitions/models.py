from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
import uuid


class Discipline(models.Model):
    """Disciplinas ecuestres según estándares FEI"""
    
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    fei_code = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Disciplina'
        verbose_name_plural = 'Disciplinas'
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Category(models.Model):
    """Categorías de competencias con parámetros específicos"""
    
    LEVEL_CHOICES = [
        ('INTRO', 'Introductorio'),
        ('PRELIMINARY', 'Preliminar'),
        ('NOVICE', 'Novato'),
        ('TRAINING', 'Entrenamiento'),
        ('MODIFIED', 'Modificado'),
        ('INTERMEDIATE', 'Intermedio'),
        ('ADVANCED', 'Avanzado'),
        ('CCI1', 'CCI1*'),
        ('CCI2', 'CCI2*'),
        ('CCI3', 'CCI3*'),
        ('CCI4', 'CCI4*'),
        ('CCI5', 'CCI5*'),
    ]
    
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE, related_name='categories')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    min_age_rider = models.PositiveIntegerField(validators=[MinValueValidator(10), MaxValueValidator(80)])
    max_age_rider = models.PositiveIntegerField(validators=[MinValueValidator(10), MaxValueValidator(80)], null=True, blank=True)
    min_age_horse = models.PositiveIntegerField(validators=[MinValueValidator(4), MaxValueValidator(30)])
    max_participants = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(200)])
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    description = models.TextField(blank=True)
    fei_parameters = models.JSONField(default=dict, help_text="Parámetros específicos FEI para esta categoría")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['discipline', 'level', 'name']
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        unique_together = ['discipline', 'code']
    
    def __str__(self):
        return f"{self.discipline.code} - {self.name} ({self.level})"
    
    def clean(self):
        if self.max_age_rider and self.min_age_rider >= self.max_age_rider:
            raise ValidationError("La edad máxima debe ser mayor que la mínima")


class Competition(models.Model):
    """Competencias ecuestres con estados configurables"""
    
    STATUS_CHOICES = [
        ('DRAFT', 'Borrador'),
        ('OPEN', 'Abierta para inscripciones'),
        ('REGISTRATION_CLOSED', 'Inscripciones cerradas'),
        ('IN_PROGRESS', 'En progreso'),
        ('SCORING', 'En calificación'),
        ('COMPLETED', 'Completada'),
        ('CANCELLED', 'Cancelada'),
        ('SUSPENDED', 'Suspendida'),
    ]
    
    WEATHER_CONDITIONS = [
        ('SUNNY', 'Soleado'),
        ('CLOUDY', 'Nublado'),
        ('RAINY', 'Lluvioso'),
        ('WINDY', 'Ventoso'),
        ('MIXED', 'Mixto'),
    ]
    
    GROUND_CONDITIONS = [
        ('FIRM', 'Firme'),
        ('GOOD', 'Bueno'),
        ('SOFT', 'Blando'),
        ('HEAVY', 'Pesado'),
        ('FROZEN', 'Congelado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    venue = models.CharField(max_length=200, help_text="Lugar de la competencia")
    address = models.TextField(help_text="Dirección completa del venue")
    
    # Fechas y horarios
    start_date = models.DateField()
    end_date = models.DateField()
    registration_start = models.DateTimeField()
    registration_end = models.DateTimeField()
    
    # Categorías y disciplinas
    categories = models.ManyToManyField(Category, through='CompetitionCategory')
    
    # Organizador y contacto
    organizer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='organized_competitions')
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Estado y configuración
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    max_total_participants = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(500)])
    allow_late_registration = models.BooleanField(default=False)
    late_registration_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Condiciones de competencia
    weather_condition = models.CharField(max_length=20, choices=WEATHER_CONDITIONS, blank=True)
    ground_condition = models.CharField(max_length=20, choices=GROUND_CONDITIONS, blank=True)
    temperature = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, help_text="Temperatura en Celsius")
    
    # FEI y regulaciones
    fei_code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    is_fei_sanctioned = models.BooleanField(default=False)
    regulations = models.TextField(blank=True, help_text="Regulaciones específicas de la competencia")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_competitions')
    
    class Meta:
        ordering = ['-start_date', 'name']
        verbose_name = 'Competencia'
        verbose_name_plural = 'Competencias'
    
    def __str__(self):
        return f"{self.name} - {self.start_date}"
    
    def clean(self):
        errors = {}
        
        if self.start_date and self.end_date and self.start_date > self.end_date:
            errors['end_date'] = "La fecha de fin debe ser posterior a la fecha de inicio"
        
        if self.registration_start and self.registration_end and self.registration_start >= self.registration_end:
            errors['registration_end'] = "La fecha de fin de inscripciones debe ser posterior al inicio"
        
        if self.registration_end and self.start_date and self.registration_end.date() > self.start_date:
            errors['registration_end'] = "Las inscripciones deben cerrar antes del inicio de la competencia"
        
        if errors:
            raise ValidationError(errors)
    
    @property
    def total_registered_participants(self):
        return Registration.objects.filter(competition_category__competition=self).count()
    
    @property
    def is_registration_open(self):
        from django.utils import timezone
        now = timezone.now()
        return (
            self.status in ['OPEN', 'REGISTRATION_CLOSED'] and
            self.registration_start <= now <= self.registration_end
        )
    
    @property
    def days_until_start(self):
        from django.utils import timezone
        from datetime import date
        today = timezone.now().date()
        return (self.start_date - today).days if self.start_date > today else 0


class CompetitionCategory(models.Model):
    """Relación entre competencias y categorías con configuración específica"""
    
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    max_participants = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(100)])
    entry_fee_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    order = models.PositiveIntegerField(default=1)
    special_requirements = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', 'category__name']
        unique_together = ['competition', 'category']
        verbose_name = 'Categoría de Competencia'
        verbose_name_plural = 'Categorías de Competencia'
    
    def __str__(self):
        return f"{self.competition.name} - {self.category.name}"
    
    @property
    def effective_entry_fee(self):
        return self.entry_fee_override or self.category.entry_fee
    
    @property
    def registered_participants(self):
        return Registration.objects.filter(competition_category=self).count()
    
    @property
    def available_spots(self):
        return self.max_participants - self.registered_participants


class Horse(models.Model):
    """Modelo para caballos participantes"""
    
    GENDER_CHOICES = [
        ('MARE', 'Yegua'),
        ('STALLION', 'Semental'),
        ('GELDING', 'Castrado'),
    ]
    
    name = models.CharField(max_length=100)
    registration_number = models.CharField(max_length=50, unique=True)
    breed = models.CharField(max_length=100)
    color = models.CharField(max_length=50)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    birth_date = models.DateField()
    owner = models.CharField(max_length=200)
    country_of_birth = models.CharField(max_length=100)
    
    # Documentación y salud
    passport_number = models.CharField(max_length=50, unique=True)
    vaccination_current = models.BooleanField(default=False)
    health_certificate_valid = models.BooleanField(default=False)
    insurance_valid = models.BooleanField(default=False)
    
    # FEI y registros
    fei_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    national_registration = models.CharField(max_length=100, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Caballo'
        verbose_name_plural = 'Caballos'
    
    def __str__(self):
        return f"{self.name} ({self.registration_number})"
    
    @property
    def age(self):
        from django.utils import timezone
        today = timezone.now().date()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
    
    def clean(self):
        from django.utils import timezone
        if self.birth_date and self.birth_date >= timezone.now().date():
            raise ValidationError("La fecha de nacimiento debe ser anterior a hoy")


class Rider(models.Model):
    """Modelo para jinetes participantes"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='rider_profile')
    license_number = models.CharField(max_length=50, unique=True)
    nationality = models.CharField(max_length=100)
    birth_date = models.DateField()
    phone = models.CharField(max_length=20)
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=20)
    
    # FEI y licencias
    fei_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    license_type = models.CharField(max_length=50)
    license_valid_until = models.DateField()
    
    # Seguros y documentación
    insurance_valid = models.BooleanField(default=False)
    medical_certificate_valid = models.BooleanField(default=False)
    
    # Experiencia y clasificación
    experience_level = models.CharField(max_length=50, blank=True)
    category_permissions = models.ManyToManyField(Category, blank=True, help_text="Categorías en las que puede competir")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['user__last_name', 'user__first_name']
        verbose_name = 'Jinete'
        verbose_name_plural = 'Jinetes'
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.license_number})"
    
    @property
    def age(self):
        from django.utils import timezone
        today = timezone.now().date()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
    
    @property
    def full_name(self):
        return self.user.get_full_name()
    
    def can_compete_in_category(self, category):
        age = self.age
        if age < category.min_age_rider:
            return False
        if category.max_age_rider and age > category.max_age_rider:
            return False
        return category in self.category_permissions.all()


class Registration(models.Model):
    """Inscripciones de participantes en competencias"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('CONFIRMED', 'Confirmada'),
        ('PAID', 'Pagada'),
        ('CANCELLED', 'Cancelada'),
        ('WAITLIST', 'Lista de espera'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition_category = models.ForeignKey(CompetitionCategory, on_delete=models.CASCADE, related_name='registrations')
    rider = models.ForeignKey(Rider, on_delete=models.CASCADE, related_name='registrations')
    horse = models.ForeignKey(Horse, on_delete=models.CASCADE, related_name='registrations')
    
    # Estado y fechas
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    registered_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    start_number = models.PositiveIntegerField(null=True, blank=True, help_text="Número de dorsal")
    
    # Pagos
    entry_fee_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    payment_reference = models.CharField(max_length=100, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    
    # Información adicional
    special_requirements = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Metadatos
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_registrations')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['registered_at']
        unique_together = [
            ['competition_category', 'rider', 'horse'],
            ['competition_category', 'start_number']
        ]
        verbose_name = 'Inscripción'
        verbose_name_plural = 'Inscripciones'
    
    def __str__(self):
        return f"{self.rider.full_name} - {self.horse.name} ({self.competition_category})"
    
    def clean(self):
        errors = {}
        
        # Validar edad del jinete
        if not self.rider.can_compete_in_category(self.competition_category.category):
            errors['rider'] = f"El jinete no cumple los requisitos para la categoría {self.competition_category.category.name}"
        
        # Validar edad del caballo
        horse_age = self.horse.age
        category = self.competition_category.category
        if horse_age < category.min_age_horse:
            errors['horse'] = f"El caballo debe tener al menos {category.min_age_horse} años para esta categoría"
        
        # Validar documentación
        if not self.horse.vaccination_current:
            errors['horse'] = "El caballo debe tener vacunación al día"
        
        if not self.rider.insurance_valid:
            errors['rider'] = "El jinete debe tener seguro válido"
        
        if errors:
            raise ValidationError(errors)
    
    @property
    def is_paid(self):
        return self.status == 'PAID'
    
    @property
    def outstanding_balance(self):
        return self.competition_category.effective_entry_fee - self.entry_fee_paid


class JudgeAssignment(models.Model):
    """Asignación de jueces a competencias"""
    
    ROLE_CHOICES = [
        ('PRESIDENT', 'Presidente del Jurado'),
        ('MEMBER', 'Miembro del Jurado'),
        ('GROUND_JURY', 'Jurado de Tierra'),
        ('TECHNICAL_DELEGATE', 'Delegado Técnico'),
        ('COURSE_DESIGNER', 'Diseñador de Pista'),
        ('VETERINARIAN', 'Veterinario'),
        ('STEWARD', 'Comisario'),
    ]
    
    competition_category = models.ForeignKey(CompetitionCategory, on_delete=models.CASCADE, related_name='judge_assignments')
    judge = models.ForeignKey(User, on_delete=models.CASCADE, related_name='judge_assignments')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    # Configuración específica
    order = models.PositiveIntegerField(default=1, help_text="Orden en el panel de jueces")
    fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    travel_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    accommodation_provided = models.BooleanField(default=False)
    
    # Estado
    confirmed = models.BooleanField(default=False)
    confirmation_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_judge_assignments')
    
    class Meta:
        ordering = ['order', 'role']
        unique_together = ['competition_category', 'judge', 'role']
        verbose_name = 'Asignación de Juez'
        verbose_name_plural = 'Asignaciones de Jueces'
    
    def __str__(self):
        return f"{self.judge.get_full_name()} - {self.get_role_display()} ({self.competition_category})"
    
    def clean(self):
        errors = {}
        
        # Verificar que el usuario tiene el rol de juez
        if not hasattr(self.judge, 'judge_profile'):
            errors['judge'] = "El usuario debe tener un perfil de juez válido"
        else:
            judge_profile = self.judge.judge_profile
            category = self.competition_category.category
            
            # Verificar que el juez puede juzgar esta disciplina
            if not judge_profile.can_judge_discipline(category.discipline):
                errors['judge'] = f"El juez no está certificado para la disciplina {category.discipline.name}"
            
            # Verificar que el juez puede juzgar este nivel de categoría
            if not judge_profile.can_judge_category_level(category.level):
                errors['judge'] = f"El juez no está certificado para el nivel {category.get_level_display()}"
            
            # Verificar que la licencia del juez está vigente
            if not judge_profile.is_license_valid():
                errors['judge'] = "La licencia del juez no está vigente"
        
        # Verificar que no hay conflicto de roles en la misma competencia
        if self.role == 'PRESIDENT':
            existing_president = JudgeAssignment.objects.filter(
                competition_category__competition=self.competition_category.competition,
                role='PRESIDENT'
            ).exclude(pk=self.pk)
            
            if existing_president.exists():
                errors['role'] = "Ya existe un Presidente del Jurado para esta competencia"
        
        # Verificar que el juez no está asignado a competencias que se superponen en fechas
        overlapping_assignments = JudgeAssignment.objects.filter(
            judge=self.judge,
            competition_category__competition__start_date__lte=self.competition_category.competition.end_date,
            competition_category__competition__end_date__gte=self.competition_category.competition.start_date
        ).exclude(pk=self.pk)
        
        if overlapping_assignments.exists():
            overlapping_comp = overlapping_assignments.first().competition_category.competition
            errors['judge'] = f"El juez ya está asignado a '{overlapping_comp.name}' en fechas superpuestas"
        
        if errors:
            raise ValidationError(errors)
    
    @property
    def total_compensation(self):
        """Compensación total del juez"""
        return (self.fee or Decimal('0.00')) + self.travel_allowance
    
    @property
    def is_confirmed_and_paid(self):
        """Verifica si está confirmado y pagado"""
        return self.confirmed and self.fee is not None


# Modelo adicional para manejar mejor los perfiles de jueces
class JudgeQualification(models.Model):
    """Calificaciones y certificaciones de jueces"""
    
    QUALIFICATION_LEVELS = [
        ('NATIONAL_1', 'Nacional Nivel 1'),
        ('NATIONAL_2', 'Nacional Nivel 2'),
        ('NATIONAL_3', 'Nacional Nivel 3'),
        ('FEI_1', 'FEI Nivel 1'),
        ('FEI_2', 'FEI Nivel 2'),
        ('FEI_3', 'FEI Nivel 3'),
        ('FEI_4', 'FEI Nivel 4'),
        ('FEI_5', 'FEI Nivel 5'),
    ]
    
    judge_profile = models.ForeignKey('users.JudgeProfile', on_delete=models.CASCADE, related_name='qualifications')
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE)
    level = models.CharField(max_length=20, choices=QUALIFICATION_LEVELS)
    certificate_number = models.CharField(max_length=100)
    issued_date = models.DateField()
    valid_until = models.DateField()
    issuing_authority = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['judge_profile', 'discipline', 'level']
        ordering = ['-valid_until', 'discipline', 'level']
        verbose_name = 'Calificación de Juez'
        verbose_name_plural = 'Calificaciones de Jueces'
    
    def __str__(self):
        return f"{self.judge_profile.user.get_full_name()} - {self.discipline.name} {self.get_level_display()}"
    
    @property
    def is_valid(self):
        """Verifica si la calificación está vigente"""
        from django.utils import timezone
        return self.is_active and self.valid_until >= timezone.now().date()
    
    @property
    def days_until_expiry(self):
        """Días hasta el vencimiento"""
        from django.utils import timezone
        if not self.is_valid:
            return 0
        return (self.valid_until - timezone.now().date()).days


# Modelo para registro de conflictos de interés
class JudgeConflictOfInterest(models.Model):
    """Registro de conflictos de interés de jueces"""
    
    CONFLICT_TYPES = [
        ('FAMILY', 'Familiar'),
        ('BUSINESS', 'Negocios'),
        ('TRAINING', 'Entrenamiento'),
        ('OWNERSHIP', 'Propiedad de caballo'),
        ('SPONSORSHIP', 'Patrocinio'),
        ('OTHER', 'Otro'),
    ]
    
    judge = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conflicts_of_interest')
    participant = models.ForeignKey(Rider, on_delete=models.CASCADE, related_name='judge_conflicts')
    conflict_type = models.CharField(max_length=20, choices=CONFLICT_TYPES)
    description = models.TextField()
    declared_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['judge', 'participant', 'conflict_type']
        verbose_name = 'Conflicto de Interés'
        verbose_name_plural = 'Conflictos de Interés'
    
    def __str__(self):
        return f"{self.judge.get_full_name()} - {self.participant.full_name} ({self.get_conflict_type_display()})"


# Extensión del modelo JudgeProfile (esto se agregaría al modelo existente en users)
"""
Agregar estos métodos al modelo JudgeProfile existente en apps/users/models.py:

def can_judge_discipline(self, discipline):
    '''Verifica si el juez puede juzgar una disciplina específica'''
    return self.qualifications.filter(
        discipline=discipline,
        is_active=True,
        valid_until__gte=timezone.now().date()
    ).exists()

def can_judge_category_level(self, category_level):
    '''Verifica si el juez puede juzgar un nivel de categoría'''
    # Mapeo de niveles de categoría a niveles de calificación requeridos
    level_requirements = {
        'INTRO': ['NATIONAL_1', 'NATIONAL_2', 'NATIONAL_3', 'FEI_1', 'FEI_2', 'FEI_3', 'FEI_4', 'FEI_5'],
        'PRELIMINARY': ['NATIONAL_2', 'NATIONAL_3', 'FEI_1', 'FEI_2', 'FEI_3', 'FEI_4', 'FEI_5'],
        'NOVICE': ['NATIONAL_2', 'NATIONAL_3', 'FEI_1', 'FEI_2', 'FEI_3', 'FEI_4', 'FEI_5'],
        'TRAINING': ['NATIONAL_3', 'FEI_1', 'FEI_2', 'FEI_3', 'FEI_4', 'FEI_5'],
        'MODIFIED': ['FEI_1', 'FEI_2', 'FEI_3', 'FEI_4', 'FEI_5'],
        'INTERMEDIATE': ['FEI_2', 'FEI_3', 'FEI_4', 'FEI_5'],
        'ADVANCED': ['FEI_3', 'FEI_4', 'FEI_5'],
        'CCI1': ['FEI_2', 'FEI_3', 'FEI_4', 'FEI_5'],
        'CCI2': ['FEI_2', 'FEI_3', 'FEI_4', 'FEI_5'],
        'CCI3': ['FEI_3', 'FEI_4', 'FEI_5'],
        'CCI4': ['FEI_4', 'FEI_5'],
        'CCI5': ['FEI_5'],
    }
    
    required_levels = level_requirements.get(category_level, [])
    if not required_levels:
        return True  # Si no hay requisitos específicos, permitir
    
    return self.qualifications.filter(
        level__in=required_levels,
        is_active=True,
        valid_until__gte=timezone.now().date()
    ).exists()

def is_license_valid(self):
    '''Verifica si la licencia del juez está vigente'''
    from django.utils import timezone
    return self.license_valid_until >= timezone.now().date()

def has_conflict_with_participant(self, participant):
    '''Verifica si hay conflicto de interés con un participante'''
    return JudgeConflictOfInterest.objects.filter(
        judge=self.user,
        participant=participant,
        is_active=True
    ).exists()

def get_valid_qualifications(self):
    '''Obtiene las calificaciones válidas del juez'''
    return self.qualifications.filter(
        is_active=True,
        valid_until__gte=timezone.now().date()
    )

def get_expiring_qualifications(self, days=30):
    '''Obtiene calificaciones que expiran en los próximos días'''
    from django.utils import timezone
    from datetime import timedelta
    
    expiry_date = timezone.now().date() + timedelta(days=days)
    return self.qualifications.filter(
        is_active=True,
        valid_until__gte=timezone.now().date(),
        valid_until__lte=expiry_date
    )
"""