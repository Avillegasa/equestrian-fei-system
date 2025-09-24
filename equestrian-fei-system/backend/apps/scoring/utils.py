from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import CompetitionRanking, RankingEntry, ScoreCard


def calculate_competition_ranking(competition, discipline=None, category=None):
    """
    Calcular rankings para una competencia específica
    """
    # Si no se especifican disciplina y categoría, recalcular todos los rankings
    if discipline is None and category is None:
        disciplines = competition.disciplines.all()
        categories = competition.categories.all()
        
        for disc in disciplines:
            for cat in categories:
                _calculate_specific_ranking(competition, disc, cat)
    else:
        _calculate_specific_ranking(competition, discipline, category)


def _calculate_specific_ranking(competition, discipline, category):
    """
    Calcular ranking para una combinación específica de competencia/disciplina/categoría
    """
    with transaction.atomic():
        # Obtener o crear el ranking
        ranking, created = CompetitionRanking.objects.get_or_create(
            competition=competition,
            discipline=discipline,
            category=category,
            defaults={
                'ranking_type': 'general',
                'calculation_method': 'standard',
                'is_final': False,
                'is_published': False
            }
        )
        
        # Limpiar entradas existentes
        ranking.entries.all().delete()
        
        # Obtener scorecards completados para esta combinación
        scorecards = ScoreCard.objects.filter(
            competition=competition,
            participant__categories__in=[category],
            status='completed'
        ).select_related(
            'participant__user', 'participant__horse'
        ).exclude(is_disqualified=True)
        
        # Filtrar por disciplina si el participante tiene disciplinas específicas
        # (esto depende de cómo esté estructurada la relación participante-disciplina)
        
        # Ordenar por puntuación final (descendente)
        scorecards = scorecards.order_by('-final_score', '-technical_score', '-artistic_score')
        
        # Crear entradas de ranking
        position = 1
        previous_score = None
        tied_participants = []
        
        for i, scorecard in enumerate(scorecards):
            current_score = scorecard.final_score
            
            # Manejar empates
            is_tied = False
            if previous_score is not None and current_score == previous_score:
                is_tied = True
                position = tied_participants[0].position if tied_participants else position
                tied_participants.append(scorecard)
            else:
                if tied_participants:
                    # Resolver empates anteriores
                    _resolve_ties(ranking, tied_participants)
                    tied_participants = []
                
                position = i + 1
                tied_participants = [scorecard]
            
            # Crear entrada de ranking
            entry = RankingEntry.objects.create(
                ranking=ranking,
                participant=scorecard.participant,
                position=position,
                final_score=scorecard.final_score,
                technical_score=scorecard.technical_score,
                artistic_score=scorecard.artistic_score,
                time_score=scorecard.time_score,
                penalty_points=scorecard.penalties,
                is_tied=is_tied
            )
            
            previous_score = current_score
        
        # Resolver empates finales si los hay
        if tied_participants:
            _resolve_ties(ranking, tied_participants)
        
        # Actualizar información del ranking
        ranking.total_participants = scorecards.count()
        ranking.last_updated = timezone.now()
        ranking.save()


def _resolve_ties(ranking, tied_scorecards):
    """
    Resolver empates usando criterios de desempate
    """
    if len(tied_scorecards) <= 1:
        return
    
    # Criterios de desempate en orden de prioridad:
    # 1. Mayor puntuación técnica
    # 2. Mayor puntuación artística  
    # 3. Menor tiempo (si aplicable)
    # 4. Menores penalizaciones
    
    # Ordenar por criterios de desempate
    tied_scorecards.sort(key=lambda x: (
        -x.technical_score,  # Mayor técnica (negativo para orden descendente)
        -x.artistic_score,   # Mayor artística
        x.time_score if x.time_score else 0,  # Menor tiempo
        x.penalties          # Menores penalizaciones
    ))
    
    # Actualizar entradas con información de desempate
    for i, scorecard in enumerate(tied_scorecards):
        try:
            entry = RankingEntry.objects.get(
                ranking=ranking,
                participant=scorecard.participant
            )
            
            if len(tied_scorecards) > 1 and i > 0:
                # Generar información de desempate
                tie_info = []
                if scorecard.technical_score != tied_scorecards[0].technical_score:
                    tie_info.append(f"Técnica: {scorecard.technical_score}")
                if scorecard.artistic_score != tied_scorecards[0].artistic_score:
                    tie_info.append(f"Artística: {scorecard.artistic_score}")
                if scorecard.time_score and tied_scorecards[0].time_score:
                    if scorecard.time_score != tied_scorecards[0].time_score:
                        tie_info.append(f"Tiempo: {scorecard.time_score}")
                if scorecard.penalties != tied_scorecards[0].penalties:
                    tie_info.append(f"Penalizaciones: {scorecard.penalties}")
                
                entry.tie_break_info = "; ".join(tie_info)
                entry.save()
                
        except RankingEntry.DoesNotExist:
            continue


def calculate_fei_jumping_score(time_taken, time_allowed, faults, penalties):
    """
    Calcular puntuación FEI para salto
    """
    # Tiempo base
    time_penalties = 0
    if time_taken > time_allowed:
        time_penalties = int(time_taken - time_allowed)  # 1 punto por segundo
    
    # Penalizaciones por faltas
    fault_penalties = 0
    if faults:
        for fault in faults:
            fault_penalties += fault.penalty_points
    
    # Puntuación final (menor es mejor en salto)
    final_score = fault_penalties + time_penalties + penalties
    
    return final_score


def calculate_fei_dressage_score(movements, collective_marks=None):
    """
    Calcular puntuación FEI para doma
    """
    if not movements:
        return 0
    
    total_score = 0
    total_possible = 0
    
    # Sumar puntuaciones de movimientos
    for movement in movements:
        weighted_score = movement.score * movement.coefficient
        total_score += weighted_score
        total_possible += 10 * movement.coefficient  # Máximo 10 puntos
    
    # Agregar marcas colectivas si existen
    if collective_marks:
        for mark in collective_marks:
            total_score += mark.score * mark.coefficient
            total_possible += 10 * mark.coefficient
    
    # Convertir a porcentaje
    if total_possible > 0:
        percentage = (total_score / total_possible) * 100
        return round(percentage, 2)
    
    return 0


def calculate_eventing_score(dressage_score, jumping_penalties, cross_country_penalties, time_penalties):
    """
    Calcular puntuación total para concurso completo
    """
    # En eventing, se suman las penalizaciones (menor es mejor)
    dressage_penalties = (100 - dressage_score) if dressage_score else 0
    
    total_penalties = (
        dressage_penalties + 
        jumping_penalties + 
        cross_country_penalties + 
        time_penalties
    )
    
    return total_penalties


def update_live_rankings(competition_id):
    """
    Actualizar rankings en vivo para una competencia
    """
    try:
        from apps.competitions.models import Competition
        competition = Competition.objects.get(id=competition_id)
        calculate_competition_ranking(competition)
        
        # Marcar como actualizado en vivo
        rankings = CompetitionRanking.objects.filter(competition=competition)
        for ranking in rankings:
            ranking.last_updated = timezone.now()
            ranking.save()
            
        return True
    except Competition.DoesNotExist:
        return False


def get_ranking_statistics(competition_id, discipline_id=None, category_id=None):
    """
    Obtener estadísticas de ranking para una competencia
    """
    filters = {'competition_id': competition_id}
    if discipline_id:
        filters['discipline_id'] = discipline_id
    if category_id:
        filters['category_id'] = category_id
    
    rankings = CompetitionRanking.objects.filter(**filters)
    
    stats = {
        'total_rankings': rankings.count(),
        'published_rankings': rankings.filter(is_published=True).count(),
        'final_rankings': rankings.filter(is_final=True).count(),
        'total_participants': 0,
        'average_score': 0,
        'score_distribution': {}
    }
    
    all_entries = RankingEntry.objects.filter(ranking__in=rankings)
    if all_entries.exists():
        from django.db.models import Avg
        stats['total_participants'] = all_entries.count()
        stats['average_score'] = all_entries.aggregate(
            avg=Avg('final_score')
        )['avg'] or 0
        
        # Distribución de puntuaciones (rangos de 10 puntos)
        for entry in all_entries:
            score_range = int(entry.final_score // 10) * 10
            range_key = f"{score_range}-{score_range + 9}"
            stats['score_distribution'][range_key] = stats['score_distribution'].get(range_key, 0) + 1
    
    return stats


def export_ranking_to_csv(ranking_id):
    """
    Exportar ranking a formato CSV
    """
    import csv
    from io import StringIO
    
    try:
        ranking = CompetitionRanking.objects.get(id=ranking_id)
        entries = ranking.entries.select_related(
            'participant__user', 'participant__horse'
        ).order_by('position')
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            'Posición', 'Participante', 'Caballo', 'País',
            'Puntuación Final', 'Puntuación Técnica', 'Puntuación Artística',
            'Puntuación Tiempo', 'Penalizaciones', 'Empate', 'Info Desempate'
        ])
        
        # Data
        for entry in entries:
            writer.writerow([
                entry.position,
                entry.participant.user.get_full_name(),
                entry.participant.horse.name,
                entry.participant.user.country or 'N/A',
                entry.final_score,
                entry.technical_score,
                entry.artistic_score,
                entry.time_score or 0,
                entry.penalty_points,
                'Sí' if entry.is_tied else 'No',
                entry.tie_break_info or ''
            ])
        
        return output.getvalue()
        
    except CompetitionRanking.DoesNotExist:
        return None


def validate_scorecard_completion(scorecard):
    """
    Validar que un scorecard esté completo antes de calcular puntuación final
    """
    errors = []
    
    # Verificar que tenga puntuaciones individuales si es requerido
    required_criteria = scorecard.competition.disciplines.first().scoring_criteria.filter(is_required=True)
    
    for criteria in required_criteria:
        individual_score = scorecard.individual_scores.filter(criteria=criteria).first()
        if not individual_score:
            errors.append(f"Falta puntuación para criterio: {criteria.name}")
        elif not individual_score.is_final:
            errors.append(f"Puntuación no finalizada para criterio: {criteria.name}")
    
    # Validaciones específicas por disciplina
    discipline = scorecard.competition.disciplines.first()
    if discipline:
        if discipline.code == 'JUMPING':
            # Verificar que tenga registro de faltas si es necesario
            pass
        elif discipline.code == 'DRESSAGE':
            # Verificar movimientos de doma
            movements = scorecard.dressage_movements.all()
            if not movements.exists():
                errors.append("Faltan movimientos de doma")
        elif discipline.code == 'EVENTING':
            # Verificar fases de concurso completo
            phases = scorecard.eventing_phases.all()
            required_phases = ['dressage', 'cross_country', 'jumping']
            for phase in required_phases:
                if not phases.filter(phase_type=phase).exists():
                    errors.append(f"Falta fase de concurso completo: {phase}")
    
    return errors