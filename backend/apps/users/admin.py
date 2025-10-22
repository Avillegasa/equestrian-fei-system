from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils import timezone
from .models import User, JudgeProfile, OrganizerProfile, AuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin personalizado para el modelo User con roles FEI
    """
    list_display = [
        'username', 'email', 'full_name', 'role_badge',
        'is_verified', 'is_active', 'is_staff', 'date_joined'
    ]
    list_filter = ['role', 'is_verified', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']

    fieldsets = (
        ('Credenciales', {
            'fields': ('username', 'password')
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'birth_date', 'nationality')
        }),
        ('Roles y Permisos', {
            'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser')
        }),
        ('Grupos y Permisos Específicos', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Fechas Importantes', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    readonly_fields = ['created_at', 'updated_at', 'last_login', 'date_joined']

    add_fieldsets = (
        ('Crear Nuevo Usuario', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'is_verified')
        }),
    )

    actions = ['verify_users', 'unverify_users', 'make_admin', 'make_organizer', 'make_judge']

    def role_badge(self, obj):
        """Muestra el rol con un badge de color"""
        colors = {
            'admin': '#dc3545',
            'organizer': '#007bff',
            'judge': '#28a745',
            'viewer': '#6c757d'
        }
        color = colors.get(obj.role, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Rol'

    def full_name(self, obj):
        return obj.full_name or '(Sin nombre)'
    full_name.short_description = 'Nombre Completo'

    # Acciones personalizadas
    def verify_users(self, request, queryset):
        count = queryset.update(is_verified=True)
        self.message_user(request, f'{count} usuarios verificados correctamente.')
    verify_users.short_description = 'Verificar usuarios seleccionados'

    def unverify_users(self, request, queryset):
        count = queryset.update(is_verified=False)
        self.message_user(request, f'{count} usuarios marcados como no verificados.')
    unverify_users.short_description = 'Quitar verificación'

    def make_admin(self, request, queryset):
        count = queryset.update(role='admin', is_staff=True)
        self.message_user(request, f'{count} usuarios convertidos a Administradores.')
    make_admin.short_description = 'Convertir a Administrador'

    def make_organizer(self, request, queryset):
        count = queryset.update(role='organizer')
        self.message_user(request, f'{count} usuarios convertidos a Organizadores.')
    make_organizer.short_description = 'Convertir a Organizador'

    def make_judge(self, request, queryset):
        count = queryset.update(role='judge')
        self.message_user(request, f'{count} usuarios convertidos a Jueces.')
    make_judge.short_description = 'Convertir a Juez'


@admin.register(JudgeProfile)
class JudgeProfileAdmin(admin.ModelAdmin):
    """
    Admin para perfiles de jueces FEI
    """
    list_display = [
        'user', 'license_number', 'certification_badge',
        'certification_status', 'years_experience', 'is_active_judge'
    ]
    list_filter = ['certification_level', 'is_active_judge', 'certification_expiry']
    search_fields = ['user__username', 'user__email', 'license_number', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Juez', {
            'fields': ('user',)
        }),
        ('Certificación FEI', {
            'fields': ('license_number', 'certification_level', 'certification_expiry', 'is_active_judge')
        }),
        ('Especialización', {
            'fields': ('specializations', 'years_experience')
        }),
        ('Información Adicional', {
            'fields': ('bio',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['activate_judges', 'deactivate_judges', 'extend_certification']

    def certification_badge(self, obj):
        """Muestra el nivel de certificación con color"""
        colors = {
            'national': '#17a2b8',
            'international': '#28a745',
            'fei_3star': '#ffc107',
            'fei_4star': '#fd7e14',
            'fei_5star': '#dc3545'
        }
        color = colors.get(obj.certification_level, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_certification_level_display()
        )
    certification_badge.short_description = 'Nivel de Certificación'

    def certification_status(self, obj):
        """Muestra si la certificación está vigente"""
        is_valid = obj.is_certified
        if is_valid:
            return format_html('<span style="color: green; font-weight: bold;">✓ Vigente</span>')
        else:
            return format_html('<span style="color: red; font-weight: bold;">✗ Expirada</span>')
    certification_status.short_description = 'Estado Certificación'

    def activate_judges(self, request, queryset):
        count = queryset.update(is_active_judge=True)
        self.message_user(request, f'{count} jueces activados correctamente.')
    activate_judges.short_description = 'Activar jueces'

    def deactivate_judges(self, request, queryset):
        count = queryset.update(is_active_judge=False)
        self.message_user(request, f'{count} jueces desactivados.')
    deactivate_judges.short_description = 'Desactivar jueces'

    def extend_certification(self, request, queryset):
        from datetime import timedelta
        for profile in queryset:
            profile.certification_expiry += timedelta(days=365)
            profile.save()
        self.message_user(request, f'Certificaciones extendidas por 1 año para {queryset.count()} jueces.')
    extend_certification.short_description = 'Extender certificación 1 año'


@admin.register(OrganizerProfile)
class OrganizerProfileAdmin(admin.ModelAdmin):
    """
    Admin para perfiles de organizadores
    """
    list_display = [
        'organization_name', 'user', 'contact_email', 'contact_phone',
        'verification_status', 'can_create_competitions'
    ]
    list_filter = ['is_verified_organizer', 'can_create_competitions', 'created_at']
    search_fields = [
        'organization_name', 'user__username', 'user__email',
        'contact_email', 'user__first_name', 'user__last_name'
    ]
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Organización', {
            'fields': ('organization_name', 'contact_email', 'contact_phone', 'website')
        }),
        ('Dirección', {
            'fields': ('address',)
        }),
        ('Permisos', {
            'fields': ('is_verified_organizer', 'can_create_competitions')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['verify_organizers', 'unverify_organizers', 'grant_competition_rights', 'revoke_competition_rights']

    def verification_status(self, obj):
        """Muestra el estado de verificación"""
        if obj.is_verified_organizer:
            return format_html('<span style="color: green; font-weight: bold;">✓ Verificado</span>')
        else:
            return format_html('<span style="color: orange; font-weight: bold;">⚠ Sin Verificar</span>')
    verification_status.short_description = 'Estado'

    def verify_organizers(self, request, queryset):
        count = queryset.update(is_verified_organizer=True)
        self.message_user(request, f'{count} organizadores verificados correctamente.')
    verify_organizers.short_description = 'Verificar organizadores'

    def unverify_organizers(self, request, queryset):
        count = queryset.update(is_verified_organizer=False)
        self.message_user(request, f'{count} organizadores marcados como no verificados.')
    unverify_organizers.short_description = 'Quitar verificación'

    def grant_competition_rights(self, request, queryset):
        count = queryset.update(can_create_competitions=True)
        self.message_user(request, f'{count} organizadores ahora pueden crear competencias.')
    grant_competition_rights.short_description = 'Otorgar derechos de creación'

    def revoke_competition_rights(self, request, queryset):
        count = queryset.update(can_create_competitions=False)
        self.message_user(request, f'{count} organizadores ya no pueden crear competencias.')
    revoke_competition_rights.short_description = 'Revocar derechos de creación'


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Admin para logs de auditoría del sistema
    """
    list_display = [
        'timestamp', 'user', 'action_badge', 'model_name',
        'object_id', 'ip_address'
    ]
    list_filter = ['action', 'model_name', 'timestamp']
    search_fields = ['user__username', 'model_name', 'object_id', 'ip_address']
    readonly_fields = ['id', 'user', 'action', 'model_name', 'object_id', 'changes', 'ip_address', 'user_agent', 'timestamp']
    ordering = ['-timestamp']

    fieldsets = (
        ('Información del Log', {
            'fields': ('id', 'timestamp', 'user', 'ip_address')
        }),
        ('Acción', {
            'fields': ('action', 'model_name', 'object_id')
        }),
        ('Cambios', {
            'fields': ('changes',)
        }),
        ('Detalles Técnicos', {
            'fields': ('user_agent',),
            'classes': ('collapse',)
        })
    )

    def has_add_permission(self, request):
        # No se pueden crear logs manualmente
        return False

    def has_delete_permission(self, request, obj=None):
        # Solo superusuarios pueden borrar logs
        return request.user.is_superuser

    def action_badge(self, obj):
        """Muestra la acción con un badge de color"""
        colors = {
            'create': '#28a745',
            'update': '#17a2b8',
            'delete': '#dc3545',
            'login': '#007bff',
            'logout': '#6c757d',
            'score_submit': '#ffc107',
            'competition_create': '#20c997',
            'competition_start': '#fd7e14',
            'competition_finish': '#e83e8c'
        }
        color = colors.get(obj.action, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color, obj.get_action_display()
        )
    action_badge.short_description = 'Acción'
