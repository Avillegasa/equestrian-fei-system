# backend/apps/scoring/admin.py
# Admin correcto basado en los campos reales de los modelos

from django.contrib import admin
from .models import EvaluationParameter, ScoreEntry, JudgeEvaluation, JudgePosition

@admin.register(EvaluationParameter)
class EvaluationParameterAdmin(admin.ModelAdmin):
    list_display = [
        'exercise_number', 
        'exercise_name', 
        'category', 
        'coefficient', 
        'max_score',
        'is_collective_mark',
        'order'
    ]
    list_filter = ['category', 'coefficient', 'is_collective_mark']
    search_fields = ['exercise_name', 'exercise_number', 'description']
    ordering = ['category', 'order', 'exercise_number']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('category', 'exercise_number', 'exercise_name', 'order')
        }),
        ('Configuración FEI', {
            'fields': ('coefficient', 'max_score', 'is_collective_mark')
        }),
        ('Descripción', {
            'fields': ('description',),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']

@admin.register(ScoreEntry)
class ScoreEntryAdmin(admin.ModelAdmin):
    list_display = [
        'participant',
        'evaluation_parameter', 
        'judge_position',
        'score',
        'is_reviewed',
        'scored_at'
    ]
    list_filter = [
        'evaluation_parameter__category',
        'judge_position',
        'is_reviewed',
        'scored_at',
        'evaluation_parameter__coefficient'
    ]
    search_fields = [
        'participant__rider__first_name',
        'participant__rider__last_name',
        'participant__horse__name',
        'evaluation_parameter__exercise_name'
    ]
    ordering = ['-scored_at']
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('participant', 'evaluation_parameter', 'judge_position')
        }),
        ('Calificación', {
            'fields': ('score', 'justification')
        }),
        ('Revisión', {
            'fields': ('is_reviewed', 'reviewed_at', 'reviewed_by'),
            'classes': ('collapse',)
        }),
        ('Metadatos', {
            'fields': ('scored_by', 'scored_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['scored_at', 'updated_at', 'reviewed_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'participant__rider',
            'participant__horse',
            'participant__competition_category',
            'evaluation_parameter',
            'judge_position',
            'scored_by',
            'reviewed_by'
        )

@admin.register(JudgeEvaluation)
class JudgeEvaluationAdmin(admin.ModelAdmin):
    list_display = [
        'participant',
        'judge_position',
        'total_score',
        'total_possible',
        'percentage',
        'status',
        'completed_at'
    ]
    list_filter = [
        'judge_position',
        'status',
        'started_at',
        'completed_at'
    ]
    search_fields = [
        'participant__rider__first_name',
        'participant__rider__last_name',
        'participant__horse__name'
    ]
    ordering = ['-updated_at']
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('participant', 'judge_position')
        }),
        ('Resultados', {
            'fields': ('total_score', 'total_possible', 'percentage', 'status')
        }),
        ('Tiempos', {
            'fields': ('started_at', 'completed_at')
        }),
        ('Observaciones', {
            'fields': ('general_comments',)
        }),
        ('Metadatos', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['updated_at', 'percentage']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'participant__rider',
            'participant__horse',
            'judge_position'
        )

@admin.register(JudgePosition)
class JudgePositionAdmin(admin.ModelAdmin):
    list_display = [
        'competition',
        'judge', 
        'position',
        'is_active',
        'assigned_at'
    ]
    list_filter = ['position', 'is_active', 'assigned_at']
    search_fields = ['judge__first_name', 'judge__last_name', 'position']
    ordering = ['competition', 'position']
    
    fieldsets = (
        ('Asignación', {
            'fields': ('competition', 'judge', 'position')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Metadatos', {
            'fields': ('assigned_at',),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['assigned_at']

# Configuración adicional para mejorar la experiencia del admin
admin.site.site_header = "Sistema FEI - Administración"
admin.site.site_title = "Admin FEI"
admin.site.index_title = "Panel de Administración del Sistema FEI"