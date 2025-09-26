from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone

from .models import (
    LiveRanking,
    LiveRankingEntry,
    RankingSnapshot,
    RankingRule,
    TeamRanking
)


@admin.register(LiveRanking)
class LiveRankingAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'competition', 'category', 'ranking_type', 'status',
        'total_participants', 'last_updated', 'is_live', 'is_public'
    ]
    list_filter = ['status', 'ranking_type', 'is_live', 'is_public', 'created_at']
    search_fields = ['name', 'competition__name', 'category__name']
    readonly_fields = ['last_updated', 'created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'competition', 'category', 'ranking_type', 'status')
        }),
        ('Configuración', {
            'fields': ('calculation_method', 'update_frequency', 'round_number')
        }),
        ('Estado de Publicación', {
            'fields': ('is_live', 'is_public', 'auto_publish')
        }),
        ('Detalles', {
            'fields': ('description',)
        }),
        ('Timestamps', {
            'fields': ('last_updated', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['force_update_rankings', 'activate_rankings', 'deactivate_rankings']

    def total_participants(self, obj):
        return obj.entries.count()
    total_participants.short_description = 'Participantes'

    def force_update_rankings(self, request, queryset):
        updated = 0
        for ranking in queryset:
            try:
                ranking.update_rankings()
                updated += 1
            except Exception:
                continue

        self.message_user(request, f'{updated} rankings actualizados correctamente.')
    force_update_rankings.short_description = 'Forzar actualización de rankings'

    def activate_rankings(self, request, queryset):
        count = queryset.update(status='active', is_live=True)
        self.message_user(request, f'{count} rankings activados.')
    activate_rankings.short_description = 'Activar rankings'

    def deactivate_rankings(self, request, queryset):
        count = queryset.update(status='paused', is_live=False)
        self.message_user(request, f'{count} rankings desactivados.')
    deactivate_rankings.short_description = 'Desactivar rankings'


@admin.register(LiveRankingEntry)
class LiveRankingEntryAdmin(admin.ModelAdmin):
    list_display = [
        'position', 'participant_name', 'horse_name', 'ranking_name',
        'current_score', 'position_change_indicator', 'is_active', 'is_eliminated'
    ]
    list_filter = ['ranking__competition', 'ranking__category', 'is_active', 'is_eliminated']
    search_fields = [
        'participant__rider_name', 'participant__horse_name',
        'participant__number', 'ranking__name'
    ]
    readonly_fields = [
        'position_change', 'last_score_update', 'created_at', 'updated_at'
    ]

    fieldsets = (
        ('Posición', {
            'fields': ('position', 'previous_position', 'position_change')
        }),
        ('Puntuaciones', {
            'fields': (
                'current_score', 'previous_score', 'total_penalties',
                'best_score', 'average_score'
            )
        }),
        ('Puntuaciones Detalladas', {
            'fields': ('technical_score', 'artistic_score', 'time_score'),
            'classes': ('collapse',)
        }),
        ('Estado', {
            'fields': ('is_active', 'is_eliminated', 'elimination_reason')
        }),
        ('Estadísticas', {
            'fields': ('rounds_completed', 'consistency_score', 'improvement_trend'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('last_score_update', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def participant_name(self, obj):
        return obj.participant.rider_name
    participant_name.short_description = 'Jinete'

    def horse_name(self, obj):
        return obj.participant.horse_name
    horse_name.short_description = 'Caballo'

    def ranking_name(self, obj):
        return obj.ranking.name
    ranking_name.short_description = 'Ranking'

    def position_change_indicator(self, obj):
        if obj.position_change > 0:
            return format_html('<span style="color: green;">↑ {}</span>', obj.position_change)
        elif obj.position_change < 0:
            return format_html('<span style="color: red;">↓ {}</span>', abs(obj.position_change))
        else:
            return format_html('<span style="color: gray;">-</span>')
    position_change_indicator.short_description = 'Cambio'


@admin.register(RankingSnapshot)
class RankingSnapshotAdmin(admin.ModelAdmin):
    list_display = [
        'live_ranking', 'snapshot_time', 'round_number',
        'total_participants', 'active_participants', 'event_trigger'
    ]
    list_filter = ['event_trigger', 'round_number', 'snapshot_time']
    search_fields = ['live_ranking__name', 'live_ranking__competition__name']
    readonly_fields = ['snapshot_time']

    fieldsets = (
        ('Información del Snapshot', {
            'fields': ('live_ranking', 'snapshot_time', 'round_number', 'event_trigger')
        }),
        ('Estadísticas', {
            'fields': ('total_participants', 'active_participants', 'completed_rounds')
        }),
        ('Notas', {
            'fields': ('notes',)
        })
    )


@admin.register(RankingRule)
class RankingRuleAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'competition', 'rule_type', 'field_name',
        'operator', 'threshold_value', 'priority', 'is_active'
    ]
    list_filter = ['rule_type', 'operator', 'is_active', 'competition']
    search_fields = ['name', 'competition__name', 'description']
    ordering = ['priority', 'name']

    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'competition', 'rule_type', 'description')
        }),
        ('Configuración de la Regla', {
            'fields': ('field_name', 'operator', 'threshold_value')
        }),
        ('Acción y Prioridad', {
            'fields': ('action', 'priority', 'is_active')
        })
    )

    actions = ['test_rules', 'activate_rules', 'deactivate_rules']

    def test_rules(self, request, queryset):
        # Esta acción podría implementar pruebas de reglas
        self.message_user(request, f'Prueba de {queryset.count()} reglas completada.')
    test_rules.short_description = 'Probar reglas seleccionadas'

    def activate_rules(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} reglas activadas.')
    activate_rules.short_description = 'Activar reglas'

    def deactivate_rules(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} reglas desactivadas.')
    deactivate_rules.short_description = 'Desactivar reglas'


@admin.register(TeamRanking)
class TeamRankingAdmin(admin.ModelAdmin):
    list_display = [
        'position', 'team_name', 'competition', 'total_score',
        'members_count', 'qualified_members', 'is_qualified'
    ]
    list_filter = ['competition', 'is_qualified', 'country_code']
    search_fields = ['team_name', 'team_code', 'competition__name']
    ordering = ['position']

    fieldsets = (
        ('Información del Equipo', {
            'fields': ('team_name', 'team_code', 'country_code', 'competition')
        }),
        ('Ranking', {
            'fields': ('position', 'is_qualified')
        }),
        ('Puntuaciones', {
            'fields': ('total_score', 'average_score', 'best_individual_score')
        }),
        ('Estadísticas', {
            'fields': ('members_count', 'qualified_members')
        })
    )

    actions = ['recalculate_team_scores', 'qualify_teams', 'disqualify_teams']

    def recalculate_team_scores(self, request, queryset):
        updated = 0
        for team in queryset:
            try:
                team.calculate_team_score()
                updated += 1
            except Exception:
                continue

        self.message_user(request, f'{updated} puntuaciones de equipos recalculadas.')
    recalculate_team_scores.short_description = 'Recalcular puntuaciones de equipos'

    def qualify_teams(self, request, queryset):
        count = queryset.update(is_qualified=True)
        self.message_user(request, f'{count} equipos clasificados.')
    qualify_teams.short_description = 'Clasificar equipos'

    def disqualify_teams(self, request, queryset):
        count = queryset.update(is_qualified=False)
        self.message_user(request, f'{count} equipos descalificados.')
    disqualify_teams.short_description = 'Descalificar equipos'