from rest_framework import serializers
from decimal import Decimal
from .models import (
    EvaluationParameter,
    ScoreEntry,
    JudgeEvaluation,
    JudgePosition,
    ScoreAuditLog
)
from apps.competitions.serializers import ParticipantSerializer
from apps.users.serializers import JudgeSerializer


class EvaluationParameterSerializer(serializers.ModelSerializer):
    """
    Serializer para parámetros de evaluación FEI
    """
    weighted_max_score = serializers.ReadOnlyField()
    
    class Meta:
        model = EvaluationParameter
        fields = [
            'id',
            'exercise_number',
            'exercise_name',
            'coefficient',
            'max_score',
            'weighted_max_score',
            'is_collective_mark',
            'order',
            'description'
        ]


class JudgePositionSerializer(serializers.ModelSerializer):
    """
    Serializer para posiciones de jueces
    """
    judge_name = serializers.CharField(source='judge.get_full_name', read_only=True)
    judge_license = serializers.CharField(source='judge.fei_license', read_only=True)
    
    class Meta:
        model = JudgePosition
        fields = [
            'id',
            'judge',
            'judge_name',
            'judge_license',
            'position',
            'is_active'
        ]


class ScoreEntrySerializer(serializers.ModelSerializer):
    """
    Serializer completo para calificaciones FEI
    """
    evaluation_parameter = EvaluationParameterSerializer(read_only=True)
    judge_position = JudgePositionSerializer(read_only=True)
    weighted_score = serializers.ReadOnlyField()
    is_extreme_score = serializers.ReadOnlyField()
    scored_by_name = serializers.CharField(source='scored_by.get_full_name', read_only=True)
    
    # Información del participante
    participant_number = serializers.IntegerField(source='participant.number', read_only=True)
    rider_name = serializers.SerializerMethodField()
    horse_name = serializers.CharField(source='participant.horse.name', read_only=True)
    
    class Meta:
        model = ScoreEntry
        fields = [
            'id',
            'participant',
            'participant_number',
            'rider_name',
            'horse_name',
            'judge_position',
            'evaluation_parameter',
            'score',
            'weighted_score',
            'justification',
            'is_extreme_score',
            'scored_at',
            'updated_at',
            'scored_by',
            'scored_by_name',
            'is_reviewed',
            'reviewed_at',
            'reviewed_by'
        ]
    
    def get_rider_name(self, obj):
        return f"{obj.participant.rider.first_name} {obj.participant.rider.last_name}"


class ScoreEntryCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear/actualizar calificaciones
    Incluye validaciones específicas FEI
    """
    
    class Meta:
        model = ScoreEntry
        fields = [
            'participant',
            'judge_position',
            'evaluation_parameter',
            'score',
            'justification'
        ]
    
    def validate_score(self, value):
        """Validar puntuación según estándares FEI"""
        if value < Decimal('0.0') or value > Decimal('10.0'):
            raise serializers.ValidationError(
                "La puntuación debe estar entre 0.0 y 10.0"
            )
        
        # Verificar incrementos de 0.5
        score_doubled = value * 2
        if score_doubled != score_doubled.quantize(Decimal('1')):
            raise serializers.ValidationError(
                "La puntuación debe estar en incrementos de 0.5"
            )
        
        return value
    
    def validate(self, data):
        """Validaciones cruzadas"""
        score = data.get('score')
        justification = data.get('justification', '')
        
        # Verificar justificación para puntuaciones extremas
        if score is not None:
            if (score <= Decimal('3.0') or score >= Decimal('8.5')) and not justification.strip():
                raise serializers.ValidationError(
                    "Se requiere justificación para puntuaciones ≤3.0 o ≥8.5"
                )
        
        # Verificar que el participante pertenezca a la competencia del juez
        participant = data.get('participant')
        judge_position = data.get('judge_position')
        
        if participant and judge_position:
            if participant.competition != judge_position.competition:
                raise serializers.ValidationError(
                    "El participante debe pertenecer a la misma competencia que el juez"
                )
        
        return data


class ScoreAuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer para logs de auditoría
    """
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = ScoreAuditLog
        fields = [
            'id',
            'action',
            'old_score',
            'new_score',
            'old_justification',
            'new_justification',
            'changed_by',
            'changed_by_name',
            'changed_at',
            'reason',
            'ip_address'
        ]


class JudgeEvaluationSerializer(serializers.ModelSerializer):
    """
    Serializer para evaluaciones completas de jueces
    """
    participant = ParticipantSerializer(read_only=True)
    judge_position = JudgePositionSerializer(read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    is_complete = serializers.SerializerMethodField()
    
    class Meta:
        model = JudgeEvaluation
        fields = [
            'id',
            'participant',
            'judge_position',
            'total_score',
            'total_possible',
            'percentage',
            'status',
            'progress_percentage',
            'is_complete',
            'started_at',
            'completed_at',
            'updated_at',
            'general_comments'
        ]
    
    def get_progress_percentage(self, obj):
        return obj.get_progress_percentage()
    
    def get_is_complete(self, obj):
        return obj.is_complete()


class ScoringSummarySerializer(serializers.Serializer):
    """
    Serializer para resúmenes de puntuación
    """
    participant_id = serializers.IntegerField()
    participant_number = serializers.IntegerField()
    rider_name = serializers.CharField()
    horse_name = serializers.CharField()
    category_name = serializers.CharField()
    
    total_weighted_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    total_possible_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    judges_count = serializers.IntegerField()
    complete_evaluations = serializers.IntegerField()
    is_complete = serializers.BooleanField()
    
    position = serializers.IntegerField(required=False)


class RankingSerializer(serializers.Serializer):
    """
    Serializer para rankings de competencia
    """
    position = serializers.IntegerField()
    participant = ParticipantSerializer()
    rider_name = serializers.CharField()
    horse_name = serializers.CharField()
    category = serializers.CharField()
    number = serializers.IntegerField()
    
    average_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    judges_count = serializers.IntegerField()
    complete_evaluations = serializers.IntegerField()
    is_complete = serializers.BooleanField()
    
    judges_breakdown = serializers.ListField(
        child=serializers.DictField(),
        read_only=True
    )


class ScorecardSerializer(serializers.Serializer):
    """
    Serializer para tarjetas de puntuación de jueces
    """
    parameter = EvaluationParameterSerializer()
    score_entry = ScoreEntrySerializer(allow_null=True)
    weighted_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    is_scored = serializers.BooleanField()


class JudgeScorecardResponseSerializer(serializers.Serializer):
    """
    Serializer para respuesta completa de tarjeta de puntuación
    """
    participant = serializers.DictField()
    judge = serializers.DictField()
    scorecard = ScorecardSerializer(many=True)
    totals = serializers.DictField()


class CompetitionStatisticsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de competencia
    """
    participants_count = serializers.IntegerField()
    judges_count = serializers.IntegerField()
    total_scores_entered = serializers.IntegerField()
    expected_total_scores = serializers.IntegerField()
    completion_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_score = serializers.DecimalField(max_digits=3, decimal_places=2)
    minimum_score = serializers.DecimalField(max_digits=3, decimal_places=1)
    maximum_score = serializers.DecimalField(max_digits=3, decimal_places=1)


class JudgeProgressSerializer(serializers.Serializer):
    """
    Serializer para progreso de jueces
    """
    judge_name = serializers.CharField()
    judge_position = serializers.CharField()
    completed_evaluations = serializers.IntegerField()
    total_evaluations = serializers.IntegerField()
    completion_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class CompetitionProgressSerializer(serializers.Serializer):
    """
    Serializer para progreso general de competencia
    """
    competition = serializers.DictField()
    statistics = CompetitionStatisticsSerializer()
    judges_progress = JudgeProgressSerializer(many=True)


class AnomalySerializer(serializers.Serializer):
    """
    Serializer para anomalías detectadas
    """
    type = serializers.CharField()
    participant = ParticipantSerializer()
    exercise_number = serializers.IntegerField()
    scores = serializers.ListField(child=serializers.DictField())
    range = serializers.DecimalField(max_digits=3, decimal_places=1)
    description = serializers.CharField()


class BulkScoreUpdateSerializer(serializers.Serializer):
    """
    Serializer para actualización masiva de puntuaciones
    """
    participant_id = serializers.IntegerField()
    judge_position_id = serializers.IntegerField()
    evaluation_parameter_id = serializers.IntegerField()
    score = serializers.DecimalField(max_digits=3, decimal_places=1)
    justification = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate_score(self, value):
        """Validar puntuación según estándares FEI"""
        if value < Decimal('0.0') or value > Decimal('10.0'):
            raise serializers.ValidationError(
                "La puntuación debe estar entre 0.0 y 10.0"
            )
        
        # Verificar incrementos de 0.5
        score_doubled = value * 2
        if score_doubled != score_doubled.quantize(Decimal('1')):
            raise serializers.ValidationError(
                "La puntuación debe estar en incrementos de 0.5"
            )
        
        return value


class ScoreValidationResponseSerializer(serializers.Serializer):
    """
    Serializer para respuestas de validación de puntuaciones
    """
    is_valid = serializers.BooleanField()
    errors = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    weighted_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    is_extreme = serializers.BooleanField()