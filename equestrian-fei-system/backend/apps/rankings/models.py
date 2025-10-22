import uuid
from decimal import Decimal
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import F, Sum, Avg, Count, Q


class LiveRanking(models.Model):
    """Rankings en tiempo real para competencias activas"""
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('paused', 'Pausado'),
        ('completed', 'Completado'),
        ('archived', 'Archivado'),
    ]

    RANKING_TYPES = [
        ('overall', 'General'),
        ('category', 'Por Categoría'),
        ('round', 'Por Ronda'),
        ('discipline', 'Por Disciplina'),
        ('team', 'Por Equipo'),
        ('qualification', 'Clasificatorio'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE, related_name='live_rankings')
    category = models.ForeignKey('competitions.Category', on_delete=models.CASCADE, null=True, blank=True, related_name='live_rankings')

    # Configuración del ranking
    name = models.CharField(max_length=200, verbose_name="Nombre del ranking")
    ranking_type = models.CharField(max_length=20, choices=RANKING_TYPES, default='overall', verbose_name="Tipo de ranking")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="Estado")

    # Configuración de cálculo
    calculation_method = models.CharField(max_length=50, default='cumulative', verbose_name="Método de cálculo")
    update_frequency = models.PositiveIntegerField(default=30, verbose_name="Frecuencia de actualización (segundos)")

    # Información temporal
    round_number = models.PositiveIntegerField(default=1, verbose_name="Número de ronda")
    last_updated = models.DateTimeField(auto_now=True, verbose_name="Última actualización")
    next_update = models.DateTimeField(null=True, blank=True, verbose_name="Próxima actualización")

    # Estado de publicación
    is_live = models.BooleanField(default=True, verbose_name="En vivo")
    is_public = models.BooleanField(default=True, verbose_name="Público")
    auto_publish = models.BooleanField(default=True, verbose_name="Auto publicar")

    # Metadata
    description = models.TextField(blank=True, verbose_name="Descripción")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ranking en Vivo"
        verbose_name_plural = "Rankings en Vivo"
        ordering = ['-created_at']
        unique_together = ['competition', 'category', 'ranking_type', 'round_number']

    def __str__(self):
        return f"{self.competition.name} - {self.name}"

    def update_rankings(self):
        """Actualizar todas las posiciones del ranking"""
        from django.db import transaction

        with transaction.atomic():
            # Obtener todos los participantes con sus puntuaciones
            participants = self._get_ranked_participants()

            # Limpiar entradas existentes
            self.entries.all().delete()

            # Crear nuevas entradas
            for position, participant_data in enumerate(participants, 1):
                LiveRankingEntry.objects.create(
                    ranking=self,
                    participant=participant_data['participant'],
                    position=position,
                    current_score=participant_data['total_score'],
                    total_penalties=participant_data.get('total_penalties', 0),
                    rounds_completed=participant_data.get('rounds_completed', 0),
                    best_score=participant_data.get('best_score', 0),
                    average_score=participant_data.get('average_score', 0),
                    technical_score=participant_data.get('technical_score', 0),
                    artistic_score=participant_data.get('artistic_score', 0),
                    time_score=participant_data.get('time_score', 0),
                )

            self.last_updated = timezone.now()
            self.save()

    def _get_ranked_participants(self):
        """Obtener participantes ordenados por puntuación"""
        from apps.competitions.models import Participant
        from apps.scoring.models import ScoreCard

        # Base query para participantes
        participants_query = Participant.objects.filter(competition=self.competition)

        if self.category:
            participants_query = participants_query.filter(category=self.category)

        ranked_participants = []

        for participant in participants_query:
            # Calcular puntuaciones del participante
            score_cards = ScoreCard.objects.filter(
                participant=participant,
                status__in=['completed', 'validated', 'published']
            )

            if self.round_number > 0:
                score_cards = score_cards.filter(round_number__lte=self.round_number)

            if score_cards.exists():
                # Calcular estadísticas
                stats = score_cards.aggregate(
                    total_score=Sum('final_score'),
                    best_score=models.Max('final_score'),
                    average_score=Avg('final_score'),
                    rounds_completed=Count('id'),
                    total_penalties=Sum('penalty_score'),
                    technical_total=Sum('technical_score'),
                    artistic_total=Sum('artistic_score'),
                    time_total=Sum('time_score'),
                )

                participant_data = {
                    'participant': participant,
                    'total_score': stats['total_score'] or 0,
                    'best_score': stats['best_score'] or 0,
                    'average_score': stats['average_score'] or 0,
                    'rounds_completed': stats['rounds_completed'] or 0,
                    'total_penalties': stats['total_penalties'] or 0,
                    'technical_score': stats['technical_total'] or 0,
                    'artistic_score': stats['artistic_total'] or 0,
                    'time_score': stats['time_total'] or 0,
                }

                ranked_participants.append(participant_data)

        # Ordenar por puntuación (descendente para la mayoría de disciplinas)
        # Para disciplinas como eventing donde menos es mejor, invertir orden
        disciplines = self.competition.disciplines.all()
        discipline_name = disciplines.first().name.lower() if disciplines.exists() else ''
        reverse_order = 'eventing' not in discipline_name and 'cross' not in discipline_name

        return sorted(
            ranked_participants,
            key=lambda x: (
                -x['total_score'] if reverse_order else x['total_score'],
                x['total_penalties'],
                -x['best_score'] if reverse_order else x['best_score']
            )
        )


class LiveRankingEntry(models.Model):
    """Entrada individual en un ranking en vivo"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ranking = models.ForeignKey(LiveRanking, on_delete=models.CASCADE, related_name='entries')
    participant = models.ForeignKey('competitions.Participant', on_delete=models.CASCADE, related_name='live_ranking_entries')

    # Posición y movimiento
    position = models.PositiveIntegerField(verbose_name="Posición actual")
    previous_position = models.PositiveIntegerField(null=True, blank=True, verbose_name="Posición anterior")
    position_change = models.IntegerField(default=0, verbose_name="Cambio de posición")

    # Puntuaciones
    current_score = models.DecimalField(max_digits=10, decimal_places=3, default=0, verbose_name="Puntuación actual")
    previous_score = models.DecimalField(max_digits=10, decimal_places=3, default=0, verbose_name="Puntuación anterior")
    total_penalties = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Penalizaciones totales")

    # Estadísticas
    rounds_completed = models.PositiveIntegerField(default=0, verbose_name="Rondas completadas")
    best_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Mejor puntuación")
    average_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación promedio")

    # Puntuaciones por categoría
    technical_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación técnica")
    artistic_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación artística")
    time_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación de tiempo")

    # Estado del participante
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    is_eliminated = models.BooleanField(default=False, verbose_name="Eliminado")
    elimination_reason = models.CharField(max_length=200, blank=True, verbose_name="Razón de eliminación")

    # Información de rendimiento
    consistency_score = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="Puntuación de consistencia")
    improvement_trend = models.CharField(max_length=20, default='stable', verbose_name="Tendencia de mejora")

    # Timestamps
    last_score_update = models.DateTimeField(auto_now=True, verbose_name="Última actualización de puntuación")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Entrada de Ranking en Vivo"
        verbose_name_plural = "Entradas de Rankings en Vivo"
        ordering = ['position']
        unique_together = ['ranking', 'participant']

    def __str__(self):
        return f"#{self.position} - {self.participant.rider_name} ({self.current_score})"

    def calculate_position_change(self):
        """Calcular cambio de posición desde la última actualización"""
        if self.previous_position:
            self.position_change = self.previous_position - self.position
        else:
            self.position_change = 0
        return self.position_change

    def get_position_trend(self):
        """Obtener tendencia de posición (subiendo, bajando, estable)"""
        if self.position_change > 0:
            return 'rising'
        elif self.position_change < 0:
            return 'falling'
        else:
            return 'stable'

    def calculate_consistency_score(self):
        """Calcular puntuación de consistencia basada en variación de puntuaciones"""
        from apps.scoring.models import ScoreCard
        import statistics

        scores = list(ScoreCard.objects.filter(
            participant=self.participant,
            status__in=['completed', 'validated', 'published']
        ).values_list('final_score', flat=True))

        if len(scores) > 1:
            try:
                mean_score = statistics.mean(scores)
                std_dev = statistics.stdev(scores)
                # Consistencia inversa a la desviación estándar (normalizada)
                self.consistency_score = max(0, 100 - (std_dev / mean_score * 100))
            except (statistics.StatisticsError, ZeroDivisionError):
                self.consistency_score = 0
        else:
            self.consistency_score = 100  # Perfectamente consistente con una sola puntuación

        return self.consistency_score


class RankingSnapshot(models.Model):
    """Instantánea de un ranking en un momento específico"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    live_ranking = models.ForeignKey(LiveRanking, on_delete=models.CASCADE, related_name='snapshots')

    # Información temporal
    snapshot_time = models.DateTimeField(auto_now_add=True, verbose_name="Momento de la instantánea")
    round_number = models.PositiveIntegerField(verbose_name="Número de ronda")
    event_trigger = models.CharField(max_length=100, blank=True, verbose_name="Evento disparador")

    # Estadísticas del momento
    total_participants = models.PositiveIntegerField(default=0, verbose_name="Total de participantes")
    active_participants = models.PositiveIntegerField(default=0, verbose_name="Participantes activos")
    completed_rounds = models.PositiveIntegerField(default=0, verbose_name="Rondas completadas")

    # Metadata
    notes = models.TextField(blank=True, verbose_name="Notas")

    class Meta:
        verbose_name = "Instantánea de Ranking"
        verbose_name_plural = "Instantáneas de Rankings"
        ordering = ['-snapshot_time']

    def __str__(self):
        return f"Snapshot: {self.live_ranking.name} - {self.snapshot_time}"


class RankingRule(models.Model):
    """Reglas de clasificación para diferentes tipos de competencias"""
    RULE_TYPES = [
        ('scoring', 'Puntuación'),
        ('penalty', 'Penalización'),
        ('time', 'Tiempo'),
        ('elimination', 'Eliminación'),
        ('tiebreaker', 'Desempate'),
        ('qualification', 'Clasificación'),
    ]

    COMPARISON_OPERATORS = [
        ('gt', 'Mayor que'),
        ('gte', 'Mayor o igual que'),
        ('lt', 'Menor que'),
        ('lte', 'Menor o igual que'),
        ('eq', 'Igual a'),
        ('ne', 'Diferente de'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE, related_name='ranking_rules')

    # Información de la regla
    name = models.CharField(max_length=100, verbose_name="Nombre de la regla")
    rule_type = models.CharField(max_length=20, choices=RULE_TYPES, verbose_name="Tipo de regla")
    description = models.TextField(verbose_name="Descripción")

    # Configuración de la regla
    field_name = models.CharField(max_length=50, verbose_name="Campo a evaluar")
    operator = models.CharField(max_length=10, choices=COMPARISON_OPERATORS, verbose_name="Operador")
    threshold_value = models.DecimalField(max_digits=10, decimal_places=3, verbose_name="Valor umbral")

    # Acción a tomar
    action = models.CharField(max_length=50, verbose_name="Acción")
    priority = models.PositiveIntegerField(default=1, verbose_name="Prioridad")

    # Estado
    is_active = models.BooleanField(default=True, verbose_name="Activa")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Regla de Ranking"
        verbose_name_plural = "Reglas de Rankings"
        ordering = ['priority', 'name']

    def __str__(self):
        return f"{self.competition.name} - {self.name}"

    def evaluate_participant(self, participant_entry):
        """Evaluar si un participante cumple con esta regla"""
        try:
            field_value = getattr(participant_entry, self.field_name, None)
            if field_value is None:
                return False

            threshold = self.threshold_value

            if self.operator == 'gt':
                return field_value > threshold
            elif self.operator == 'gte':
                return field_value >= threshold
            elif self.operator == 'lt':
                return field_value < threshold
            elif self.operator == 'lte':
                return field_value <= threshold
            elif self.operator == 'eq':
                return field_value == threshold
            elif self.operator == 'ne':
                return field_value != threshold

            return False
        except (AttributeError, TypeError, ValueError):
            return False


class TeamRanking(models.Model):
    """Rankings por equipos"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE, related_name='team_rankings')

    # Información del equipo
    team_name = models.CharField(max_length=200, verbose_name="Nombre del equipo")
    team_code = models.CharField(max_length=20, verbose_name="Código del equipo")
    country_code = models.CharField(max_length=3, blank=True, verbose_name="Código de país")

    # Posición y puntuación
    position = models.PositiveIntegerField(verbose_name="Posición")
    total_score = models.DecimalField(max_digits=10, decimal_places=3, default=0, verbose_name="Puntuación total")
    average_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Puntuación promedio")

    # Estadísticas del equipo
    members_count = models.PositiveIntegerField(default=0, verbose_name="Número de miembros")
    qualified_members = models.PositiveIntegerField(default=0, verbose_name="Miembros clasificados")
    best_individual_score = models.DecimalField(max_digits=8, decimal_places=3, default=0, verbose_name="Mejor puntuación individual")

    # Estado
    is_qualified = models.BooleanField(default=False, verbose_name="Clasificado")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ranking por Equipos"
        verbose_name_plural = "Rankings por Equipos"
        ordering = ['position']
        unique_together = ['competition', 'team_name']

    def __str__(self):
        return f"#{self.position} - {self.team_name} ({self.total_score})"

    def calculate_team_score(self):
        """Calcular puntuación del equipo basada en sus miembros"""
        team_participants = self.competition.participants.filter(
            team_name=self.team_name
        ).select_related('user')

        # Obtener las mejores puntuaciones de los miembros del equipo
        member_scores = []
        for participant in team_participants:
            best_score = participant.score_cards.filter(
                status__in=['completed', 'validated', 'published']
            ).aggregate(best=models.Max('final_score'))['best']

            if best_score:
                member_scores.append(best_score)

        if member_scores:
            # Usar las top N puntuaciones (típicamente 3 de 4 en competencias por equipos)
            top_scores = sorted(member_scores, reverse=True)[:3]
            self.total_score = sum(top_scores)
            self.average_score = sum(top_scores) / len(top_scores)
            self.best_individual_score = max(member_scores)
        else:
            self.total_score = 0
            self.average_score = 0
            self.best_individual_score = 0

        self.members_count = team_participants.count()
        self.qualified_members = team_participants.filter(
            score_cards__status__in=['completed', 'validated', 'published']
        ).distinct().count()

        self.save()