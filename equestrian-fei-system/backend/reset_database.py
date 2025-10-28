"""
  Script para resetear la base de datos después del cambio UUID -> Integer
  ADVERTENCIA: Esto eliminará TODOS los datos existentes
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import call_command
from django.db import connection
from apps.users.models import User
from apps.competitions.models import Venue, Competition

def reset_database():
    print("=" * 60)
    print("RESETEANDO BASE DE DATOS - UUID a Integer")
    print("=" * 60)

    # Paso 1: Eliminar todas las tablas
    print("\n1. Eliminando tablas existentes...")
    with connection.cursor() as cursor:
        cursor.execute("""
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        """)
    print("   Tablas eliminadas")

    # Paso 2: Eliminar migraciones viejas
    print("\n2. Limpiando migraciones...")
    call_command('migrate', '--fake', 'zero', '--all')

    # Paso 3: Crear nuevas migraciones
    print("\n3. Creando nuevas migraciones...")
    call_command('makemigrations')

    # Paso 4: Aplicar migraciones
    print("\n4. Aplicando migraciones...")
    call_command('migrate')

    # Paso 5: Crear usuarios de prueba
    print("\n5. Creando usuarios de prueba...")

    # Admin
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@equestrian-fei.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        role='admin'
    )
    print(f"   Admin creado: {admin.username} (ID: {admin.id})")

    # Organizador
    organizer = User.objects.create_user(
        username='organizer1',
        email='organizer@equestrian-fei.com',
        password='org123',
        first_name='Carlos',
        last_name='Rodríguez',
        role='organizer',
        is_active=True
    )
    print(f"   Organizador creado: {organizer.username} (ID: {organizer.id})")

    # Juez
    judge = User.objects.create_user(
        username='judge1',
        email='judge@equestrian-fei.com',
        password='judge123',
        first_name='María',
        last_name='González',
        role='judge',
        is_active=True
    )
    print(f"   Juez creado: {judge.username} (ID: {judge.id})")

    print("\n" + "=" * 60)
    print("RESET COMPLETADO EXITOSAMENTE")
    print("=" * 60)
    print("\nCredenciales:")
    print("  Admin:       admin / admin123")
    print("  Organizador: organizer1 / org123")
    print("  Juez:        judge1 / judge123")
    print("=" * 60)

if __name__ == '__main__':
    reset_database()