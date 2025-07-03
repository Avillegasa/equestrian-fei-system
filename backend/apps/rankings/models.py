from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
import uuid
from django.utils import timezone

class RankingSnapshot(models.Model):
    """Instantánea de ranking en un momento específico"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE)
    category = models.ForeignKey('competitions.Category', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Metadata del snapshot
    total_participants = models.IntegerField()
    completed_evaluations = models.IntegerField()
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Estado del ranking
    is_current = models.BooleanField(default=True)
    is_final = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'ranking_snapshots'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['competition', 'category', 'is_current']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"Ranking {self.competition.name} - {self.category.name} ({self.timestamp})"


class RankingEntry(models.Model):
    """Entrada individual en un ranking"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    snapshot = models.ForeignKey(RankingSnapshot, on_delete=models.CASCADE, related_name='entries')
    participant = models.ForeignKey('competitions.Participant', on_delete=models.CASCADE)
    
    # Posición en el ranking
    position = models.IntegerField()
    previous_position = models.IntegerField(null=True, blank=True)
    position_change = models.IntegerField(default=0)  # +/- cambio desde último ranking
    
    # Puntuaciones
    total_score = models.DecimalField(max_digits=10, decimal_places=3)
    percentage_score = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Desglose por juez
    judge_scores = models.JSONField(default=dict)  # {"judge_id": {"score": 245.5, "percentage": 72.2}}
    
    # Estadísticas
    evaluations_completed = models.IntegerField(default=0)
    evaluations_total = models.IntegerField(default=0)
    
    # Información de empates
    is_tied = models.BooleanField(default=False)
    tied_with = models.JSONField(default=list)  # IDs de participantes empatados
    
    class Meta:
        db_table = 'ranking_entries'
        ordering = ['position']
        unique_together = ['snapshot', 'participant']
        indexes = [
            models.Index(fields=['snapshot', 'position']),
            models.Index(fields=['participant']),
        ]
    
    def __str__(self):
        return f"#{self.position} - {self.participant.rider.name} ({self.percentage_score}%)"


class RankingCalculation(models.Model):
    """Registro de cálculos de ranking para auditoría"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE)
    category = models.ForeignKey('competitions.Category', on_delete=models.CASCADE)
    triggered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Información del cálculo
    calculation_start = models.DateTimeField(auto_now_add=True)
    calculation_end = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    
    # Resultado
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    
    # Datos del cálculo
    participants_processed = models.IntegerField(default=0)
    evaluations_processed = models.IntegerField(default=0)
    
    # Cambios detectados
    position_changes = models.JSONField(default=list)  # [{"participant_id": "...", "old_pos": 1, "new_pos": 2}]
    
    class Meta:
        db_table = 'ranking_calculations'
        ordering = ['-calculation_start']
        indexes = [
            models.Index(fields=['competition', 'category']),
            models.Index(fields=['calculation_start']),
        ]
    
    def complete_calculation(self, success=True, error_message=""):
        """Marcar cálculo como completado"""
        self.calculation_end = timezone.now()
        self.duration_ms = int((self.calculation_end - self.calculation_start).total_seconds() * 1000)
        self.success = success
        self.error_message = error_message
        self.save()


class LiveRankingUpdate(models.Model):
    """Actualizaciones en tiempo real del ranking"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE)
    category = models.ForeignKey('competitions.Category', on_delete=models.CASCADE)
    
    # Información del cambio
    timestamp = models.DateTimeField(auto_now_add=True)
    update_type = models.CharField(max_length=20, choices=[
        ('POSITION_CHANGE', 'Cambio de posición'),
        ('SCORE_UPDATE', 'Actualización de puntuación'),
        ('NEW_PARTICIPANT', 'Nuevo participante'),
        ('EVALUATION_COMPLETE', 'Evaluación completada'),
    ])
    
    # Datos del cambio
    affected_participants = models.JSONField(default=list)  # IDs de participantes afectados
    change_data = models.JSONField(default=dict)  # Datos específicos del cambio
    
    # Estado de broadcast
    broadcasted = models.BooleanField(default=False)
    broadcast_timestamp = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'live_ranking_updates'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['competition', 'category', 'timestamp']),
            models.Index(fields=['broadcasted']),
        ]
    
    def mark_broadcasted(self):
        """Marcar como enviado a través de WebSocket"""
        self.broadcasted = True
        self.broadcast_timestamp = timezone.now()
        self.save()


class RankingConfiguration(models.Model):
    """Configuración de ranking por competencia/categoría"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE)
    category = models.ForeignKey('competitions.Category', on_delete=models.CASCADE)
    
    # Configuración de cálculo
    auto_calculate = models.BooleanField(default=True)
    calculation_interval = models.IntegerField(default=30)  # segundos
    
    # Configuración de empates
    tie_break_method = models.CharField(max_length=20, choices=[
        ('PERCENTAGE', 'Mayor porcentaje'),
        ('COLLECTIVE_MARKS', 'Notas colectivas'),
        ('TECHNICAL_SCORE', 'Puntuación técnica'),
    ], default='PERCENTAGE')
    
    # Configuración de broadcast
    broadcast_enabled = models.BooleanField(default=True)
    broadcast_interval = models.IntegerField(default=5)  # segundos
    
    # Configuración de visualización
    show_percentages = models.BooleanField(default=True)
    show_judge_breakdown = models.BooleanField(default=True)
    show_position_changes = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'ranking_configurations'
        unique_together = ['competition', 'category']
        indexes = [
            models.Index(fields=['competition', 'category']),
        ]
    
    def __str__(self):
        return f"Config {self.competition.name} - {self.category.name}"