#!/usr/bin/env python
"""
Script simplificado para crear datos de prueba básicos
"""
import os
import sys
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import JudgeProfile, OrganizerProfile
from apps.competitions.models import Competition, Discipline, Category, Venue
from apps.scoring.models import ScoreCard, IndividualScore, ScoringCriteria
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def create_simple_test_data():
    print("🐎 Creando datos de prueba básicos para el sistema ecuestre FEI...")

    # 1. Crear usuarios básicos
    print("👥 Creando usuarios...")
    admin = User.objects.get(username='admin')
    admin.role = 'admin'
    admin.nationality = 'International'
    admin.save()

    # Juez
    judge_user, created = User.objects.get_or_create(
        username='judge1',
        defaults={
            'email': 'judge1@fei.com',
            'first_name': 'María',
            'last_name': 'García',
            'role': 'judge',
            'nationality': 'Spain'
        }
    )
    if created:
        judge_user.set_password('judge123')
        judge_user.save()

    judge_profile, _ = JudgeProfile.objects.get_or_create(
        user=judge_user,
        defaults={
            'license_number': 'FEI-J-002',
            'certification_level': 'fei_4star',
            'specializations': ['dressage', 'jumping'],
            'certification_expiry': timezone.now().date() + timedelta(days=365),
            'years_experience': 15
        }
    )

    # Organizador
    organizer_user, created = User.objects.get_or_create(
        username='organizer1',
        defaults={
            'email': 'organizer1@fei.com',
            'first_name': 'Carlos',
            'last_name': 'Rodríguez',
            'role': 'organizer',
            'nationality': 'Spain'
        }
    )
    if created:
        organizer_user.set_password('org123')
        organizer_user.save()

    organizer_profile, _ = OrganizerProfile.objects.get_or_create(
        user=organizer_user,
        defaults={
            'organization_name': 'Club Hípico Madrid',
            'contact_phone': '+34 91 123 4567',
            'contact_email': 'info@clubhipicomadrid.es',
            'is_verified_organizer': True,
            'can_create_competitions': True
        }
    )

    # 2. Crear disciplinas básicas
    print("🏇 Creando disciplinas...")
    dressage, _ = Discipline.objects.get_or_create(
        name='Dressage',
        defaults={
            'code': 'DR',
            'discipline_type': 'dressage',
            'description': 'Dressage competitions focusing on horse and rider harmony',
            'scoring_system': 'percentage',
            'max_duration_minutes': 60
        }
    )

    jumping, _ = Discipline.objects.get_or_create(
        name='Show Jumping',
        defaults={
            'code': 'SJ',
            'discipline_type': 'jumping',
            'description': 'Show jumping competitions with obstacles',
            'scoring_system': 'penalties',
            'max_duration_minutes': 90
        }
    )

    # 3. Crear categorías
    print("🎯 Creando categorías...")
    senior_category, _ = Category.objects.get_or_create(
        name='Senior',
        defaults={
            'code': 'SR',
            'category_type': 'level',
            'level': 'professional',
            'description': 'Senior level competition',
            'max_participants': 50,
            'entry_fee': Decimal('150.00')
        }
    )

    # 4. Crear venue
    print("🏟️ Creando sede...")
    venue, _ = Venue.objects.get_or_create(
        name='Club Hípico Madrid',
        defaults={
            'address': 'Calle de la Hípica, 1, 28040 Madrid',
            'city': 'Madrid',
            'state_province': 'Madrid',
            'country': 'Spain',
            'postal_code': '28040',
            'capacity': 500,
            'phone': '+34 91 123 4567',
            'email': 'venue@clubhipicomadrid.es',
            'indoor_arena': True,
            'outdoor_arena': True,
            'warm_up_area': True,
            'stabling': 100
        }
    )

    # 5. Crear competición básica
    print("🏆 Creando competición...")
    start_datetime = timezone.now() + timedelta(days=7)
    end_datetime = timezone.now() + timedelta(days=10)
    reg_start = timezone.now()
    reg_end = timezone.now() + timedelta(days=5)

    competition, _ = Competition.objects.get_or_create(
        name='FEI Dressage Madrid 2024',
        defaults={
            'short_name': 'Dressage Madrid 2024',
            'venue': venue,
            'start_date': start_datetime,
            'end_date': end_datetime,
            'registration_start': reg_start,
            'registration_end': reg_end,
            'organizer': organizer_user,
            'status': 'open_registration',
            'competition_type': 'international',
            'max_participants': 50,
            'entry_fee': Decimal('200.00'),
            'late_fee': Decimal('50.00'),
            'is_championship': False,
            'points_for_ranking': True,
            'description': 'International Dressage Competition in Madrid'
        }
    )
    competition.disciplines.add(dressage)
    competition.categories.add(senior_category)

    # 6. Crear algunos usuarios jinetes
    print("🐴 Creando jinetes...")
    rider1, created = User.objects.get_or_create(
        username='rider1',
        defaults={
            'email': 'rider1@example.com',
            'first_name': 'Ana',
            'last_name': 'Martínez',
            'role': 'viewer',
            'nationality': 'Spain'
        }
    )
    if created:
        rider1.set_password('rider123')
        rider1.save()

    rider2, created = User.objects.get_or_create(
        username='rider2',
        defaults={
            'email': 'rider2@example.com',
            'first_name': 'Pedro',
            'last_name': 'González',
            'role': 'viewer',
            'nationality': 'Spain'
        }
    )
    if created:
        rider2.set_password('rider123')
        rider2.save()

    print("✅ Datos de prueba básicos creados exitosamente!")
    print("\n📋 Resumen de datos creados:")
    print(f"👥 Usuarios: {User.objects.count()}")
    print(f"🏇 Disciplinas: {Discipline.objects.count()}")
    print(f"🎯 Categorías: {Category.objects.count()}")
    print(f"🏟️ Sedes: {Venue.objects.count()}")
    print(f"🏆 Competiciones: {Competition.objects.count()}")
    print(f"👨‍⚖️ Perfiles de jueces: {JudgeProfile.objects.count()}")
    print(f"👨‍💼 Perfiles de organizadores: {OrganizerProfile.objects.count()}")

    print("\n🔑 Credenciales de acceso:")
    print("Admin: admin / admin123")
    print("Juez: judge1 / judge123")
    print("Organizador: organizer1 / org123")
    print("Jinete 1: rider1 / rider123")
    print("Jinete 2: rider2 / rider123")

    print("\n🚀 ¡El sistema está listo para probar!")
    print("Puede ejecutar: python manage.py runserver")

if __name__ == '__main__':
    create_simple_test_data()