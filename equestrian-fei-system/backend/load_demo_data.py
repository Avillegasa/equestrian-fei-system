#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de carga de datos de demostración para FEI Equestrian System
Crea datos realistas para presentación a stakeholders finales

Uso:
    python load_demo_data.py
    python load_demo_data.py --clear  (borra datos existentes primero)
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
    DressageMovement,
    CompetitionRanking,
    RankingEntry
)

User = get_user_model()

CLEAR_DATA = '--clear' in sys.argv


def print_section(title):
    """Imprime título de sección"""
    print(f'\n{"=" * 60}')
    print(f'  {title}')
    print(f'{"=" * 60}')


def create_users():
    """Crea usuarios de demostración (20 usuarios)"""
    print_section('CREANDO USUARIOS')

    users_data = [
        {'username': 'admin', 'email': 'admin@equestrian-fei.com', 'password': 'admin123', 'first_name': 'Admin', 'last_name': 'FEI', 'role': 'admin', 'is_superuser': True},
        {'username': 'admin_fei', 'email': 'admin.fei@fei.org', 'password': 'admin123', 'first_name': 'Carlos', 'last_name': 'Rodríguez', 'role': 'admin', 'nationality': 'España'},
        {'username': 'admin_rfhe', 'email': 'admin@rfhe.com', 'password': 'admin123', 'first_name': 'María', 'last_name': 'González', 'role': 'admin', 'nationality': 'España'},
        {'username': 'organizer1', 'email': 'organizer@equestrian-fei.com', 'password': 'org123', 'first_name': 'Organizador', 'last_name': 'Prueba', 'role': 'organizer'},
        {'username': 'org_madrid', 'email': 'info@clubhipicomadrid.com', 'password': 'org123', 'first_name': 'Juan', 'last_name': 'Martínez', 'role': 'organizer', 'nationality': 'España'},
        {'username': 'org_barcelona', 'email': 'info@rcpolo-barcelona.com', 'password': 'org123', 'first_name': 'Laura', 'last_name': 'Sánchez', 'role': 'organizer', 'nationality': 'España'},
        {'username': 'judge1', 'email': 'judge@equestrian-fei.com', 'password': 'judge123', 'first_name': 'Juez', 'last_name': 'Prueba', 'role': 'judge'},
        {'username': 'judge_fei_5star', 'email': 'judge5star@fei.org', 'password': 'judge123', 'first_name': 'Sophie', 'last_name': 'Dubois', 'role': 'judge', 'nationality': 'France'},
        {'username': 'judge_fei_4star', 'email': 'judge4star@fei.org', 'password': 'judge123', 'first_name': 'Klaus', 'last_name': 'Schmidt', 'role': 'judge', 'nationality': 'Germany'},
        {'username': 'judge_nacional_1', 'email': 'judge.n1@rfhe.com', 'password': 'judge123', 'first_name': 'Ana', 'last_name': 'Fernández', 'role': 'judge', 'nationality': 'España'},
        {'username': 'judge_nacional_2', 'email': 'judge.n2@rfhe.com', 'password': 'judge123', 'first_name': 'Pedro', 'last_name': 'López', 'role': 'judge', 'nationality': 'España'},
        {'username': 'rider_alvarez', 'email': 'beatriz.alvarez@example.com', 'password': 'rider123', 'first_name': 'Beatriz', 'last_name': 'Álvarez', 'role': 'viewer', 'nationality': 'España'},
        {'username': 'rider_garcia', 'email': 'javier.garcia@example.com', 'password': 'rider123', 'first_name': 'Javier', 'last_name': 'García', 'role': 'viewer', 'nationality': 'España'},
        {'username': 'rider_martin', 'email': 'isabel.martin@example.com', 'password': 'rider123', 'first_name': 'Isabel', 'last_name': 'Martín', 'role': 'viewer', 'nationality': 'España'},
        {'username': 'rider_moreau', 'email': 'jean.moreau@example.com', 'password': 'rider123', 'first_name': 'Jean', 'last_name': 'Moreau', 'role': 'viewer', 'nationality': 'France'},
        {'username': 'rider_mueller', 'email': 'hans.mueller@example.com', 'password': 'rider123', 'first_name': 'Hans', 'last_name': 'Müller', 'role': 'viewer', 'nationality': 'Germany'},
        {'username': 'rider_santos', 'email': 'ana.santos@example.com', 'password': 'rider123', 'first_name': 'Ana', 'last_name': 'Santos', 'role': 'viewer', 'nationality': 'Portugal'},
        {'username': 'rider_brown', 'email': 'james.brown@example.com', 'password': 'rider123', 'first_name': 'James', 'last_name': 'Brown', 'role': 'viewer', 'nationality': 'United Kingdom'},
        {'username': 'rider_rossi', 'email': 'giulia.rossi@example.com', 'password': 'rider123', 'first_name': 'Giulia', 'last_name': 'Rossi', 'role': 'viewer', 'nationality': 'Italy'},
        {'username': 'rider_schmidt', 'email': 'anna.schmidt@example.com', 'password': 'rider123', 'first_name': 'Anna', 'last_name': 'Schmidt', 'role': 'viewer', 'nationality': 'Germany'},
    ]

    users = {}
    for user_data in users_data:
        username = user_data['username']
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            print(f'  ℹ️  Usuario "{username}" ya existe')
        else:
            is_superuser = user_data.pop('is_superuser', False)
            password = user_data.pop('password')
            if is_superuser:
                user = User.objects.create_superuser(**user_data, password=password)
            else:
                user = User.objects.create_user(**user_data, password=password)
            user.is_verified = True
            user.save()
            print(f'  ✅ Usuario "{username}" creado')
        users[username] = user

    create_judge_profiles(users)
    create_organizer_profiles(users)

    return users


def create_judge_profiles(users):
    """Crea perfiles de jueces con certificaciones FEI"""
    print('\n  📋 Creando perfiles de jueces...')

    judges_data = [
        {'user': users['judge1'], 'license_number': 'ESP-J-001', 'certification_level': 'national', 'specializations': ['dressage'], 'years_experience': 8, 'certification_expiry': timezone.now().date() + timedelta(days=365)},
        {'user': users['judge_fei_5star'], 'license_number': 'FRA-FEI-5-001', 'certification_level': 'fei_5star', 'specializations': ['dressage'], 'years_experience': 25, 'certification_expiry': timezone.now().date() + timedelta(days=730)},
        {'user': users['judge_fei_4star'], 'license_number': 'GER-FEI-4-001', 'certification_level': 'fei_4star', 'specializations': ['dressage'], 'years_experience': 18, 'certification_expiry': timezone.now().date() + timedelta(days=730)},
        {'user': users['judge_nacional_1'], 'license_number': 'ESP-J-002', 'certification_level': 'national', 'specializations': ['dressage'], 'years_experience': 12, 'certification_expiry': timezone.now().date() + timedelta(days=365)},
        {'user': users['judge_nacional_2'], 'license_number': 'ESP-J-003', 'certification_level': 'national', 'specializations': ['dressage'], 'years_experience': 10, 'certification_expiry': timezone.now().date() + timedelta(days=365)},
    ]

    for judge_data in judges_data:
        if not hasattr(judge_data['user'], 'judge_profile'):
            JudgeProfile.objects.create(**judge_data)
            print(f'    ✅ Perfil de juez creado: {judge_data["license_number"]}')


def create_organizer_profiles(users):
    """Crea perfiles de organizadores"""
    print('\n  📋 Creando perfiles de organizadores...')

    organizers_data = [
        {'user': users['organizer1'], 'organization_name': 'Federación Ecuestre Test', 'contact_phone': '+34 600 000 001', 'contact_email': 'organizer@equestrian-fei.com', 'is_verified_organizer': True, 'can_create_competitions': True},
        {'user': users['org_madrid'], 'organization_name': 'Club Hípico de Madrid', 'contact_phone': '+34 91 123 4567', 'contact_email': 'info@clubhipicomadrid.com', 'address': 'Casa de Campo, 28011 Madrid, España', 'is_verified_organizer': True, 'can_create_competitions': True},
        {'user': users['org_barcelona'], 'organization_name': 'Real Club de Polo de Barcelona', 'contact_phone': '+34 93 456 7890', 'contact_email': 'info@rcpolo-barcelona.com', 'address': 'Av. Doctor Marañón, 17, 08028 Barcelona, España', 'is_verified_organizer': True, 'can_create_competitions': True},
    ]

    for org_data in organizers_data:
        if not hasattr(org_data['user'], 'organizer_profile'):
            OrganizerProfile.objects.create(**org_data)
            print(f'    ✅ Perfil de organizador creado: {org_data["organization_name"]}')


def create_disciplines():
    """Crea disciplinas ecuestres FEI"""
    print_section('CREANDO DISCIPLINAS')

    disciplines_data = [
        {'name': 'Dressage', 'code': 'DR', 'discipline_type': 'dressage', 'description': 'Doma Clásica - Pruebas de precisión y armonía', 'scoring_system': 'percentage'},
        {'name': 'Show Jumping', 'code': 'SJ', 'discipline_type': 'jumping', 'description': 'Salto de Obstáculos', 'scoring_system': 'faults'},
        {'name': 'Eventing', 'code': 'EV', 'discipline_type': 'eventing', 'description': 'Concurso Completo de Equitación', 'scoring_system': 'penalties'},
        {'name': 'Endurance', 'code': 'EN', 'discipline_type': 'endurance', 'description': 'Raid de Resistencia', 'scoring_system': 'time'},
        {'name': 'Reining', 'code': 'RE', 'discipline_type': 'reining', 'description': 'Doma Vaquera Americana', 'scoring_system': 'points'},
        {'name': 'Para-Dressage', 'code': 'PD', 'discipline_type': 'para_dressage', 'description': 'Doma Paralímpica', 'scoring_system': 'percentage'},
    ]

    disciplines = {}
    for disc_data in disciplines_data:
        discipline, created = Discipline.objects.get_or_create(
            code=disc_data['code'],
            defaults=disc_data
        )
        if created:
            print(f'  ✅ Disciplina creada: {disc_data["name"]}')
        else:
            print(f'  ℹ️  Disciplina ya existe: {disc_data["name"]}')
        disciplines[disc_data['code']] = discipline

    return disciplines


def create_categories():
    """Crea categorías de competición"""
    print_section('CREANDO CATEGORÍAS')

    categories_data = [
        {'name': 'Junior', 'code': 'JUN', 'category_type': 'age', 'level': 'intermediate', 'min_age': 14, 'max_age': 18, 'description': 'Jinetes júnior 14-18 años', 'max_participants': 30, 'entry_fee': Decimal('120.00')},
        {'name': 'Young Rider', 'code': 'YR', 'category_type': 'age', 'level': 'advanced', 'min_age': 18, 'max_age': 21, 'description': 'Jinetes jóvenes 18-21 años', 'max_participants': 25, 'entry_fee': Decimal('150.00')},
        {'name': 'Senior', 'code': 'SEN', 'category_type': 'age', 'level': 'professional', 'min_age': 21, 'description': 'Categoría Senior 21+ años', 'max_participants': 40, 'entry_fee': Decimal('180.00')},
        {'name': 'Amateur', 'code': 'AM', 'category_type': 'level', 'level': 'intermediate', 'description': 'Jinetes Amateur', 'max_participants': 35, 'entry_fee': Decimal('100.00')},
        {'name': 'Grand Prix', 'code': 'GP', 'category_type': 'level', 'level': 'professional', 'description': 'Grand Prix - Nivel más alto de doma', 'max_participants': 20, 'entry_fee': Decimal('250.00')},
        {'name': 'Intermediate I', 'code': 'INT1', 'category_type': 'level', 'level': 'advanced', 'description': 'Intermediate I - Nivel avanzado', 'max_participants': 25, 'entry_fee': Decimal('180.00')},
        {'name': 'Intermediate II', 'code': 'INT2', 'category_type': 'level', 'level': 'advanced', 'description': 'Intermediate II - Nivel avanzado superior', 'max_participants': 22, 'entry_fee': Decimal('200.00')},
        {'name': 'Small Tour', 'code': 'ST', 'category_type': 'level', 'level': 'intermediate', 'description': 'Small Tour - Nivel intermedio', 'max_participants': 30, 'entry_fee': Decimal('150.00')},
    ]

    categories = {}
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            code=cat_data['code'],
            defaults=cat_data
        )
        if created:
            print(f'  ✅ Categoría creada: {cat_data["name"]}')
        else:
            print(f'  ℹ️  Categoría ya existe: {cat_data["name"]}')
        categories[cat_data['code']] = category

    return categories


def create_venues():
    """Crea sedes de competición"""
    print_section('CREANDO SEDES')

    venues_data = [
        {'name': 'Club Hípico de Madrid', 'address': 'Casa de Campo, s/n', 'city': 'Madrid', 'state_province': 'Madrid', 'country': 'España', 'postal_code': '28011', 'phone': '+34 91 123 4567', 'email': 'info@clubhipicomadrid.com', 'capacity': 500, 'indoor_arena': True, 'outdoor_arena': True, 'warm_up_area': True, 'stabling': 80},
        {'name': 'Real Club de Polo de Barcelona', 'address': 'Av. Doctor Marañón, 17', 'city': 'Barcelona', 'state_province': 'Cataluña', 'country': 'España', 'postal_code': '08028', 'phone': '+34 93 456 7890', 'email': 'info@rcpolo-barcelona.com', 'capacity': 800, 'indoor_arena': True, 'outdoor_arena': True, 'warm_up_area': True, 'stabling': 120},
        {'name': 'Centro Ecuestre Dehesa Montenmedio', 'address': 'Carretera N-340, Km 42.5', 'city': 'Vejer de la Frontera', 'state_province': 'Cádiz', 'country': 'España', 'postal_code': '11150', 'phone': '+34 956 447 200', 'email': 'info@montenmedio.com', 'capacity': 300, 'indoor_arena': False, 'outdoor_arena': True, 'warm_up_area': True, 'stabling': 60},
        {'name': 'Centro Hípico Internacional Valencia', 'address': 'Carretera de Barcelona, Km 2', 'city': 'Valencia', 'state_province': 'Valencia', 'country': 'España', 'postal_code': '46015', 'phone': '+34 96 345 6789', 'email': 'info@centrohipicovalencia.com', 'capacity': 600, 'indoor_arena': True, 'outdoor_arena': True, 'warm_up_area': True, 'stabling': 100},
    ]

    venues = {}
    for venue_data in venues_data:
        venue, created = Venue.objects.get_or_create(
            name=venue_data['name'],
            defaults=venue_data
        )
        if created:
            print(f'  ✅ Sede creada: {venue_data["name"]}')
        else:
            print(f'  ℹ️  Sede ya existe: {venue_data["name"]}')
        venues[venue_data['name']] = venue

    return venues


def create_horses(users):
    """Crea caballos de competición"""
    print_section('CREANDO CABALLOS')

    riders = [u for u in users.values() if u.role == 'viewer']

    horses_data = [
        {'name': 'Fuego XII', 'registration_number': 'ESP-PRE-2015-001', 'breed': 'PRE', 'color': 'Castaño', 'gender': 'stallion', 'height': 162, 'is_fei_registered': True, 'fei_id': 'ESP40234'},
        {'name': 'Conquistador', 'registration_number': 'ESP-AND-2014-045', 'breed': 'Andaluz', 'color': 'Tordo', 'gender': 'gelding', 'height': 165, 'is_fei_registered': True, 'fei_id': 'ESP40891'},
        {'name': 'Duque', 'registration_number': 'ESP-PRE-2013-089', 'breed': 'PRE', 'color': 'Negro', 'gender': 'stallion', 'height': 160, 'is_fei_registered': False},
        {'name': 'Diamante', 'registration_number': 'POR-LUS-2015-023', 'breed': 'Lusitano', 'color': 'Palomino', 'gender': 'mare', 'height': 158, 'is_fei_registered': True, 'fei_id': 'POR50123'},
        {'name': 'Bella Luna', 'registration_number': 'ESP-PRE-2016-034', 'breed': 'PRE', 'color': 'Isabelo', 'gender': 'mare', 'height': 161, 'is_fei_registered': False},
        {'name': 'Don Quijote', 'registration_number': 'ESP-AND-2012-056', 'breed': 'Andaluz', 'color': 'Castaño Oscuro', 'gender': 'stallion', 'height': 167, 'is_fei_registered': True, 'fei_id': 'ESP41234'},
        {'name': 'Werther', 'registration_number': 'GER-HAN-2014-078', 'breed': 'Hanoverian', 'color': 'Bay', 'gender': 'gelding', 'height': 170, 'is_fei_registered': True, 'fei_id': 'GER60234'},
        {'name': 'Florestan', 'registration_number': 'GER-OLD-2013-091', 'breed': 'Oldenburg', 'color': 'Black', 'gender': 'stallion', 'height': 168, 'is_fei_registered': True, 'fei_id': 'GER60789'},
        {'name': 'Valegro II', 'registration_number': 'NED-KWP-2015-012', 'breed': 'KWPN', 'color': 'Dark Bay', 'gender': 'gelding', 'height': 172, 'is_fei_registered': True, 'fei_id': 'NED70234'},
        {'name': 'Totilas Jr', 'registration_number': 'NED-KWP-2014-034', 'breed': 'KWPN', 'color': 'Black', 'gender': 'stallion', 'height': 171, 'is_fei_registered': True, 'fei_id': 'NED70456'},
        {'name': 'Dante', 'registration_number': 'GBR-WMB-2015-045', 'breed': 'Warmblood', 'color': 'Chestnut', 'gender': 'gelding', 'height': 169, 'is_fei_registered': True, 'fei_id': 'GBR80123'},
        {'name': 'Sanceo', 'registration_number': 'GER-HAN-2013-067', 'breed': 'Hanoverian', 'color': 'Bay', 'gender': 'stallion', 'height': 170, 'is_fei_registered': True, 'fei_id': 'GER60567'},
        {'name': 'Desperados', 'registration_number': 'GER-OLD-2012-089', 'breed': 'Oldenburg', 'color': 'Dark Bay', 'gender': 'gelding', 'height': 169, 'is_fei_registered': True, 'fei_id': 'GER60890'},
        {'name': 'Hermoso', 'registration_number': 'ESP-PRE-2016-078', 'breed': 'PRE', 'color': 'Tordo', 'gender': 'stallion', 'height': 163, 'is_fei_registered': False},
        {'name': 'Caramelo', 'registration_number': 'ESP-AND-2015-090', 'breed': 'Andaluz', 'color': 'Alazán', 'gender': 'gelding', 'height': 164, 'is_fei_registered': False},
        {'name': 'Rosalinda', 'registration_number': 'ESP-PRE-2014-101', 'breed': 'PRE', 'color': 'Castaño', 'gender': 'mare', 'height': 159, 'is_fei_registered': False},
        {'name': 'Gitano', 'registration_number': 'ESP-AND-2013-112', 'breed': 'Andaluz', 'color': 'Negro', 'gender': 'stallion', 'height': 166, 'is_fei_registered': True, 'fei_id': 'ESP42345'},
        {'name': 'Bonita', 'registration_number': 'POR-LUS-2016-045', 'breed': 'Lusitano', 'color': 'Alazán Tostado', 'gender': 'mare', 'height': 160, 'is_fei_registered': False},
        {'name': 'Escorial', 'registration_number': 'ESP-PRE-2012-123', 'breed': 'PRE', 'color': 'Tordo Rodado', 'gender': 'stallion', 'height': 165, 'is_fei_registered': True, 'fei_id': 'ESP42567'},
        {'name': 'Gavilán', 'registration_number': 'ESP-AND-2014-134', 'breed': 'Andaluz', 'color': 'Castaño Oscuro', 'gender': 'gelding', 'height': 162, 'is_fei_registered': False},
        {'name': 'Reina', 'registration_number': 'ESP-PRE-2015-145', 'breed': 'PRE', 'color': 'Isabelo', 'gender': 'mare', 'height': 161, 'is_fei_registered': False},
        {'name': 'Apollo', 'registration_number': 'FRA-SEL-2014-056', 'breed': 'Selle Français', 'color': 'Bay', 'gender': 'stallion', 'height': 168, 'is_fei_registered': True, 'fei_id': 'FRA90123'},
        {'name': 'Majesty', 'registration_number': 'GBR-WMB-2013-078', 'breed': 'Warmblood', 'color': 'Black', 'gender': 'gelding', 'height': 170, 'is_fei_registered': True, 'fei_id': 'GBR80234'},
        {'name': 'Elegante', 'registration_number': 'ITA-MRN-2015-089', 'breed': 'Maremmano', 'color': 'Grey', 'gender': 'mare', 'height': 162, 'is_fei_registered': False},
        {'name': 'Tornado', 'registration_number': 'ESP-PRE-2013-156', 'breed': 'PRE', 'color': 'Negro Azabache', 'gender': 'stallion', 'height': 164, 'is_fei_registered': True, 'fei_id': 'ESP42789'},
    ]

    horses = []
    for i, horse_data in enumerate(horses_data):
        owner = riders[i % len(riders)]
        birth_date = timezone.now().date() - timedelta(days=365 * random.randint(7, 15))

        if Horse.objects.filter(registration_number=horse_data['registration_number']).exists():
            horse = Horse.objects.get(registration_number=horse_data['registration_number'])
            print(f'  ℹ️  Caballo ya existe: {horse_data["name"]}')
        else:
            horse = Horse.objects.create(
                owner=owner,
                birth_date=birth_date,
                **horse_data
            )
            print(f'  ✅ Caballo creado: {horse_data["name"]} (Propietario: {owner.get_full_name()})')
        horses.append(horse)

    return horses


def create_competitions(users, disciplines, categories, venues):
    """Crea competencias completadas"""
    print_section('CREANDO COMPETENCIAS')

    dressage = disciplines['DR']
    organizers = [users['org_madrid'], users['org_barcelona'], users['organizer1']]

    competitions_data = [
        {
            'name': 'CDI4* Madrid Spring Tour',
            'short_name': 'Madrid Spring CDI4*',
            'organizer': organizers[0],
            'venue': venues['Club Hípico de Madrid'],
            'description': 'Concurso internacional de doma clásica 4 estrellas',
            'start_date': timezone.now() - timedelta(days=32),
            'end_date': timezone.now() - timedelta(days=29),
            'registration_start': timezone.now() - timedelta(days=62),
            'registration_end': timezone.now() - timedelta(days=35),
            'status': 'completed',
            'competition_type': 'international',
            'max_participants': 60,
            'entry_fee': Decimal('250.00'),
            'prize_money': Decimal('15000.00'),
            'is_championship': False,
            'categories_codes': ['GP', 'INT2', 'YR'],
        },
        {
            'name': 'CDI3* Barcelona Dressage Cup',
            'short_name': 'Barcelona CDI3*',
            'organizer': organizers[1],
            'venue': venues['Real Club de Polo de Barcelona'],
            'description': 'Copa de doma clásica internacional 3 estrellas',
            'start_date': timezone.now() - timedelta(days=62),
            'end_date': timezone.now() - timedelta(days=59),
            'registration_start': timezone.now() - timedelta(days=92),
            'registration_end': timezone.now() - timedelta(days=65),
            'status': 'completed',
            'competition_type': 'international',
            'max_participants': 50,
            'entry_fee': Decimal('200.00'),
            'prize_money': Decimal('10000.00'),
            'is_championship': False,
            'categories_codes': ['GP', 'INT1', 'JUN'],
        },
        {
            'name': 'Campeonato Nacional de Doma',
            'short_name': 'Nacional Doma',
            'organizer': organizers[2],
            'venue': venues['Centro Ecuestre Dehesa Montenmedio'],
            'description': 'Campeonato nacional de doma clásica',
            'start_date': timezone.now() - timedelta(days=22),
            'end_date': timezone.now() - timedelta(days=20),
            'registration_start': timezone.now() - timedelta(days=52),
            'registration_end': timezone.now() - timedelta(days=25),
            'status': 'completed',
            'competition_type': 'national',
            'max_participants': 55,
            'entry_fee': Decimal('150.00'),
            'prize_money': Decimal('8000.00'),
            'is_championship': True,
            'categories_codes': ['SEN', 'AM', 'YR'],
        },
        {
            'name': 'CDI3* Valencia Winter Show',
            'short_name': 'Valencia CDI3*',
            'organizer': organizers[0],
            'venue': venues['Centro Hípico Internacional Valencia'],
            'description': 'Concurso internacional de invierno',
            'start_date': timezone.now() - timedelta(days=47),
            'end_date': timezone.now() - timedelta(days=44),
            'registration_start': timezone.now() - timedelta(days=77),
            'registration_end': timezone.now() - timedelta(days=50),
            'status': 'completed',
            'competition_type': 'international',
            'max_participants': 45,
            'entry_fee': Decimal('200.00'),
            'prize_money': Decimal('9000.00'),
            'is_championship': False,
            'categories_codes': ['GP', 'INT1'],
        },
        {
            'name': 'Andalusian Dressage Trophy',
            'short_name': 'Andalusian Trophy',
            'organizer': organizers[2],
            'venue': venues['Centro Ecuestre Dehesa Montenmedio'],
            'description': 'Trofeo andaluz de doma clásica',
            'start_date': timezone.now() - timedelta(days=15),
            'end_date': timezone.now() - timedelta(days=13),
            'registration_start': timezone.now() - timedelta(days=45),
            'registration_end': timezone.now() - timedelta(days=18),
            'status': 'completed',
            'competition_type': 'regional',
            'max_participants': 40,
            'entry_fee': Decimal('120.00'),
            'prize_money': Decimal('5000.00'),
            'is_championship': False,
            'categories_codes': ['SEN', 'AM'],
        },
    ]

    competitions = []
    for comp_data in competitions_data:
        categories_codes = comp_data.pop('categories_codes')

        if Competition.objects.filter(name=comp_data['name']).exists():
            competition = Competition.objects.get(name=comp_data['name'])
            print(f'  ℹ️  Competencia ya existe: {comp_data["name"]}')
        else:
            competition = Competition.objects.create(**comp_data)
            competition.disciplines.add(dressage)
            for cat_code in categories_codes:
                competition.categories.add(categories[cat_code])
            print(f'  ✅ Competencia creada: {comp_data["name"]}')

        competitions.append(competition)

    return competitions


def assign_competition_staff(competitions, users):
    """Asigna staff a las competencias"""
    print_section('ASIGNANDO STAFF A COMPETENCIAS')

    judges = [
        users['judge1'],
        users['judge_fei_5star'],
        users['judge_fei_4star'],
        users['judge_nacional_1'],
        users['judge_nacional_2']
    ]

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


def create_participants(competitions, users, horses):
    """Crea participantes para cada competencia"""
    print_section('CREANDO PARTICIPANTES')

    riders = [u for u in users.values() if u.role == 'viewer']
    all_participants = []

    participants_per_comp = {
        0: 15,
        1: 12,
        2: 14,
        3: 10,
        4: 12,
    }

    for comp_idx, competition in enumerate(competitions):
        num_participants = participants_per_comp.get(comp_idx, 12)
        competition_categories = list(competition.categories.all())

        print(f'\n  📋 Competencia: {competition.short_name}')

        for i in range(num_participants):
            rider = riders[i % len(riders)]
            horse = horses[i % len(horses)]
            category = competition_categories[i % len(competition_categories)]

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
                all_participants.append(participant)

    return all_participants


def create_scoring_criteria(disciplines):
    """Crea criterios de scoring para doma"""
    print_section('CREANDO CRITERIOS DE SCORING')

    dressage = disciplines['DR']

    criteria_data = [
        {'name': 'Halt and Salute', 'code': 'HALT_SAL', 'criteria_type': 'technical', 'order': 1, 'weight': Decimal('1.0')},
        {'name': 'Working Trot', 'code': 'WORK_TROT', 'criteria_type': 'technical', 'order': 2, 'weight': Decimal('1.0')},
        {'name': 'Extended Trot', 'code': 'EXT_TROT', 'criteria_type': 'technical', 'order': 3, 'weight': Decimal('2.0')},
        {'name': 'Collected Trot', 'code': 'COL_TROT', 'criteria_type': 'technical', 'order': 4, 'weight': Decimal('1.0')},
        {'name': 'Working Canter', 'code': 'WORK_CANT', 'criteria_type': 'technical', 'order': 5, 'weight': Decimal('1.0')},
        {'name': 'Extended Canter', 'code': 'EXT_CANT', 'criteria_type': 'technical', 'order': 6, 'weight': Decimal('2.0')},
        {'name': 'Collected Canter', 'code': 'COL_CANT', 'criteria_type': 'technical', 'order': 7, 'weight': Decimal('1.0')},
        {'name': 'Flying Changes', 'code': 'FLY_CHANG', 'criteria_type': 'technical', 'order': 8, 'weight': Decimal('2.0')},
        {'name': 'Half-Pass Trot', 'code': 'HP_TROT', 'criteria_type': 'technical', 'order': 9, 'weight': Decimal('1.0')},
        {'name': 'Half-Pass Canter', 'code': 'HP_CANT', 'criteria_type': 'technical', 'order': 10, 'weight': Decimal('1.0')},
        {'name': 'Pirouettes', 'code': 'PIROUET', 'criteria_type': 'technical', 'order': 11, 'weight': Decimal('2.0')},
        {'name': 'Passage', 'code': 'PASSAGE', 'criteria_type': 'technical', 'order': 12, 'weight': Decimal('2.0')},
        {'name': 'Piaffe', 'code': 'PIAFFE', 'criteria_type': 'technical', 'order': 13, 'weight': Decimal('2.0')},
        {'name': 'Transitions', 'code': 'TRANSIT', 'criteria_type': 'technical', 'order': 14, 'weight': Decimal('1.0')},
        {'name': 'Final Halt', 'code': 'FIN_HALT', 'criteria_type': 'technical', 'order': 15, 'weight': Decimal('1.0')},
        {'name': 'Gaits', 'code': 'GAITS', 'criteria_type': 'artistic', 'order': 16, 'weight': Decimal('2.0')},
        {'name': 'Impulsion', 'code': 'IMPULSION', 'criteria_type': 'artistic', 'order': 17, 'weight': Decimal('2.0')},
        {'name': 'Submission', 'code': 'SUBMISS', 'criteria_type': 'artistic', 'order': 18, 'weight': Decimal('2.0')},
        {'name': 'Rider Position', 'code': 'RIDER_POS', 'criteria_type': 'artistic', 'order': 19, 'weight': Decimal('2.0')},
        {'name': 'Harmony', 'code': 'HARMONY', 'criteria_type': 'artistic', 'order': 20, 'weight': Decimal('2.0')},
    ]

    criterias = []
    for crit_data in criteria_data:
        criteria, created = ScoringCriteria.objects.get_or_create(
            discipline=dressage,
            code=crit_data['code'],
            defaults=crit_data
        )
        if created:
            print(f'  ✅ Criterio creado: {crit_data["name"]}')
        criterias.append(criteria)

    return criterias


def create_scorecards_and_rankings(competitions, criterias):
    """Crea scorecards y rankings para todas las competencias"""
    print_section('CREANDO SCORECARDS Y RANKINGS')

    for competition in competitions:
        print(f'\n  📋 Competencia: {competition.short_name}')

        participants = Participant.objects.filter(competition=competition)
        judges = CompetitionStaff.objects.filter(
            competition=competition,
            role__in=['judge', 'chief_judge']
        )

        for participant in participants:
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

        create_competition_rankings(competition)


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


def create_competition_rankings(competition):
    """Crea rankings finales para cada categoría"""
    print(f'\n  🏆 Generando rankings para: {competition.short_name}')

    for category in competition.categories.all():
        ranking, created = CompetitionRanking.objects.get_or_create(
            competition=competition,
            category=category,
            defaults={
                'is_final': True,
                'is_published': True,
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

            print(f'    ✅ Ranking creado: {category.name} - {len(participant_scores)} participantes')


def main():
    """Función principal"""
    print('\n')
    print('=' * 70)
    print('  SCRIPT DE CARGA DE DATOS DE DEMOSTRACIÓN')
    print('  FEI Equestrian Competition Management System')
    print('=' * 70)
    print(f'\n  📅 Fecha: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'  🎯 Objetivo: Cargar datos realistas para demostración\n')

    if CLEAR_DATA:
        print('  ⚠️  MODO: Limpieza de datos DESHABILITADO por seguridad')
        print('  💡 Para limpiar datos, hacerlo manualmente desde Django Admin\n')

    try:
        users = create_users()
        disciplines = create_disciplines()
        categories = create_categories()
        venues = create_venues()
        horses = create_horses(users)
        competitions = create_competitions(users, disciplines, categories, venues)
        assign_competition_staff(competitions, users)
        participants = create_participants(competitions, users, horses)
        criterias = create_scoring_criteria(disciplines)
        create_scorecards_and_rankings(competitions, criterias)

        print_section('✅ PROCESO COMPLETADO EXITOSAMENTE')
        print('\n  📊 Resumen de datos creados:')
        print(f'    • Usuarios: {User.objects.count()}')
        print(f'    • Disciplinas: {Discipline.objects.count()}')
        print(f'    • Categorías: {Category.objects.count()}')
        print(f'    • Sedes: {Venue.objects.count()}')
        print(f'    • Caballos: {Horse.objects.count()}')
        print(f'    • Competencias: {Competition.objects.count()}')
        print(f'    • Participantes: {Participant.objects.count()}')
        print(f'    • Scorecards: {ScoreCard.objects.count()}')
        print(f'    • Rankings: {CompetitionRanking.objects.count()}')
        print('\n  🎉 Sistema listo para demostración!\n')

    except Exception as e:
        print_section('❌ ERROR DURANTE LA CARGA')
        print(f'\n  Error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
