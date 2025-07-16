"""
Motor de Rankings para el Sistema FEI
=====================================

Implementa el algoritmo principal de cálculo y ordenamiento de rankings
según las reglas oficiales de la Federación Ecuestre Internacional (FEI).

Este motor integra con el FEIScoreCalculator existente y maneja:
- Cálculo automático de rankings por competencia/categoría
- Resolución de empates según reglas FEI
- Actualizaciones en tiempo real
- Cache y optimización de performance
- Detección de anomalías y validaciones

Autor: Sistema FEI - Fase 6.6
Fecha: 16 Julio 2025
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timezone
import logging
from django.db import transaction
from django.core.cache import cache
from django.utils import timezone as django_timezone

# Importar modelos necesarios
from .models import Ranking, RankingEntry, RankingSnapshot, RankingCalculation
from ..competitions.models import Competition, Registration
from ..scoring.models import ScoreEntry, JudgeEvaluation
from ..scoring.calculators import FEIScoreCalculator, FEIRankingCalculator

logger = logging.getLogger(__name__)


class RankingEngine:
    """
    Motor principal de cálculo de rankings FEI
    
    Características:
    - Integración con FEIRankingCalculator existente
    - Cálculo automático por competencia/categoría
    - Resolución de empates FEI
    - Cache inteligente para performance
    - Snapshots históricos automáticos
    """
    
    def __init__(self):
        """Inicializar motor de rankings"""
        self.fei_calculator = FEIScoreCalculator()
        self.ranking_calculator = FEIRankingCalculator()
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        
        # Configuración de cache
        self.cache_timeout = 300  # 5 minutos
        self.cache_prefix = "ranking_"
    
    def calculate_competition_rankings(self, competition_id: str, 
                                     category_id: Optional[str] = None,
                                     force_recalculate: bool = False) -> Dict[str, Any]:
        """
        Calcular rankings completos para una competencia
        
        Args:
            competition_id: ID de la competencia
            category_id: ID de categoría específica (opcional)
            force_recalculate: Forzar recálculo ignorando cache
            
        Returns:
            Dict con rankings calculados y metadatos
        """
        cache_key = f"{self.cache_prefix}comp_{competition_id}_{category_id or 'all'}"
        
        # Verificar cache si no es forzado
        if not force_recalculate:
            cached_result = cache.get(cache_key)
            if cached_result:
                self.logger.info(f"Rankings obtenidos desde cache: {cache_key}")
                return cached_result
        
        try:
            with transaction.atomic():
                # Obtener datos base
                competition = Competition.objects.get(id=competition_id)
                
                # Filtrar por categoría si se especifica
                registrations = Registration.objects.filter(
                    competition_category__competition_id=competition_id
                )
                
                if category_id:
                    registrations = registrations.filter(
                        competition_category__category_id=category_id
                    )
                
                # Calcular rankings usando el motor FEI existente
                rankings_data = self.ranking_calculator.calculate_rankings(
                    registrations.values('id', 'rider__user__first_name', 'rider__user__last_name',
                                       'horse__name', 'competition_category__category__name')
                )
                
                # Procesar y enriquecer datos
                processed_rankings = self._process_ranking_results(
                    rankings_data, competition_id, category_id
                )
                
                # Aplicar resolución de empates FEI
                final_rankings = self._resolve_ties_fei(processed_rankings)
                
                # Crear snapshot histórico
                snapshot = self._create_ranking_snapshot(
                    competition_id, category_id, final_rankings
                )
                
                # Preparar resultado
                result = {
                    'competition_id': competition_id,
                    'category_id': category_id,
                    'rankings': final_rankings,
                    'snapshot_id': snapshot.id if snapshot else None,
                    'calculated_at': django_timezone.now().isoformat(),
                    'total_participants': len(final_rankings),
                    'calculation_metadata': {
                        'engine_version': '1.0',
                        'fei_standards': True,
                        'tie_resolution': 'FEI_official',
                        'cache_updated': True
                    }
                }
                
                # Guardar en cache
                cache.set(cache_key, result, self.cache_timeout)
                
                self.logger.info(
                    f"Rankings calculados exitosamente: {len(final_rankings)} participantes"
                )
                
                return result
                
        except Competition.DoesNotExist:
            self.logger.error(f"Competencia no encontrada: {competition_id}")
            raise ValueError(f"Competencia {competition_id} no existe")
            
        except Exception as e:
            self.logger.error(f"Error calculando rankings: {str(e)}")
            raise Exception(f"Error en cálculo de rankings: {str(e)}")
    
    def _process_ranking_results(self, rankings_data: List[Dict], 
                               competition_id: str, category_id: Optional[str]) -> List[Dict]:
        """
        Procesar y enriquecer resultados de ranking
        
        Args:
            rankings_data: Datos base de rankings desde FEIRankingCalculator
            competition_id: ID de competencia
            category_id: ID de categoría
            
        Returns:
            Lista de rankings procesados y enriquecidos
        """
        processed = []
        
        for rank_data in rankings_data:
            try:
                # Obtener información detallada del participante
                registration = Registration.objects.select_related(
                    'rider__user', 'horse', 'competition_category__category'
                ).get(id=rank_data.get('rider_id'))  # Asumiendo que rider_id es registration_id
                
                # Calcular estadísticas adicionales
                judge_scores = rank_data.get('judge_scores', [])
                score_statistics = self._calculate_score_statistics(judge_scores)
                
                # Detectar anomalías
                anomalies = self.ranking_calculator.detect_ranking_anomalies([rank_data])
                
                processed_entry = {
                    'registration_id': registration.id,
                    'rider': {
                        'id': registration.rider.id,
                        'name': f"{registration.rider.user.first_name} {registration.rider.user.last_name}",
                        'country': registration.rider.user.country or '',
                        'fei_id': getattr(registration.rider, 'fei_id', None)
                    },
                    'horse': {
                        'id': registration.horse.id,
                        'name': registration.horse.name,
                        'breed': getattr(registration.horse, 'breed', ''),
                        'birth_year': getattr(registration.horse, 'birth_year', None)
                    },
                    'category': {
                        'id': registration.competition_category.category.id,
                        'name': registration.competition_category.category.name,
                        'level': getattr(registration.competition_category.category, 'level', '')
                    },
                    'scores': {
                        'average_score': rank_data.get('average_score', Decimal('0')),
                        'average_percentage': rank_data.get('average_percentage', Decimal('0')),
                        'total_judges': rank_data.get('judge_count', 0),
                        'judge_scores': judge_scores,
                        'statistics': score_statistics
                    },
                    'ranking': {
                        'position': rank_data.get('rank', 0),
                        'provisional': True,  # Se actualiza en resolución de empates
                        'tied_with': [],  # Se llena en resolución de empates
                        'tie_break_info': None
                    },
                    'metadata': {
                        'start_number': registration.start_number,
                        'registration_status': registration.status,
                        'anomalies': anomalies,
                        'last_score_update': self._get_last_score_update(registration.id)
                    }
                }
                
                processed.append(processed_entry)
                
            except Registration.DoesNotExist:
                self.logger.warning(f"Registro no encontrado: {rank_data.get('rider_id')}")
                continue
            except Exception as e:
                self.logger.error(f"Error procesando ranking entry: {str(e)}")
                continue
        
        return processed
    
    def _calculate_score_statistics(self, judge_scores: List[Dict]) -> Dict[str, Any]:
        """
        Calcular estadísticas de puntuaciones
        
        Args:
            judge_scores: Lista de puntuaciones por juez
            
        Returns:
            Dict con estadísticas calculadas
        """
        if not judge_scores:
            return {
                'min_score': Decimal('0'),
                'max_score': Decimal('0'),
                'score_range': Decimal('0'),
                'standard_deviation': Decimal('0'),
                'consistency_rating': 'N/A'
            }
        
        scores = [Decimal(str(score.get('percentage', 0))) for score in judge_scores]
        
        if not scores:
            return self._calculate_score_statistics([])
        
        min_score = min(scores)
        max_score = max(scores)
        score_range = max_score - min_score
        
        # Calcular desviación estándar simple
        mean = sum(scores) / len(scores)
        variance = sum((score - mean) ** 2 for score in scores) / len(scores)
        std_dev = variance.sqrt() if variance > 0 else Decimal('0')
        
        # Rating de consistencia basado en rango
        if score_range <= Decimal('2.0'):
            consistency = 'Excelente'
        elif score_range <= Decimal('5.0'):
            consistency = 'Buena'
        elif score_range <= Decimal('8.0'):
            consistency = 'Regular'
        else:
            consistency = 'Baja'
        
        return {
            'min_score': min_score,
            'max_score': max_score,
            'score_range': score_range,
            'standard_deviation': std_dev,
            'consistency_rating': consistency,
            'judge_agreement': 'Alta' if score_range <= Decimal('3.0') else 'Media' if score_range <= Decimal('6.0') else 'Baja'
        }
    
    def _resolve_ties_fei(self, rankings: List[Dict]) -> List[Dict]:
        """
        Resolver empates según reglas oficiales FEI
        
        Reglas FEI para empates:
        1. Mayor puntuación en movimientos colectivos
        2. Mayor puntuación promedio en movimientos técnicos
        3. Menor número de puntuaciones bajo 6.0
        4. En caso de empate persistente, posiciones compartidas
        
        Args:
            rankings: Lista de rankings a procesar
            
        Returns:
            Lista de rankings con empates resueltos
        """
        # Agrupar por puntuación para detectar empates
        score_groups = {}
        for entry in rankings:
            score = entry['scores']['average_percentage']
            score_key = str(score)
            
            if score_key not in score_groups:
                score_groups[score_key] = []
            score_groups[score_key].append(entry)
        
        final_rankings = []
        current_position = 1
        
        # Procesar cada grupo de puntuación
        for score in sorted(score_groups.keys(), key=lambda x: Decimal(x), reverse=True):
            group = score_groups[score]
            
            if len(group) == 1:
                # Sin empate
                group[0]['ranking']['position'] = current_position
                group[0]['ranking']['provisional'] = False
                final_rankings.append(group[0])
                current_position += 1
            else:
                # Resolver empate
                resolved_group = self._apply_tie_breaking_rules(group, current_position)
                final_rankings.extend(resolved_group)
                current_position += len(group)
        
        return final_rankings
    
    def _apply_tie_breaking_rules(self, tied_entries: List[Dict], start_position: int) -> List[Dict]:
        """
        Aplicar reglas FEI específicas para resolución de empates
        
        Args:
            tied_entries: Lista de entradas empatadas
            start_position: Posición inicial para asignar
            
        Returns:
            Lista ordenada de entradas con empates resueltos
        """
        self.logger.info(f"Resolviendo empate entre {len(tied_entries)} participantes")
        
        # Regla 1: Puntuación en movimientos colectivos
        for entry in tied_entries:
            entry['tie_break_scores'] = self._calculate_tie_break_scores(entry)
        
        # Aplicar criterios de desempate en orden de prioridad
        def tie_break_key(entry):
            tb_scores = entry['tie_break_scores']
            return (
                -tb_scores['collective_marks_avg'],  # Negativo para orden descendente
                -tb_scores['technical_marks_avg'],
                tb_scores['low_scores_count'],  # Positivo para orden ascendente (menos es mejor)
                -tb_scores['highest_individual_score']
            )
        
        # Ordenar según criterios de desempate
        sorted_entries = sorted(tied_entries, key=tie_break_key)
        
        # Asignar posiciones y marcar información de empate
        current_pos = start_position
        i = 0
        
        while i < len(sorted_entries):
            # Encontrar grupo con mismo criterio de desempate
            current_group = [sorted_entries[i]]
            j = i + 1
            
            while (j < len(sorted_entries) and 
                   tie_break_key(sorted_entries[i]) == tie_break_key(sorted_entries[j])):
                current_group.append(sorted_entries[j])
                j += 1
            
            # Asignar posiciones al grupo
            if len(current_group) == 1:
                # Empate resuelto
                entry = current_group[0]
                entry['ranking']['position'] = current_pos
                entry['ranking']['provisional'] = False
                entry['ranking']['tie_break_info'] = {
                    'resolved': True,
                    'method': 'FEI_official_rules',
                    'criteria_used': self._get_criteria_description(entry['tie_break_scores'])
                }
            else:
                # Empate persistente - posiciones compartidas
                for entry in current_group:
                    entry['ranking']['position'] = current_pos
                    entry['ranking']['provisional'] = False
                    entry['ranking']['tied_with'] = [
                        e['registration_id'] for e in current_group 
                        if e['registration_id'] != entry['registration_id']
                    ]
                    entry['ranking']['tie_break_info'] = {
                        'resolved': False,
                        'method': 'shared_position',
                        'tied_participants': len(current_group)
                    }
            
            current_pos += len(current_group)
            i = j
        
        return sorted_entries
    
    def _calculate_tie_break_scores(self, entry: Dict) -> Dict[str, Decimal]:
        """
        Calcular puntuaciones específicas para criterios de desempate FEI
        
        Args:
            entry: Entrada de ranking
            
        Returns:
            Dict con puntuaciones para criterios de desempate
        """
        registration_id = entry['registration_id']
        
        try:
            # Obtener todas las puntuaciones del participante
            score_entries = ScoreEntry.objects.filter(
                participant_id=registration_id
            ).select_related('evaluation_parameter')
            
            collective_scores = []
            technical_scores = []
            all_scores = []
            low_scores_count = 0
            
            for score_entry in score_entries:
                score_val = score_entry.score
                all_scores.append(score_val)
                
                # Contar puntuaciones bajas (< 6.0)
                if score_val < Decimal('6.0'):
                    low_scores_count += 1
                
                # Clasificar según tipo de movimiento
                param = score_entry.evaluation_parameter
                if getattr(param, 'is_collective_mark', False):
                    collective_scores.append(score_val)
                else:
                    technical_scores.append(score_val)
            
            return {
                'collective_marks_avg': (
                    sum(collective_scores) / len(collective_scores) 
                    if collective_scores else Decimal('0')
                ),
                'technical_marks_avg': (
                    sum(technical_scores) / len(technical_scores) 
                    if technical_scores else Decimal('0')
                ),
                'low_scores_count': low_scores_count,
                'highest_individual_score': max(all_scores) if all_scores else Decimal('0'),
                'total_scores': len(all_scores)
            }
            
        except Exception as e:
            self.logger.error(f"Error calculando tie-break scores: {str(e)}")
            return {
                'collective_marks_avg': Decimal('0'),
                'technical_marks_avg': Decimal('0'),
                'low_scores_count': 999,  # Penalizar en caso de error
                'highest_individual_score': Decimal('0'),
                'total_scores': 0
            }
    
    def _get_criteria_description(self, tie_break_scores: Dict) -> str:
        """
        Generar descripción legible de criterios de desempate utilizados
        
        Args:
            tie_break_scores: Puntuaciones de criterios de desempate
            
        Returns:
            Descripción textual del criterio utilizado
        """
        if tie_break_scores['collective_marks_avg'] > Decimal('0'):
            return f"Movimientos colectivos (promedio: {tie_break_scores['collective_marks_avg']:.2f}%)"
        elif tie_break_scores['technical_marks_avg'] > Decimal('0'):
            return f"Movimientos técnicos (promedio: {tie_break_scores['technical_marks_avg']:.2f}%)"
        elif tie_break_scores['low_scores_count'] < 999:
            return f"Menor cantidad de puntuaciones bajas ({tie_break_scores['low_scores_count']} scores < 6.0)"
        else:
            return "Puntuación individual más alta"
    
    def _create_ranking_snapshot(self, competition_id: str, category_id: Optional[str], 
                               rankings: List[Dict]) -> Optional[RankingSnapshot]:
        """
        Crear snapshot histórico de rankings
        
        Args:
            competition_id: ID de competencia
            category_id: ID de categoría (opcional)
            rankings: Rankings calculados
            
        Returns:
            RankingSnapshot creado o None si hay error
        """
        try:
            # Crear snapshot principal
            snapshot = RankingSnapshot.objects.create(
                competition_id=competition_id,
                category_id=category_id,
                timestamp=django_timezone.now(),
                total_participants=len(rankings),
                calculation_method='FEI_official',
                metadata={
                    'engine_version': '1.0',
                    'tie_resolution_applied': any(
                        r['ranking'].get('tie_break_info') for r in rankings
                    ),
                    'anomalies_detected': any(
                        r['metadata'].get('anomalies') for r in rankings
                    )
                }
            )
            
            # Crear entradas individuales
            ranking_entries = []
            for ranking_data in rankings:
                entry = RankingEntry(
                    snapshot=snapshot,
                    participant_id=ranking_data['registration_id'],
                    position=ranking_data['ranking']['position'],
                    score=ranking_data['scores']['average_score'],
                    percentage=ranking_data['scores']['average_percentage'],
                    is_tied=bool(ranking_data['ranking']['tied_with']),
                    tie_break_info=ranking_data['ranking'].get('tie_break_info'),
                    judge_scores=ranking_data['scores']['judge_scores'],
                    metadata=ranking_data['metadata']
                )
                ranking_entries.append(entry)
            
            # Bulk create para performance
            RankingEntry.objects.bulk_create(ranking_entries)
            
            self.logger.info(f"Snapshot creado: {snapshot.id} con {len(ranking_entries)} entradas")
            return snapshot
            
        except Exception as e:
            self.logger.error(f"Error creando snapshot: {str(e)}")
            return None
    
    def _get_last_score_update(self, registration_id: str) -> Optional[str]:
        """
        Obtener timestamp de última actualización de puntuación
        
        Args:
            registration_id: ID de registro
            
        Returns:
            ISO timestamp de última actualización o None
        """
        try:
            last_score = ScoreEntry.objects.filter(
                participant_id=registration_id
            ).order_by('-updated_at').first()
            
            return last_score.updated_at.isoformat() if last_score else None
            
        except Exception:
            return None
    
    def update_live_rankings(self, competition_id: str, category_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Actualizar rankings en vivo (optimizado para llamadas frecuentes)
        
        Args:
            competition_id: ID de competencia
            category_id: ID de categoría opcional
            
        Returns:
            Dict con rankings actualizados y metadata de cambios
        """
        cache_key = f"{self.cache_prefix}live_{competition_id}_{category_id or 'all'}"
        
        try:
            # Obtener rankings anteriores del cache
            previous_rankings = cache.get(cache_key, {})
            
            # Calcular nuevos rankings
            current_rankings = self.calculate_competition_rankings(
                competition_id, category_id, force_recalculate=True
            )
            
            # Detectar cambios
            changes = self._detect_ranking_changes(
                previous_rankings.get('rankings', []),
                current_rankings['rankings']
            )
            
            # Preparar respuesta con información de cambios
            result = {
                **current_rankings,
                'changes': changes,
                'is_live_update': True,
                'previous_update': previous_rankings.get('calculated_at'),
                'change_summary': {
                    'positions_changed': len(changes['position_changes']),
                    'new_entries': len(changes['new_entries']),
                    'significant_changes': len([
                        c for c in changes['position_changes'] 
                        if abs(c['position_change']) >= 3
                    ])
                }
            }
            
            # Actualizar cache con nueva información
            cache.set(cache_key, result, self.cache_timeout)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error actualizando rankings en vivo: {str(e)}")
            raise
    
    def _detect_ranking_changes(self, previous: List[Dict], current: List[Dict]) -> Dict[str, List]:
        """
        Detectar cambios entre rankings anteriores y actuales
        
        Args:
            previous: Rankings anteriores
            current: Rankings actuales
            
        Returns:
            Dict con tipos de cambios detectados
        """
        if not previous:
            return {
                'position_changes': [],
                'new_entries': [e['registration_id'] for e in current],
                'removed_entries': [],
                'score_changes': []
            }
        
        # Crear mapas para comparación eficiente
        prev_map = {e['registration_id']: e for e in previous}
        curr_map = {e['registration_id']: e for e in current}
        
        position_changes = []
        score_changes = []
        new_entries = []
        removed_entries = []
        
        # Detectar cambios en entradas existentes
        for reg_id, curr_entry in curr_map.items():
            if reg_id in prev_map:
                prev_entry = prev_map[reg_id]
                
                # Cambio de posición
                prev_pos = prev_entry['ranking']['position']
                curr_pos = curr_entry['ranking']['position']
                
                if prev_pos != curr_pos:
                    position_changes.append({
                        'registration_id': reg_id,
                        'rider_name': curr_entry['rider']['name'],
                        'previous_position': prev_pos,
                        'current_position': curr_pos,
                        'position_change': prev_pos - curr_pos,  # Positivo = mejoró
                        'direction': 'up' if prev_pos > curr_pos else 'down'
                    })
                
                # Cambio de puntuación
                prev_score = prev_entry['scores']['average_percentage']
                curr_score = curr_entry['scores']['average_percentage']
                
                if prev_score != curr_score:
                    score_changes.append({
                        'registration_id': reg_id,
                        'rider_name': curr_entry['rider']['name'],
                        'previous_score': float(prev_score),
                        'current_score': float(curr_score),
                        'score_change': float(curr_score - prev_score)
                    })
            else:
                new_entries.append(reg_id)
        
        # Detectar entradas removidas
        for reg_id in prev_map:
            if reg_id not in curr_map:
                removed_entries.append(reg_id)
        
        return {
            'position_changes': position_changes,
            'new_entries': new_entries,
            'removed_entries': removed_entries,
            'score_changes': score_changes
        }
    
    def get_ranking_statistics(self, competition_id: str, category_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Obtener estadísticas completas de rankings
        
        Args:
            competition_id: ID de competencia
            category_id: ID de categoría opcional
            
        Returns:
            Dict con estadísticas detalladas
        """
        try:
            rankings_result = self.calculate_competition_rankings(competition_id, category_id)
            rankings = rankings_result['rankings']
            
            if not rankings:
                return {'error': 'No hay datos de ranking disponibles'}
            
            # Calcular estadísticas básicas
            scores = [Decimal(str(r['scores']['average_percentage'])) for r in rankings]
            total_participants = len(rankings)
            
            # Estadísticas de puntuación
            avg_score = sum(scores) / len(scores)
            min_score = min(scores)
            max_score = max(scores)
            score_range = max_score - min_score
            
            # Distribución por rangos
            excellent = sum(1 for s in scores if s >= Decimal('80'))
            good = sum(1 for s in scores if Decimal('70') <= s < Decimal('80'))
            satisfactory = sum(1 for s in scores if Decimal('60') <= s < Decimal('70'))
            needs_improvement = sum(1 for s in scores if s < Decimal('60'))
            
            # Estadísticas de empates
            tied_positions = sum(1 for r in rankings if r['ranking']['tied_with'])
            
            # Estadísticas de jueces
            judge_counts = [r['scores']['total_judges'] for r in rankings]
            avg_judges = sum(judge_counts) / len(judge_counts) if judge_counts else 0
            
            return {
                'competition_id': competition_id,
                'category_id': category_id,
                'total_participants': total_participants,
                'score_statistics': {
                    'average_score': float(avg_score),
                    'minimum_score': float(min_score),
                    'maximum_score': float(max_score),
                    'score_range': float(score_range),
                    'standard_deviation': float(self._calculate_std_dev(scores))
                },
                'performance_distribution': {
                    'excellent_80_plus': excellent,
                    'good_70_79': good,
                    'satisfactory_60_69': satisfactory,
                    'needs_improvement_below_60': needs_improvement,
                    'percentages': {
                        'excellent': round(excellent / total_participants * 100, 1),
                        'good': round(good / total_participants * 100, 1),
                        'satisfactory': round(satisfactory / total_participants * 100, 1),
                        'needs_improvement': round(needs_improvement / total_participants * 100, 1)
                    }
                },
                'ranking_metadata': {
                    'tied_positions': tied_positions,
                    'average_judges_per_participant': round(avg_judges, 1),
                    'calculation_timestamp': rankings_result['calculated_at'],
                    'engine_version': rankings_result['calculation_metadata']['engine_version']
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error calculando estadísticas: {str(e)}")
            return {'error': f'Error calculando estadísticas: {str(e)}'}
    
    def _calculate_std_dev(self, scores: List[Decimal]) -> Decimal:
        """Calcular desviación estándar de puntuaciones"""
        if len(scores) < 2:
            return Decimal('0')
        
        mean = sum(scores) / len(scores)
        variance = sum((score - mean) ** 2 for score in scores) / (len(scores) - 1)
        return variance.sqrt() if variance > 0 else Decimal('0')
    
    def clear_rankings_cache(self, competition_id: str, category_id: Optional[str] = None):
        """
        Limpiar cache de rankings para forzar recálculo
        
        Args:
            competition_id: ID de competencia
            category_id: ID de categoría opcional
        """
        patterns = [
            f"{self.cache_prefix}comp_{competition_id}_{category_id or 'all'}",
            f"{self.cache_prefix}live_{competition_id}_{category_id or 'all'}"
        ]
        
        for pattern in patterns:
            cache.delete(pattern)
            self.logger.info(f"Cache limpiado: {pattern}")


# Instancia global del motor para uso en views
ranking_engine = RankingEngine()


def calculate_rankings(competition_id: str, category_id: Optional[str] = None, 
                      force_recalculate: bool = False) -> Dict[str, Any]:
    """
    Función de conveniencia para calcular rankings
    
    Args:
        competition_id: ID de competencia
        category_id: ID de categoría opcional
        force_recalculate: Forzar recálculo
        
    Returns:
        Resultado de rankings calculados
    """
    return ranking_engine.calculate_competition_rankings(
        competition_id, category_id, force_recalculate
    )


def update_live_rankings(competition_id: str, category_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Función de conveniencia para actualizar rankings en vivo
    
    Args:
        competition_id: ID de competencia  
        category_id: ID de categoría opcional
        
    Returns:
        Rankings actualizados con información de cambios
    """
    return ranking_engine.update_live_rankings(competition_id, category_id)


def get_ranking_statistics(competition_id: str, category_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Función de conveniencia para obtener estadísticas de rankings
    
    Args:
        competition_id: ID de competencia
        category_id: ID de categoría opcional
        
    Returns:
        Estadísticas completas de ranking
    """
    return ranking_engine.get_ranking_statistics(competition_id, category_id)