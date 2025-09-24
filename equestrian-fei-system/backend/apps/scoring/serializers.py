from rest_framework import serializers
from .models import (
    ScoringCriteria, ScoreCard, IndividualScore, JumpingFault,
    DressageMovement, EventingPhase, CompetitionRanking, RankingEntry
)
from apps.competitions.models import Competition, Participant
from apps.users.models import User


class ScoringCriteriaSerializer(serializers.ModelSerializer):
    discipline_name = serializers.CharField(source='discipline.name', read_only=True)
    discipline_code = serializers.CharField(source='discipline.code', read_only=True)
    
    class Meta:
        model = ScoringCriteria
        fields = [
            'id', 'discipline', 'discipline_name', 'discipline_code',
            'name', 'code', 'criteria_type', 'min_score', 'max_score',
            'weight', 'is_required', 'description', 'order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class IndividualScoreSerializer(serializers.ModelSerializer):
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)
    criteria_code = serializers.CharField(source='criteria.code', read_only=True)
    judge_name = serializers.CharField(source='judge.get_full_name', read_only=True)
    
    class Meta:
        model = IndividualScore
        fields = [
            'id', 'scorecard', 'criteria', 'criteria_name', 'criteria_code',
            'judge', 'judge_name', 'raw_score', 'weighted_score',
            'notes', 'is_final', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'weighted_score', 'created_at', 'updated_at']
    
    def validate_raw_score(self):
        """Validar que la puntuación esté dentro del rango permitido"""
        score = self.validated_data['raw_score']
        criteria = self.validated_data['criteria']
        
        if score < criteria.min_score or score > criteria.max_score:
            raise serializers.ValidationError(
                f"La puntuación debe estar entre {criteria.min_score} y {criteria.max_score}"
            )
        
        return score


class JumpingFaultSerializer(serializers.ModelSerializer):
    class Meta:
        model = JumpingFault
        fields = [
            'id', 'scorecard', 'obstacle_number', 'fault_type',
            'penalty_points', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DressageMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = DressageMovement
        fields = [
            'id', 'scorecard', 'movement_number', 'movement_name',
            'movement_description', 'score', 'coefficient',
            'weighted_score', 'judge_notes', 'created_at'
        ]
        read_only_fields = ['id', 'weighted_score', 'created_at']


class EventingPhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventingPhase
        fields = [
            'id', 'scorecard', 'phase_type', 'phase_name',
            'time_allowed', 'time_taken', 'time_penalties',
            'jumping_penalties', 'cross_country_penalties',
            'dressage_score', 'total_penalties', 'phase_score',
            'is_eliminated', 'elimination_reason', 'created_at'
        ]
        read_only_fields = ['id', 'total_penalties', 'phase_score', 'created_at']


class ScoreCardDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para scorecard con todas las puntuaciones"""
    participant_name = serializers.CharField(source='participant.user.get_full_name', read_only=True)
    participant_number = serializers.CharField(source='participant.competitor_number', read_only=True)
    horse_name = serializers.CharField(source='participant.horse.name', read_only=True)
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    discipline_name = serializers.CharField(source='competition.disciplines.first.name', read_only=True)
    
    # Puntuaciones individuales
    individual_scores = IndividualScoreSerializer(many=True, read_only=True)
    jumping_faults = JumpingFaultSerializer(many=True, read_only=True)
    dressage_movements = DressageMovementSerializer(many=True, read_only=True)
    eventing_phases = EventingPhaseSerializer(many=True, read_only=True)
    
    class Meta:
        model = ScoreCard
        fields = [
            'id', 'competition', 'competition_name', 'participant',
            'participant_name', 'participant_number', 'horse_name',
            'discipline_name', 'judge', 'status', 'start_time',
            'finish_time', 'raw_score', 'penalties', 'bonus_points',
            'final_score', 'position', 'notes', 'is_disqualified',
            'disqualification_reason', 'technical_score', 'artistic_score',
            'time_score', 'individual_scores', 'jumping_faults',
            'dressage_movements', 'eventing_phases', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'raw_score', 'final_score', 'position', 'technical_score',
            'artistic_score', 'time_score', 'created_at', 'updated_at'
        ]


class ScoreCardListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de scorecards"""
    participant_name = serializers.CharField(source='participant.user.get_full_name', read_only=True)
    participant_number = serializers.CharField(source='participant.competitor_number', read_only=True)
    horse_name = serializers.CharField(source='participant.horse.name', read_only=True)
    judge_name = serializers.CharField(source='judge.get_full_name', read_only=True)
    
    class Meta:
        model = ScoreCard
        fields = [
            'id', 'participant_name', 'participant_number', 'horse_name',
            'judge_name', 'status', 'final_score', 'position',
            'start_time', 'finish_time', 'is_disqualified'
        ]


class RankingEntrySerializer(serializers.ModelSerializer):
    participant_name = serializers.CharField(source='participant.user.get_full_name', read_only=True)
    participant_number = serializers.CharField(source='participant.competitor_number', read_only=True)
    horse_name = serializers.CharField(source='participant.horse.name', read_only=True)
    country = serializers.CharField(source='participant.user.country', read_only=True)
    
    class Meta:
        model = RankingEntry
        fields = [
            'id', 'ranking', 'participant', 'participant_name',
            'participant_number', 'horse_name', 'country',
            'position', 'final_score', 'technical_score',
            'artistic_score', 'time_score', 'penalty_points',
            'is_tied', 'tie_break_info'
        ]
        read_only_fields = ['id']


class CompetitionRankingSerializer(serializers.ModelSerializer):
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    discipline_name = serializers.CharField(source='discipline.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    entries = RankingEntrySerializer(many=True, read_only=True)
    
    class Meta:
        model = CompetitionRanking
        fields = [
            'id', 'competition', 'competition_name', 'discipline',
            'discipline_name', 'category', 'category_name',
            'ranking_type', 'is_final', 'is_published',
            'total_participants', 'calculation_method',
            'last_updated', 'entries', 'created_at'
        ]
        read_only_fields = ['id', 'total_participants', 'last_updated', 'created_at']


class ScoreCardCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear nuevos scorecards"""
    
    class Meta:
        model = ScoreCard
        fields = [
            'competition', 'participant', 'judge', 'status',
            'notes'
        ]
    
    def validate(self, data):
        """Validar que no exista ya un scorecard para este participante y juez"""
        competition = data['competition']
        participant = data['participant']
        judge = data.get('judge')
        
        # Verificar que el participante esté inscrito en la competencia
        if participant.competition != competition:
            raise serializers.ValidationError(
                "El participante no está inscrito en esta competencia"
            )
        
        # Verificar que no exista ya un scorecard
        existing = ScoreCard.objects.filter(
            competition=competition,
            participant=participant,
            judge=judge
        ).first()
        
        if existing:
            raise serializers.ValidationError(
                "Ya existe un scorecard para este participante y juez"
            )
        
        return data


class CompetitionScoresSummarySerializer(serializers.Serializer):
    """Serializer para resumen de puntuaciones de una competencia"""
    competition_id = serializers.UUIDField()
    competition_name = serializers.CharField()
    total_participants = serializers.IntegerField()
    completed_evaluations = serializers.IntegerField()
    pending_evaluations = serializers.IntegerField()
    average_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    highest_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    lowest_score = serializers.DecimalField(max_digits=6, decimal_places=2)
    rankings_published = serializers.BooleanField()
    last_updated = serializers.DateTimeField()


class JudgeScoresSummarySerializer(serializers.Serializer):
    """Serializer para resumen de puntuaciones de un juez"""
    judge_id = serializers.UUIDField()
    judge_name = serializers.CharField()
    total_evaluations = serializers.IntegerField()
    completed_evaluations = serializers.IntegerField()
    pending_evaluations = serializers.IntegerField()
    average_score_given = serializers.DecimalField(max_digits=6, decimal_places=2)
    competitions_judged = serializers.IntegerField()
    last_evaluation = serializers.DateTimeField()