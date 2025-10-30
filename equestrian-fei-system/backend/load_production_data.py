#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de carga de datos de PRODUCCIÓN para FEI Equestrian System
Crea competencias activas en vivo con datos bolivianos para entrega a usuarios finales

Uso:
    python load_production_data.py
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.users.models import JudgeProfile, OrganizerProfile
from apps.competitions.models import (
    Discipline,
    Category,
    Venue,
    Competition,
    CompetitionStaff,
    Horse,
    Participant,
    CompetitionSchedule
)
from apps.scoring.models import (
    ScoringCriteria,
    ScoreCard,
    IndividualScore,
    CompetitionRanking,
    RankingEntry
)

User = get_user_model()


def print_section(title):
    """Imprime título de sección"""
    print(f'\n{"=" * 70}')
    print(f'  {title}')
    print(f'{"=" * 70}')


def rename_existing_competitions():
    """Renombra todas las competencias existentes al formato boliviano"""
    print_section('RENOMBRANDO COMPETENCIAS EXISTENTES')

    # Obtener o crear venue de La Paz
    venue, _ = Venue.objects.get_or_create(
        name='Campo Ecuestre Apostol Santiago',
        defaults={
            'address': 'Zona Sur, Calacoto',
            'city': 'La Paz',
            'state_province': 'La Paz',
            'country': 'Bolivia',
            'postal_code': '00000',
            'phone': '+591 2 277 1234',
            'email': 'info@apostolsantiago.bo',
            'capacity': 300,
            'indoor_arena': True,
            'outdoor_arena': True,
            'warm_up_area': True,
            'stabling': 50,
        }
    )
    print(f'  ✅ Venue creado/actualizado: {venue.name}')

    # Renombrar competencias existentes
    existing_competitions = Competition.objects.all()

    comp_type_names = {
        'international': 'Internacional',
        'national': 'Nacional',
        'regional': 'Regional',
        'local': 'Local',
        'championship': 'Campeonato',
    }

    renamed_count = 0
    for comp in existing_competitions:
        old_name = comp.name
        comp_type = comp_type_names.get(comp.competition_type, 'General')

        # Nuevo formato: "Competencia [Tipo] - La Paz, Bolivia"
        comp.name = f"Competencia {comp_type} - La Paz, Bolivia"
        comp.venue = venue
        comp.save()

        print(f'  ✅ Renombrada: "{old_name}" → "{comp.name}"')
        renamed_count += 1

    print(f'\n  📊 Total renombradas: {renamed_count}')
    return venue


def create_bolivian_riders():
    """Crea jinetes bolivianos para las competencias"""
    print_section('CREANDO JINETES BOLIVIANOS')

    bolivian_riders_data = [
        {'username': 'rider_paz_carlos', 'email': 'carlos.mendoza@example.bo', 'password': 'rider123', 'first_name': 'Carlos', 'last_name': 'Mendoza', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_maria', 'email': 'maria.gutierrez@example.bo', 'password': 'rider123', 'first_name': 'María', 'last_name': 'Gutiérrez', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_jorge', 'email': 'jorge.vargas@example.bo', 'password': 'rider123', 'first_name': 'Jorge', 'last_name': 'Vargas', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_ana', 'email': 'ana.rojas@example.bo', 'password': 'rider123', 'first_name': 'Ana', 'last_name': 'Rojas', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_luis', 'email': 'luis.chavez@example.bo', 'password': 'rider123', 'first_name': 'Luis', 'last_name': 'Chávez', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_sofia', 'email': 'sofia.morales@example.bo', 'password': 'rider123', 'first_name': 'Sofía', 'last_name': 'Morales', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_diego', 'email': 'diego.rivera@example.bo', 'password': 'rider123', 'first_name': 'Diego', 'last_name': 'Rivera', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_valentina', 'email': 'valentina.santos@example.bo', 'password': 'rider123', 'first_name': 'Valentina', 'last_name': 'Santos', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_andres', 'email': 'andres.lopez@example.bo', 'password': 'rider123', 'first_name': 'Andrés', 'last_name': 'López', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_camila', 'email': 'camila.garcia@example.bo', 'password': 'rider123', 'first_name': 'Camila', 'last_name': 'García', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_ricardo', 'email': 'ricardo.flores@example.bo', 'password': 'rider123', 'first_name': 'Ricardo', 'last_name': 'Flores', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_daniela', 'email': 'daniela.martinez@example.bo', 'password': 'rider123', 'first_name': 'Daniela', 'last_name': 'Martínez', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_fernando', 'email': 'fernando.torrez@example.bo', 'password': 'rider123', 'first_name': 'Fernando', 'last_name': 'Torrez', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_paula', 'email': 'paula.suarez@example.bo', 'password': 'rider123', 'first_name': 'Paula', 'last_name': 'Suárez', 'role': 'viewer', 'nationality': 'Bolivia'},
        {'username': 'rider_paz_miguel', 'email': 'miguel.ortiz@example.bo', 'password': 'rider123', 'first_name': 'Miguel', 'last_name': 'Ortiz', 'role': 'viewer', 'nationality': 'Bolivia'},
    ]

    riders = []
    for rider_data in bolivian_riders_data:
        username = rider_data['username']
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            print(f'  ℹ️  Jinete ya existe: {user.get_full_name()}')
        else:
            password = rider_data.pop('password')
            user = User.objects.create_user(**rider_data, password=password)
            user.is_verified = True
            user.save()
            print(f'  ✅ Jinete creado: {user.get_full_name()} ({username})')
        riders.append(user)

    return riders


def create_bolivian_horses(riders):
    """Crea caballos bolivianos para los jinetes"""
    print_section('CREANDO CABALLOS BOLIVIANOS')

    horses_data = [
        {'name': 'Illimani', 'registration_number': 'BOL-2018-001', 'breed': 'Criollo', 'color': 'Alazán', 'gender': 'stallion', 'height': 152},
        {'name': 'Tunari', 'registration_number': 'BOL-2017-002', 'breed': 'Criollo', 'color': 'Tordillo', 'gender': 'gelding', 'height': 150},
        {'name': 'Sajama', 'registration_number': 'BOL-2019-003', 'breed': 'PRE', 'color': 'Castaño', 'gender': 'mare', 'height': 158},
        {'name': 'Huayna', 'registration_number': 'BOL-2016-004', 'breed': 'Criollo', 'color': 'Moro', 'gender': 'stallion', 'height': 153},
        {'name': 'Potosí', 'registration_number': 'BOL-2018-005', 'breed': 'Andaluz', 'color': 'Negro', 'gender': 'gelding', 'height': 161},
        {'name': 'Titicaca', 'registration_number': 'BOL-2017-006', 'breed': 'Lusitano', 'color': 'Isabelo', 'gender': 'mare', 'height': 159},
        {'name': 'Condoriri', 'registration_number': 'BOL-2019-007', 'breed': 'Criollo', 'color': 'Alazán Tostado', 'gender': 'stallion', 'height': 151},
        {'name': 'Mururata', 'registration_number': 'BOL-2016-008', 'breed': 'PRE', 'color': 'Tordo', 'gender': 'gelding', 'height': 160},
        {'name': 'Chacaltaya', 'registration_number': 'BOL-2018-009', 'breed': 'Criollo', 'color': 'Bayo', 'gender': 'mare', 'height': 152},
        {'name': 'Ancohuma', 'registration_number': 'BOL-2017-010', 'breed': 'Andaluz', 'color': 'Castaño Oscuro', 'gender': 'stallion', 'height': 162},
        {'name': 'Quimsa Cruz', 'registration_number': 'BOL-2019-011', 'breed': 'PRE', 'color': 'Palomino', 'gender': 'gelding', 'height': 159},
        {'name': 'Illampú', 'registration_number': 'BOL-2016-012', 'breed': 'Lusitano', 'color': 'Alazán', 'gender': 'mare', 'height': 157},
        {'name': 'Wila Lluxita', 'registration_number': 'BOL-2018-013', 'breed': 'Criollo', 'color': 'Colorado', 'gender': 'stallion', 'height': 154},
        {'name': 'Huayna Potosí', 'registration_number': 'BOL-2017-014', 'breed': 'Andaluz', 'color': 'Tordo Rodado', 'gender': 'gelding', 'height': 163},
        {'name': 'Tuni', 'registration_number': 'BOL-2019-015', 'breed': 'PRE', 'color': 'Castaño', 'gender': 'mare', 'height': 158},
        {'name': 'Tres Cruces', 'registration_number': 'BOL-2016-016', 'breed': 'Criollo', 'color': 'Overo', 'gender': 'stallion', 'height': 151},
        {'name': 'Zongo', 'registration_number': 'BOL-2018-017', 'breed': 'Lusitano', 'color': 'Negro', 'gender': 'gelding', 'height': 160},
        {'name': 'Palca', 'registration_number': 'BOL-2017-018', 'breed': 'Andaluz', 'color': 'Alazán Claro', 'gender': 'mare', 'height': 159},
        {'name': 'Yungas', 'registration_number': 'BOL-2019-019', 'breed': 'Criollo', 'color': 'Bayo Gateado', 'gender': 'stallion', 'height': 152},
        {'name': 'Coroico', 'registration_number': 'BOL-2016-020', 'breed': 'PRE', 'color': 'Tordo', 'gender': 'gelding', 'height': 161},
    ]

    horses = []
    for i, horse_data in enumerate(horses_data):
        owner = riders[i % len(riders)]
        birth_date = timezone.now().date() - timedelta(days=365 * random.randint(6, 12))

        if Horse.objects.filter(registration_number=horse_data['registration_number']).exists():
            horse = Horse.objects.get(registration_number=horse_data['registration_number'])
            print(f'  ℹ️  Caballo ya existe: {horse_data["name"]}')
        else:
            is_registered = random.choice([True, False])
            horse = Horse.objects.create(
                owner=owner,
                birth_date=birth_date,
                is_fei_registered=is_registered,
                fei_id=f'BOL{random.randint(40000, 49999)}' if is_registered else '',
                **horse_data
            )
            print(f'  ✅ Caballo creado: {horse_data["name"]} (Propietario: {owner.get_full_name()})')
        horses.append(horse)

    return horses


def create_live_competitions(venue, disciplines, categories, users):
    """Crea 2 competencias activas (una en vivo, otra próxima)"""
    print_section('CREANDO COMPETENCIAS ACTIVAS')

    dressage = disciplines['DR']
    jumping = disciplines['SJ']
    organizer = User.objects.filter(role='organizer').first()

    # Competencia 1: EN VIVO (in_progress)
    comp1_data = {
        'name': 'Copa Internacional de Doma - La Paz 2025',
        'short_name': 'Copa Doma LP 2025',
        'organizer': organizer,
        'venue': venue,
        'description': 'Copa internacional de doma clásica en vivo - Campo Ecuestre Apostol Santiago',
        'start_date': timezone.now(),
        'end_date': timezone.now() + timedelta(days=3),
        'registration_start': timezone.now() - timedelta(days=30),
        'registration_end': timezone.now() - timedelta(days=2),
        'status': 'in_progress',
        'competition_type': 'international',
        'max_participants': 50,
        'entry_fee': Decimal('200.00'),
        'prize_money': Decimal('12000.00'),
        'is_championship': False,
    }

    comp1, created1 = Competition.objects.get_or_create(
        name=comp1_data['name'],
        defaults=comp1_data
    )
    if created1:
        comp1.disciplines.add(dressage)
        comp1.categories.add(categories['GP'], categories['INT1'], categories['INT2'], categories['YR'])
        print(f'  ✅ Competencia EN VIVO creada: {comp1.name}')
    else:
        print(f'  ℹ️  Competencia ya existe: {comp1.name}')

    # Competencia 2: PRÓXIMA (open_registration)
    comp2_data = {
        'name': 'Campeonato Nacional de Salto - La Paz 2025',
        'short_name': 'Campeonato Salto LP 2025',
        'organizer': organizer,
        'venue': venue,
        'description': 'Campeonato nacional de salto de obstáculos - Inscripciones abiertas',
        'start_date': timezone.now() + timedelta(days=7),
        'end_date': timezone.now() + timedelta(days=10),
        'registration_start': timezone.now() - timedelta(days=15),
        'registration_end': timezone.now() + timedelta(days=5),
        'status': 'open_registration',
        'competition_type': 'national',
        'max_participants': 40,
        'entry_fee': Decimal('180.00'),
        'prize_money': Decimal('8000.00'),
        'is_championship': True,
    }

    comp2, created2 = Competition.objects.get_or_create(
        name=comp2_data['name'],
        defaults=comp2_data
    )
    if created2:
        comp2.disciplines.add(jumping)
        comp2.categories.add(categories['SEN'], categories['AM'], categories['JUN'])
        print(f'  ✅ Competencia PRÓXIMA creada: {comp2.name}')
    else:
        print(f'  ℹ️  Competencia ya existe: {comp2.name}')

    return comp1, comp2


def assign_staff_to_competitions(competitions, users):
    """Asigna jueces y staff a las competencias activas"""
    print_section('ASIGNANDO STAFF A COMPETENCIAS ACTIVAS')

    # Forzar aceptación de jueces sin verificar judge_profile
    judges = [u for u in users.values() if u.role == 'judge']

    for competition in competitions:
        num_judges = min(3, len(judges))
        selected_judges = random.sample(judges, num_judges)

        for i, judge in enumerate(selected_judges):
            role = 'chief_judge' if i == 0 else 'judge'
            staff, created = CompetitionStaff.objects.get_or_create(
                competition=competition,
                staff_member=judge,
                role=role,
                defaults={'is_confirmed': True}
            )
            if created:
                print(f'  ✅ Staff asignado: {judge.get_full_name()} como {role} en {competition.short_name}')


def create_competition_participants(competition, riders, horses, num_participants):
    """Crea participantes para una competencia"""
    print(f'\n  📋 Competencia: {competition.short_name}')

    categories = list(competition.categories.all())
    participants = []

    for i in range(num_participants):
        rider = riders[i % len(riders)]
        horse = horses[i % len(horses)]
        category = categories[i % len(categories)]
        bib_number = i + 1

        participant, created = Participant.objects.get_or_create(
            competition=competition,
            rider=rider,
            horse=horse,
            category=category,
            defaults={
                'bib_number': bib_number,
                'is_confirmed': True,
                'is_paid': True,
            }
        )

        if created:
            print(f'    ✅ Participante #{bib_number}: {rider.get_full_name()} con {horse.name} en {category.name}')
            participants.append(participant)

    return participants


def create_scorecards_for_live_competition(competition, criterias):
    """Crea scorecards PARCIALES para competencia en vivo"""
    print_section('CREANDO SCORECARDS PARCIALES (COMPETENCIA EN VIVO)')

    participants = Participant.objects.filter(competition=competition)
    judges = CompetitionStaff.objects.filter(
        competition=competition,
        role__in=['judge', 'chief_judge']
    )

    # Solo calificar ~60% de participantes (simulando competencia en progreso)
    num_scored = int(len(participants) * 0.6)
    scored_participants = list(participants)[:num_scored]

    print(f'  📊 Calificando {num_scored} de {len(participants)} participantes (60%)')

    for participant in scored_participants:
        for comp_staff in judges:
            judge = comp_staff.staff_member

            scorecard, created = ScoreCard.objects.get_or_create(
                participant=participant,
                judge=judge,
                round_number=1,
                attempt_number=1,
                defaults={
                    'status': 'validated',
                    'start_time': competition.start_date,
                    'end_time': competition.start_date + timedelta(minutes=8),
                }
            )

            if created:
                create_individual_scores(scorecard, criterias, participant)
                scorecard.calculate_scores()
                scorecard.status = 'validated'
                scorecard.save()
                print(f'    ✅ Scorecard: {participant.rider.get_full_name()} - Juez: {judge.get_full_name()} - Score: {scorecard.percentage:.2f}%')


def create_individual_scores(scorecard, criterias, participant):
    """Crea scores individuales para cada criterio"""
    category_level = participant.category.level

    base_scores = {
        'professional': (7.0, 8.5),
        'advanced': (6.5, 8.0),
        'intermediate': (6.0, 7.5),
        'beginner': (5.5, 7.0),
    }

    min_score, max_score = base_scores.get(category_level, (6.0, 7.5))

    for criteria in criterias:
        raw_score = Decimal(str(round(random.uniform(min_score, max_score), 1)))

        IndividualScore.objects.create(
            score_card=scorecard,
            criteria=criteria,
            raw_score=raw_score
        )


def create_live_rankings(competition):
    """Crea rankings en tiempo real para competencia en vivo"""
    print_section('GENERANDO RANKINGS EN TIEMPO REAL')

    for category in competition.categories.all():
        ranking, created = CompetitionRanking.objects.get_or_create(
            competition=competition,
            category=category,
            defaults={
                'is_final': False,  # No es final, está en progreso
                'is_published': True,  # Pero sí publicado para visualización
            }
        )

        if created:
            participants = Participant.objects.filter(
                competition=competition,
                category=category
            )

            participant_scores = []
            for participant in participants:
                scorecards = ScoreCard.objects.filter(
                    participant=participant,
                    status='validated'
                )
                if scorecards.exists():
                    avg_score = sum(sc.final_score for sc in scorecards) / len(scorecards)
                    avg_percentage = sum(sc.percentage for sc in scorecards) / len(scorecards)
                    participant_scores.append({
                        'participant': participant,
                        'score': avg_score,
                        'percentage': avg_percentage,
                    })

            participant_scores.sort(key=lambda x: x['score'], reverse=True)

            for position, data in enumerate(participant_scores, start=1):
                RankingEntry.objects.create(
                    ranking=ranking,
                    participant=data['participant'],
                    position=position,
                    total_score=data['score'],
                    final_score=data['score'],
                    technical_score=data['score'],
                    rounds_completed=1,
                )

            print(f'  ✅ Ranking EN VIVO creado: {category.name} - {len(participant_scores)} participantes calificados')


def create_schedule_events(competition):
    """Crea eventos programados para una competencia"""
    print(f'\n  📅 Creando programación para: {competition.short_name}')

    start_date = competition.start_date
    categories = list(competition.categories.all())

    events_data = [
        {'title': 'Apertura y Ceremonia de Bienvenida', 'schedule_type': 'special_event', 'duration_minutes': 60},
        {'title': 'Calentamiento General', 'schedule_type': 'break', 'duration_minutes': 90},
        {'title': f'Categoría {categories[0].name} - Ronda 1', 'schedule_type': 'category_start', 'duration_minutes': 180},
        {'title': f'Categoría {categories[1 % len(categories)].name} - Ronda 1', 'schedule_type': 'category_start', 'duration_minutes': 180},
        {'title': 'Almuerzo', 'schedule_type': 'lunch', 'duration_minutes': 60},
        {'title': f'Categoría {categories[2 % len(categories)].name} - Ronda 1', 'schedule_type': 'category_start', 'duration_minutes': 180},
        {'title': 'Premiación Preliminar', 'schedule_type': 'awards', 'duration_minutes': 45},
    ]

    current_time = start_date
    for event_data in events_data:
        end_time = current_time + timedelta(minutes=event_data['duration_minutes'])

        event, created = CompetitionSchedule.objects.get_or_create(
            competition=competition,
            title=event_data['title'],
            defaults={
                'schedule_type': event_data['schedule_type'],
                'start_time': current_time,
                'end_time': end_time,
            }
        )

        if created:
            print(f'    ✅ Evento: {event_data["title"]} ({current_time.strftime("%H:%M")} - {end_time.strftime("%H:%M")})')

        current_time = end_time + timedelta(minutes=15)  # 15 min break between events


def main():
    """Función principal"""
    print('\n')
    print('=' * 70)
    print('  SCRIPT DE CARGA DE DATOS DE PRODUCCIÓN')
    print('  FEI Equestrian Competition Management System - Bolivia')
    print('=' * 70)
    print(f'\n  📅 Fecha: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'  🎯 Objetivo: Preparar sistema para usuarios finales con datos bolivianos\n')

    try:
        # 1. Renombrar competencias existentes
        venue = rename_existing_competitions()

        # 2. Crear jinetes y caballos bolivianos
        riders = create_bolivian_riders()
        horses = create_bolivian_horses(riders)

        # 3. Obtener datos existentes
        disciplines = {d.code: d for d in Discipline.objects.all()}
        categories = {c.code: c for c in Category.objects.all()}
        users = {u.username: u for u in User.objects.all()}

        # 4. Crear competencias activas
        comp1, comp2 = create_live_competitions(venue, disciplines, categories, users)

        # 5. Asignar staff a ambas competencias
        assign_staff_to_competitions([comp1, comp2], users)

        # 6. Crear participantes para ambas competencias
        print_section('CREANDO PARTICIPANTES PARA COMPETENCIAS ACTIVAS')
        participants_comp1 = create_competition_participants(comp1, riders, horses, 18)
        participants_comp2 = create_competition_participants(comp2, riders, horses, 14)

        # 7. Crear eventos programados
        print_section('CREANDO PROGRAMACIÓN DE EVENTOS')
        create_schedule_events(comp1)
        create_schedule_events(comp2)

        # 8. Crear scorecards SOLO para competencia en vivo (comp1)
        criterias = list(ScoringCriteria.objects.filter(discipline=disciplines['DR']))
        if criterias:
            create_scorecards_for_live_competition(comp1, criterias)
            create_live_rankings(comp1)
        else:
            print('  ⚠️  No hay criterios de scoring disponibles. Ejecutar load_demo_data.py primero.')

        # 9. Resumen final
        print_section('✅ SISTEMA LISTO PARA PRODUCCIÓN')
        print('\n  📊 Resumen completo del sistema:')
        print(f'    • Usuarios totales: {User.objects.count()}')
        print(f'    • Jinetes bolivianos: {len(riders)}')
        print(f'    • Caballos bolivianos: {len(horses)}')
        print(f'    • Competencias totales: {Competition.objects.count()}')
        print(f'    • Competencias EN VIVO: {Competition.objects.filter(status="in_progress").count()}')
        print(f'    • Competencias con inscripciones abiertas: {Competition.objects.filter(status="open_registration").count()}')
        print(f'    • Participantes totales: {Participant.objects.count()}')
        print(f'    • Scorecards totales: {ScoreCard.objects.count()}')
        print(f'    • Rankings totales: {CompetitionRanking.objects.count()}')

        print('\n  🏆 Competencias activas:')
        print(f'    1. {comp1.name} ({comp1.status})')
        print(f'       - Participantes: {Participant.objects.filter(competition=comp1).count()}')
        print(f'       - Scorecards: {ScoreCard.objects.filter(participant__competition=comp1).count()}')
        print(f'       - Estado: EN VIVO - Calificaciones en progreso')

        print(f'\n    2. {comp2.name} ({comp2.status})')
        print(f'       - Participantes: {Participant.objects.filter(competition=comp2).count()}')
        print(f'       - Estado: Inscripciones abiertas')

        print('\n  🎉 Sistema completo y funcional para entrega a usuarios finales!\n')
        print('  💡 Acceso:')
        print('     - Admin: admin / admin123')
        print('     - Organizador: organizer1 / org123')
        print('     - Juez: judge1 / judge123')
        print('     - Jinetes bolivianos: rider_paz_* / rider123\n')

    except Exception as e:
        print_section('❌ ERROR DURANTE LA CARGA')
        print(f'\n  Error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
