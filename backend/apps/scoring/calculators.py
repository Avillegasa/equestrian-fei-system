from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple, Optional
from django.db.models import Sum, F, Q, Avg, Min, Max
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import ScoreEntry, JudgeEvaluation, EvaluationParameter, JudgePosition
from apps.competitions.models import Registration


class FEICalculator:
    """
    Motor de cálculo oficial FEI
    Implementa algoritmos precisos basados en las hojas Excel analizadas
    """
    
    # Constantes FEI
    MIN_SCORE = Decimal('0.0')
    MAX_SCORE = Decimal('10.0')
    SCORE_INCREMENT = Decimal('0.5')
    EXTREME_SCORE_THRESHOLD_LOW = Decimal('3.0')
    EXTREME_SCORE_THRESHOLD_HIGH = Decimal('8.5')
    
    @staticmethod
    def validate_score(score: Decimal) -> bool:
        """
        Valida que una puntuación cumple con los estándares FEI
        """
        if score < FEICalculator.MIN_SCORE or score > FEICalculator.MAX_SCORE:
            return False
            
        # Verificar participantes
        participants_count = Registration.objects.filter(competition=competition).count()
        if participants_count == 0:
            errors.append("No hay participantes inscritos en la competencia")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'judges_count': judges_count,
            'participants_count': participants_count
        }
    
    @staticmethod
    def detect_scoring_anomalies(competition) -> List[Dict]:
        """
        Detecta anomalías potenciales en las calificaciones
        """
        anomalies = []
        
        # Detectar variaciones extremas entre jueces
        participants = Registration.objects.filter(competition=competition)
        
        for participant in participants:
            scores_by_exercise = {}
            
            # Agrupar calificaciones por ejercicio
            scores = ScoreEntry.objects.filter(participant=participant)
            for score in scores:
                exercise_num = score.evaluation_parameter.exercise_number
                if exercise_num not in scores_by_exercise:
                    scores_by_exercise[exercise_num] = []
                scores_by_exercise[exercise_num].append({
                    'score': score.score,
                    'judge': score.judge_position.judge.get_full_name(),
                    'position': score.judge_position.position
                })
            
            # Detectar variaciones extremas
            for exercise_num, exercise_scores in scores_by_exercise.items():
                if len(exercise_scores) >= 2:
                    scores_only = [float(s['score']) for s in exercise_scores]
                    score_range = max(scores_only) - min(scores_only)
                    
                    if score_range >= 3.0:  # Diferencia de 3 puntos o más
                        anomalies.append({
                            'type': 'extreme_variation',
                            'participant': participant,
                            'exercise_number': exercise_num,
                            'scores': exercise_scores,
                            'range': score_range,
                            'description': f"Variación extrema en ejercicio {exercise_num}: rango de {score_range} puntos"
                        })
        
        return anomalies
        return (score <= FEICalculator.EXTREME_SCORE_THRESHOLD_LOW or 
                score >= FEICalculator.EXTREME_SCORE_THRESHOLD_HIGH)
    
    @classmethod
    def calculate_participant_total(cls, participant: Registration, judge_position: JudgePosition) -> Dict:
        """
        Calcula el total para un participante específico con un juez específico
        Basado en la estructura de las hojas Excel
        """
        try:
            # Obtener todas las calificaciones del participante para este juez
            scores = ScoreEntry.objects.filter(
                participant=participant,
                judge_position=judge_position
            ).select_related('evaluation_parameter')
            
            if not scores.exists():
                return {
                    'total_weighted_score': Decimal('0.00'),
                    'total_possible_score': Decimal('340.00'),  # Basado en hojas Excel
                    'percentage': Decimal('0.00'),
                    'scores_count': 0,
                    'parameters_count': 0,
                    'is_complete': False
                }
            
            # Calcular totales
            total_weighted = Decimal('0.00')
            total_possible = Decimal('0.00')
            scores_breakdown = []
            
            for score_entry in scores:
                weighted = cls.calculate_weighted_score(
                    score_entry.score, 
                    score_entry.evaluation_parameter.coefficient
                )
                max_weighted = cls.calculate_weighted_score(
                    score_entry.evaluation_parameter.max_score,
                    score_entry.evaluation_parameter.coefficient
                )
                
                total_weighted += weighted
                total_possible += max_weighted
                
                scores_breakdown.append({
                    'exercise_number': score_entry.evaluation_parameter.exercise_number,
                    'exercise_name': score_entry.evaluation_parameter.exercise_name,
                    'score': score_entry.score,
                    'coefficient': score_entry.evaluation_parameter.coefficient,
                    'weighted_score': weighted,
                    'max_possible': max_weighted,
                    'is_collective': score_entry.evaluation_parameter.is_collective_mark
                })
            
            # Calcular porcentaje FEI
            if total_possible > 0:
                percentage = (total_weighted / total_possible * Decimal('100')).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
            else:
                percentage = Decimal('0.00')
            
            # Verificar si está completa la evaluación
            total_parameters = EvaluationParameter.objects.filter(
                category=participant.category
            ).count()
            
            is_complete = len(scores_breakdown) == total_parameters
            
            return {
                'total_weighted_score': total_weighted,
                'total_possible_score': total_possible,
                'percentage': percentage,
                'scores_count': len(scores_breakdown),
                'parameters_count': total_parameters,
                'is_complete': is_complete,
                'scores_breakdown': scores_breakdown
            }
            
        except Exception as e:
            raise ValidationError(f"Error calculando totales: {str(e)}")
    
    @classmethod
    def calculate_participant_average(cls, participant: Registration) -> Dict:
        """
        Calcula el promedio de todos los jueces para un participante
        Implementa la metodología oficial FEI para múltiples jueces
        """
        try:
            # Obtener todas las posiciones de jueces para esta competencia
            judge_positions = JudgePosition.objects.filter(
                competition=participant.competition,
                is_active=True
            )
            
            if not judge_positions.exists():
                return {
                    'average_percentage': Decimal('0.00'),
                    'total_weighted_average': Decimal('0.00'),
                    'judges_count': 0,
                    'judges_breakdown': [],
                    'is_complete': False
                }
            
            judges_results = []
            total_percentages = Decimal('0.00')
            complete_evaluations = 0
            
            for judge_position in judge_positions:
                judge_result = cls.calculate_participant_total(participant, judge_position)
                
                judges_results.append({
                    'judge_name': judge_position.judge.get_full_name(),
                    'judge_position': judge_position.position,
                    'percentage': judge_result['percentage'],
                    'total_weighted': judge_result['total_weighted_score'],
                    'is_complete': judge_result['is_complete']
                })
                
                if judge_result['is_complete']:
                    total_percentages += judge_result['percentage']
                    complete_evaluations += 1
            
            # Calcular promedio solo de evaluaciones completas
            if complete_evaluations > 0:
                average_percentage = (total_percentages / Decimal(str(complete_evaluations))).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
            else:
                average_percentage = Decimal('0.00')
            
            is_complete = complete_evaluations == len(judge_positions)
            
            return {
                'average_percentage': average_percentage,
                'total_weighted_average': total_percentages,
                'judges_count': len(judge_positions),
                'complete_evaluations': complete_evaluations,
                'judges_breakdown': judges_results,
                'is_complete': is_complete
            }
            
        except Exception as e:
            raise ValidationError(f"Error calculando promedio: {str(e)}")
    
    @classmethod
    def calculate_competition_rankings(cls, competition) -> List[Dict]:
        """
        Calcula los rankings completos para una competencia
        Basado en promedios de porcentajes FEI
        """
        try:
            participants = Registration.objects.filter(
                competition=competition
            ).select_related('rider', 'horse', 'category')
            
            rankings = []
            
            for participant in participants:
                result = cls.calculate_participant_average(participant)
                
                rankings.append({
                    'participant': participant,
                    'rider_name': f"{participant.rider.first_name} {participant.rider.last_name}",
                    'horse_name': participant.horse.name,
                    'category': participant.category.name,
                    'number': participant.number,
                    'average_percentage': result['average_percentage'],
                    'judges_count': result['judges_count'],
                    'complete_evaluations': result['complete_evaluations'],
                    'is_complete': result['is_complete'],
                    'judges_breakdown': result['judges_breakdown']
                })
            
            # Ordenar por porcentaje descendente
            rankings.sort(key=lambda x: x['average_percentage'], reverse=True)
            
            # Asignar posiciones manejando empates
            current_position = 1
            for i, ranking in enumerate(rankings):
                if i > 0 and rankings[i-1]['average_percentage'] == ranking['average_percentage']:
                    # Empate - mantener la misma posición
                    ranking['position'] = rankings[i-1]['position']
                else:
                    ranking['position'] = current_position
                current_position = i + 2  # Siguiente posición disponible
            
            return rankings
            
        except Exception as e:
            raise ValidationError(f"Error calculando rankings: {str(e)}")
    
    @classmethod
    def update_judge_evaluation(cls, participant: Registration, judge_position: JudgePosition) -> JudgeEvaluation:
        """
        Actualiza o crea una evaluación de juez con cálculos automáticos
        """
        try:
            # Obtener o crear la evaluación
            evaluation, created = JudgeEvaluation.objects.get_or_create(
                participant=participant,
                judge_position=judge_position,
                defaults={
                    'status': 'draft'
                }
            )
            
            # Calcular totales
            result = cls.calculate_participant_total(participant, judge_position)
            
            # Actualizar campos
            evaluation.total_score = result['total_weighted_score']
            evaluation.total_possible = result['total_possible_score']
            evaluation.percentage = result['percentage']
            
            # Actualizar estado
            if result['is_complete']:
                if evaluation.status in ['draft', 'in_progress']:
                    evaluation.status = 'completed'
                    evaluation.completed_at = timezone.now()
            else:
                if evaluation.status == 'draft':
                    evaluation.status = 'in_progress'
            
            evaluation.save()
            
            return evaluation
            
        except Exception as e:
            raise ValidationError(f"Error actualizando evaluación: {str(e)}")
    
    @classmethod
    def validate_score_entry(cls, score: Decimal, coefficient: int, justification: str = "") -> Dict:
        """
        Valida una entrada de puntuación según estándares FEI
        """
        errors = []
        warnings = []
        
        # Validar rango
        if not cls.validate_score(score):
            errors.append("La puntuación debe estar entre 0.0 y 10.0 en incrementos de 0.5")
        
        # Validar coeficiente
        if coefficient not in [1, 2, 3, 4, 5]:
            errors.append("El coeficiente debe ser 1, 2, 3, 4 o 5")
        
        # Verificar justificación para puntuaciones extremas
        if cls.is_extreme_score(score):
            if not justification.strip():
                errors.append("Se requiere justificación para puntuaciones ≤3.0 o ≥8.5")
            else:
                warnings.append("Puntuación extrema registrada con justificación")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'weighted_score': cls.calculate_weighted_score(score, coefficient),
            'is_extreme': cls.is_extreme_score(score)
        }
    
    @classmethod
    def get_statistics_summary(cls, competition) -> Dict:
        """
        Genera estadísticas resumidas para una competencia
        """
        try:
            participants_count = Registration.objects.filter(competition=competition).count()
            judges_count = JudgePosition.objects.filter(
                competition=competition, 
                is_active=True
            ).count()
            
            total_scores = ScoreEntry.objects.filter(
                participant__competition=competition
            ).count()
            
            expected_scores = participants_count * judges_count * EvaluationParameter.objects.filter(
                category__in=competition.categories.all()
            ).count()
            
            completion_percentage = Decimal('0.00')
            if expected_scores > 0:
                completion_percentage = (Decimal(str(total_scores)) / Decimal(str(expected_scores)) * Decimal('100')).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
            
            # Estadísticas de puntuaciones
            avg_stats = ScoreEntry.objects.filter(
                participant__competition=competition
            ).aggregate(
                avg_score=Avg('score'),
                min_score=Min('score'),
                max_score=Max('score')
            )
            
            return {
                'participants_count': participants_count,
                'judges_count': judges_count,
                'total_scores_entered': total_scores,
                'expected_total_scores': expected_scores,
                'completion_percentage': completion_percentage,
                'average_score': avg_stats['avg_score'] or Decimal('0.00'),
                'minimum_score': avg_stats['min_score'] or Decimal('0.00'),
                'maximum_score': avg_stats['max_score'] or Decimal('0.00'),
            }
            
        except Exception as e:
            raise ValidationError(f"Error generando estadísticas: {str(e)}")


class FEIValidationEngine:
    """
    Motor de validación específico para reglas FEI
    """
    
    @staticmethod
    def validate_competition_setup(competition) -> Dict:
        """
        Valida que una competencia esté correctamente configurada para calificación FEI
        """
        errors = []
        warnings = []
    
    @classmethod
    def calculate_participant_total(cls, participant: Registration, judge_position: JudgePosition) -> Dict:
        """
        Calcula el total para un participante específico con un juez específico
        Basado en la estructura de las hojas Excel
        """
        try:
            # Obtener todas las calificaciones del participante para este juez
            scores = ScoreEntry.objects.filter(
                participant=participant,
                judge_position=judge_position
            ).select_related('evaluation_parameter')
            
            if not scores.exists():
                return {
                    'total_weighted_score': Decimal('0.00'),
                    'total_possible_score': Decimal('340.00'),  # Basado en hojas Excel
                    'percentage': Decimal('0.00'),
                    'scores_count': 0,
                    'parameters_count': 0,
                    'is_complete': False
                }
            
            # Calcular totales
            total_weighted = Decimal('0.00')
            total_possible = Decimal('0.00')
            scores_breakdown = []
            
            for score_entry in scores:
                weighted = cls.calculate_weighted_score(
                    score_entry.score, 
                    score_entry.evaluation_parameter.coefficient
                )
                max_weighted = cls.calculate_weighted_score(
                    score_entry.evaluation_parameter.max_score,
                    score_entry.evaluation_parameter.coefficient
                )
                
                total_weighted += weighted
                total_possible += max_weighted
                
                scores_breakdown.append({
                    'exercise_number': score_entry.evaluation_parameter.exercise_number,
                    'exercise_name': score_entry.evaluation_parameter.exercise_name,
                    'score': score_entry.score,
                    'coefficient': score_entry.evaluation_parameter.coefficient,
                    'weighted_score': weighted,
                    'max_possible': max_weighted,
                    'is_collective': score_entry.evaluation_parameter.is_collective_mark
                })
            
            # Calcular porcentaje FEI
            if total_possible > 0:
                percentage = (total_weighted / total_possible * Decimal('100')).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
            else:
                percentage = Decimal('0.00')
            
            # Verificar si está completa la evaluación
            total_parameters = EvaluationParameter.objects.filter(
                category=participant.category
            ).count()
            
            is_complete = len(scores_breakdown) == total_parameters
            
            return {
                'total_weighted_score': total_weighted,
                'total_possible_score': total_possible,
                'percentage': percentage,
                'scores_count': len(scores_breakdown),
                'parameters_count': total_parameters,
                'is_complete': is_complete,
                'scores_breakdown': scores_breakdown
            }
            
        except Exception as e:
            raise ValidationError(f"Error calculando totales: {str(e)}")
    
    @classmethod
    def calculate_participant_average(cls, participant: Registration) -> Dict:
        """
        Calcula el promedio de todos los jueces para un participante
        Implementa la metodología oficial FEI para múltiples jueces
        """
        try:
            # Obtener todas las posiciones de jueces para esta competencia
            judge_positions = JudgePosition.objects.filter(
                competition=participant.competition,
                is_active=True
            )
            
            if not judge_positions.exists():
                return {
                    'average_percentage': Decimal('0.00'),
                    'total_weighted_average': Decimal('0.00'),
                    'judges_count': 0,
                    'judges_breakdown': [],
                    'is_complete': False
                }
            
            judges_results = []
            total_percentages = Decimal('0.00')
            complete_evaluations = 0
            
            for judge_position in judge_positions:
                judge_result = cls.calculate_participant_total(participant, judge_position)
                
                judges_results.append({
                    'judge_name': judge_position.judge.get_full_name(),
                    'judge_position': judge_position.position,
                    'percentage': judge_result['percentage'],
                    'total_weighted': judge_result['total_weighted_score'],
                    'is_complete': judge_result['is_complete']
                })
                
                if judge_result['is_complete']:
                    total_percentages += judge_result['percentage']
                    complete_evaluations += 1
            
            # Calcular promedio solo de evaluaciones completas
            if complete_evaluations > 0:
                average_percentage = (total_percentages / Decimal(str(complete_evaluations))).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
            else:
                average_percentage = Decimal('0.00')
            
            is_complete = complete_evaluations == len(judge_positions)
            
            return {
                'average_percentage': average_percentage,
                'total_weighted_average': total_percentages,
                'judges_count': len(judge_positions),
                'complete_evaluations': complete_evaluations,
                'judges_breakdown': judges_results,
                'is_complete': is_complete
            }
            
        except Exception as e:
            raise ValidationError(f"Error calculando promedio: {str(e)}")
    
    @classmethod
    def calculate_competition_rankings(cls, competition) -> List[Dict]:
        """
        Calcula los rankings completos para una competencia
        Basado en promedios de porcentajes FEI
        """
        try:
            participants = Registration.objects.filter(
                competition=competition
            ).select_related('rider', 'horse', 'category')
            
            rankings = []
            
            for participant in participants:
                result = cls.calculate_participant_average(participant)
                
                rankings.append({
                    'participant': participant,
                    'rider_name': f"{participant.rider.first_name} {participant.rider.last_name}",
                    'horse_name': participant.horse.name,
                    'category': participant.category.name,
                    'number': participant.number,
                    'average_percentage': result['average_percentage'],
                    'judges_count': result['judges_count'],
                    'complete_evaluations': result['complete_evaluations'],
                    'is_complete': result['is_complete'],
                    'judges_breakdown': result['judges_breakdown']
                })
            
            # Ordenar por porcentaje descendente
            rankings.sort(key=lambda x: x['average_percentage'], reverse=True)
            
            # Asignar posiciones manejando empates
            current_position = 1
            for i, ranking in enumerate(rankings):
                if i > 0 and rankings[i-1]['average_percentage'] == ranking['average_percentage']:
                    # Empate - mantener la misma posición
                    ranking['position'] = rankings[i-1]['position']
                else:
                    ranking['position'] = current_position
                current_position = i + 2  # Siguiente posición disponible
            
            return rankings
            
        except Exception as e:
            raise ValidationError(f"Error calculando rankings: {str(e)}")
    
    @classmethod
    def update_judge_evaluation(cls, participant: Registration, judge_position: JudgePosition) -> JudgeEvaluation:
        """
        Actualiza o crea una evaluación de juez con cálculos automáticos
        """
        try:
            # Obtener o crear la evaluación
            evaluation, created = JudgeEvaluation.objects.get_or_create(
                participant=participant,
                judge_position=judge_position,
                defaults={
                    'status': 'draft'
                }
            )
            
            # Calcular totales
            result = cls.calculate_participant_total(participant, judge_position)
            
            # Actualizar campos
            evaluation.total_score = result['total_weighted_score']
            evaluation.total_possible = result['total_possible_score']
            evaluation.percentage = result['percentage']
            
            # Actualizar estado
            if result['is_complete']:
                if evaluation.status in ['draft', 'in_progress']:
                    evaluation.status = 'completed'
                    evaluation.completed_at = timezone.now()
            else:
                if evaluation.status == 'draft':
                    evaluation.status = 'in_progress'
            
            evaluation.save()
            
            return evaluation
            
        except Exception as e:
            raise ValidationError(f"Error actualizando evaluación: {str(e)}")
    
    @classmethod
    def validate_score_entry(cls, score: Decimal, coefficient: int, justification: str = "") -> Dict:
        """
        Valida una entrada de puntuación según estándares FEI
        """
        errors = []
        warnings = []
        
        # Validar rango
        if not cls.validate_score(score):
            errors.append("La puntuación debe estar entre 0.0 y 10.0 en incrementos de 0.5")
        
        # Validar coeficiente
        if coefficient not in [1, 2, 3, 4, 5]:
            errors.append("El coeficiente debe ser 1, 2, 3, 4 o 5")
        
        # Verificar justificación para puntuaciones extremas
        if cls.is_extreme_score(score):
            if not justification.strip():
                errors.append("Se requiere justificación para puntuaciones ≤3.0 o ≥8.5")
            else:
                warnings.append("Puntuación extrema registrada con justificación")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'weighted_score': cls.calculate_weighted_score(score, coefficient),
            'is_extreme': cls.is_extreme_score(score)
        }
    
    @classmethod
    def get_statistics_summary(cls, competition) -> Dict:
        """
        Genera estadísticas resumidas para una competencia
        """
        try:
            participants_count = Registration.objects.filter(competition=competition).count()
            judges_count = JudgePosition.objects.filter(
                competition=competition, 
                is_active=True
            ).count()
            
            total_scores = ScoreEntry.objects.filter(
                participant__competition=competition
            ).count()
            
            expected_scores = participants_count * judges_count * EvaluationParameter.objects.filter(
                category__in=competition.categories.all()
            ).count()
            
            completion_percentage = Decimal('0.00')
            if expected_scores > 0:
                completion_percentage = (Decimal(str(total_scores)) / Decimal(str(expected_scores)) * Decimal('100')).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
            
            # Estadísticas de puntuaciones
            avg_stats = ScoreEntry.objects.filter(
                participant__competition=competition
            ).aggregate(
                avg_score=Avg('score'),
                min_score=Min('score'),
                max_score=Max('score')
            )
            
            return {
                'participants_count': participants_count,
                'judges_count': judges_count,
                'total_scores_entered': total_scores,
                'expected_total_scores': expected_scores,
                'completion_percentage': completion_percentage,
                'average_score': avg_stats['avg_score'] or Decimal('0.00'),
                'minimum_score': avg_stats['min_score'] or Decimal('0.00'),
                'maximum_score': avg_stats['max_score'] or Decimal('0.00'),
            }
            
        except Exception as e:
            raise ValidationError(f"Error generando estadísticas: {str(e)}")


class FEIValidationEngine:
    """
    Motor de validación específico para reglas FEI
    """
    
    @staticmethod
    def validate_competition_setup(competition) -> Dict:
        """
        Valida que una competencia esté correctamente configurada para calificación FEI
        """
        errors = []
        warnings = []
        
        # Verificar que hay jueces asignados
        judges_count = JudgePosition.objects.filter(
            competition=competition,
            is_active=True
        ).count()
        
        if judges_count == 0:
            errors.append("No hay jueces asignados a la competencia")
        elif judges_count == 1:
            warnings.append("Solo hay un juez asignado. Se recomienda mínimo 3 jueces para competencias FEI")
        
        # Verificar parámetros de evaluación
        for category in competition.categories.all():
            params_count = EvaluationParameter.objects.filter(category=category).count()
            if params_count == 0:
                errors.append(f"La categoría '{category.name}' no tiene parámetros de evaluación definidos")
        
        #