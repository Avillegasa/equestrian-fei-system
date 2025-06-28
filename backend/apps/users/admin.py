from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, JudgeProfile, OrganizerProfile, UserPermission, AuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin personalizado para el modelo User extendido"""
    
    list_display = ('email', 'username', 'full_name', 'role', 'is_verified', 'is_active', 'date_joined')
    list_filter = ('role', 'is_verified', 'is_active', 'date_joined', 'country')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Información Personal'), {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'country')
        }),
        (_('Permisos y Roles'), {
            'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        (_('Fechas Importantes'), {
            'fields': ('last_login', 'date_joined')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'first_name', 'last_name', 'role'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login')
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Nombre Completo'
    
    actions = ['verify_users', 'unverify_users', 'activate_users', 'deactivate_users']
    
    def verify_users(self, request, queryset):
        count = queryset.update(is_verified=True)
        self.message_user(request, f'{count} usuarios verificados.')
    verify_users.short_description = 'Verificar usuarios seleccionados'
    
    def unverify_users(self, request, queryset):
        count = queryset.update(is_verified=False)
        self.message_user(request, f'{count} usuarios no verificados.')
    unverify_users.short_description = 'No verificar usuarios seleccionados'
    
    def activate_users(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} usuarios activados.')
    activate_users.short_description = 'Activar usuarios seleccionados'
    
    def deactivate_users(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} usuarios desactivados.')
    deactivate_users.short_description = 'Desactivar usuarios seleccionados'


@admin.register(JudgeProfile)
class JudgeProfileAdmin(admin.ModelAdmin):
    """Admin para perfiles de jueces"""
    
    list_display = (
        'user', 'fei_id', 'certification_level', 'get_disciplines',
        'is_active_judge', 'is_certification_valid', 'certification_date'
    )
    list_filter = (
        'certification_level', 'is_active_judge', 'certification_date',
        'user__country', 'user__is_verified'
    )
    search_fields = (
        'user__email', 'user__first_name', 'user__last_name',
        'fei_id', 'license_number'
    )
    ordering = ('-certification_date',)
    
    fieldsets = (
        (_('Usuario'), {
            'fields': ('user',)
        }),
        (_('Certificación FEI'), {
            'fields': ('fei_id', 'certification_level', 'certification_date', 'expiry_date', 'license_number')
        }),
        (_('Especialidades'), {
            'fields': ('disciplines', 'languages')
        }),
        (_('Información Adicional'), {
            'fields': ('biography', 'years_experience', 'is_active_judge'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('is_certification_valid',)
    
    def get_disciplines(self, obj):
        return ', '.join(obj.disciplines) if obj.disciplines else 'Ninguna'
    get_disciplines.short_description = 'Disciplinas'
    
    def is_certification_valid(self, obj):
        return obj.is_certification_valid
    is_certification_valid.boolean = True
    is_certification_valid.short_description = 'Certificación Válida'
    
    actions = ['activate_judges', 'deactivate_judges']
    
    def activate_judges(self, request, queryset):
        count = queryset.update(is_active_judge=True)
        self.message_user(request, f'{count} jueces activados.')
    activate_judges.short_description = 'Activar jueces seleccionados'
    
    def deactivate_judges(self, request, queryset):
        count = queryset.update(is_active_judge=False)
        self.message_user(request, f'{count} jueces desactivados.')
    deactivate_judges.short_description = 'Desactivar jueces seleccionados'


@admin.register(OrganizerProfile)
class OrganizerProfileAdmin(admin.ModelAdmin):
    """Admin para perfiles de organizadores"""
    
    list_display = (
        'user', 'organization_name', 'organization_type',
        'is_verified_organizer', 'contact_person', 'contact_email'
    )
    list_filter = (
        'organization_type', 'is_verified_organizer',
        'established_date', 'user__country'
    )
    search_fields = (
        'user__email', 'user__first_name', 'user__last_name',
        'organization_name', 'contact_person', 'contact_email'
    )
    ordering = ('-user__date_joined',)
    
    fieldsets = (
        (_('Usuario'), {
            'fields': ('user',)
        }),
        (_('Organización'), {
            'fields': ('organization_name', 'organization_type', 'license_number', 'website', 'established_date')
        }),
        (_('Contacto'), {
            'fields': ('contact_person', 'contact_email', 'contact_phone', 'address')
        }),
        (_('Información Adicional'), {
            'fields': ('description', 'is_verified_organizer'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['verify_organizers', 'unverify_organizers']
    
    def verify_organizers(self, request, queryset):
        count = queryset.update(is_verified_organizer=True)
        self.message_user(request, f'{count} organizadores verificados.')
    verify_organizers.short_description = 'Verificar organizadores seleccionados'
    
    def unverify_organizers(self, request, queryset):
        count = queryset.update(is_verified_organizer=False)
        self.message_user(request, f'{count} organizadores no verificados.')
    unverify_organizers.short_description = 'No verificar organizadores seleccionados'


@admin.register(UserPermission)
class UserPermissionAdmin(admin.ModelAdmin):
    """Admin para permisos de usuario"""
    
    list_display = ('user', 'module', 'permission', 'granted_by', 'granted_at')
    list_filter = ('module', 'permission', 'granted_at')
    search_fields = (
        'user__email', 'user__first_name', 'user__last_name',
        'granted_by__email', 'granted_by__first_name', 'granted_by__last_name'
    )
    ordering = ('-granted_at',)
    
    fieldsets = (
        (_('Permiso'), {
            'fields': ('user', 'module', 'permission')
        }),
        (_('Auditoría'), {
            'fields': ('granted_by', 'granted_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('granted_at',)
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editando objeto existente
            return self.readonly_fields + ('user', 'module', 'permission', 'granted_by')
        return self.readonly_fields
    
    def save_model(self, request, obj, form, change):
        if not change:  # Solo al crear
            obj.granted_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin para logs de auditoría - solo lectura"""
    
    list_display = ('user', 'action', 'resource_type', 'resource_id', 'timestamp', 'ip_address')
    list_filter = ('action', 'resource_type', 'timestamp')
    search_fields = (
        'user__email', 'user__first_name', 'user__last_name',
        'description', 'resource_id', 'ip_address'
    )
    ordering = ('-timestamp',)
    
    fieldsets = (
        (_('Acción'), {
            'fields': ('user', 'action', 'resource_type', 'resource_id', 'description')
        }),
        (_('Contexto'), {
            'fields': ('ip_address', 'user_agent', 'timestamp'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('user', 'action', 'resource_type', 'resource_id', 'description', 
                      'ip_address', 'user_agent', 'timestamp')
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


# Configuraciones adicionales para el admin

admin.site.site_header = 'Sistema FEI - Administración'
admin.site.site_title = 'FEI Admin'
admin.site.index_title = 'Panel de Administración del Sistema FEI'