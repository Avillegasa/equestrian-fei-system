from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    LiveRanking,
    LiveRankingEntry,
    RankingSnapshot,
    RankingRule,
    TeamRanking
)
from apps.competitions.serializers import CompetitionSerializer, CategorySerializer, ParticipantSerializer

User = get_user_model()


class LiveRankingSerializer(serializers.ModelSerializer):
    """Serializer para rankings en vivo"""
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    total_participants = serializers.SerializerMethodField()
    active_participants = serializers.SerializerMethodField()

    class Meta:
        model = LiveRanking
        fields = [
            'id', 'competition', 'category', 'name', 'ranking_type', 'status',
            'calculation_method', 'update_frequency', 'round_number',
            'last_updated', 'next_update', 'is_live', 'is_public', 'auto_publish',
            'description', 'created_at', 'updated_at',
            # Read-only fields
            'competition_name', 'category_name', 'total_participants', 'active_participants'
        ]
        read_only_fields = ['last_updated', 'created_at', 'updated_at']

    def get_total_participants(self, obj):
        """Obtener total de participantes en este ranking"""
        return obj.entries.count()

    def get_active_participants(self, obj):
        """Obtener participantes activos"""
        return obj.entries.filter(is_active=True, is_eliminated=False).count()


class LiveRankingEntrySerializer(serializers.ModelSerializer):
    """Serializer para entradas de ranking en vivo"""
    participant_name = serializers.CharField(source='participant.rider_name', read_only=True)
    participant_number = serializers.CharField(source='participant.number', read_only=True)
    horse_name = serializers.CharField(source='participant.horse_name', read_only=True)
    country = serializers.CharField(source='participant.country', read_only=True)
    position_trend = serializers.SerializerMethodField()
    score_change = serializers.SerializerMethodField()

    class Meta:
        model = LiveRankingEntry
        fields = [
            'id', 'ranking', 'participant', 'position', 'previous_position', 'position_change',
            'current_score', 'previous_score', 'total_penalties', 'rounds_completed',
            'best_score', 'average_score', 'technical_score', 'artistic_score', 'time_score',
            'is_active', 'is_eliminated', 'elimination_reason', 'consistency_score',
            'improvement_trend', 'last_score_update', 'created_at', 'updated_at',
            # Read-only fields
            'participant_name', 'participant_number', 'horse_name', 'country',
            'position_trend', 'score_change'
        ]
        read_only_fields = ['last_score_update', 'created_at', 'updated_at']

    def get_position_trend(self, obj):
        """Obtener tendencia de posición"""
        return obj.get_position_trend()

    def get_score_change(self, obj):
        """Calcular cambio en la puntuación"""
        if obj.previous_score:
            return float(obj.current_score - obj.previous_score)
        return 0.0


class LiveRankingDetailSerializer(LiveRankingSerializer):
    """Serializer detallado para ranking en vivo con entradas"""
    entries = LiveRankingEntrySerializer(many=True, read_only=True)
    competition = CompetitionSerializer(read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta(LiveRankingSerializer.Meta):
        fields = LiveRankingSerializer.Meta.fields + ['entries']


class RankingSnapshotSerializer(serializers.ModelSerializer):
    """Serializer para instantáneas de ranking"""
    ranking_name = serializers.CharField(source='live_ranking.name', read_only=True)
    competition_name = serializers.CharField(source='live_ranking.competition.name', read_only=True)

    class Meta:
        model = RankingSnapshot
        fields = [
            'id', 'live_ranking', 'snapshot_time', 'round_number', 'event_trigger',
            'total_participants', 'active_participants', 'completed_rounds', 'notes',
            # Read-only fields
            'ranking_name', 'competition_name'
        ]
        read_only_fields = ['snapshot_time']


class RankingRuleSerializer(serializers.ModelSerializer):
    """Serializer para reglas de ranking"""
    competition_name = serializers.CharField(source='competition.name', read_only=True)

    class Meta:
        model = RankingRule
        fields = [
            'id', 'competition', 'name', 'rule_type', 'description',
            'field_name', 'operator', 'threshold_value', 'action', 'priority',
            'is_active', 'created_at', 'updated_at',
            # Read-only fields
            'competition_name'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TeamRankingSerializer(serializers.ModelSerializer):
    """Serializer para rankings por equipos"""
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    team_members = serializers.SerializerMethodField()

    class Meta:
        model = TeamRanking
        fields = [
            'id', 'competition', 'team_name', 'team_code', 'country_code',
            'position', 'total_score', 'average_score', 'members_count',
            'qualified_members', 'best_individual_score', 'is_qualified',
            'created_at', 'updated_at',
            # Read-only fields
            'competition_name', 'team_members'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_team_members(self, obj):
        """Obtener miembros del equipo"""
        team_participants = obj.competition.participants.filter(
            team_name=obj.team_name
        ).select_related('user')

        return [{
            'id': str(participant.id),
            'rider_name': participant.rider_name,
            'horse_name': participant.horse_name,
            'number': participant.number,
            'best_score': participant.score_cards.filter(
                status__in=['completed', 'validated', 'published']
            ).aggregate(best=serializers.models.Max('final_score'))['best'] or 0
        } for participant in team_participants]


class RankingStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de ranking"""
    total_competitions = serializers.IntegerField()
    active_rankings = serializers.IntegerField()
    total_participants = serializers.IntegerField()
    completed_rounds = serializers.IntegerField()
    average_score = serializers.DecimalField(max_digits=8, decimal_places=3)
    highest_score = serializers.DecimalField(max_digits=8, decimal_places=3)
    lowest_score = serializers.DecimalField(max_digits=8, decimal_places=3)
    score_distribution = serializers.DictField()
    recent_updates = serializers.ListField()


class QuickRankingSerializer(serializers.ModelSerializer):
    """Serializer ligero para vista rápida de rankings"""
    participant_name = serializers.CharField(source='participant.rider_name', read_only=True)
    horse_name = serializers.CharField(source='participant.horse_name', read_only=True)

    class Meta:
        model = LiveRankingEntry
        fields = [
            'position', 'participant_name', 'horse_name', 'current_score',
            'position_change', 'is_eliminated'
        ]


class CompetitionRankingOverviewSerializer(serializers.Serializer):
    """Serializer para vista general de rankings de una competencia"""
    competition_id = serializers.UUIDField()
    competition_name = serializers.CharField()
    total_rankings = serializers.IntegerField()
    active_rankings = serializers.IntegerField()
    total_participants = serializers.IntegerField()
    categories = serializers.ListField()
    last_update = serializers.DateTimeField()
    rankings = LiveRankingSerializer(many=True)


class ParticipantRankingHistorySerializer(serializers.Serializer):
    """Serializer para historial de ranking de un participante"""
    participant_id = serializers.UUIDField()
    participant_name = serializers.CharField()
    horse_name = serializers.CharField()
    position_history = serializers.ListField()
    score_history = serializers.ListField()
    best_position = serializers.IntegerField()
    current_position = serializers.IntegerField()
    total_competitions = serializers.IntegerField()
    win_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class RankingUpdateSerializer(serializers.Serializer):
    """Serializer para actualizaciones de ranking via WebSocket"""
    ranking_id = serializers.UUIDField()
    update_type = serializers.CharField()
    timestamp = serializers.DateTimeField()
    data = serializers.DictField()
    affected_positions = serializers.ListField()


class BulkRankingUpdateSerializer(serializers.Serializer):
    """Serializer para actualizaciones masivas de rankings"""
    competition_id = serializers.UUIDField()
    round_number = serializers.IntegerField()
    force_update = serializers.BooleanField(default=False)
    category_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True
    )


class RankingExportSerializer(serializers.Serializer):
    """Serializer para exportar datos de ranking"""
    ranking_id = serializers.UUIDField()
    format = serializers.ChoiceField(choices=['pdf', 'excel', 'csv', 'json'])
    include_history = serializers.BooleanField(default=False)
    include_stats = serializers.BooleanField(default=True)
    round_number = serializers.IntegerField(required=False)