from rest_framework import serializers
from .models import (
    RankingSnapshot, RankingEntry, RankingCalculation,
    LiveRankingUpdate, RankingConfiguration
)
from apps.competitions.serializers import ParticipantSerializer


class RankingEntrySerializer(serializers.ModelSerializer):
    """Serializer para entradas de ranking"""
    
    participant = ParticipantSerializer(read_only=True)
    participant_name = serializers.CharField(source='participant.rider.name', read_only=True)
    horse_name = serializers.CharField(source='participant.horse.name', read_only=True)
    position_change_indicator = serializers.SerializerMethodField()
    
    class Meta:
        model = RankingEntry
        fields = [
            'id', 'participant', 'participant_name', 'horse_name',
            'position', 'previous_position', 'position_change',
            'position_change_indicator',
            'total_score', 'percentage_score', 'judge_scores',
            'evaluations_completed', 'evaluations_total',
            'is_tied', 'tied_with'
        ]
    
    def get_position_change_indicator(self, obj):
        """Indicador visual de cambio de posición"""
        if obj.position_change == 0:
            return 'stable'
        elif obj.position_change > 0:
            return 'up'
        else:
            return 'down'


class RankingSnapshotSerializer(serializers.ModelSerializer):
    """Serializer para snapshots de ranking"""
    
    entries = RankingEntrySerializer(many=True, read_only=True)
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = RankingSnapshot
        fields = [
            'id', 'competition', 'category', 'competition_name', 'category_name',
            'timestamp', 'total_participants', 'completed_evaluations',
            'progress_percentage', 'is_current', 'is_final', 'entries'
        ]


class RankingCalculationSerializer(serializers.ModelSerializer):
    """Serializer para cálculos de ranking"""
    
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    triggered_by_name = serializers.CharField(source='triggered_by.username', read_only=True)
    
    class Meta:
        model = RankingCalculation
        fields = [
            'id', 'competition', 'category', 'competition_name', 'category_name',
            'triggered_by', 'triggered_by_name', 'calculation_start',
            'calculation_end', 'duration_ms', 'success', 'error_message',
            'participants_processed', 'evaluations_processed', 'position_changes'
        ]


class LiveRankingUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizaciones en tiempo real"""
    
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = LiveRankingUpdate
        fields = [
            'id', 'competition', 'category', 'competition_name', 'category_name',
            'timestamp', 'update_type', 'affected_participants', 'change_data',
            'broadcasted', 'broadcast_timestamp'
        ]


class RankingConfigurationSerializer(serializers.ModelSerializer):
    """Serializer para configuración de rankings"""
    
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = RankingConfiguration
        fields = [
            'id', 'competition', 'category', 'competition_name', 'category_name',
            'auto_calculate', 'calculation_interval', 'tie_break_method',
            'broadcast_enabled', 'broadcast_interval', 'show_percentages',
            'show_judge_breakdown', 'show_position_changes'
        ]
        
    def validate_calculation_interval(self, value):
        """Validar intervalo de cálculo"""
        if value < 10:
            raise serializers.ValidationError("El intervalo mínimo es 10 segundos")
        if value > 300:
            raise serializers.ValidationError("El intervalo máximo es 300 segundos")
        return value
    
    def validate_broadcast_interval(self, value):
        """Validar intervalo de broadcast"""
        if value < 1:
            raise serializers.ValidationError("El intervalo mínimo es 1 segundo")
        if value > 60:
            raise serializers.ValidationError("El intervalo máximo es 60 segundos")
        return value


class RankingDisplaySerializer(serializers.ModelSerializer):
    """Serializer optimizado para pantallas públicas"""
    
    entries = serializers.SerializerMethodField()
    competition_info = serializers.SerializerMethodField()
    
    class Meta:
        model = RankingSnapshot
        fields = [
            'id', 'timestamp', 'competition_info', 'progress_percentage',
            'is_final', 'entries'
        ]
    
    def get_entries(self, obj):
        """Obtener entradas optimizadas para display"""
        # Limitar a top 20 para pantallas públicas
        entries = obj.entries.all()[:20]
        
        return [
            {
                'position': entry.position,
                'rider_name': entry.participant.rider.name,
                'horse_name': entry.participant.horse.name,
                'score': float(entry.total_score),
                'percentage': float(entry.percentage_score),
                'position_change': entry.position_change,
                'is_tied': entry.is_tied
            }
            for entry in entries
        ]
    
    def get_competition_info(self, obj):
        """Información básica de la competencia"""
        return {
            'name': obj.competition.name,
            'category': obj.category.name,
            'date': obj.competition.start_date,
            'location': obj.competition.location
        }


class RankingStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de ranking"""
    
    total_participants = serializers.IntegerField()
    completed_evaluations = serializers.IntegerField()
    pending_evaluations = serializers.IntegerField()
    progress_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    # Estadísticas por juez
    judge_progress = serializers.ListField(
        child=serializers.DictField()
    )
    
    # Últimas actualizaciones
    recent_updates = serializers.ListField(
        child=serializers.DictField()
    )
    
    # Tiempo promedio de evaluación
    avg_evaluation_time = serializers.IntegerField()
    
    # Proyección de finalización
    estimated_completion = serializers.DateTimeField()


class RankingComparisonSerializer(serializers.Serializer):
    """Serializer para comparación de rankings"""
    
    participant_id = serializers.UUIDField()
    participant_name = serializers.CharField()
    horse_name = serializers.CharField()
    
    # Posiciones en diferentes snapshots
    positions = serializers.ListField(
        child=serializers.DictField()
    )
    
    # Tendencia
    trend = serializers.CharField()  # 'improving', 'declining', 'stable'
    
    # Cambio total
    total_change = serializers.IntegerField()
    
    # Mejor posición alcanzada
    best_position = serializers.IntegerField()
    
    # Peor posición alcanzada
    worst_position = serializers.IntegerField()


class RankingExportSerializer(serializers.Serializer):
    """Serializer para exportación de rankings"""
    
    format = serializers.ChoiceField(
        choices=['pdf', 'excel', 'csv'],
        default='pdf'
    )
    
    include_details = serializers.BooleanField(default=True)
    include_judge_breakdown = serializers.BooleanField(default=True)
    include_history = serializers.BooleanField(default=False)
    
    # Filtros
    top_n = serializers.IntegerField(required=False)
    category_filter = serializers.UUIDField(required=False)
    
    def validate_top_n(self, value):
        """Validar límite de participantes"""
        if value and (value < 1 or value > 100):
            raise serializers.ValidationError("El límite debe estar entre 1 y 100")
        return value