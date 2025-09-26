#!/usr/bin/env python
"""
Script para crear datos de prueba para el sistema ecuestre FEI
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
from apps.competitions.models import Competition, Discipline, Event, EventEntry
from apps.scoring.models import ScoreCard, IndividualScore, Criteria, JudgeAssignment
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def create_test_data():
    print("🐎 Creando datos de prueba para el sistema ecuestre FEI...")

    # 1. Crear usuarios
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

    # 2. Crear disciplinas
    print("🏇 Creando disciplinas...")
    dressage, _ = Discipline.objects.get_or_create(
        name='Dressage',
        defaults={
            'fei_code': 'DR',
            'description': 'Dressage competitions focusing on horse and rider harmony',
            'scoring_system': 'percentage',
            'max_score': Decimal('10.00'),
            'min_score': Decimal('0.00')
        }
    )

    jumping, _ = Discipline.objects.get_or_create(
        name='Show Jumping',
        defaults={
            'fei_code': 'SJ',
            'description': 'Show jumping competitions with obstacles',
            'scoring_system': 'penalties',
            'max_score': Decimal('0.00'),
            'min_score': Decimal('0.00')
        }
    )

    # 3. Crear competición
    print("🏆 Creando competición...")
    competition, _ = Competition.objects.get_or_create(
        name='FEI Dressage World Cup - Madrid 2024',
        defaults={
            'fei_id': 'ESP2024001',
            'location': 'Madrid, Spain',
            'start_date': timezone.now().date(),
            'end_date': timezone.now().date() + timedelta(days=3),
            'organizer': organizer_user,
            'status': 'ongoing',
            'level': 'CDI4*',
            'max_participants': 50
        }
    )
    competition.disciplines.add(dressage)

    # 4. Crear eventos
    print("🎯 Creando eventos...")
    grand_prix, _ = Event.objects.get_or_create(
        competition=competition,
        name='Grand Prix',
        defaults={
            'discipline': dressage,
            'category': 'senior',
            'start_datetime': timezone.now() + timedelta(hours=2),
            'status': 'scheduled',
            'max_entries': 30
        }
    )

    # 5. Crear jinetes y caballos
    print("🐴 Creando jinetes y participantes...")
    rider1, created = User.objects.get_or_create(
        username='rider1',
        defaults={
            'email': 'rider1@example.com',
            'first_name': 'Ana',
            'last_name': 'Martínez'
        }
    )
    if created:
        rider1.set_password('rider123')
        rider1.save()

    if created:
        rider1.role = 'viewer'  # Los atletas son viewers con permisos especiales
        rider1.nationality = 'Spain'
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

    # 6. Crear inscripciones
    print("📝 Creando inscripciones...")
    entry1, _ = EventEntry.objects.get_or_create(
        event=grand_prix,
        rider=rider1,
        defaults={
            'horse_name': 'Belissimo',
            'horse_fei_id': 'ESP104567',
            'status': 'confirmed',
            'entry_number': 1
        }
    )

    entry2, _ = EventEntry.objects.get_or_create(
        event=grand_prix,
        rider=rider2,
        defaults={
            'horse_name': 'Donnerhall',
            'horse_fei_id': 'ESP104568',
            'status': 'confirmed',
            'entry_number': 2
        }
    )

    # 7. Crear criterios de puntuación
    print("📊 Creando criterios de puntuación...")
    criteria_data = [
        ('Halt at X', 'Quality of halt and immobility'),
        ('Working Trot', 'Rhythm, tempo, balance'),
        ('Medium Trot', 'Extension and collection'),
        ('Canter Depart', 'Quality of transition'),
        ('Flying Changes', 'Straightness and timing'),
        ('Piaffe', 'Activity and balance'),
        ('Passage', 'Elevation and rhythm'),
        ('Overall Impression', 'General harmony and presentation')
    ]

    criteria_objects = []
    for i, (name, desc) in enumerate(criteria_data):
        criteria, _ = Criteria.objects.get_or_create(
            name=name,
            defaults={
                'description': desc,
                'max_score': Decimal('10.0'),
                'coefficient': Decimal('1.0') if i < 7 else Decimal('2.0'),  # Última impresión x2
                'discipline': dressage
            }
        )
        criteria_objects.append(criteria)

    # 8. Crear asignaciones de jueces
    print("👨‍⚖️ Asignando jueces...")
    judge_assignment, _ = JudgeAssignment.objects.get_or_create(
        event=grand_prix,
        judge=judge_user,
        defaults={
            'position': 'C',
            'is_president': True
        }
    )

    # 9. Crear tarjetas de puntuación
    print("🎯 Creando tarjetas de puntuación...")

    # ScoreCard para rider1
    scorecard1, _ = ScoreCard.objects.get_or_create(
        event_entry=entry1,
        judge_assignment=judge_assignment,
        defaults={
            'status': 'in_progress',
            'total_score': Decimal('0.0'),
            'percentage': Decimal('0.0')
        }
    )

    # Puntuaciones individuales para rider1
    scores_rider1 = [8.5, 7.0, 7.5, 8.0, 6.5, 7.5, 8.0, 7.0]  # Última es impresión general
    for i, criteria in enumerate(criteria_objects):
        score, _ = IndividualScore.objects.get_or_create(
            score_card=scorecard1,
            criteria=criteria,
            defaults={
                'score': Decimal(str(scores_rider1[i])),
                'notes': f'Good execution for {criteria.name.lower()}'
            }
        )

    # ScoreCard para rider2
    scorecard2, _ = ScoreCard.objects.get_or_create(
        event_entry=entry2,
        judge_assignment=judge_assignment,
        defaults={
            'status': 'completed',
            'total_score': Decimal('0.0'),
            'percentage': Decimal('0.0')
        }
    )

    # Puntuaciones individuales para rider2
    scores_rider2 = [7.5, 8.0, 8.5, 7.0, 7.5, 6.5, 7.0, 7.5]
    for i, criteria in enumerate(criteria_objects):
        score, _ = IndividualScore.objects.get_or_create(
            score_card=scorecard2,
            criteria=criteria,
            defaults={
                'score': Decimal(str(scores_rider2[i])),
                'notes': f'Excellent performance in {criteria.name.lower()}'
            }
        )

    # Calcular totales
    print("🧮 Calculando totales...")
    scorecard1.calculate_totals()
    scorecard2.calculate_totals()

    print("✅ Datos de prueba creados exitosamente!")
    print("\n📋 Resumen de datos creados:")
    print(f"👥 Usuarios: {User.objects.count()}")
    print(f"🏇 Disciplinas: {Discipline.objects.count()}")
    print(f"🏆 Competiciones: {Competition.objects.count()}")
    print(f"🎯 Eventos: {Event.objects.count()}")
    print(f"📝 Inscripciones: {EventEntry.objects.count()}")
    print(f"📊 Criterios: {Criteria.objects.count()}")
    print(f"🎯 Tarjetas de puntuación: {ScoreCard.objects.count()}")
    print(f"🔢 Puntuaciones individuales: {IndividualScore.objects.count()}")

    print("\n🔑 Credenciales de acceso:")
    print("Admin: admin / admin123")
    print("Juez: judge1 / judge123")
    print("Organizador: organizer1 / org123")
    print("Jinete 1: rider1 / rider123")
    print("Jinete 2: rider2 / rider123")

if __name__ == '__main__':
    create_test_data()