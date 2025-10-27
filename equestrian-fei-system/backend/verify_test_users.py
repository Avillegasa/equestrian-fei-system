#!/usr/bin/env python
"""
Script para verificar usuarios de prueba en producción.
Marca is_verified=True para los usuarios: admin, organizer1, judge1
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

def verify_test_users():
    """Verifica los usuarios de prueba"""
    test_usernames = ['admin', 'organizer1', 'judge1']

    for username in test_usernames:
        try:
            user = User.objects.get(username=username)
            user.is_verified = True
            user.save()
            print(f"✅ Usuario '{username}' verificado exitosamente")
        except User.DoesNotExist:
            print(f"❌ Usuario '{username}' no encontrado")

    print("\n✨ Proceso completado")

if __name__ == '__main__':
    verify_test_users()
