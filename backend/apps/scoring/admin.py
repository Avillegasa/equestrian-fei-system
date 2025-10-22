from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Avg, Sum, Count
from .models import (
    ScoringCriteria, ScoreCard, IndividualScore,
    JumpingFault, DressageMovement, EventingPhase,
    CompetitionRanking, RankingEntry
)


@admin.register(ScoringCriteria)
class ScoringCriteriaAdmin(admin.ModelAdmin):
    """Admin para criterios de puntuación"""
    list_display = [
        'name', 'discipline', 'criteria_type_badge', 'score_range',
        'weight', 'is_required', 'order', 'status_badge'
    ]
    list_filter = ['discipline', 'criteria_type', 'is_required', 'is_active']
    search_fields = ['name', 'code', 'description', 'discipline__name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['discipline', 'order', 'name']

    fieldsets = (
        ('Información Básica', {
            'fields': ('discipline', 'name', 'code', 'criteria_type', 'description')
        }),
        ('Configuración de Puntuación', {
            'fields': ('min_score', 'max_score', 'weight')
        }),
        ('Opciones', {
            'fields': ('is_required', 'is_time_based', 'allow_decimals')
        }),
        ('Orden y Estado', {
            'fields': ('order', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['activate_criteria', 'deactivate_criteria']

    def criteria_type_badge(self, obj):
        colors = {
            'technical': '#007bff',
            'artistic': '#e83e8c',
            'time': '#17a2b8',
            'penalty': '#dc3545',
            'bonus': '#28a745',
            'overall': '#6f42c1'
        }
        color = colors.get(obj.criteria_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_criteria_type_display()
        )
    criteria_type_badge.short_description = 'Tipo'

    def score_range(self, obj):
        return f"{obj.min_score} - {obj.max_score}"
    score_range.short_description = 'Rango'

    def status_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Activo</span>')
        return format_html('<span style="color: red;">✗ Inactivo</span>')
    status_badge.short_description = 'Estado'

    def activate_criteria(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} criterios activados.')
    activate_criteria.short_description = 'Activar criterios'

    def deactivate_criteria(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} criterios desactivados.')
    deactivate_criteria.short_description = 'Desactivar criterios'


class IndividualScoreInline(admin.TabularInline):
    """Inline para puntuaciones individuales"""
    model = IndividualScore
    extra = 0
    fields = ['criteria', 'raw_score', 'weighted_score', 'comments']
    readonly_fields = ['weighted_score']


class JumpingFaultInline(admin.TabularInline):
    """Inline para faltas de salto"""
    model = JumpingFault
    extra = 0
    fields = ['fault_type', 'obstacle_number', 'penalty_points', 'description']


class DressageMovementInline(admin.TabularInline):
    """Inline para movimientos de dressage"""
    model = DressageMovement
    extra = 0
    fields = ['movement_number', 'movement_type', 'score', 'coefficient', 'weighted_score', 'judge_comments']
    readonly_fields = ['weighted_score']


@admin.register(ScoreCard)
class ScoreCardAdmin(admin.ModelAdmin):
    """Admin para tarjetas de puntuación"""
    list_display = [
        'participant_info', 'judge', 'status_badge', 'round_info',
        'final_score_display', 'percentage_display', 'validation_status',
        'created_at'
    ]
    list_filter = [
        'status', 'round_number', 'participant__competition',
        'participant__category', 'created_at'
    ]
    search_fields = [
        'participant__rider__username', 'participant__rider__first_name',
        'participant__rider__last_name', 'participant__horse__name',
        'judge__username'
    ]
    readonly_fields = ['created_at', 'updated_at', 'duration_seconds']
    inlines = [IndividualScoreInline, JumpingFaultInline, DressageMovementInline]

    fieldsets = (
        ('Participante y Juez', {
            'fields': ('participant', 'judge')
        }),
        ('Estado y Ronda', {
            'fields': ('status', 'round_number', 'attempt_number')
        }),
        ('Tiempos', {
            'fields': ('start_time', 'end_time', 'execution_time', 'duration_seconds')
        }),
        ('Puntuaciones Detalladas', {
            'fields': (
                'technical_score', 'artistic_score', 'time_score',
                'penalty_score', 'bonus_score'
            )
        }),
        ('Puntuación Final', {
            'fields': ('raw_score', 'final_score', 'percentage')
        }),
        ('Condiciones', {
            'fields': ('weather_conditions', 'arena_conditions'),
            'classes': ('collapse',)
        }),
        ('Notas', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Validación', {
            'fields': ('validated_by', 'validated_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = [
        'validate_scorecards', 'publish_scorecards',
        'recalculate_scores', 'mark_completed'
    ]

    def participant_info(self, obj):
        return format_html(
            '<strong>{}</strong><br><small>🐴 {}</small>',
            obj.participant.rider.get_full_name(),
            obj.participant.horse.name
        )
    participant_info.short_description = 'Participante'

    def status_badge(self, obj):
        colors = {
            'pending': '#6c757d',
            'in_progress': '#007bff',
            'completed': '#17a2b8',
            'validated': '#28a745',
            'published': '#20c997',
            'disputed': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Estado'

    def round_info(self, obj):
        return f"R{obj.round_number} / A{obj.attempt_number}"
    round_info.short_description = 'Ronda/Intento'

    def final_score_display(self, obj):
        return format_html(
            '<span style="font-size: 16px; font-weight: bold; color: #007bff;">{:.3f}</span>',
            obj.final_score
        )
    final_score_display.short_description = 'Puntuación Final'

    def percentage_display(self, obj):
        color = 'green' if obj.percentage >= 70 else 'orange' if obj.percentage >= 50 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.2f}%</span>',
            color, obj.percentage
        )
    percentage_display.short_description = '%'

    def validation_status(self, obj):
        if obj.validated_by:
            return format_html(
                '<span style="color: green;">✓ Por {}</span>',
                obj.validated_by.get_full_name()
            )
        return format_html('<span style="color: orange;">⏳ Sin validar</span>')
    validation_status.short_description = 'Validación'

    # Acciones
    def validate_scorecards(self, request, queryset):
        count = queryset.update(
            status='validated',
            validated_by=request.user,
            validated_at=timezone.now()
        )
        self.message_user(request, f'{count} tarjetas validadas correctamente.')
    validate_scorecards.short_description = 'Validar tarjetas'

    def publish_scorecards(self, request, queryset):
        count = queryset.filter(status='validated').update(status='published')
        self.message_user(request, f'{count} tarjetas publicadas.')
    publish_scorecards.short_description = 'Publicar tarjetas validadas'

    def recalculate_scores(self, request, queryset):
        for scorecard in queryset:
            scorecard.calculate_scores()
        self.message_user(request, f'{queryset.count()} puntuaciones recalculadas.')
    recalculate_scores.short_description = 'Recalcular puntuaciones'

    def mark_completed(self, request, queryset):
        count = queryset.update(status='completed')
        self.message_user(request, f'{count} tarjetas marcadas como completadas.')
    mark_completed.short_description = 'Marcar como completadas'


@admin.register(IndividualScore)
class IndividualScoreAdmin(admin.ModelAdmin):
    """Admin para puntuaciones individuales"""
    list_display = [
        'score_card', 'criteria', 'raw_score', 'weighted_score',
        'created_at'
    ]
    list_filter = ['criteria__criteria_type', 'criteria__discipline', 'created_at']
    search_fields = [
        'score_card__participant__rider__username',
        'criteria__name'
    ]
    readonly_fields = ['weighted_score', 'created_at', 'updated_at']

    fieldsets = (
        ('Tarjeta y Criterio', {
            'fields': ('score_card', 'criteria')
        }),
        ('Puntuación', {
            'fields': ('raw_score', 'weighted_score')
        }),
        ('Detalles', {
            'fields': ('comments', 'time_value')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(JumpingFault)
class JumpingFaultAdmin(admin.ModelAdmin):
    """Admin para faltas de salto"""
    list_display = [
        'score_card_info', 'fault_type_badge', 'obstacle_number',
        'penalty_points', 'timestamp'
    ]
    list_filter = ['fault_type', 'timestamp']
    search_fields = [
        'score_card__participant__rider__username',
        'score_card__participant__horse__name',
        'description'
    ]
    readonly_fields = ['timestamp']

    fieldsets = (
        ('Tarjeta de Puntuación', {
            'fields': ('score_card',)
        }),
        ('Información de la Falta', {
            'fields': ('fault_type', 'obstacle_number', 'penalty_points')
        }),
        ('Detalles', {
            'fields': ('description', 'timestamp')
        })
    )

    def score_card_info(self, obj):
        return format_html(
            '{} - {}',
            obj.score_card.participant.rider.get_full_name(),
            obj.score_card.participant.horse.name
        )
    score_card_info.short_description = 'Participante'

    def fault_type_badge(self, obj):
        colors = {
            'knockdown': '#ffc107',
            'refusal': '#fd7e14',
            'fall_horse': '#dc3545',
            'fall_rider': '#dc3545',
            'wrong_course': '#e83e8c',
            'time_exceeded': '#17a2b8',
            'elimination': '#6c757d'
        }
        color = colors.get(obj.fault_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_fault_type_display()
        )
    fault_type_badge.short_description = 'Tipo de Falta'


@admin.register(DressageMovement)
class DressageMovementAdmin(admin.ModelAdmin):
    """Admin para movimientos de dressage"""
    list_display = [
        'score_card_info', 'movement_number', 'movement_type_badge',
        'score_display', 'coefficient', 'weighted_score'
    ]
    list_filter = ['movement_type', 'created_at']
    search_fields = [
        'score_card__participant__rider__username',
        'score_card__participant__horse__name',
        'description'
    ]
    readonly_fields = ['weighted_score', 'created_at', 'updated_at']
    ordering = ['score_card', 'movement_number']

    fieldsets = (
        ('Tarjeta de Puntuación', {
            'fields': ('score_card',)
        }),
        ('Movimiento', {
            'fields': ('movement_number', 'movement_type', 'description')
        }),
        ('Puntuación', {
            'fields': ('score', 'coefficient', 'weighted_score')
        }),
        ('Comentarios', {
            'fields': ('judge_comments',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def score_card_info(self, obj):
        return format_html(
            '{} - {}',
            obj.score_card.participant.rider.get_full_name(),
            obj.score_card.participant.horse.name
        )
    score_card_info.short_description = 'Participante'

    def movement_type_badge(self, obj):
        colors = {
            'halt': '#6c757d',
            'walk': '#17a2b8',
            'trot': '#007bff',
            'canter': '#6f42c1',
            'transition': '#20c997',
            'figure': '#ffc107',
            'lateral': '#fd7e14',
            'collection': '#e83e8c',
            'extension': '#28a745'
        }
        color = colors.get(obj.movement_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_movement_type_display()
        )
    movement_type_badge.short_description = 'Tipo'

    def score_display(self, obj):
        color = 'green' if obj.score >= 7 else 'orange' if obj.score >= 5 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold; font-size: 14px;">{}</span>',
            color, obj.score
        )
    score_display.short_description = 'Puntuación'


@admin.register(EventingPhase)
class EventingPhaseAdmin(admin.ModelAdmin):
    """Admin para fases de eventing"""
    list_display = [
        'participant', 'phase_type_badge', 'time_info',
        'penalties_summary', 'completion_status', 'created_at'
    ]
    list_filter = ['phase_type', 'is_completed', 'is_eliminated']
    search_fields = [
        'participant__rider__username',
        'participant__rider__first_name',
        'participant__rider__last_name',
        'participant__horse__name'
    ]
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Participante y Fase', {
            'fields': ('participant', 'phase_type')
        }),
        ('Tiempos', {
            'fields': ('start_time', 'finish_time', 'optimum_time', 'actual_time')
        }),
        ('Puntuaciones', {
            'fields': (
                'dressage_score', 'jumping_penalties',
                'time_penalties', 'total_penalties'
            )
        }),
        ('Estado', {
            'fields': ('is_completed', 'is_eliminated', 'elimination_reason')
        }),
        ('Notas', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['recalculate_time_penalties', 'mark_completed', 'mark_eliminated']

    def phase_type_badge(self, obj):
        colors = {
            'dressage': '#e83e8c',
            'cross_country': '#28a745',
            'show_jumping': '#007bff'
        }
        color = colors.get(obj.phase_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_phase_type_display()
        )
    phase_type_badge.short_description = 'Fase'

    def time_info(self, obj):
        if obj.actual_time and obj.optimum_time:
            diff = obj.actual_time - obj.optimum_time
            diff_seconds = diff.total_seconds()
            color = 'green' if diff_seconds <= 0 else 'orange' if diff_seconds <= 10 else 'red'
            return format_html(
                '<span style="color: {};">Real: {} | Óptimo: {}</span>',
                color, obj.actual_time, obj.optimum_time
            )
        return '-'
    time_info.short_description = 'Tiempos'

    def penalties_summary(self, obj):
        return format_html(
            'Salto: {} | Tiempo: {} | <strong>Total: {}</strong>',
            obj.jumping_penalties, obj.time_penalties, obj.total_penalties
        )
    penalties_summary.short_description = 'Penalizaciones'

    def completion_status(self, obj):
        if obj.is_eliminated:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ Eliminado</span><br><small>{}</small>',
                obj.elimination_reason
            )
        elif obj.is_completed:
            return format_html('<span style="color: green; font-weight: bold;">✓ Completada</span>')
        return format_html('<span style="color: orange;">⏳ En progreso</span>')
    completion_status.short_description = 'Estado'

    def recalculate_time_penalties(self, request, queryset):
        for phase in queryset:
            phase.calculate_time_penalties()
        self.message_user(request, f'{queryset.count()} fases recalculadas.')
    recalculate_time_penalties.short_description = 'Recalcular penalizaciones de tiempo'

    def mark_completed(self, request, queryset):
        count = queryset.update(is_completed=True)
        self.message_user(request, f'{count} fases marcadas como completadas.')
    mark_completed.short_description = 'Marcar como completadas'

    def mark_eliminated(self, request, queryset):
        count = queryset.update(is_eliminated=True)
        self.message_user(request, f'{count} participantes eliminados.')
    mark_eliminated.short_description = 'Marcar como eliminados'


class RankingEntryInline(admin.TabularInline):
    """Inline para entradas de ranking"""
    model = RankingEntry
    extra = 0
    fields = [
        'position', 'participant', 'final_score', 'total_penalties',
        'rounds_completed', 'is_eliminated'
    ]
    readonly_fields = ['position']
    ordering = ['position']


@admin.register(CompetitionRanking)
class CompetitionRankingAdmin(admin.ModelAdmin):
    """Admin para rankings de competencia"""
    list_display = [
        'competition', 'category', 'entries_count',
        'publication_status', 'final_status', 'ranking_date'
    ]
    list_filter = ['is_final', 'is_published', 'ranking_date', 'competition']
    search_fields = ['competition__name', 'category__name']
    readonly_fields = ['ranking_date']
    inlines = [RankingEntryInline]

    fieldsets = (
        ('Competencia y Categoría', {
            'fields': ('competition', 'category')
        }),
        ('Estado', {
            'fields': ('is_final', 'is_published', 'ranking_date')
        })
    )

    actions = ['publish_rankings', 'unpublish_rankings', 'mark_as_final']

    def entries_count(self, obj):
        count = obj.entries.count()
        return format_html(
            '<span style="font-weight: bold; color: #007bff;">{} participantes</span>',
            count
        )
    entries_count.short_description = 'Entradas'

    def publication_status(self, obj):
        if obj.is_published:
            return format_html('<span style="color: green; font-weight: bold;">✓ Publicado</span>')
        return format_html('<span style="color: gray;">✗ Borrador</span>')
    publication_status.short_description = 'Publicación'

    def final_status(self, obj):
        if obj.is_final:
            return format_html('<span style="color: green; font-weight: bold;">✓ Final</span>')
        return format_html('<span style="color: orange;">Provisional</span>')
    final_status.short_description = 'Final'

    def publish_rankings(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f'{count} rankings publicados.')
    publish_rankings.short_description = 'Publicar rankings'

    def unpublish_rankings(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f'{count} rankings despublicados.')
    unpublish_rankings.short_description = 'Despublicar rankings'

    def mark_as_final(self, request, queryset):
        count = queryset.update(is_final=True)
        self.message_user(request, f'{count} rankings marcados como finales.')
    mark_as_final.short_description = 'Marcar como finales'


@admin.register(RankingEntry)
class RankingEntryAdmin(admin.ModelAdmin):
    """Admin para entradas de ranking"""
    list_display = [
        'position_display', 'participant_info', 'ranking_info',
        'final_score_display', 'penalties_display', 'rounds_completed',
        'elimination_status'
    ]
    list_filter = ['is_eliminated', 'ranking__competition', 'ranking__category']
    search_fields = [
        'participant__rider__username',
        'participant__rider__first_name',
        'participant__rider__last_name',
        'participant__horse__name'
    ]
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['ranking', 'position']

    fieldsets = (
        ('Ranking y Participante', {
            'fields': ('ranking', 'participant')
        }),
        ('Posición y Puntuación', {
            'fields': ('position', 'total_score', 'total_penalties', 'final_score')
        }),
        ('Detalles de Puntuación', {
            'fields': ('technical_score', 'artistic_score', 'time_score')
        }),
        ('Estadísticas', {
            'fields': ('best_round_score', 'rounds_completed')
        }),
        ('Eliminación', {
            'fields': ('is_eliminated', 'elimination_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def position_display(self, obj):
        colors = {1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32'}
        color = colors.get(obj.position, '#007bff')
        return format_html(
            '<span style="font-size: 18px; font-weight: bold; color: {};">#{}</span>',
            color, obj.position
        )
    position_display.short_description = 'Posición'

    def participant_info(self, obj):
        return format_html(
            '<strong>{}</strong><br><small>🐴 {}</small>',
            obj.participant.rider.get_full_name(),
            obj.participant.horse.name
        )
    participant_info.short_description = 'Participante'

    def ranking_info(self, obj):
        return format_html(
            '{}<br><small>{}</small>',
            obj.ranking.competition.name,
            obj.ranking.category.name
        )
    ranking_info.short_description = 'Competencia/Categoría'

    def final_score_display(self, obj):
        return format_html(
            '<span style="font-size: 16px; font-weight: bold; color: #28a745;">{:.3f}</span>',
            obj.final_score
        )
    final_score_display.short_description = 'Puntuación Final'

    def penalties_display(self, obj):
        if obj.total_penalties > 0:
            return format_html(
                '<span style="color: red; font-weight: bold;">-{:.3f}</span>',
                obj.total_penalties
            )
        return format_html('<span style="color: green;">0</span>')
    penalties_display.short_description = 'Penalizaciones'

    def elimination_status(self, obj):
        if obj.is_eliminated:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ Eliminado</span><br><small>{}</small>',
                obj.elimination_reason
            )
        return format_html('<span style="color: green;">✓ Activo</span>')
    elimination_status.short_description = 'Estado'
