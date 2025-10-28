import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta


class Discipline(models.Model):
    """Disciplinas ecuestres (Salto, Dressage, Concurso Completo, etc.)"""
    DISCIPLINE_TYPES = [
        ('jumping', 'Salto'),
        ('dressage', 'Dressage'),
        ('eventing', 'Concurso Completo'),
        ('endurance', 'Resistencia'),
        ('vaulting', 'Volteo'),
        ('driving', 'Enganche'),
        ('reining', 'Reining'),
        ('para_dressage', 'Para-Dressage'),
        ('para_jumping', 'Para-Salto'),
    ]
    
    # id se genera automáticamente como integer AutoField (primary key)
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre")
    code = models.CharField(max_length=20, unique=True, verbose_name="Código")
    discipline_type = models.CharField(max_length=20, choices=DISCIPLINE_TYPES, verbose_name="Tipo")
    description = models.TextField(blank=True, verbose_name="Descripción")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    
    # Reglas específicas de la disciplina
    max_duration_minutes = models.PositiveIntegerField(null=True, blank=True, verbose_name="Duración máxima (min)")
    scoring_system = models.CharField(max_length=50, default='points', verbose_name="Sistema de puntuación")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Disciplina"
        verbose_name_plural = "Disciplinas"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Category(models.Model):
    """Categorías de competencia basadas en edad, nivel, etc."""
    CATEGORY_TYPES = [
        ('age', 'Por Edad'),
        ('level', 'Por Nivel'),
        ('height', 'Por Altura'),
        ('mixed', 'Mixta'),
    ]
    
    LEVEL_CHOICES = [
        ('beginner', 'Principiante'),
        ('intermediate', 'Intermedio'),
        ('advanced', 'Avanzado'),
        ('professional', 'Profesional'),
        ('international', 'Internacional'),
    ]
    
    # id se genera automáticamente como integer AutoField (primary key)
    name = models.CharField(max_length=100, verbose_name="Nombre")
    code = models.CharField(max_length=20, unique=True, verbose_name="Código")
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPES, verbose_name="Tipo")
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, null=True, blank=True, verbose_name="Nivel")
    
    # Restricciones de edad
    min_age = models.PositiveIntegerField(null=True, blank=True, verbose_name="Edad mínima")
    max_age = models.PositiveIntegerField(null=True, blank=True, verbose_name="Edad máxima")
    
    # Restricciones de altura (para salto)
    min_height_cm = models.PositiveIntegerField(null=True, blank=True, verbose_name="Altura mínima (cm)")
    max_height_cm = models.PositiveIntegerField(null=True, blank=True, verbose_name="Altura máxima (cm)")
    
    description = models.TextField(blank=True, verbose_name="Descripción")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    
    # Configuraciones específicas
    max_participants = models.PositiveIntegerField(null=True, blank=True, verbose_name="Máx. participantes")
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Tarifa de inscripción")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ['category_type', 'level', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Venue(models.Model):
    """Lugares/Sedes donde se realizan las competencias"""
    # id se genera automáticamente como integer AutoField (primary key)
    name = models.CharField(max_length=200, verbose_name="Nombre")
    address = models.TextField(verbose_name="Dirección")
    city = models.CharField(max_length=100, verbose_name="Ciudad")
    state_province = models.CharField(max_length=100, verbose_name="Estado/Provincia")
    country = models.CharField(max_length=100, verbose_name="País")
    postal_code = models.CharField(max_length=20, blank=True, verbose_name="Código postal")
    
    # Información de contacto
    phone = models.CharField(max_length=20, blank=True, verbose_name="Teléfono")
    email = models.EmailField(blank=True, verbose_name="Email")
    website = models.URLField(blank=True, verbose_name="Sitio web")
    
    # Capacidades e instalaciones
    capacity = models.PositiveIntegerField(null=True, blank=True, verbose_name="Capacidad")
    indoor_arena = models.BooleanField(default=False, verbose_name="Arena cubierta")
    outdoor_arena = models.BooleanField(default=False, verbose_name="Arena exterior")
    warm_up_area = models.BooleanField(default=False, verbose_name="Área de calentamiento")
    stabling = models.PositiveIntegerField(null=True, blank=True, verbose_name="Establos disponibles")
    
    # Coordenadas GPS
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Sede"
        verbose_name_plural = "Sedes"
        ordering = ['country', 'city', 'name']
    
    def __str__(self):
        return f"{self.name}, {self.city}"


class Competition(models.Model):
    """Competencias ecuestres"""
    STATUS_CHOICES = [
        ('draft', 'Borrador'),
        ('published', 'Publicada'),
        ('open_registration', 'Inscripción Abierta'),
        ('registration_closed', 'Inscripción Cerrada'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
        ('postponed', 'Pospuesta'),
    ]
    
    COMPETITION_TYPES = [
        ('national', 'Nacional'),
        ('international', 'Internacional'),
        ('regional', 'Regional'),
        ('local', 'Local'),
        ('championship', 'Campeonato'),
        ('friendly', 'Amistoso'),
    ]
    
    # id se genera automáticamente como integer AutoField (primary key)
    name = models.CharField(max_length=200, verbose_name="Nombre")
    short_name = models.CharField(max_length=50, blank=True, verbose_name="Nombre corto")
    description = models.TextField(blank=True, verbose_name="Descripción")
    
    # Organización
    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="Organizador")
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, verbose_name="Sede")
    disciplines = models.ManyToManyField(Discipline, verbose_name="Disciplinas")
    categories = models.ManyToManyField(Category, verbose_name="Categorías")
    
    # Fechas y tiempos
    start_date = models.DateTimeField(verbose_name="Fecha de inicio")
    end_date = models.DateTimeField(verbose_name="Fecha de fin")
    registration_start = models.DateTimeField(verbose_name="Inicio de inscripción")
    registration_end = models.DateTimeField(verbose_name="Fin de inscripción")
    
    # Estado y tipo
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="Estado")
    competition_type = models.CharField(max_length=20, choices=COMPETITION_TYPES, verbose_name="Tipo")
    
    # Configuraciones
    max_participants = models.PositiveIntegerField(null=True, blank=True, verbose_name="Máx. participantes")
    max_horses_per_rider = models.PositiveIntegerField(default=1, verbose_name="Máx. caballos por jinete")
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Tarifa de inscripción")
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Recargo por inscripción tardía")
    
    # Configuraciones avanzadas
    requires_qualification = models.BooleanField(default=False, verbose_name="Requiere clasificación")
    is_championship = models.BooleanField(default=False, verbose_name="Es campeonato")
    points_for_ranking = models.BooleanField(default=True, verbose_name="Otorga puntos para ranking")
    
    # Información adicional
    rules = models.TextField(blank=True, verbose_name="Reglamento")
    prize_money = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="Premio en dinero")
    sponsors = models.TextField(blank=True, verbose_name="Patrocinadores")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Competencia"
        verbose_name_plural = "Competencias"
        ordering = ['-start_date', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.start_date.strftime('%Y-%m-%d')}"
    
    @property
    def is_registration_open(self):
        """Verifica si la inscripción está abierta"""
        now = timezone.now()
        return (
            self.status == 'open_registration' and
            self.registration_start <= now <= self.registration_end
        )
    
    @property
    def days_until_start(self):
        """Días hasta el inicio de la competencia"""
        now = timezone.now()
        if self.start_date > now:
            return (self.start_date.date() - now.date()).days
        return 0
    
    @property
    def duration_days(self):
        """Duración de la competencia en días"""
        return (self.end_date.date() - self.start_date.date()).days + 1


class CompetitionStaff(models.Model):
    """Personal asignado a una competencia"""
    ROLE_CHOICES = [
        ('chief_judge', 'Juez Principal'),
        ('judge', 'Juez'),
        ('technical_delegate', 'Delegado Técnico'),
        ('steward', 'Comisario'),
        ('veterinarian', 'Veterinario'),
        ('course_designer', 'Diseñador de Pista'),
        ('announcer', 'Locutor'),
        ('timekeeper', 'Cronometrador'),
        ('scorer', 'Anotador'),
    ]
    
    # id se genera automáticamente como integer AutoField (primary key)
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='staff')
    staff_member = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="Miembro del personal")
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, verbose_name="Rol")
    is_confirmed = models.BooleanField(default=False, verbose_name="Confirmado")
    
    # Información adicional
    notes = models.TextField(blank=True, verbose_name="Notas")
    assigned_date = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de asignación")
    
    class Meta:
        verbose_name = "Personal de Competencia"
        verbose_name_plural = "Personal de Competencias"
        unique_together = ['competition', 'staff_member', 'role']
    
    def __str__(self):
        return f"{self.staff_member.get_full_name()} - {self.get_role_display()} ({self.competition.name})"


class Horse(models.Model):
    """Caballos registrados en el sistema"""
    GENDER_CHOICES = [
        ('stallion', 'Semental'),
        ('mare', 'Yegua'),
        ('gelding', 'Caballo castrado'),
    ]
    
    # id se genera automáticamente como integer AutoField (primary key)
    name = models.CharField(max_length=100, verbose_name="Nombre")
    registration_number = models.CharField(max_length=50, unique=True, verbose_name="Número de registro")
    
    # Información básica
    breed = models.CharField(max_length=100, verbose_name="Raza")
    color = models.CharField(max_length=50, verbose_name="Color")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, verbose_name="Sexo")
    birth_date = models.DateField(verbose_name="Fecha de nacimiento")
    height = models.PositiveIntegerField(help_text="Altura en centímetros", verbose_name="Altura (cm)")
    
    # Propietario y responsables
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_horses', verbose_name="Propietario")
    trainer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='trained_horses', verbose_name="Entrenador")
    
    # Información médica y veterinaria
    microchip_number = models.CharField(max_length=50, blank=True, verbose_name="Número de microchip")
    passport_number = models.CharField(max_length=50, blank=True, verbose_name="Número de pasaporte")
    is_fei_registered = models.BooleanField(default=False, verbose_name="Registrado FEI")
    fei_id = models.CharField(max_length=20, blank=True, verbose_name="ID FEI")
    
    # Estado
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    is_available_for_competition = models.BooleanField(default=True, verbose_name="Disponible para competencia")
    
    # Información adicional
    notes = models.TextField(blank=True, verbose_name="Notas")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Caballo"
        verbose_name_plural = "Caballos"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.registration_number})"
    
    @property
    def age(self):
        """Edad del caballo en años"""
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))


class Participant(models.Model):
    """Participante en una competencia específica"""
    # id se genera automáticamente como integer AutoField (primary key)
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='participants')
    rider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="Jinete")
    horse = models.ForeignKey(Horse, on_delete=models.CASCADE, verbose_name="Caballo")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, verbose_name="Categoría")
    
    # Número de participación
    bib_number = models.PositiveIntegerField(null=True, blank=True, verbose_name="Número de dorsal")
    
    # Estado de la inscripción
    registration_date = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de inscripción")
    is_confirmed = models.BooleanField(default=False, verbose_name="Confirmado")
    is_paid = models.BooleanField(default=False, verbose_name="Pagado")
    
    # Información adicional
    emergency_contact_name = models.CharField(max_length=200, blank=True, verbose_name="Contacto de emergencia")
    emergency_contact_phone = models.CharField(max_length=20, blank=True, verbose_name="Teléfono de emergencia")
    special_requirements = models.TextField(blank=True, verbose_name="Requerimientos especiales")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Participante"
        verbose_name_plural = "Participantes"
        unique_together = ['competition', 'rider', 'horse', 'category']
        ordering = ['bib_number', 'rider__last_name']
    
    def __str__(self):
        return f"{self.rider.get_full_name()} + {self.horse.name} ({self.competition.name})"


class CompetitionSchedule(models.Model):
    """Horarios y programación de competencias"""
    SCHEDULE_TYPES = [
        ('competition_start', 'Inicio de Competencia'),
        ('discipline_start', 'Inicio de Disciplina'),
        ('category_start', 'Inicio de Categoría'),
        ('break', 'Descanso'),
        ('lunch', 'Almuerzo'),
        ('awards', 'Premiación'),
        ('special_event', 'Evento Especial'),
    ]
    
    # id se genera automáticamente como integer AutoField (primary key)
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='schedule')
    
    # Tiempo y duración
    start_time = models.DateTimeField(verbose_name="Hora de inicio")
    end_time = models.DateTimeField(null=True, blank=True, verbose_name="Hora de fin")
    estimated_duration = models.DurationField(null=True, blank=True, verbose_name="Duración estimada")
    
    # Información del evento
    title = models.CharField(max_length=200, verbose_name="Título")
    description = models.TextField(blank=True, verbose_name="Descripción")
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPES, verbose_name="Tipo")
    
    # Relaciones opcionales
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Disciplina")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True, verbose_name="Categoría")
    
    # Información adicional
    location = models.CharField(max_length=200, blank=True, verbose_name="Ubicación específica")
    is_published = models.BooleanField(default=True, verbose_name="Publicado")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Programación"
        verbose_name_plural = "Programaciones"
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.title} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"
