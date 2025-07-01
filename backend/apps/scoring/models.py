from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from decimal import Decimal
from django.contrib.auth import get_user_model
from apps.competitions.models import Competition, Category, Registration
from apps.users.models import JudgeProfile

User = get_user_model()

class EvaluationParameter(models.Model):
    """
    Define los parámetros de evaluación FEI para cada categoría
    Basado en las hojas Excel: cada ejercicio tiene número, coeficiente y descripción
    """
    COEFFICIENT_CHOICES = [
        (1, '1'),
        (2, '2'), 
        (3, '3'),
        (4, '4'),
        (5, '5'),
    ]
    
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='evaluation_parameters')
    exercise_number = models.PositiveIntegerField(
        help_text="Número del ejercicio (1-25 según hojas Excel)"
    )
    exercise_name = models.CharField(
        max_length=200,
        help_text="Nombre descriptivo del ejercicio"
    )
    coefficient = models.IntegerField(
        choices=COEFFICIENT_CHOICES,
        default=1,
        help_text="Coeficiente multiplicador FEI (1, 2, 3, 4, 5)"
    )
    max_score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=Decimal('10.0'),
        validators=[MinValueValidator(Decimal('0.0')), MaxValueValidator(Decimal('10.0'))],
        help_text="Puntuación máxima para este ejercicio (normalmente 10.0)"
    )
    is_collective_mark = models.BooleanField(
        default=False,
        help_text="Indica si es una nota de conjunto (aparece al final de las hojas Excel)"
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Orden de presentación en la interfaz"
    )
    description = models.TextField(
        blank=True,
        help_text="Descripción detallada del ejercicio"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'scoring_evaluation_parameters'
        ordering = ['category', 'order', 'exercise_number']
        unique_together = ['category', 'exercise_number']
        verbose_name = 'Parámetro de Evaluación'
        verbose_name_plural = 'Parámetros de Evaluación'

    def __str__(self):
        return f"{self.category.name} - Ejercicio {self.exercise_number}: {self.exercise_name}"

    @property
    def weighted_max_score(self):
        """Calcula la puntuación máxima ponderada (max_score * coefficient)"""
        return self.max_score * self.coefficient


class JudgePosition(models.Model):
    """
    Define las posiciones de los jueces en la competencia
    Basado en hojas Excel: posiciones C, B, H, etc.
    """
    POSITION_CHOICES = [
        ('C', 'Posición C'),
        ('B', 'Posición B'), 
        ('H', 'Posición H'),
        ('M', 'Posición M'),
        ('E', 'Posición E'),
        ('K', 'Posición K'),
        ('F', 'Posición F'),
        ('S', 'Posición S'),
    ]
    
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='judge_positions')
    judge = models.ForeignKey(JudgeProfile, on_delete=models.CASCADE)
    position = models.CharField(
        max_length=1,
        choices=POSITION_CHOICES,
        help_text="Posición del juez en la pista"
    )
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'scoring_judge_positions'
        unique_together = ['competition', 'judge', 'position']
        verbose_name = 'Posición de Juez'
        verbose_name_plural = 'Posiciones de Jueces'

    def __str__(self):
        return f"{self.judge.get_full_name()} - Posición {self.position} ({self.competition.name})"


class ScoreEntry(models.Model):
    """
    Almacena cada calificación individual FEI
    Implementa el sistema de 3 celdas: Parámetro, Coeficiente, Calificación
    """
    participant = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='scores')
    judge_position = models.ForeignKey(JudgePosition, on_delete=models.CASCADE, related_name='scores')
    evaluation_parameter = models.ForeignKey(EvaluationParameter, on_delete=models.CASCADE, related_name='scores')
    
    # Validador para incrementos de 0.5
    score_validator = RegexValidator(
        regex=r'^([0-9]|10)(\.0|\.5)?$',
        message="La puntuación debe estar entre 0.0 y 10.0 en incrementos de 0.5"
    )
    
    score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        validators=[
            MinValueValidator(Decimal('0.0')),
            MaxValueValidator(Decimal('10.0'))
        ],
        help_text="Puntuación otorgada (0.0 - 10.0 en incrementos de 0.5)"
    )
    
    # Justificación obligatoria para puntuaciones extremas
    justification = models.TextField(
        blank=True,
        help_text="Justificación obligatoria para puntuaciones ≤3.0 o ≥8.5"
    )
    
    # Metadatos de auditoría
    scored_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    scored_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='scores_given')
    
    # Campos para revisión
    is_reviewed = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='scores_reviewed'
    )
    
    class Meta:
        db_table = 'scoring_score_entries'
        unique_together = ['participant', 'judge_position', 'evaluation_parameter']
        ordering = ['participant', 'evaluation_parameter__order', 'evaluation_parameter__exercise_number']
        verbose_name = 'Calificación'
        verbose_name_plural = 'Calificaciones'

    def __str__(self):
        return f"{self.participant} - {self.evaluation_parameter.exercise_name}: {self.score}"

    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Validar incrementos de 0.5
        if self.score is not None:
            score_float = float(self.score)
            if score_float * 2 != int(score_float * 2):
                raise ValidationError("La puntuación debe estar en incrementos de 0.5")
        
        # Validar justificación para puntuaciones extremas
        if self.score is not None and not self.justification:
            if self.score <= Decimal('3.0') or self.score >= Decimal('8.5'):
                raise ValidationError(
                    "Se requiere justificación para puntuaciones ≤3.0 o ≥8.5"
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def weighted_score(self):
        """Calcula la puntuación ponderada (score * coefficient)"""
        return self.score * self.evaluation_parameter.coefficient

    @property
    def is_extreme_score(self):
        """Verifica si la puntuación requiere justificación"""
        return self.score <= Decimal('3.0') or self.score >= Decimal('8.5')


class JudgeEvaluation(models.Model):
    """
    Representa la evaluación completa de un juez para un participante
    Calcula automáticamente totales y porcentajes FEI
    """
    STATUS_CHOICES = [
        ('draft', 'Borrador'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('reviewed', 'Revisada'),
        ('finalized', 'Finalizada'),
    ]
    
    participant = models.ForeignKey(Registration, on_delete=models.CASCADE, related_name='evaluations')
    judge_position = models.ForeignKey(JudgePosition, on_delete=models.CASCADE, related_name='evaluations')
    
    # Campos calculados automáticamente
    total_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Suma total de puntuaciones ponderadas"
    )
    total_possible = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Puntuación máxima posible"
    )
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Porcentaje FEI calculado"
    )
    
    # Estado y metadatos
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Notas generales del juez
    general_comments = models.TextField(
        blank=True,
        help_text="Comentarios generales sobre la actuación"
    )
    
    class Meta:
        db_table = 'scoring_judge_evaluations'
        unique_together = ['participant', 'judge_position']
        ordering = ['-completed_at', '-updated_at']
        verbose_name = 'Evaluación de Juez'
        verbose_name_plural = 'Evaluaciones de Jueces'

    def __str__(self):
        return f"{self.judge_position.judge.get_full_name()} - {self.participant} ({self.percentage}%)"

    def calculate_totals(self):
        """
        Calcula los totales basándose en las calificaciones individuales
        Implementa la fórmula FEI exacta
        """
        from django.db.models import Sum, F
        
        # Obtener todas las calificaciones para esta evaluación
        scores = self.participant.scores.filter(judge_position=self.judge_position)
        
        # Calcular total ponderado
        total_weighted = scores.aggregate(
            total=Sum(F('score') * F('evaluation_parameter__coefficient'))
        )['total'] or Decimal('0.00')
        
        # Calcular total posible
        total_possible = self.judge_position.competition.category.evaluation_parameters.aggregate(
            total=Sum(F('max_score') * F('coefficient'))
        )['total'] or Decimal('340.00')  # Fallback basado en hojas Excel
        
        # Calcular porcentaje FEI
        if total_possible > 0:
            percentage = (total_weighted / total_possible) * Decimal('100.00')
        else:
            percentage = Decimal('0.00')
        
        # Actualizar campos
        self.total_score = total_weighted
        self.total_possible = total_possible
        self.percentage = percentage
        
        return {
            'total_score': self.total_score,
            'total_possible': self.total_possible,
            'percentage': self.percentage
        }

    def is_complete(self):
        """Verifica si todas las calificaciones han sido ingresadas"""
        required_parameters = self.judge_position.competition.category.evaluation_parameters.count()
        completed_scores = self.participant.scores.filter(judge_position=self.judge_position).count()
        return required_parameters == completed_scores

    def get_progress_percentage(self):
        """Calcula el porcentaje de progreso de la evaluación"""
        if not hasattr(self, '_progress_cache'):
            required_parameters = self.judge_position.competition.category.evaluation_parameters.count()
            if required_parameters == 0:
                self._progress_cache = 0
            else:
                completed_scores = self.participant.scores.filter(judge_position=self.judge_position).count()
                self._progress_cache = int((completed_scores / required_parameters) * 100)
        return self._progress_cache


class ScoreAuditLog(models.Model):
    """
    Registro de auditoría para todas las modificaciones de calificaciones
    Cumple con requisitos de transparencia FEI
    """
    ACTION_CHOICES = [
        ('create', 'Creación'),
        ('update', 'Actualización'),
        ('delete', 'Eliminación'),
        ('review', 'Revisión'),
        ('finalize', 'Finalización'),
    ]
    
    score_entry = models.ForeignKey(ScoreEntry, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    
    # Valores antes y después del cambio
    old_score = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    new_score = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    old_justification = models.TextField(blank=True)
    new_justification = models.TextField(blank=True)
    
    # Metadatos de auditoría
    changed_by = models.ForeignKey(User, on_delete=models.PROTECT)
    changed_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(help_text="Razón del cambio")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'scoring_audit_logs'
        ordering = ['-changed_at']
        verbose_name = 'Log de Auditoría'
        verbose_name_plural = 'Logs de Auditoría'

    def __str__(self):
        return f"{self.action} - {self.score_entry} por {self.changed_by.get_full_name()}"