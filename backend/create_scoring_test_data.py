#!/usr/bin/env python
"""
Script para crear datos de prueba del sistema de scoring FEI
Ejecutar desde el directorio backend con: python create_scoring_test_data.py
"""

import os
import django
import sys
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.competitions.models import Discipline, Category, Competition, CompetitionCategory, Horse, Rider, Registration
from apps.scoring.models import EvaluationParameter, JudgePosition
from apps.users.models import JudgeProfile

User = get_user_model()

def create_test_data():
    """Crear datos de prueba completos para el sistema de scoring"""
    
    print("🎯 Creando datos de prueba para Sistema FEI...")
    
    # 1. Crear disciplina
    discipline, created = Discipline.objects.get_or_create(
        code='CCE',
        defaults={
            'name': 'Concurso Completo de Equitación',
            'description': 'Disciplina ecuestre FEI',
            'fei_code': 'CCE',
            'is_active': True
        }
    )
    if created:
        print(f"✅ Disciplina creada: {discipline.name}")
    else:
        print(f"✅ Disciplina existente: {discipline.name}")
    
    # 2. Crear categoría
    category, created = Category.objects.get_or_create(
        code='PRIMERA_YR',
        defaults={
            'name': 'Primera Young Riders',
            'discipline': discipline,
            'level': 'Intermedio',
            'min_age_rider': 16,
            'max_age_rider': 21,
            'min_age_horse': 6,
            'max_participants': 30,
            'entry_fee': Decimal('150.00'),
            'description': 'Categoría para jóvenes jinetes',
            'is_active': True
        }
    )
    if created:
        print(f"✅ Categoría creada: {category.name}")
    else:
        print(f"✅ Categoría existente: {category.name}")
    
    # 3. Crear parámetros de evaluación FEI
    parameters_data = [
        {
            'exercise_number': 1,
            'exercise_name': 'A - Entrada al galope de trabajo',
            'coefficient': 1,
            'max_score': Decimal('10.0'),
            'is_collective_mark': False,
            'order': 1,
            'description': 'Entrada desde A al galope de trabajo'
        },
        {
            'exercise_number': 2,
            'exercise_name': 'C - Parada y saludo',
            'coefficient': 1,
            'max_score': Decimal('10.0'),
            'is_collective_mark': False,
            'order': 2,
            'description': 'Parada inmóvil y saludo'
        },
        {
            'exercise_number': 3,
            'exercise_name': 'Trote de trabajo',
            'coefficient': 1,
            'max_score': Decimal('10.0'),
            'is_collective_mark': False,
            'order': 3,
            'description': 'Transición y trote de trabajo'
        },
        {
            'exercise_number': 4,
            'exercise_name': 'Círculo 20m al trote',
            'coefficient': 2,
            'max_score': Decimal('10.0'),
            'is_collective_mark': False,
            'order': 4,
            'description': 'Círculo de 20 metros al trote'
        },
        {
            'exercise_number': 5,
            'exercise_name': 'Cambio de mano diagonal',
            'coefficient': 1,
            'max_score': Decimal('10.0'),
            'is_collective_mark': False,
            'order': 5,
            'description': 'Cambio de mano en diagonal'
        },
        {
            'exercise_number': 20,
            'exercise_name': 'Aires generales',
            'coefficient': 2,
            'max_score': Decimal('10.0'),
            'is_collective_mark': True,
            'order': 20,
            'description': 'Nota de conjunto - calidad de aires'
        },
        {
            'exercise_number': 21,
            'exercise_name': 'Impulsión',
            'coefficient': 2,
            'max_score': Decimal('10.0'),
            'is_collective_mark': True,
            'order': 21,
            'description': 'Nota de conjunto - impulsión'
        },
        {
            'exercise_number': 22,
            'exercise_name': 'Sumisión y actitud del jinete',
            'coefficient': 2,
            'max_score': Decimal('10.0'),
            'is_collective_mark': True,
            'order': 22,
            'description': 'Nota de conjunto - sumisión y jinete'
        }
    ]
    
    created_params = 0
    for param_data in parameters_data:
        param_data['category'] = category
        param, created = EvaluationParameter.objects.get_or_create(
            category=category,
            exercise_number=param_data['exercise_number'],
            defaults=param_data
        )
        if created:
            created_params += 1
    
    print(f"✅ Parámetros de evaluación: {created_params} nuevos creados, {len(parameters_data)} total")
    
    # 4. Crear competencia
    try:
        organizer = User.objects.filter(is_staff=True).first()
        if not organizer:
            organizer = User.objects.create_user(
                username='organizer_test',
                email='organizer@test.com',
                password='test123',
                first_name='Organizador',
                last_name='Prueba'
            )
            print("✅ Usuario organizador creado")
    except:
        organizer = User.objects.first()
    
    competition, created = Competition.objects.get_or_create(
        name='Competencia de Prueba FEI',
        defaults={
            'organizer': organizer,
            'discipline': discipline,
            'venue': 'Centro Ecuestre de Prueba',
            'start_date': '2025-08-01',
            'end_date': '2025-08-03',
            'registration_deadline': '2025-07-25',
            'max_participants': 50,
            'entry_fee_base': Decimal('100.00'),
            'description': 'Competencia de prueba para sistema FEI',
            'status': 'upcoming'
        }
    )
    if created:
        print(f"✅ Competencia creada: {competition.name}")
    else:
        print(f"✅ Competencia existente: {competition.name}")
    
    # 5. Asociar categoría con competencia
    comp_category, created = CompetitionCategory.objects.get_or_create(
        competition=competition,
        category=category,
        defaults={
            'max_participants': 20,
            'entry_fee_override': Decimal('150.00'),
            'start_time': '09:00:00',
            'order': 1,
            'is_active': True
        }
    )
    if created:
        print(f"✅ Categoría asociada a competencia")
    
    # 6. Crear caballos de prueba
    horses_data = [
        {'name': 'Thunder', 'breed': 'Pura Sangre', 'birth_year': 2015},
        {'name': 'Lightning', 'breed': 'Holsteiner', 'birth_year': 2014},
        {'name': 'Starlight', 'breed': 'Hannover', 'birth_year': 2016},
    ]
    
    horses = []
    for horse_data in horses_data:
        horse, created = Horse.objects.get_or_create(
            name=horse_data['name'],
            defaults={
                'breed': horse_data['breed'],
                'birth_year': horse_data['birth_year'],
                'gender': 'stallion',
                'color': 'bay',
                'owner_name': f"Propietario de {horse_data['name']}",
                'is_active': True
            }
        )
        horses.append(horse)
        if created:
            print(f"✅ Caballo creado: {horse.name}")
    
    # 7. Crear jinetes de prueba
    riders_data = [
        {'username': 'rider1', 'first_name': 'Ana', 'last_name': 'García', 'nationality': 'ESP'},
        {'username': 'rider2', 'first_name': 'Carlos', 'last_name': 'López', 'nationality': 'ARG'},
        {'username': 'rider3', 'first_name': 'María', 'last_name': 'Silva', 'nationality': 'BRA'},
    ]
    
    riders = []
    for rider_data in riders_data:
        # Crear usuario
        user, created = User.objects.get_or_create(
            username=rider_data['username'],
            defaults={
                'email': f"{rider_data['username']}@test.com",
                'first_name': rider_data['first_name'],
                'last_name': rider_data['last_name'],
                'password': 'test123'
            }
        )
        
        # Crear perfil de jinete
        rider, created = Rider.objects.get_or_create(
            user=user,
            defaults={
                'license_number': f"LIC{1000 + len(riders)}",
                'nationality': rider_data['nationality'],
                'birth_date': '1995-01-01',
                'fei_id': f"FEI{2000 + len(riders)}",
                'license_type': 'national',
                'license_valid_until': '2025-12-31',
                'is_active': True
            }
        )
        riders.append(rider)
        if created:
            print(f"✅ Jinete creado: {rider.full_name}")
    
    # 8. Crear registros (inscripciones)
    registrations = []
    for i, (rider, horse) in enumerate(zip(riders, horses)):
        registration, created = Registration.objects.get_or_create(
            competition=competition,
            category=category,
            rider=rider,
            horse=horse,
            defaults={
                'start_number': i + 1,
                'status': 'confirmed',
                'registered_at': '2025-07-01 10:00:00+00:00',
                'entry_fee_paid': True,
                'entry_fee_amount': Decimal('150.00')
            }
        )
        registrations.append(registration)
        if created:
            print(f"✅ Inscripción creada: {rider.full_name} con {horse.name}")
    
    # 9. Crear jueces de prueba
    judges_data = [
        {'username': 'judge1', 'first_name': 'Pedro', 'last_name': 'Martínez', 'position': 'C'},
        {'username': 'judge2', 'first_name': 'Laura', 'last_name': 'Rodríguez', 'position': 'B'},
    ]
    
    for judge_data in judges_data:
        # Crear usuario juez
        user, created = User.objects.get_or_create(
            username=judge_data['username'],
            defaults={
                'email': f"{judge_data['username']}@test.com",
                'first_name': judge_data['first_name'],
                'last_name': judge_data['last_name'],
                'password': 'test123',
                'user_type': 'judge'
            }
        )
        
        # Crear perfil de juez
        judge_profile, created = JudgeProfile.objects.get_or_create(
            user=user,
            defaults={
                'fei_id': f"JUDGE{3000 + len(judges_data)}",
                'certification_level': 'national',
                'license_valid_until': '2025-12-31',
                'specializations': ['dressage'],
                'is_active_judge': True
            }
        )
        
        # Crear posición de juez en competencia
        judge_position, created = JudgePosition.objects.get_or_create(
            competition=competition,
            judge=judge_profile,
            position=judge_data['position'],
            defaults={'is_active': True}
        )
        
        if created:
            print(f"✅ Juez creado: {judge_profile.user.get_full_name()} - Posición {judge_data['position']}")
    
    print("\n🎉 ¡Datos de prueba creados exitosamente!")
    print(f"📊 Resumen:")
    print(f"   - 1 Disciplina: {discipline.name}")
    print(f"   - 1 Categoría: {category.name}")
    print(f"   - {len(parameters_data)} Parámetros de evaluación")
    print(f"   - 1 Competencia: {competition.name}")
    print(f"   - {len(horses)} Caballos")
    print(f"   - {len(riders)} Jinetes")
    print(f"   - {len(registrations)} Inscripciones")
    print(f"   - {len(judges_data)} Jueces")
    
    print(f"\n🔗 URLs para probar:")
    print(f"   - Parámetros: http://localhost:8000/api/scoring/parameters/")
    print(f"   - Competencia: http://localhost:8000/api/competitions/{competition.id}/")
    print(f"   - Test scoring: http://localhost:3000/test-scoring")

if __name__ == "__main__":
    try:
        create_test_data()
    except Exception as e:
        print(f"❌ Error creando datos de prueba: {e}")
        import traceback
        traceback.print_exc()