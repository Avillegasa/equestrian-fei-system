from django.db.models.signals import post_save, pre_delete, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import User, JudgeProfile, OrganizerProfile, AuditLog


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Crear perfiles automáticamente según el rol del usuario"""
    if created:
        # Log de creación de usuario
        AuditLog.objects.create(
            user=instance,
            action=AuditLog.Action.CREATE,
            resource_type='user',
            resource_id=str(instance.id),
            description=f'Nuevo usuario registrado: {instance.email} con rol {instance.role}'
        )
        
        # Crear perfil específico según el rol
        if instance.role == User.UserRole.JUDGE:
            # No crear automáticamente, que el usuario complete su perfil
            pass
        elif instance.role == User.UserRole.ORGANIZER:
            # No crear automáticamente, que el usuario complete su perfil
            pass


@receiver(post_save, sender=User)
def user_role_changed(sender, instance, created, **kwargs):
    """Manejar cambios de rol del usuario"""
    if not created:  # Solo para usuarios existentes
        # Verificar si el rol cambió
        try:
            old_instance = User.objects.get(pk=instance.pk)
            if old_instance.role != instance.role:
                AuditLog.objects.create(
                    user=instance,
                    action=AuditLog.Action.UPDATE,
                    resource_type='user',
                    resource_id=str(instance.id),
                    description=f'Rol cambiado de {old_instance.role} a {instance.role}'
                )
        except User.DoesNotExist:
            pass


@receiver(post_save, sender=JudgeProfile)
def judge_profile_created_or_updated(sender, instance, created, **kwargs):
    """Log cuando se crea o actualiza un perfil de juez"""
    action = AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE
    description = f'Perfil de juez {"creado" if created else "actualizado"}: {instance.user.email}'
    
    AuditLog.objects.create(
        user=instance.user,
        action=action,
        resource_type='judge_profile',
        resource_id=str(instance.id),
        description=description
    )


@receiver(post_save, sender=OrganizerProfile)
def organizer_profile_created_or_updated(sender, instance, created, **kwargs):
    """Log cuando se crea o actualiza un perfil de organizador"""
    action = AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE
    description = f'Perfil de organizador {"creado" if created else "actualizado"}: {instance.user.email}'
    
    AuditLog.objects.create(
        user=instance.user,
        action=action,
        resource_type='organizer_profile',
        resource_id=str(instance.id),
        description=description
    )


@receiver(pre_delete, sender=User)
def user_pre_delete(sender, instance, **kwargs):
    """Log antes de eliminar un usuario"""
    AuditLog.objects.create(
        user=instance,
        action=AuditLog.Action.DELETE,
        resource_type='user',
        resource_id=str(instance.id),
        description=f'Usuario eliminado: {instance.email}'
    )


@receiver(post_delete, sender=JudgeProfile)
def judge_profile_deleted(sender, instance, **kwargs):
    """Log cuando se elimina un perfil de juez"""
    AuditLog.objects.create(
        user=None,  # El usuario podría ya no existir
        action=AuditLog.Action.DELETE,
        resource_type='judge_profile',
        resource_id=str(instance.id),
        description=f'Perfil de juez eliminado: {instance.user.email if instance.user else "Usuario eliminado"}'
    )


@receiver(post_delete, sender=OrganizerProfile)
def organizer_profile_deleted(sender, instance, **kwargs):
    """Log cuando se elimina un perfil de organizador"""
    AuditLog.objects.create(
        user=None,  # El usuario podría ya no existir
        action=AuditLog.Action.DELETE,
        resource_type='organizer_profile',
        resource_id=str(instance.id),
        description=f'Perfil de organizador eliminado: {instance.user.email if instance.user else "Usuario eliminado"}'
    )


@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    """Log cuando un usuario inicia sesión"""
    ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
    if ip_address:
        ip_address = ip_address.split(',')[0]
    else:
        ip_address = request.META.get('REMOTE_ADDR')
    
    AuditLog.objects.create(
        user=user,
        action=AuditLog.Action.LOGIN,
        resource_type='session',
        description=f'Usuario conectado: {user.email}',
        ip_address=ip_address,
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )


@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    """Log cuando un usuario cierra sesión"""
    if user:  # user puede ser None en algunos casos
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip_address:
            ip_address = ip_address.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        AuditLog.objects.create(
            user=user,
            action=AuditLog.Action.LOGOUT,
            resource_type='session',
            description=f'Usuario desconectado: {user.email}',
            ip_address=ip_address,
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )