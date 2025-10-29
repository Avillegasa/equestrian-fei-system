#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para COMPLETAR todas las competencias con datos faltantes
Agrega participantes, staff, eventos, scorecards y rankings a TODAS las competencias

Uso:
    python complete_all_competitions.py
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
from apps.users.models import JudgeProfile
from apps.competitions.models import (
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


def assign_judges_to_competition(competition, judges):
    """Asigna jueces a una competencia si no tiene"""
    existing_staff = CompetitionStaff.objects.filter(competition=competition).count()

    if existing_staff > 0:
        print(f'  ℹ️  {competition.short_name} ya tiene {existing_staff} staff asignados')
        return

    num_judges = min(3, len(judges))
    selected_judges = random.sample(judges, num_judges)

    for i, judge in enumerate(selected_judges):
        role = 'chief_judge' if i == 0 else 'judge'
        CompetitionStaff.objects.create(
            competition=competition,
            staff_member=judge,
            role=role,
            is_confirmed=True
        )
        print(f'  ✅ Staff asignado: {judge.get_full_name()} como {role}')


def create_participants_for_competition(competition, riders, horses):
    """Crea participantes para una competencia si no tiene"""
    existing_participants = Participant.objects.filter(competition=competition).count()

    if existing_participants > 0:
        print(f'  ℹ️  {competition.short_name} ya tiene {existing_participants} participantes')
        return

    categories = list(competition.categories.all())
    if not categories:
        print(f'  ⚠️  {competition.short_name} no tiene categorías asignadas')
        return

    # Número de participantes según tipo de competencia
    num_participants_map = {
        'international': 15,
        'national': 14,
        'regional': 12,
        'local': 10,
        'championship': 14,
    }
    num_participants = num_participants_map.get(competition.competition_type, 12)

    for i in range(num_participants):
        rider = riders[i % len(riders)]
        horse = horses[i % len(horses)]
        category = categories[i % len(categories)]
        bib_number = i + 1

        Participant.objects.create(
            competition=competition,
            rider=rider,
            horse=horse,
            category=category,
            bib_number=bib_number,
            is_confirmed=True,
            is_paid=True,
        )
        print(f'    ✅ Participante #{bib_number}: {rider.get_full_name()} con {horse.name} en {category.name}')


def create_schedule_for_competition(competition):
    """Crea eventos programados para una competencia si no tiene"""
    existing_events = CompetitionSchedule.objects.filter(competition=competition).count()

    if existing_events > 0:
        print(f'  ℹ️  {competition.short_name} ya tiene {existing_events} eventos programados')
        return

    start_date = competition.start_date
    categories = list(competition.categories.all())

    if not categories:
        print(f'  ⚠️  {competition.short_name} no tiene categorías para programar')
        return

    events_data = [
        {'title': 'Apertura y Ceremonia de Bienvenida', 'schedule_type': 'special_event', 'duration_minutes': 60},
        {'title': 'Calentamiento General', 'schedule_type': 'break', 'duration_minutes': 90},
        {'title': f'Categoría {categories[0].name} - Ronda 1', 'schedule_type': 'category_start', 'duration_minutes': 180},
        {'title': f'Categoría {categories[1 % len(categories)].name} - Ronda 1', 'schedule_type': 'category_start', 'duration_minutes': 180},
        {'title': 'Almuerzo', 'schedule_type': 'lunch', 'duration_minutes': 60},
        {'title': f'Categoría {categories[2 % len(categories)].name} - Ronda 1', 'schedule_type': 'category_start', 'duration_minutes': 180},
        {'title': 'Premiación Final', 'schedule_type': 'awards', 'duration_minutes': 45},
    ]

    current_time = start_date
    for event_data in events_data:
        end_time = current_time + timedelta(minutes=event_data['duration_minutes'])

        CompetitionSchedule.objects.create(
            competition=competition,
            title=event_data['title'],
            schedule_type=event_data['schedule_type'],
            start_time=current_time,
            end_time=end_time,
        )
        print(f'    ✅ Evento: {event_data["title"]}')

        current_time = end_time + timedelta(minutes=15)


def create_scorecards_for_completed_competition(competition, criterias):
    """Crea scorecards para competencias completadas"""
    if competition.status != 'completed':
        return

    participants = Participant.objects.filter(competition=competition)
    judges = CompetitionStaff.objects.filter(
        competition=competition,
        role__in=['judge', 'chief_judge']
    )

    if not judges.exists():
        print(f'  ⚠️  {competition.short_name} no tiene jueces asignados')
        return

    if not criterias:
        print(f'  ⚠️  No hay criterios de scoring disponibles')
        return

    # Verificar si ya tiene scorecards
    existing_scorecards = ScoreCard.objects.filter(participant__competition=competition).count()
    if existing_scorecards > 0:
        print(f'  ℹ️  {competition.short_name} ya tiene {existing_scorecards} scorecards')
        return

    scorecard_count = 0
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
                scorecard_count += 1

    print(f'  ✅ {scorecard_count} scorecards creados para {competition.short_name}')


def create_individual_scores(scorecard, criterias, participant):
    """Crea scores individuales para cada criterio"""
    category_level = participant.category.level if participant.category.level else 'intermediate'

    base_scores = {
        'professional': (7.0, 8.5),
        'advanced': (6.5, 8.0),
        'intermediate': (6.0, 7.5),
        'international': (7.5, 9.0),
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


def create_rankings_for_completed_competition(competition):
    """Crea rankings para competencias completadas"""
    if competition.status != 'completed':
        return

    # Verificar si ya tiene rankings
    existing_rankings = CompetitionRanking.objects.filter(competition=competition).count()
    if existing_rankings > 0:
        print(f'  ℹ️  {competition.short_name} ya tiene {existing_rankings} rankings')
        return

    ranking_count = 0
    for category in competition.categories.all():
        ranking = CompetitionRanking.objects.create(
            competition=competition,
            category=category,
            is_final=True,
            is_published=True,
        )

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
                participant_scores.append({
                    'participant': participant,
                    'score': avg_score,
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

        ranking_count += 1
        print(f'  ✅ Ranking creado: {category.name} - {len(participant_scores)} participantes')

    return ranking_count


def main():
    """Función principal"""
    print('\n')
    print('=' * 70)
    print('  SCRIPT DE COMPLETADO DE COMPETENCIAS')
    print('  Agrega datos faltantes a TODAS las competencias')
    print('=' * 70)
    print(f'\n  📅 Fecha: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}\n')

    try:
        # Obtener todos los datos necesarios
        all_competitions = Competition.objects.all().order_by('-start_date')
        all_judges = [u for u in User.objects.filter(role='judge') if hasattr(u, 'judge_profile')]
        all_riders = list(User.objects.filter(role='viewer'))
        all_horses = list(Horse.objects.all())
        dressage_criterias = list(ScoringCriteria.objects.filter(discipline__code='DR'))

        print(f'  📊 Datos disponibles:')
        print(f'    • Competencias: {len(all_competitions)}')
        print(f'    • Jueces: {len(all_judges)}')
        print(f'    • Jinetes: {len(all_riders)}')
        print(f'    • Caballos: {len(all_horses)}')
        print(f'    • Criterios de scoring: {len(dressage_criterias)}')

        if not all_judges:
            print('\n  ⚠️  ERROR: No hay jueces en el sistema. Ejecutar load_demo_data.py primero.')
            sys.exit(1)

        if not all_riders:
            print('\n  ⚠️  ERROR: No hay jinetes en el sistema.')
            sys.exit(1)

        if not all_horses:
            print('\n  ⚠️  ERROR: No hay caballos en el sistema.')
            sys.exit(1)

        # Procesar cada competencia
        for competition in all_competitions:
            print_section(f'COMPLETANDO: {competition.name}')
            print(f'  Status: {competition.status}')
            print(f'  Tipo: {competition.competition_type}')

            # 1. Asignar jueces
            print('\n  👨‍⚖️  Asignando jueces...')
            assign_judges_to_competition(competition, all_judges)

            # 2. Crear participantes
            print('\n  🏇 Creando participantes...')
            create_participants_for_competition(competition, all_riders, all_horses)

            # 3. Crear eventos programados
            print('\n  📅 Creando eventos programados...')
            create_schedule_for_competition(competition)

            # 4. Para competencias completadas: scorecards y rankings
            if competition.status == 'completed':
                print('\n  📝 Creando scorecards (competencia completada)...')
                create_scorecards_for_completed_competition(competition, dressage_criterias)

                print('\n  🏆 Generando rankings finales...')
                create_rankings_for_completed_competition(competition)

        # Resumen final
        print_section('✅ PROCESO COMPLETADO')
        print('\n  📊 Resumen final del sistema:')
        print(f'    • Competencias totales: {Competition.objects.count()}')
        print(f'    • Participantes totales: {Participant.objects.count()}')
        print(f'    • Staff/Jueces asignados: {CompetitionStaff.objects.count()}')
        print(f'    • Eventos programados: {CompetitionSchedule.objects.count()}')
        print(f'    • Scorecards totales: {ScoreCard.objects.count()}')
        print(f'    • Rankings totales: {CompetitionRanking.objects.count()}')

        print('\n  🎉 Todas las competencias tienen datos completos!\n')

    except Exception as e:
        print_section('❌ ERROR DURANTE LA EJECUCIÓN')
        print(f'\n  Error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
