from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.urls import reverse
from .models import (
    Discipline, Category, Venue, Competition,
    CompetitionStaff, Horse, Participant, CompetitionSchedule
)


@admin.register(Discipline)
class DisciplineAdmin(admin.ModelAdmin):
    """Admin para disciplinas ecuestres"""
    list_display = [
        'name', 'code', 'discipline_type', 'scoring_system',
        'max_duration_minutes', 'status_badge', 'created_at'
    ]
    list_filter = ['discipline_type', 'is_active', 'scoring_system']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'code', 'discipline_type', 'description', 'is_active')
        }),
        ('Reglas de la Disciplina', {
            'fields': ('scoring_system', 'max_duration_minutes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['activate_disciplines', 'deactivate_disciplines']

    def status_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Activo</span>')
        return format_html('<span style="color: red;">✗ Inactivo</span>')
    status_badge.short_description = 'Estado'

    def activate_disciplines(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} disciplinas activadas.')
    activate_disciplines.short_description = 'Activar disciplinas'

    def deactivate_disciplines(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} disciplinas desactivadas.')
    deactivate_disciplines.short_description = 'Desactivar disciplinas'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin para categorías de competencia"""
    list_display = [
        'name', 'code', 'category_type', 'level', 'age_range',
        'max_participants', 'entry_fee', 'status_badge'
    ]
    list_filter = ['category_type', 'level', 'is_active']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'code', 'category_type', 'level', 'description', 'is_active')
        }),
        ('Restricciones de Edad', {
            'fields': ('min_age', 'max_age')
        }),
        ('Restricciones de Altura (para Salto)', {
            'fields': ('min_height_cm', 'max_height_cm')
        }),
        ('Configuraciones', {
            'fields': ('max_participants', 'entry_fee')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['activate_categories', 'deactivate_categories']

    def age_range(self, obj):
        if obj.min_age and obj.max_age:
            return f"{obj.min_age}-{obj.max_age} años"
        elif obj.min_age:
            return f"{obj.min_age}+ años"
        elif obj.max_age:
            return f"≤{obj.max_age} años"
        return "Sin restricción"
    age_range.short_description = 'Rango de Edad'

    def status_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Activo</span>')
        return format_html('<span style="color: red;">✗ Inactivo</span>')
    status_badge.short_description = 'Estado'

    def activate_categories(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} categorías activadas.')
    activate_categories.short_description = 'Activar categorías'

    def deactivate_categories(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} categorías desactivadas.')
    deactivate_categories.short_description = 'Desactivar categorías'


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    """Admin para sedes de competencias"""
    list_display = [
        'name', 'city', 'country', 'capacity', 'facilities_summary',
        'status_badge', 'created_at'
    ]
    list_filter = ['country', 'is_active', 'indoor_arena', 'outdoor_arena']
    search_fields = ['name', 'city', 'country', 'address']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'is_active')
        }),
        ('Ubicación', {
            'fields': ('address', 'city', 'state_province', 'country', 'postal_code')
        }),
        ('Contacto', {
            'fields': ('phone', 'email', 'website')
        }),
        ('Instalaciones', {
            'fields': (
                'capacity', 'indoor_arena', 'outdoor_arena',
                'warm_up_area', 'stabling'
            )
        }),
        ('Coordenadas GPS', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['activate_venues', 'deactivate_venues']

    def facilities_summary(self, obj):
        facilities = []
        if obj.indoor_arena:
            facilities.append('🏟️ Interior')
        if obj.outdoor_arena:
            facilities.append('🌳 Exterior')
        if obj.warm_up_area:
            facilities.append('🏃 Calentamiento')
        if obj.stabling:
            facilities.append(f'🐴 {obj.stabling} establos')
        return ' | '.join(facilities) if facilities else 'Sin datos'
    facilities_summary.short_description = 'Instalaciones'

    def status_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Activo</span>')
        return format_html('<span style="color: red;">✗ Inactivo</span>')
    status_badge.short_description = 'Estado'

    def activate_venues(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} sedes activadas.')
    activate_venues.short_description = 'Activar sedes'

    def deactivate_venues(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} sedes desactivadas.')
    deactivate_venues.short_description = 'Desactivar sedes'


class CompetitionStaffInline(admin.TabularInline):
    """Inline para personal de competencia"""
    model = CompetitionStaff
    extra = 1
    fields = ['staff_member', 'role', 'is_confirmed', 'notes']


class ParticipantInline(admin.TabularInline):
    """Inline para participantes de competencia"""
    model = Participant
    extra = 0
    fields = ['rider', 'horse', 'category', 'bib_number', 'is_confirmed', 'is_paid']
    readonly_fields = ['registration_date']


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    """Admin para competencias"""
    list_display = [
        'name', 'organizer', 'venue', 'competition_type',
        'status_badge', 'date_range', 'participants_count',
        'registration_status', 'created_at'
    ]
    list_filter = [
        'status', 'competition_type', 'is_championship',
        'start_date', 'venue__country'
    ]
    search_fields = ['name', 'short_name', 'organizer__username', 'venue__name']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['disciplines', 'categories']
    inlines = [CompetitionStaffInline, ParticipantInline]

    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'short_name', 'description', 'organizer', 'venue')
        }),
        ('Categorías y Disciplinas', {
            'fields': ('disciplines', 'categories')
        }),
        ('Fechas', {
            'fields': (
                'start_date', 'end_date',
                'registration_start', 'registration_end'
            )
        }),
        ('Estado y Tipo', {
            'fields': ('status', 'competition_type')
        }),
        ('Configuraciones', {
            'fields': (
                'max_participants', 'max_horses_per_rider',
                'entry_fee', 'late_fee'
            )
        }),
        ('Configuraciones Avanzadas', {
            'fields': (
                'requires_qualification', 'is_championship',
                'points_for_ranking'
            ),
            'classes': ('collapse',)
        }),
        ('Información Adicional', {
            'fields': ('rules', 'prize_money', 'sponsors'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = [
        'open_registration', 'close_registration', 'start_competition',
        'complete_competition', 'cancel_competition'
    ]

    def status_badge(self, obj):
        colors = {
            'draft': '#6c757d',
            'published': '#17a2b8',
            'open_registration': '#28a745',
            'registration_closed': '#ffc107',
            'in_progress': '#007bff',
            'completed': '#28a745',
            'cancelled': '#dc3545',
            'postponed': '#fd7e14'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Estado'

    def date_range(self, obj):
        return f"{obj.start_date.strftime('%d/%m/%Y')} - {obj.end_date.strftime('%d/%m/%Y')}"
    date_range.short_description = 'Fechas'

    def participants_count(self, obj):
        count = obj.participants.count()
        if obj.max_participants:
            percentage = (count / obj.max_participants) * 100
            color = 'green' if percentage < 80 else 'orange' if percentage < 100 else 'red'
            return format_html(
                '<span style="color: {}; font-weight: bold;">{}/{}</span>',
                color, count, obj.max_participants
            )
        return count
    participants_count.short_description = 'Participantes'

    def registration_status(self, obj):
        if obj.is_registration_open:
            return format_html('<span style="color: green; font-weight: bold;">✓ Abierta</span>')
        return format_html('<span style="color: gray;">✗ Cerrada</span>')
    registration_status.short_description = 'Inscripción'

    # Acciones
    def open_registration(self, request, queryset):
        count = queryset.update(status='open_registration')
        self.message_user(request, f'{count} competencias ahora tienen inscripción abierta.')
    open_registration.short_description = 'Abrir inscripción'

    def close_registration(self, request, queryset):
        count = queryset.update(status='registration_closed')
        self.message_user(request, f'{count} competencias con inscripción cerrada.')
    close_registration.short_description = 'Cerrar inscripción'

    def start_competition(self, request, queryset):
        count = queryset.update(status='in_progress')
        self.message_user(request, f'{count} competencias iniciadas.')
    start_competition.short_description = 'Iniciar competencia'

    def complete_competition(self, request, queryset):
        count = queryset.update(status='completed')
        self.message_user(request, f'{count} competencias completadas.')
    complete_competition.short_description = 'Completar competencia'

    def cancel_competition(self, request, queryset):
        count = queryset.update(status='cancelled')
        self.message_user(request, f'{count} competencias canceladas.')
    cancel_competition.short_description = 'Cancelar competencia'


@admin.register(CompetitionStaff)
class CompetitionStaffAdmin(admin.ModelAdmin):
    """Admin para personal de competencias"""
    list_display = [
        'staff_member', 'competition', 'role_badge',
        'confirmation_status', 'assigned_date'
    ]
    list_filter = ['role', 'is_confirmed', 'assigned_date']
    search_fields = [
        'staff_member__username', 'staff_member__first_name',
        'staff_member__last_name', 'competition__name'
    ]
    readonly_fields = ['assigned_date']

    fieldsets = (
        ('Asignación', {
            'fields': ('competition', 'staff_member', 'role')
        }),
        ('Estado', {
            'fields': ('is_confirmed',)
        }),
        ('Información Adicional', {
            'fields': ('notes', 'assigned_date')
        })
    )

    actions = ['confirm_staff', 'unconfirm_staff']

    def role_badge(self, obj):
        colors = {
            'chief_judge': '#dc3545',
            'judge': '#28a745',
            'technical_delegate': '#007bff',
            'steward': '#17a2b8',
            'veterinarian': '#ffc107',
            'course_designer': '#6f42c1',
            'announcer': '#fd7e14',
            'timekeeper': '#20c997',
            'scorer': '#e83e8c'
        }
        color = colors.get(obj.role, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Rol'

    def confirmation_status(self, obj):
        if obj.is_confirmed:
            return format_html('<span style="color: green; font-weight: bold;">✓ Confirmado</span>')
        return format_html('<span style="color: orange;">⏳ Pendiente</span>')
    confirmation_status.short_description = 'Estado'

    def confirm_staff(self, request, queryset):
        count = queryset.update(is_confirmed=True)
        self.message_user(request, f'{count} miembros del personal confirmados.')
    confirm_staff.short_description = 'Confirmar personal'

    def unconfirm_staff(self, request, queryset):
        count = queryset.update(is_confirmed=False)
        self.message_user(request, f'{count} confirmaciones removidas.')
    unconfirm_staff.short_description = 'Quitar confirmación'


@admin.register(Horse)
class HorseAdmin(admin.ModelAdmin):
    """Admin para caballos"""
    list_display = [
        'name', 'registration_number', 'breed', 'gender',
        'age_display', 'owner', 'fei_status', 'availability_status'
    ]
    list_filter = ['gender', 'is_fei_registered', 'is_active', 'is_available_for_competition']
    search_fields = [
        'name', 'registration_number', 'microchip_number',
        'passport_number', 'fei_id', 'owner__username'
    ]
    readonly_fields = ['created_at', 'updated_at', 'age_display']

    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'registration_number', 'breed', 'color', 'gender', 'birth_date')
        }),
        ('Características Físicas', {
            'fields': ('height',)
        }),
        ('Propietario y Responsables', {
            'fields': ('owner', 'trainer')
        }),
        ('Registros y Documentos', {
            'fields': (
                'microchip_number', 'passport_number',
                'is_fei_registered', 'fei_id'
            )
        }),
        ('Estado', {
            'fields': ('is_active', 'is_available_for_competition')
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

    actions = ['activate_horses', 'deactivate_horses', 'make_available', 'make_unavailable']

    def age_display(self, obj):
        return f"{obj.age} años"
    age_display.short_description = 'Edad'

    def fei_status(self, obj):
        if obj.is_fei_registered:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ FEI: {}</span>',
                obj.fei_id or 'Pendiente'
            )
        return format_html('<span style="color: gray;">No registrado</span>')
    fei_status.short_description = 'Estado FEI'

    def availability_status(self, obj):
        if obj.is_active and obj.is_available_for_competition:
            return format_html('<span style="color: green; font-weight: bold;">✓ Disponible</span>')
        elif obj.is_active:
            return format_html('<span style="color: orange;">Activo pero no disponible</span>')
        return format_html('<span style="color: red;">✗ Inactivo</span>')
    availability_status.short_description = 'Disponibilidad'

    def activate_horses(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} caballos activados.')
    activate_horses.short_description = 'Activar caballos'

    def deactivate_horses(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} caballos desactivados.')
    deactivate_horses.short_description = 'Desactivar caballos'

    def make_available(self, request, queryset):
        count = queryset.update(is_available_for_competition=True)
        self.message_user(request, f'{count} caballos marcados como disponibles.')
    make_available.short_description = 'Marcar como disponibles'

    def make_unavailable(self, request, queryset):
        count = queryset.update(is_available_for_competition=False)
        self.message_user(request, f'{count} caballos marcados como no disponibles.')
    make_unavailable.short_description = 'Marcar como no disponibles'


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    """Admin para participantes"""
    list_display = [
        'bib_number', 'rider', 'horse', 'competition',
        'category', 'payment_status', 'confirmation_status',
        'registration_date'
    ]
    list_filter = [
        'is_confirmed', 'is_paid', 'competition',
        'category', 'registration_date'
    ]
    search_fields = [
        'rider__username', 'rider__first_name', 'rider__last_name',
        'horse__name', 'competition__name', 'bib_number'
    ]
    readonly_fields = ['registration_date', 'created_at', 'updated_at']

    fieldsets = (
        ('Participación', {
            'fields': ('competition', 'rider', 'horse', 'category', 'bib_number')
        }),
        ('Estado', {
            'fields': ('is_confirmed', 'is_paid')
        }),
        ('Contacto de Emergencia', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone')
        }),
        ('Información Adicional', {
            'fields': ('special_requirements',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('registration_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['confirm_participants', 'mark_as_paid', 'assign_bib_numbers']

    def payment_status(self, obj):
        if obj.is_paid:
            return format_html('<span style="color: green; font-weight: bold;">✓ Pagado</span>')
        return format_html('<span style="color: red;">✗ Pendiente</span>')
    payment_status.short_description = 'Pago'

    def confirmation_status(self, obj):
        if obj.is_confirmed:
            return format_html('<span style="color: green; font-weight: bold;">✓ Confirmado</span>')
        return format_html('<span style="color: orange;">⏳ Pendiente</span>')
    confirmation_status.short_description = 'Confirmación'

    def confirm_participants(self, request, queryset):
        count = queryset.update(is_confirmed=True)
        self.message_user(request, f'{count} participantes confirmados.')
    confirm_participants.short_description = 'Confirmar participantes'

    def mark_as_paid(self, request, queryset):
        count = queryset.update(is_paid=True)
        self.message_user(request, f'{count} participantes marcados como pagados.')
    mark_as_paid.short_description = 'Marcar como pagados'

    def assign_bib_numbers(self, request, queryset):
        """Auto-asignar números de dorsal"""
        participants = queryset.filter(bib_number__isnull=True).order_by('registration_date')
        competition = participants.first().competition if participants.exists() else None

        if competition:
            # Obtener el último número usado
            last_bib = Participant.objects.filter(
                competition=competition,
                bib_number__isnull=False
            ).order_by('-bib_number').first()

            start_number = (last_bib.bib_number + 1) if last_bib else 1

            for i, participant in enumerate(participants):
                participant.bib_number = start_number + i
                participant.save()

            self.message_user(request, f'{len(participants)} dorsales asignados.')
        else:
            self.message_user(request, 'No hay participantes para asignar.', level='warning')
    assign_bib_numbers.short_description = 'Auto-asignar dorsales'


@admin.register(CompetitionSchedule)
class CompetitionScheduleAdmin(admin.ModelAdmin):
    """Admin para programación de competencias"""
    list_display = [
        'competition', 'start_time', 'title', 'schedule_type_badge',
        'duration_display', 'discipline', 'category', 'publication_status'
    ]
    list_filter = ['schedule_type', 'is_published', 'competition', 'start_time']
    search_fields = ['title', 'description', 'competition__name']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Competencia', {
            'fields': ('competition',)
        }),
        ('Información del Evento', {
            'fields': ('title', 'description', 'schedule_type', 'location')
        }),
        ('Tiempo', {
            'fields': ('start_time', 'end_time', 'estimated_duration')
        }),
        ('Relaciones', {
            'fields': ('discipline', 'category')
        }),
        ('Publicación', {
            'fields': ('is_published',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['publish_events', 'unpublish_events']

    def schedule_type_badge(self, obj):
        colors = {
            'competition_start': '#28a745',
            'discipline_start': '#007bff',
            'category_start': '#17a2b8',
            'break': '#ffc107',
            'lunch': '#fd7e14',
            'awards': '#e83e8c',
            'special_event': '#6f42c1'
        }
        color = colors.get(obj.schedule_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color, obj.get_schedule_type_display()
        )
    schedule_type_badge.short_description = 'Tipo'

    def duration_display(self, obj):
        if obj.estimated_duration:
            total_seconds = int(obj.estimated_duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return "-"
    duration_display.short_description = 'Duración'

    def publication_status(self, obj):
        if obj.is_published:
            return format_html('<span style="color: green; font-weight: bold;">✓ Publicado</span>')
        return format_html('<span style="color: gray;">✗ Borrador</span>')
    publication_status.short_description = 'Publicación'

    def publish_events(self, request, queryset):
        count = queryset.update(is_published=True)
        self.message_user(request, f'{count} eventos publicados.')
    publish_events.short_description = 'Publicar eventos'

    def unpublish_events(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f'{count} eventos despublicados.')
    unpublish_events.short_description = 'Despublicar eventos'
