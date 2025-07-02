"""
Motor de cálculo para el sistema de calificación FEI
Implementa las reglas oficiales de la Federación Ecuestre Internacional
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class FEIScoreCalculator:
    """
    Calculadora principal para puntuaciones FEI
    
    Implementa:
    - Validación de incrementos de 0.5 puntos
    - Cálculos precisos con Decimal
    - Promedios ponderados
    - Validaciones de rangos
    - Detección de anomalías básicas
    """
    
    # Constantes FEI
    MIN_SCORE = Decimal('0.0')
    MAX_SCORE = Decimal('10.0')
    SCORE_INCREMENT = Decimal('0.5')
    PRECISION_PLACES = 2
    
    def __init__(self):
        """Inicializar calculadora con configuración FEI estándar"""
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def validate_score_increment(self, score: Decimal) -> bool:
        """
        Validar que la puntuación cumple con incrementos FEI de 0.5
        
        Args:
            score: Puntuación a validar
            
        Returns:
            bool: True si es válida, False si no
        """
        try:
            # Convertir a Decimal si es necesario
            if not isinstance(score, Decimal):
                score = Decimal(str(score))
            
            # Verificar rango
            if score < self.MIN_SCORE or score > self.MAX_SCORE:
                return False
            
            # Verificar incrementos de 0.5
            # Multiplicar por 2 y verificar si es entero
            doubled = score * Decimal('2')
            return doubled == doubled.to_integral_value()
            
        except (ValueError, TypeError):
            return False
    
    def validate_score_range(self, score: Decimal, min_score: Optional[Decimal] = None, 
                           max_score: Optional[Decimal] = None) -> bool:
        """
        Validar que la puntuación está en el rango permitido
        
        Args:
            score: Puntuación a validar
            min_score: Puntuación mínima (default: 0.0)
            max_score: Puntuación máxima (default: 10.0)
            
        Returns:
            bool: True si está en rango, False si no
        """
        try:
            if not isinstance(score, Decimal):
                score = Decimal(str(score))
            
            min_val = min_score or self.MIN_SCORE
            max_val = max_score or self.MAX_SCORE
            
            return min_val <= score <= max_val
            
        except (ValueError, TypeError):
            return False
    
    def calculate_weighted_average(self, scores: List[Decimal], 
                                 weights: List[Decimal]) -> Decimal:
        """
        Calcular promedio ponderado de puntuaciones
        
        Args:
            scores: Lista de puntuaciones
            weights: Lista de pesos correspondientes
            
        Returns:
            Decimal: Promedio ponderado
            
        Raises:
            ValueError: Si las listas no tienen la misma longitud
        """
        if len(scores) != len(weights):
            raise ValueError("Las listas de puntuaciones y pesos deben tener la misma longitud")
        
        if not scores:
            return Decimal('0.0')
        
        try:
            # Convertir a Decimal si es necesario
            decimal_scores = [Decimal(str(s)) if not isinstance(s, Decimal) else s for s in scores]
            decimal_weights = [Decimal(str(w)) if not isinstance(w, Decimal) else w for w in weights]
            
            # Calcular suma ponderada
            weighted_sum = sum(score * weight for score, weight in zip(decimal_scores, decimal_weights))
            total_weight = sum(decimal_weights)
            
            if total_weight == 0:
                return Decimal('0.0')
            
            # Calcular promedio y redondear
            average = weighted_sum / total_weight
            return average.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
        except (ValueError, TypeError) as e:
            self.logger.error(f"Error calculando promedio ponderado: {e}")
            return Decimal('0.0')
    
    def calculate_simple_average(self, scores: List[Decimal]) -> Decimal:
        """
        Calcular promedio simple de puntuaciones
        
        Args:
            scores: Lista de puntuaciones
            
        Returns:
            Decimal: Promedio simple
        """
        if not scores:
            return Decimal('0.0')
        
        weights = [Decimal('1.0')] * len(scores)
        return self.calculate_weighted_average(scores, weights)
    
    def calculate_percentage(self, score: Decimal, max_possible: Optional[Decimal] = None) -> Decimal:
        """
        Calcular porcentaje de una puntuación
        
        Args:
            score: Puntuación obtenida
            max_possible: Puntuación máxima posible (default: 10.0)
            
        Returns:
            Decimal: Porcentaje (0-100)
        """
        try:
            if not isinstance(score, Decimal):
                score = Decimal(str(score))
            
            max_val = max_possible or self.MAX_SCORE
            
            if max_val == 0:
                return Decimal('0.0')
            
            percentage = (score / max_val) * Decimal('100')
            return percentage.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
        except (ValueError, TypeError, ZeroDivisionError):
            return Decimal('0.0')
    
    def calculate_total_score(self, parameter_scores: Dict[str, Dict]) -> Dict:
        """
        Calcular puntuación total para una evaluación completa
        
        Args:
            parameter_scores: Diccionario con estructura:
                {
                    'parameter_code': {
                        'score': Decimal,
                        'weight': Decimal,
                        'max_score': Decimal (opcional)
                    }
                }
                
        Returns:
            Dict: Resultado con puntuación total, porcentaje y detalles
        """
        try:
            scores = []
            weights = []
            total_max_score = Decimal('0.0')
            
            for param_code, data in parameter_scores.items():
                score = data.get('score')
                weight = data.get('weight', Decimal('1.0'))
                max_score = data.get('max_score', self.MAX_SCORE)
                
                if score is not None:
                    if not isinstance(score, Decimal):
                        score = Decimal(str(score))
                    if not isinstance(weight, Decimal):
                        weight = Decimal(str(weight))
                    if not isinstance(max_score, Decimal):
                        max_score = Decimal(str(max_score))
                    
                    scores.append(score)
                    weights.append(weight)
                    total_max_score += max_score * weight
            
            if not scores:
                return {
                    'total_score': Decimal('0.0'),
                    'percentage': Decimal('0.0'),
                    'max_possible': Decimal('0.0'),
                    'weighted_average': Decimal('0.0'),
                    'parameter_count': 0
                }
            
            # Calcular promedio ponderado
            weighted_avg = self.calculate_weighted_average(scores, weights)
            
            # Calcular puntuación total (suma ponderada)
            total_score = sum(score * weight for score, weight in zip(scores, weights))
            
            # Calcular porcentaje
            percentage = self.calculate_percentage(weighted_avg, self.MAX_SCORE)
            
            return {
                'total_score': total_score.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                'percentage': percentage,
                'max_possible': total_max_score,
                'weighted_average': weighted_avg,
                'parameter_count': len(scores)
            }
            
        except Exception as e:
            self.logger.error(f"Error calculando puntuación total: {e}")
            return {
                'total_score': Decimal('0.0'),
                'percentage': Decimal('0.0'),
                'max_possible': Decimal('0.0'),
                'weighted_average': Decimal('0.0'),
                'parameter_count': 0
            }
    
    def detect_score_anomalies(self, scores: List[Decimal], 
                             threshold_std_dev: float = 2.0) -> List[int]:
        """
        Detectar puntuaciones anómalas usando desviación estándar
        
        Args:
            scores: Lista de puntuaciones
            threshold_std_dev: Umbral de desviación estándar
            
        Returns:
            List[int]: Índices de puntuaciones anómalas
        """
        if len(scores) < 3:  # Necesitamos al menos 3 puntuaciones
            return []
        
        try:
            # Convertir a float para cálculos estadísticos
            float_scores = [float(score) for score in scores]
            
            # Calcular media y desviación estándar
            mean = sum(float_scores) / len(float_scores)
            variance = sum((score - mean) ** 2 for score in float_scores) / len(float_scores)
            std_dev = variance ** 0.5
            
            if std_dev == 0:  # Todas las puntuaciones son iguales
                return []
            
            # Encontrar outliers
            anomalies = []
            for i, score in enumerate(float_scores):
                z_score = abs(score - mean) / std_dev
                if z_score > threshold_std_dev:
                    anomalies.append(i)
            
            return anomalies
            
        except Exception as e:
            self.logger.error(f"Error detectando anomalías: {e}")
            return []
    
    def validate_evaluation_completeness(self, parameter_scores: Dict) -> Dict:
        """
        Validar que una evaluación esté completa y sea válida
        
        Args:
            parameter_scores: Diccionario de puntuaciones por parámetro
            
        Returns:
            Dict: Estado de validación
        """
        validation_result = {
            'is_complete': True,
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'missing_parameters': [],
            'invalid_scores': []
        }
        
        try:
            for param_code, data in parameter_scores.items():
                score = data.get('score')
                
                # Verificar si falta la puntuación
                if score is None or score == '':
                    validation_result['missing_parameters'].append(param_code)
                    validation_result['is_complete'] = False
                    continue
                
                # Convertir a Decimal y validar
                try:
                    if not isinstance(score, Decimal):
                        score = Decimal(str(score))
                    
                    # Validar incrementos y rango
                    if not self.validate_score_increment(score):
                        validation_result['invalid_scores'].append({
                            'parameter': param_code,
                            'score': str(score),
                            'error': 'Puntuación debe ser en incrementos de 0.5 entre 0.0 y 10.0'
                        })
                        validation_result['is_valid'] = False
                    
                except (ValueError, TypeError):
                    validation_result['invalid_scores'].append({
                        'parameter': param_code,
                        'score': str(score),
                        'error': 'Puntuación debe ser un número válido'
                    })
                    validation_result['is_valid'] = False
            
            # Agregar mensajes de error
            if validation_result['missing_parameters']:
                validation_result['errors'].append(
                    f"Faltan puntuaciones para: {', '.join(validation_result['missing_parameters'])}"
                )
            
            if validation_result['invalid_scores']:
                validation_result['errors'].append(
                    f"Puntuaciones inválidas encontradas: {len(validation_result['invalid_scores'])}"
                )
            
            return validation_result
            
        except Exception as e:
            self.logger.error(f"Error validando evaluación: {e}")
            return {
                'is_complete': False,
                'is_valid': False,
                'errors': [f"Error interno de validación: {str(e)}"],
                'warnings': [],
                'missing_parameters': [],
                'invalid_scores': []
            }


class FEIRankingCalculator:
    """
    Calculadora especializada para rankings FEI
    """
    
    def __init__(self):
        self.score_calculator = FEIScoreCalculator()
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def calculate_competition_rankings(self, evaluations: List[Dict]) -> List[Dict]:
        """
        Calcular rankings para una competencia
        
        Args:
            evaluations: Lista de evaluaciones con estructura:
                [
                    {
                        'rider_id': int,
                        'rider_name': str,
                        'horse_id': int,
                        'horse_name': str,
                        'judge_evaluations': [
                            {
                                'judge_id': int,
                                'judge_name': str,
                                'total_score': Decimal,
                                'percentage': Decimal
                            }
                        ]
                    }
                ]
                
        Returns:
            List[Dict]: Rankings ordenados
        """
        try:
            ranking_entries = []
            
            for eval_data in evaluations:
                judge_evals = eval_data.get('judge_evaluations', [])
                
                if not judge_evals:
                    continue
                
                # Calcular promedio entre jueces
                total_scores = [Decimal(str(je['total_score'])) for je in judge_evals]
                percentages = [Decimal(str(je['percentage'])) for je in judge_evals]
                
                avg_score = self.score_calculator.calculate_simple_average(total_scores)
                avg_percentage = self.score_calculator.calculate_simple_average(percentages)
                
                ranking_entry = {
                    'rider_id': eval_data['rider_id'],
                    'rider_name': eval_data['rider_name'],
                    'horse_id': eval_data['horse_id'],
                    'horse_name': eval_data['horse_name'],
                    'average_score': avg_score,
                    'average_percentage': avg_percentage,
                    'judge_scores': judge_evals,
                    'judge_count': len(judge_evals)
                }
                
                ranking_entries.append(ranking_entry)
            
            # Ordenar por puntuación promedio (descendente)
            ranking_entries.sort(key=lambda x: x['average_percentage'], reverse=True)
            
            # Asignar posiciones
            for i, entry in enumerate(ranking_entries):
                entry['rank'] = i + 1
            
            return ranking_entries
            
        except Exception as e:
            self.logger.error(f"Error calculando rankings: {e}")
            return []
    
    def detect_ranking_anomalies(self, rankings: List[Dict]) -> List[Dict]:
        """
        Detectar anomalías en rankings
        
        Args:
            rankings: Lista de rankings calculados
            
        Returns:
            List[Dict]: Anomalías detectadas
        """
        anomalies = []
        
        try:
            for entry in rankings:
                judge_scores = entry.get('judge_scores', [])
                
                if len(judge_scores) < 2:
                    continue
                
                # Obtener puntuaciones de todos los jueces
                scores = [Decimal(str(js['percentage'])) for js in judge_scores]
                
                # Detectar outliers
                outlier_indices = self.score_calculator.detect_score_anomalies(scores)
                
                for idx in outlier_indices:
                    anomaly = {
                        'type': 'judge_score_outlier',
                        'severity': 'medium',
                        'rider_name': entry['rider_name'],
                        'horse_name': entry['horse_name'],
                        'judge_name': judge_scores[idx]['judge_name'],
                        'outlier_score': str(judge_scores[idx]['percentage']),
                        'average_score': str(entry['average_percentage']),
                        'description': f"Puntuación del juez {judge_scores[idx]['judge_name']} "
                                     f"({judge_scores[idx]['percentage']}%) difiere significativamente "
                                     f"del promedio ({entry['average_percentage']}%)",
                        'suggested_action': 'Revisar evaluación del juez'
                    }
                    anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            self.logger.error(f"Error detectando anomalías en rankings: {e}")
            return []


class FEIStatisticsCalculator:
    """
    Calculadora para estadísticas de competencias FEI
    """
    
    def __init__(self):
        self.score_calculator = FEIScoreCalculator()
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def calculate_competition_statistics(self, evaluations: List[Dict]) -> Dict:
        """
        Calcular estadísticas generales de una competencia
        
        Args:
            evaluations: Lista de evaluaciones
            
        Returns:
            Dict: Estadísticas calculadas
        """
        try:
            if not evaluations:
                return {
                    'total_participants': 0,
                    'completed_evaluations': 0,
                    'average_score': Decimal('0.0'),
                    'highest_score': Decimal('0.0'),
                    'lowest_score': Decimal('0.0'),
                    'score_distribution': {},
                    'judge_statistics': {}
                }
            
            all_scores = []
            completed_count = 0
            judge_stats = {}
            
            for eval_data in evaluations:
                judge_evals = eval_data.get('judge_evaluations', [])
                
                if judge_evals:
                    completed_count += 1
                    
                    for je in judge_evals:
                        score = Decimal(str(je['percentage']))
                        all_scores.append(score)
                        
                        # Estadísticas por juez
                        judge_id = je['judge_id']
                        judge_name = je['judge_name']
                        
                        if judge_id not in judge_stats:
                            judge_stats[judge_id] = {
                                'judge_name': judge_name,
                                'evaluations_count': 0,
                                'scores': [],
                                'average_score': Decimal('0.0')
                            }
                        
                        judge_stats[judge_id]['evaluations_count'] += 1
                        judge_stats[judge_id]['scores'].append(score)
            
            # Calcular estadísticas generales
            if all_scores:
                avg_score = self.score_calculator.calculate_simple_average(all_scores)
                highest_score = max(all_scores)
                lowest_score = min(all_scores)
            else:
                avg_score = highest_score = lowest_score = Decimal('0.0')
            
            # Calcular promedios por juez
            for judge_id, stats in judge_stats.items():
                if stats['scores']:
                    stats['average_score'] = self.score_calculator.calculate_simple_average(stats['scores'])
            
            # Distribución de puntuaciones
            score_distribution = self._calculate_score_distribution(all_scores)
            
            return {
                'total_participants': len(evaluations),
                'completed_evaluations': completed_count,
                'average_score': avg_score,
                'highest_score': highest_score,
                'lowest_score': lowest_score,
                'score_distribution': score_distribution,
                'judge_statistics': judge_stats
            }
            
        except Exception as e:
            self.logger.error(f"Error calculando estadísticas: {e}")
            return {}
    
    def _calculate_score_distribution(self, scores: List[Decimal]) -> Dict:
        """Calcular distribución de puntuaciones por rangos"""
        if not scores:
            return {}
        
        ranges = {
            '0-20%': 0,
            '21-40%': 0,
            '41-60%': 0,
            '61-80%': 0,
            '81-100%': 0
        }
        
        for score in scores:
            score_float = float(score)
            if score_float <= 20:
                ranges['0-20%'] += 1
            elif score_float <= 40:
                ranges['21-40%'] += 1
            elif score_float <= 60:
                ranges['41-60%'] += 1
            elif score_float <= 80:
                ranges['61-80%'] += 1
            else:
                ranges['81-100%'] += 1
        
        return ranges