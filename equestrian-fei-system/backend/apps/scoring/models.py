import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class ScoringCriteria(models.Model):
    """Criterios de puntuación para diferentes disciplinas"""
    CRITERIA_TYPES = [
        ('technical', 'Técnico'),
        ('artistic', 'Artístico'),
        ('time', 'Tiempo'),
        ('penalty', 'Penalización'),
        ('bonus', 'Bonus'),
        ('overall', 'General'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    discipline = models.ForeignKey('competitions.Discipline', on_delete=models.CASCADE, related_name='scoring_criteria')
    name = models.CharField(max_length=100, verbose_name="Nombre del criterio")
    code = models.CharField(max_length=20, verbose_name="Código")
    criteria_type = models.CharField(max_length=20, choices=CRITERIA_TYPES, verbose_name="Tipo de criterio")
    
    # Configuración de puntuación
    min_score = models.DecimalField(max_digits=6, decimal_places=2, default=0, verbose_name="Puntuación mínima")
    max_score = models.DecimalField(max_digits=6, decimal_places=2, default=10, verbose_name="Puntuación máxima")
    weight = models.DecimalField(max_digits=5, decimal_places=3, default=1.000, verbose_name="Peso del criterio")
    
    # Configuración adicional
    is_required = models.BooleanField(default=True, verbose_name="Es requerido")
    is_time_based = models.BooleanField(default=False, verbose_name="Basado en tiempo")
    allow_decimals = models.BooleanField(default=True, verbose_name="Permite decimales")
    
    # Metadata
    description = models.TextField(blank=True, verbose_name="Descripción")
    order = models.PositiveIntegerField(default=0, verbose_name="Orden")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Criterio de Puntuación"
        verbose_name_plural = "Criterios de Puntuación"
        ordering = ['discipline', 'order', 'name']
        unique_together = ['discipline', 'code']
    
    def __str__(self):
        return f"{self.discipline.name} - {self.name}"


class ScoreCard(models.Model):
    """Tarjeta de puntuación para un participante en una competencia"""
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('validated', 'Validada'),
        ('published', 'Publicada'),
        ('disputed', 'En Disputa'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participant = models.ForeignKey('competitions.Participant', on_delete=models.CASCADE, related_name='score_cards')
    judge = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='score_cards_judged')
    
    # Estado y metadatos
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Estado")
    round_number = models.PositiveIntegerField(default=1, verbose_name="Número de ronda")
    attempt_number = models.PositiveIntegerField(default=1, verbose_name="Número de intento")
    
    # Tiempos
    start_time = models.DateTimeField(null=True, blank=True, verbose_name="Hora de inicio")
    end_time = models.DateTimeField(null=True, blank=True, verbose_name="Hora de fin")
    execution_time = models.DurationField(null=True, blank=True, verbose_name="Tiempo de ejecución")
    
    # Puntuaciones calculadas
    technical_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación técnica")
    artistic_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación artística")
    time_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación de tiempo")
    penalty_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Penalizaciones")
    bonus_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Bonificaciones")
    
    # Puntuación final
    raw_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación bruta")
    final_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación final")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="Porcentaje")
    
    # Información adicional
    notes = models.TextField(blank=True, verbose_name="Notas del juez")
    weather_conditions = models.CharField(max_length=100, blank=True, verbose_name="Condiciones climáticas")
    arena_conditions = models.CharField(max_length=100, blank=True, verbose_name="Condiciones de la arena")
    
    # Validación y aprobación
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='validated_scores')
    validated_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de validación")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Tarjeta de Puntuación"
        verbose_name_plural = "Tarjetas de Puntuación"
        ordering = ['-created_at']
        unique_together = ['participant', 'judge', 'round_number', 'attempt_number']
    
    def __str__(self):
        return f"ScoreCard: {self.participant} - {self.judge} - R{self.round_number}"
    
    @property
    def duration_seconds(self):
        """Duración en segundos"""
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None
    
    def calculate_scores(self):
        """Calcular puntuaciones basadas en los criterios individuales"""
        individual_scores = self.individual_scores.all()
        
        technical_total = individual_scores.filter(criteria__criteria_type='technical').aggregate(
            total=models.Sum(models.F('weighted_score'))
        )['total'] or 0
        
        artistic_total = individual_scores.filter(criteria__criteria_type='artistic').aggregate(
            total=models.Sum(models.F('weighted_score'))
        )['total'] or 0
        
        penalty_total = individual_scores.filter(criteria__criteria_type='penalty').aggregate(
            total=models.Sum(models.F('weighted_score'))
        )['total'] or 0
        
        bonus_total = individual_scores.filter(criteria__criteria_type='bonus').aggregate(
            total=models.Sum(models.F('weighted_score'))
        )['total'] or 0
        
        self.technical_score = technical_total
        self.artistic_score = artistic_total
        self.penalty_score = penalty_total
        self.bonus_score = bonus_total
        
        # Calcular puntuación final
        self.raw_score = technical_total + artistic_total + bonus_total - penalty_total
        self.final_score = max(0, self.raw_score)  # No permitir puntuaciones negativas
        
        # Calcular porcentaje
        max_possible_score = individual_scores.aggregate(
            total=models.Sum(models.F('criteria__max_score') * models.F('criteria__weight'))
        )['total'] or 1
        
        self.percentage = (self.final_score / max_possible_score) * 100 if max_possible_score > 0 else 0
        
        self.save()


class IndividualScore(models.Model):
    """Puntuación individual para cada criterio"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    score_card = models.ForeignKey(ScoreCard, on_delete=models.CASCADE, related_name='individual_scores')
    criteria = models.ForeignKey(ScoringCriteria, on_delete=models.CASCADE, related_name='individual_scores')
    
    # Puntuación
    raw_score = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Puntuación bruta")
    weighted_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación ponderada")
    
    # Información adicional
    comments = models.TextField(blank=True, verbose_name="Comentarios")
    time_value = models.DurationField(null=True, blank=True, verbose_name="Valor de tiempo")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Puntuación Individual"
        verbose_name_plural = "Puntuaciones Individuales"
        unique_together = ['score_card', 'criteria']
    
    def save(self, *args, **kwargs):
        # Calcular puntuación ponderada
        self.weighted_score = Decimal(str(self.raw_score)) * Decimal(str(self.criteria.weight))
        super().save(*args, **kwargs)
        
        # Recalcular totales de la tarjeta
        if hasattr(self.score_card, 'calculate_scores'):
            self.score_card.calculate_scores()
    
    def __str__(self):
        return f"{self.score_card} - {self.criteria.name}: {self.raw_score}"


class JumpingFault(models.Model):
    """Faltas específicas para salto ecuestre"""
    FAULT_TYPES = [
        ('knockdown', 'Derribo'),
        ('refusal', 'Desobediencia'),
        ('fall_horse', 'Caída del caballo'),
        ('fall_rider', 'Caída del jinete'),
        ('wrong_course', 'Recorrido erróneo'),
        ('time_exceeded', 'Tiempo excedido'),
        ('elimination', 'Eliminación'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    score_card = models.ForeignKey(ScoreCard, on_delete=models.CASCADE, related_name='jumping_faults')
    
    fault_type = models.CharField(max_length=20, choices=FAULT_TYPES, verbose_name="Tipo de falta")
    obstacle_number = models.PositiveIntegerField(null=True, blank=True, verbose_name="Número de obstáculo")
    penalty_points = models.DecimalField(max_digits=5, decimal_places=1, default=4.0, verbose_name="Puntos de penalización")
    
    # Información adicional
    description = models.TextField(blank=True, verbose_name="Descripción")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Momento de la falta")
    
    class Meta:
        verbose_name = "Falta de Salto"
        verbose_name_plural = "Faltas de Salto"
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.get_fault_type_display()} - {self.penalty_points} pts"


class DressageMovement(models.Model):
    """Movimientos específicos para dressage"""
    MOVEMENT_TYPES = [
        ('halt', 'Parada'),
        ('walk', 'Paso'),
        ('trot', 'Trote'),
        ('canter', 'Galope'),
        ('transition', 'Transición'),
        ('figure', 'Figura'),
        ('lateral', 'Movimiento Lateral'),
        ('collection', 'Reunión'),
        ('extension', 'Extensión'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    score_card = models.ForeignKey(ScoreCard, on_delete=models.CASCADE, related_name='dressage_movements')
    
    movement_number = models.PositiveIntegerField(verbose_name="Número de movimiento")
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES, verbose_name="Tipo de movimiento")
    description = models.CharField(max_length=200, verbose_name="Descripción del movimiento")
    
    # Puntuación
    score = models.DecimalField(
        max_digits=3, 
        decimal_places=1, 
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="Puntuación"
    )
    coefficient = models.DecimalField(max_digits=3, decimal_places=1, default=1.0, verbose_name="Coeficiente")
    weighted_score = models.DecimalField(max_digits=4, decimal_places=1, default=0, verbose_name="Puntuación ponderada")
    
    # Comentarios
    judge_comments = models.TextField(blank=True, verbose_name="Comentarios del juez")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Movimiento de Dressage"
        verbose_name_plural = "Movimientos de Dressage"
        ordering = ['movement_number']
        unique_together = ['score_card', 'movement_number']
    
    def save(self, *args, **kwargs):
        # Calcular puntuación ponderada
        self.weighted_score = self.score * self.coefficient
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Mov {self.movement_number}: {self.get_movement_type_display()} - {self.score}"


class EventingPhase(models.Model):
    """Fases del concurso completo (eventing)"""
    PHASE_TYPES = [
        ('dressage', 'Dressage'),
        ('cross_country', 'Cross Country'),
        ('show_jumping', 'Salto'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participant = models.ForeignKey('competitions.Participant', on_delete=models.CASCADE, related_name='eventing_phases')
    phase_type = models.CharField(max_length=20, choices=PHASE_TYPES, verbose_name="Tipo de fase")
    
    # Información de la fase
    start_time = models.DateTimeField(null=True, blank=True, verbose_name="Hora de inicio")
    finish_time = models.DateTimeField(null=True, blank=True, verbose_name="Hora de finalización")
    optimum_time = models.DurationField(null=True, blank=True, verbose_name="Tiempo óptimo")
    actual_time = models.DurationField(null=True, blank=True, verbose_name="Tiempo real")
    
    # Puntuaciones por fase
    dressage_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación dressage")
    jumping_penalties = models.DecimalField(max_digits=6, decimal_places=1, default=0, verbose_name="Penalizaciones salto")
    time_penalties = models.DecimalField(max_digits=6, decimal_places=1, default=0, verbose_name="Penalizaciones tiempo")
    total_penalties = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Penalizaciones totales")
    
    # Estado
    is_completed = models.BooleanField(default=False, verbose_name="Completada")
    is_eliminated = models.BooleanField(default=False, verbose_name="Eliminado")
    elimination_reason = models.CharField(max_length=200, blank=True, verbose_name="Razón de eliminación")
    
    # Información adicional
    notes = models.TextField(blank=True, verbose_name="Notas")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Fase de Eventing"
        verbose_name_plural = "Fases de Eventing"
        ordering = ['phase_type']
        unique_together = ['participant', 'phase_type']
    
    def __str__(self):
        return f"{self.participant} - {self.get_phase_type_display()}"
    
    def calculate_time_penalties(self):
        """Calcular penalizaciones por tiempo"""
        if self.actual_time and self.optimum_time:
            time_diff = self.actual_time - self.optimum_time
            if time_diff.total_seconds() > 0:
                # 0.4 penalizaciones por segundo de exceso
                self.time_penalties = Decimal(time_diff.total_seconds()) * Decimal('0.4')
            else:
                self.time_penalties = 0
        else:
            self.time_penalties = 0
        
        self.calculate_total_penalties()
    
    def calculate_total_penalties(self):
        """Calcular penalizaciones totales"""
        if self.phase_type == 'dressage':
            # En dressage, convertir porcentaje a penalizaciones
            self.total_penalties = max(0, 100 - self.dressage_score) if self.dressage_score else 0
        else:
            self.total_penalties = self.jumping_penalties + self.time_penalties
        
        self.save()


class CompetitionRanking(models.Model):
    """Clasificación final de una competencia"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE, related_name='rankings')
    category = models.ForeignKey('competitions.Category', on_delete=models.CASCADE, related_name='rankings')
    
    # Información del ranking
    ranking_date = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de clasificación")
    is_final = models.BooleanField(default=False, verbose_name="Es clasificación final")
    is_published = models.BooleanField(default=False, verbose_name="Publicada")
    
    class Meta:
        verbose_name = "Clasificación de Competencia"
        verbose_name_plural = "Clasificaciones de Competencias"
        ordering = ['-ranking_date']
        unique_together = ['competition', 'category']
    
    def __str__(self):
        return f"Ranking: {self.competition.name} - {self.category.name}"


class RankingEntry(models.Model):
    """Entrada individual en una clasificación"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ranking = models.ForeignKey(CompetitionRanking, on_delete=models.CASCADE, related_name='entries')
    participant = models.ForeignKey('competitions.Participant', on_delete=models.CASCADE, related_name='ranking_entries')
    
    # Posición y puntuación
    position = models.PositiveIntegerField(verbose_name="Posición")
    total_score = models.DecimalField(max_digits=10, decimal_places=3, verbose_name="Puntuación total")
    total_penalties = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Penalizaciones totales")
    final_score = models.DecimalField(max_digits=10, decimal_places=3, verbose_name="Puntuación final")
    
    # Información adicional por disciplina
    technical_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación técnica")
    artistic_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación artística")
    time_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación de tiempo")
    
    # Estadísticas
    best_round_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Mejor ronda")
    rounds_completed = models.PositiveIntegerField(default=0, verbose_name="Rondas completadas")
    
    # Estado
    is_eliminated = models.BooleanField(default=False, verbose_name="Eliminado")
    elimination_reason = models.CharField(max_length=200, blank=True, verbose_name="Razón de eliminación")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Entrada de Clasificación"
        verbose_name_plural = "Entradas de Clasificación"
        ordering = ['position']
        unique_together = ['ranking', 'participant']
    
    def __str__(self):
        return f"#{self.position} - {self.participant} ({self.final_score})"
