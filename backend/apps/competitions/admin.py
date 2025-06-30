from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import (
    Discipline, Category, Competition, CompetitionCategory,
    Horse, Rider, Registration, JudgeAssignment
)


@admin.register(Discipline)
class DisciplineAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'fei_code', 'is_active', 'categories_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code', 'fei_code']
    ordering = ['name']
    
    def categories_count(self, obj):
        return obj.categories.count()
    categories_count.short_description = 'Categorías'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'discipline', 'level', 'min_age_rider', 'max_age_rider',
        'min_age_horse', 'max_participants', 'entry_fee', 'is_active'
    ]
    list_filter = ['discipline', 'level', 'is_active']
    search_fields = ['name', 'code', 'discipline__name']
    ordering = ['discipline', 'level', 'name']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'code', 'discipline', 'level', 'description')
        }),
        ('Requisitos de Edad', {
            'fields': ('min_age_rider', 'max_age_rider', 'min_age_horse')
        }),
        ('Configuración', {
            'fields': ('max_participants', 'entry_fee', 'fei_parameters')
        }),
        ('Estado', {
            'fields': ('is_active',)
        })
    )


class CompetitionCategoryInline(admin.TabularInline):
    model = CompetitionCategory
    extra = 0
    fields = ['category', 'max_participants', 'entry_fee_override', 'start_time', 'order', 'is_active']


class JudgeAssignmentInline(admin.TabularInline):
    model = JudgeAssignment
    extra = 0
    fields = ['judge', 'role', 'order', 'fee', 'confirmed']


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'venue', 'start_date', 'end_date', 'organizer',
        'status', 'participants_count', 'is_fei_sanctioned', 'created_at'
    ]
    list_filter = [
        'status', 'is_fei_sanctioned', 'start_date', 'created_at'
    ]
    search_fields = ['name', 'venue', 'fei_code', 'organizer__username']
    ordering = ['-start_date', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'total_registered_participants']
    inlines = [CompetitionCategoryInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('id', 'name', 'description', 'venue', 'address')
        }),
        ('Fechas', {
            'fields': ('start_date', 'end_date', 'registration_start', 'registration_end')
        }),
        ('Organización', {
            'fields': ('organizer', 'created_by', 'contact_email', 'contact_phone', 'website')
        }),
        ('Configuración', {
            'fields': ('status', 'max_total_participants', 'allow_late_registration', 'late_registration_fee')
        }),
        ('Condiciones', {
            'fields': ('weather_condition', 'ground_condition', 'temperature')
        }),
        ('FEI', {
            'fields': ('is_fei_sanctioned', 'fei_code', 'regulations')
        }),
        ('Metadatos', {
            'fields': ('total_registered_participants', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def participants_count(self, obj):
        count = obj.total_registered_participants
        url = reverse('admin:competitions_registration_changelist') + f'?competition_category__competition__id={obj.id}'
        return format_html('<a href="{}">{} participantes</a>', url, count)
    participants_count.short_description = 'Participantes'


@admin.register(CompetitionCategory)
class CompetitionCategoryAdmin(admin.ModelAdmin):
    list_display = [
        'competition', 'category', 'max_participants', 'registered_count',
        'available_spots', 'effective_entry_fee', 'start_time', 'is_active'
    ]
    list_filter = ['competition__status', 'category__discipline', 'is_active']
    search_fields = ['competition__name', 'category__name']
    ordering = ['competition', 'order', 'category__name']
    inlines = [JudgeAssignmentInline]
    
    def registered_count(self, obj):
        return obj.registered_participants
    registered_count.short_description = 'Inscritos'


@admin.register(Horse)
class HorseAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'registration_number', 'breed', 'gender', 'age',
        'owner', 'country_of_birth', 'fei_id', 'is_active'
    ]
    list_filter = ['gender', 'breed', 'country_of_birth', 'is_active']
    search_fields = ['name', 'registration_number', 'passport_number', 'fei_id', 'owner']
    ordering = ['name']
    readonly_fields = ['age']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'registration_number', 'breed', 'color', 'gender', 'birth_date', 'age')
        }),
        ('Propietario', {
            'fields': ('owner', 'country_of_birth')
        }),
        ('Documentación', {
            'fields': ('passport_number', 'vaccination_current', 'health_certificate_valid', 'insurance_valid')
        }),
        ('Registros', {
            'fields': ('fei_id', 'national_registration')
        }),
        ('Estado', {
            'fields': ('is_active',)
        })
    )


@admin.register(Rider)
class RiderAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 'license_number', 'nationality', 'age',
        'license_type', 'license_valid_until', 'fei_id', 'is_active'
    ]
    list_filter = ['nationality', 'license_type', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'license_number', 'fei_id']
    ordering = ['user__last_name', 'user__first_name']
    readonly_fields = ['age']
    filter_horizontal = ['category_permissions']
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Información Personal', {
            'fields': ('nationality', 'birth_date', 'age', 'phone')
        }),
        ('Contacto de Emergencia', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone')
        }),
        ('Licencias y Registros', {
            'fields': ('license_number', 'license_type', 'license_valid_until', 'fei_id')
        }),
        ('Documentación', {
            'fields': ('insurance_valid', 'medical_certificate_valid')
        }),
        ('Experiencia', {
            'fields': ('experience_level', 'category_permissions')
        }),
        ('Estado', {
            'fields': ('is_active',)
        })
    )


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = [
        'rider', 'horse', 'competition_name', 'category_name',
        'status', 'start_number', 'entry_fee_paid', 'outstanding_balance',
        'registered_at'
    ]
    list_filter = [
        'status', 'competition_category__competition__status',
        'competition_category__category__discipline', 'registered_at'
    ]
    search_fields = [
        'rider__user__first_name', 'rider__user__last_name',
        'horse__name', 'competition_category__competition__name'
    ]
    ordering = ['-registered_at']
    readonly_fields = ['id', 'outstanding_balance', 'registered_at', 'updated_at']
    
    fieldsets = (
        ('Inscripción', {
            'fields': ('id', 'competition_category', 'rider', 'horse')
        }),
        ('Estado', {
            'fields': ('status', 'registered_at', 'confirmed_at', 'start_number')
        }),
        ('Pago', {
            'fields': ('entry_fee_paid', 'outstanding_balance', 'payment_reference', 'payment_date')
        }),
        ('Información Adicional', {
            'fields': ('special_requirements', 'notes')
        }),
        ('Metadatos', {
            'fields': ('created_by', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def competition_name(self, obj):
        return obj.competition_category.competition.name
    competition_name.short_description = 'Competencia'
    
    def category_name(self, obj):
        return obj.competition_category.category.name
    category_name.short_description = 'Categoría'
    
    actions = ['confirm_registrations', 'mark_as_paid', 'cancel_registrations']
    
    def confirm_registrations(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(status='CONFIRMED')
        self.message_user(request, f'{updated} inscripciones confirmadas.')
    confirm_registrations.short_description = "Confirmar inscripciones seleccionadas"
    
    def mark_as_paid(self, request, queryset):
        updated = queryset.filter(status='CONFIRMED').update(status='PAID')
        self.message_user(request, f'{updated} inscripciones marcadas como pagadas.')
    mark_as_paid.short_description = "Marcar como pagadas"
    
    def cancel_registrations(self, request, queryset):
        updated = queryset.update(status='CANCELLED')
        self.message_user(request, f'{updated} inscripciones canceladas.')
    cancel_registrations.short_description = "Cancelar inscripciones"


@admin.register(JudgeAssignment)
class JudgeAssignmentAdmin(admin.ModelAdmin):
    list_display = [
        'judge', 'competition_name', 'category_name', 'role',
        'order', 'fee', 'confirmed', 'created_at'
    ]
    list_filter = [
        'role', 'confirmed', 'competition_category__competition__status'
    ]
    search_fields = [
        'judge__first_name', 'judge__last_name',
        'competition_category__competition__name',
        'competition_category__category__name'
    ]
    ordering = ['competition_category__competition', 'order', 'role']
    
    fieldsets = (
        ('Asignación', {
            'fields': ('competition_category', 'judge', 'role', 'order')
        }),
        ('Compensación', {
            'fields': ('fee', 'travel_allowance', 'accommodation_provided')
        }),
        ('Estado', {
            'fields': ('confirmed', 'confirmation_date', 'notes')
        }),
        ('Metadatos', {
            'fields': ('created_by', 'created_at'),
            'classes': ('collapse',)
        })
    )
    
    def competition_name(self, obj):
        return obj.competition_category.competition.name
    competition_name.short_description = 'Competencia'
    
    def category_name(self, obj):
        return obj.competition_category.category.name
    category_name.short_description = 'Categoría'


# Configuración adicional del admin
admin.site.site_header = "Sistema FEI - Administración"
admin.site.site_title = "Sistema FEI Admin"
admin.site.index_title = "Panel de Administración"