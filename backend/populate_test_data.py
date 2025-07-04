#!/usr/bin/env python
"""
Script para crear datos de prueba para el sistema de rankings
Ejecutar desde el directorio backend: python populate_test_data.py
"""
import os
import sys
import django
from datetime import date, datetime, timedelta
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.competitions.models import (
    Discipline, Category, Competition, CompetitionCategory,
    Horse, Rider, Registration
)
from apps.scoring.models import EvaluationParameter
from apps.rankings.models import RankingConfiguration
from apps.users.models import JudgeProfile, OrganizerProfile

User = get_user_model()

def create_users():
    """Crear usuarios de prueba"""
    print("📥 Creando usuarios...")
    
    # Crear admin si no existe
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@test.com',
            'first_name': 'Admin',
            'last_name': 'Sistema',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print("  ✅ Admin creado: admin/admin123")
    
    # Crear organizador
    organizer, created = User.objects.get_or_create(
        username='organizador',
        defaults={
            'email': 'organizador@test.com',
            'first_name': 'María',
            'last_name': 'González',
            'is_staff': False
        }
    )
    if created:
        organizer.set_password('org123')
        organizer.save()
        OrganizerProfile.objects.create(
            user=organizer,
            license_number='ORG001',
            organization='Club Ecuestre La Paz',
            phone='+591 70123456'
        )
        print("  ✅ Organizador creado: organizador/org123")
    
    # Crear jueces
    judges_data = [
        {'username': 'juez1', 'first_name': 'Carlos', 'last_name': 'Mendoza', 'fei_id': 'BOL001'},
        {'username': 'juez2', 'first_name': 'Ana', 'last_name': 'Vargas', 'fei_id': 'BOL002'},
        {'username': 'juez3', 'first_name': 'Luis', 'last_name': 'Rojas', 'fei_id': 'BOL003'}
    ]
    
    for judge_data in judges_data:
        judge, created = User.objects.get_or_create(
            username=judge_data['username'],
            defaults={
                'email': f"{judge_data['username']}@test.com",
                'first_name': judge_data['first_name'],
                'last_name': judge_data['last_name']
            }
        )
        if created:
            judge.set_password('judge123')
            judge.save()
            JudgeProfile.objects.create(
                user=judge,
                license_number=f"J{judge_data['fei_id'][-3:]}",
                nationality='Bolivia',
                fei_id=judge_data['fei_id'],
                license_level='NATIONAL',
                specializations=['DRESSAGE']
            )
            print(f"  ✅ Juez creado: {judge_data['username']}/judge123")
    
    # Crear jinetes
    riders_data = [
        {'username': 'jinete1', 'first_name': 'Sofia', 'last_name': 'Morales', 'nationality': 'Bolivia'},
        {'username': 'jinete2', 'first_name': 'Diego', 'last_name': 'Fernández', 'nationality': 'Bolivia'},
        {'username': 'jinete3', 'first_name': 'Valentina', 'last_name': 'Cruz', 'nationality': 'Bolivia'},
        {'username': 'jinete4', 'first_name': 'Mateo', 'last_name': 'Sánchez', 'nationality': 'Bolivia'},
        {'username': 'jinete5', 'first_name': 'Isabella', 'last_name': 'Herrera', 'nationality': 'Bolivia'}
    ]
    
    for rider_data in riders_data:
        rider_user, created = User.objects.get_or_create(
            username=rider_data['username'],
            defaults={
                'email': f"{rider_data['username']}@test.com",
                'first_name': rider_data['first_name'],
                'last_name': rider_data['last_name']
            }
        )
        if created:
            rider_user.set_password('rider123')
            rider_user.save()
            
            birth_date = date(1995, 1, 1) + timedelta(days=int(rider_data['username'][-1]) * 365)
            Rider.objects.create(
                user=rider_user,
                license_number=f"R{rider_data['username'][-1]}001",
                nationality=rider_data['nationality'],
                birth_date=birth_date,
                phone=f"+591 7012345{rider_data['username'][-1]}",
                emergency_contact_name=f"Contacto {rider_data['last_name']}",
                emergency_contact_phone=f"+591 7098765{rider_data['username'][-1]}",
                license_type='AMATEUR',
                license_valid_until=date.today() + timedelta(days=365)
            )
            print(f"  ✅ Jinete creado: {rider_data['username']}/rider123")

def create_horses():
    """Crear caballos de prueba"""
    print("🐎 Creando caballos...")
    
    horses_data = [
        {'name': 'Thunder', 'breed': 'Warmblood', 'color': 'Castaño', 'gender': 'GELDING'},
        {'name': 'Luna', 'breed': 'Andaluz', 'color': 'Blanco', 'gender': 'MARE'},
        {'name': 'Rayo', 'breed': 'Criollo', 'color': 'Alazán', 'gender': 'STALLION'},
        {'name': 'Estrella', 'breed': 'Warmblood', 'color': 'Negro', 'gender': 'MARE'},
        {'name': 'Viento', 'breed': 'Árabe', 'color': 'Tordo', 'gender': 'GELDING'}
    ]
    
    for i, horse_data in enumerate(horses_data, 1):
        horse, created = Horse.objects.get_or_create(
            registration_number=f"H{i:03d}2024",
            defaults={
                'name': horse_data['name'],
                'breed': horse_data['breed'],
                'color': horse_data['color'],
                'gender': horse_data['gender'],
                'birth_date': date(2015, i, 15),
                'owner': f"Propietario {i}",
                'country_of_birth': 'Bolivia',
                'passport_number': f"PASS{i:03d}24",
                'vaccination_current': True,
                'health_certificate_valid': True,
                'insurance_valid': True,
                'fei_id': f"BOL{i:03d}H"
            }
        )
        if created:
            print(f"  ✅ Caballo creado: {horse_data['name']} ({horse.registration_number})")

def create_disciplines_and_categories():
    """Crear disciplinas y categorías"""
    print("🏆 Creando disciplinas y categorías...")
    
    # Crear disciplina
    discipline, created = Discipline.objects.get_or_create(
        code='DRESS',
        defaults={
            'name': 'Doma Clásica',
            'description': 'Disciplina de doma clásica según reglamento FEI',
            'fei_code': 'DR'
        }
    )
    if created:
        print("  ✅ Disciplina creada: Doma Clásica")
    
    # Crear categorías
    categories_data = [
        {
            'name': 'Preliminar',
            'code': 'PRELIM',
            'level': 'BEGINNER',
            'min_age_rider': 12,
            'max_age_rider': 80,
            'min_age_horse': 4,
            'max_participants': 30,
            'entry_fee': Decimal('500.00')
        },
        {
            'name': 'Intermedio I',
            'code': 'INT1',
            'level': 'INTERMEDIATE',
            'min_age_rider': 16,
            'max_age_rider': 80,
            'min_age_horse': 6,
            'max_participants': 25,
            'entry_fee': Decimal('750.00')
        }
    ]
    
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            code=cat_data['code'],
            defaults={
                'discipline': discipline,
                'name': cat_data['name'],
                'level': cat_data['level'],
                'min_age_rider': cat_data['min_age_rider'],
                'max_age_rider': cat_data['max_age_rider'],
                'min_age_horse': cat_data['min_age_horse'],
                'max_participants': cat_data['max_participants'],
                'entry_fee': cat_data['entry_fee'],
                'description': f"Categoría {cat_data['name']} de Doma Clásica"
            }
        )
        if created:
            print(f"  ✅ Categoría creada: {cat_data['name']}")

def create_competition():
    """Crear competencia de prueba"""
    print("🏇 Creando competencia...")
    
    organizer = User.objects.get(username='organizador')
    
    competition, created = Competition.objects.get_or_create(
        name='Copa Primavera La Paz 2024',
        defaults={
            'description': 'Competencia de doma clásica primaveral en La Paz',
            'venue': 'Club Ecuestre La Paz',
            'address': 'Zona Sur, La Paz, Bolivia',
            'start_date': date.today() + timedelta(days=7),
            'end_date': date.today() + timedelta(days=9),
            'registration_start': datetime.now(),
            'registration_end': datetime.now() + timedelta(days=5),
            'organizer': organizer,
            'contact_email': 'info@clubecuestrelapaz.bo',
            'contact_phone': '+591 2 2345678',
            'status': 'OPEN',
            'max_total_participants': 50,
            'fei_code': 'BOL2024001',
            'is_fei_sanctioned': True,
            'created_by': organizer
        }
    )
    if created:
        print("  ✅ Competencia creada: Copa Primavera La Paz 2024")
    
    # Agregar categorías a la competencia
    categories = Category.objects.all()
    for category in categories:
        comp_cat, created = CompetitionCategory.objects.get_or_create(
            competition=competition,
            category=category,
            defaults={
                'max_participants': 20,
                'start_time': datetime.combine(competition.start_date, datetime.min.time().replace(hour=9)),
                'order': category.id
            }
        )
        if created:
            print(f"  ✅ Categoría {category.name} agregada a competencia")
    
    return competition

def create_registrations(competition):
    """Crear inscripciones de participantes"""
    print("📝 Creando inscripciones...")
    
    riders = Rider.objects.all()
    horses = Horse.objects.all()
    comp_categories = CompetitionCategory.objects.filter(competition=competition)
    organizer = User.objects.get(username='organizador')
    
    registrations_created = 0
    for i, (rider, horse) in enumerate(zip(riders, horses)):
        for comp_cat in comp_categories:
            registration, created = Registration.objects.get_or_create(
                competition_category=comp_cat,
                rider=rider,
                horse=horse,
                defaults={
                    'status': 'CONFIRMED',
                    'start_number': registrations_created + 1,
                    'entry_fee_paid': comp_cat.effective_entry_fee,
                    'payment_date': datetime.now(),
                    'payment_reference': f'PAY{registrations_created + 1:03d}',
                    'created_by': organizer
                }
            )
            if created:
                registrations_created += 1
                print(f"  ✅ Inscripción creada: {rider.user.get_full_name()} + {horse.name} en {comp_cat.category.name}")
    
    return registrations_created

def create_evaluation_parameters():
    """Crear parámetros de evaluación FEI"""
    print("📊 Creando parámetros de evaluación...")
    
    categories = Category.objects.all()
    
    # Parámetros estándar FEI para doma clásica
    parameters_data = [
        {'exercise_number': 1, 'name': 'Entrada al cuadrilongo', 'coefficient': 1, 'description': 'Entrada y parada inicial'},
        {'exercise_number': 2, 'name': 'Trabajo al paso', 'coefficient': 1, 'description': 'Calidad del paso'},
        {'exercise_number': 3, 'name': 'Trabajo al trote', 'coefficient': 2, 'description': 'Calidad del trote'},
        {'exercise_number': 4, 'name': 'Trabajo al galope', 'coefficient': 2, 'description': 'Calidad del galope'},
        {'exercise_number': 5, 'name': 'Transiciones', 'coefficient': 1, 'description': 'Calidad de las transiciones'},
        {'exercise_number': 6, 'name': 'Figuras y trazado', 'coefficient': 1, 'description': 'Precisión en figuras'},
        {'exercise_number': 7, 'name': 'Impulso', 'coefficient': 2, 'description': 'Impulso y energía'},
        {'exercise_number': 8, 'name': 'Sumisión', 'coefficient': 2, 'description': 'Sumisión y obediencia'},
        {'exercise_number': 9, 'name': 'Posición del jinete', 'coefficient': 1, 'description': 'Asiento y ayudas del jinete'},
        {'exercise_number': 10, 'name': 'Impresión general', 'coefficient': 3, 'description': 'Impresión general de la prueba', 'is_collective': True}
    ]
    
    for category in categories:
        for param_data in parameters_data:
            parameter, created = EvaluationParameter.objects.get_or_create(
                category=category,
                exercise_number=param_data['exercise_number'],
                defaults={
                    'exercise_name': param_data['name'],
                    'coefficient': param_data['coefficient'],
                    'max_score': Decimal('10.0'),
                    'is_collective_mark': param_data.get('is_collective', False),
                    'description': param_data['description'],
                    'order': param_data['exercise_number']
                }
            )
            if created:
                print(f"  ✅ Parámetro creado: {param_data['name']} (coef. {param_data['coefficient']}) para {category.name}")

def create_ranking_configurations(competition):
    """Crear configuraciones de ranking"""
    print("⚙️ Creando configuraciones de ranking...")
    
    comp_categories = CompetitionCategory.objects.filter(competition=competition)
    
    for comp_cat in comp_categories:
        config, created = RankingConfiguration.objects.get_or_create(
            competition=competition,
            category=comp_cat.category,
            defaults={
                'auto_calculate': True,
                'calculation_interval': 30,
                'tie_break_method': 'PERCENTAGE',
                'broadcast_enabled': True,
                'broadcast_interval': 5,
                'show_percentages': True,
                'show_judge_breakdown': True,
                'show_position_changes': True
            }
        )
        if created:
            print(f"  ✅ Configuración de ranking creada para {comp_cat.category.name}")

def main():
    """Función principal"""
    print("🚀 INICIANDO CREACIÓN DE DATOS DE PRUEBA")
    print("=" * 50)
    
    try:
        # Crear datos en orden
        create_users()
        create_horses()
        create_disciplines_and_categories()
        competition = create_competition()
        registrations_count = create_registrations(competition)
        create_evaluation_parameters()
        create_ranking_configurations(competition)
        
        print("\n" + "=" * 50)
        print("🎉 DATOS DE PRUEBA CREADOS EXITOSAMENTE!")
        print(f"📊 Resumen:")
        print(f"   - Usuarios: {User.objects.count()}")
        print(f"   - Jinetes: {Rider.objects.count()}")
        print(f"   - Caballos: {Horse.objects.count()}")
        print(f"   - Disciplinas: {Discipline.objects.count()}")
        print(f"   - Categorías: {Category.objects.count()}")
        print(f"   - Competencias: {Competition.objects.count()}")
        print(f"   - Inscripciones: {Registration.objects.count()}")
        print(f"   - Parámetros de evaluación: {EvaluationParameter.objects.count()}")
        print(f"   - Configuraciones de ranking: {RankingConfiguration.objects.count()}")
        
        print(f"\n👥 Usuarios creados:")
        print(f"   - Admin: admin/admin123")
        print(f"   - Organizador: organizador/org123")
        print(f"   - Jueces: juez1/judge123, juez2/judge123, juez3/judge123")
        print(f"   - Jinetes: jinete1/rider123, jinete2/rider123, etc.")
        
        print(f"\n🏆 Competencia creada:")
        print(f"   - {competition.name}")
        print(f"   - Categorías: {', '.join([cc.category.name for cc in CompetitionCategory.objects.filter(competition=competition)])}")
        print(f"   - {registrations_count} inscripciones")
        
        print(f"\n🎯 Próximo paso: Crear algunas calificaciones para generar rankings")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()