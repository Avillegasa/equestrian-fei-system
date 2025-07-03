from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional, Tuple
from django.db.models import Q, Sum, Avg, Count
from django.utils import timezone
from django.core.cache import cache
import logging

from .models import (
    RankingSnapshot, RankingEntry, RankingCalculation, 
    LiveRankingUpdate, RankingConfiguration
)
from apps.competitions.models import Competition, Category, Participant
from apps.scoring.models import JudgeEvaluation, ScoreEntry

logger = logging.getLogger(__name__)


class RankingCalculator:
    """Calculadora principal de rankings FEI"""
    
    def __init__(self, competition: Competition, category: Category):
        self.competition = competition
        self.category = category
        self.config = self._get_or_create_config()
        
    def _get_or_create_config(self) -> RankingConfiguration:
        """Obtener o crear configuración de ranking"""
        config, created = RankingConfiguration.objects.get_or_create(
            competition=self.competition,
            category=self.category,
            defaults={
                'auto_calculate': True,
                'calculation_interval': 30,
                'tie_break_method': 'PERCENTAGE',
                'broadcast_enabled': True,
                'broadcast_interval': 5,
                'show_percentages': True,
                'show_judge_breakdown': True,
                'show_position_changes': True,
            }
        )
        return config
    
    def calculate_ranking(self, triggered_by=None) -> RankingSnapshot:
        """Calcular ranking completo para la competencia/categoría"""
        calculation = RankingCalculation.objects.create(
            competition=self.competition,
            category=self.category,
            triggered_by=triggered_by
        )
        
        try:
            # Obtener participantes y sus evaluaciones
            participants_data = self._get_participants_data()
            calculation.participants_processed = len(participants_data)
            
            # Calcular puntuaciones
            ranked_participants = self._calculate_scores(participants_data)
            
            # Resolver empates
            ranked_participants = self._resolve_ties(ranked_participants)
            
            # Crear snapshot
            snapshot = self._create_snapshot(ranked_participants)
            
            # Detectar cambios
            position_changes = self._detect_position_changes(ranked_participants)
            calculation.position_changes = position_changes
            
            # Crear actualización para broadcast
            if position_changes:
                self._create_live_update(position_changes)
            
            # Marcar cálculo como exitoso
            calculation.complete_calculation(success=True)
            
            # Invalidar cache
            self._invalidate_cache()
            
            logger.info(f"Ranking calculado exitosamente: {self.competition.name} - {self.category.name}")
            return snapshot
            
        except Exception as e:
            calculation.complete_calculation(success=False, error_message=str(e))
            logger.error(f"Error calculando ranking: {str(e)}")
            raise
    
    def _get_participants_data(self) -> List[Dict[str, Any]]:
        """Obtener datos de participantes con sus evaluaciones"""
        participants = Participant.objects.filter(
            competition=self.competition,
            category=self.category
        ).select_related('rider', 'horse')
        
        participants_data = []
        
        for participant in participants:
            # Obtener evaluaciones del participante
            evaluations = JudgeEvaluation.objects.filter(
                participant=participant
            ).select_related('judge', 'evaluation_round')
            
            # Calcular datos por evaluación
            evaluation_data = []
            for evaluation in evaluations:
                score_entries = ScoreEntry.objects.filter(
                    judge_evaluation=evaluation
                ).select_related('parameter')
                
                # Calcular puntuación total de la evaluación
                total_score = Decimal('0')
                parameter_scores = {}
                
                for score_entry in score_entries:
                    weighted_score = score_entry.score * score_entry.parameter.coefficient
                    total_score += weighted_score
                    parameter_scores[str(score_entry.parameter.id)] = {
                        'score': float(score_entry.score),
                        'coefficient': score_entry.parameter.coefficient,
                        'weighted_score': float(weighted_score)
                    }
                
                evaluation_data.append({
                    'evaluation_id': str(evaluation.id),
                    'judge_id': str(evaluation.judge.id),
                    'judge_name': evaluation.judge.name,
                    'total_score': float(total_score),
                    'parameter_scores': parameter_scores,
                    'completed': evaluation.is_completed,
                    'round': evaluation.evaluation_round.round_number if evaluation.evaluation_round else 1
                })
            
            participants_data.append({
                'participant': participant,
                'evaluations': evaluation_data
            })
        
        return participants_data
    
    def _calculate_scores(self, participants_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calcular puntuaciones totales para cada participante"""
        ranked_participants = []
        
        for participant_data in participants_data:
            participant = participant_data['participant']
            evaluations = participant_data['evaluations']
            
            # Calcular puntuación total
            total_score = Decimal('0')
            judge_scores = {}
            completed_evaluations = 0
            
            for evaluation in evaluations:
                if evaluation['completed']:
                    total_score += Decimal(str(evaluation['total_score']))
                    completed_evaluations += 1
                    
                    judge_scores[evaluation['judge_id']] = {
                        'judge_name': evaluation['judge_name'],
                        'score': evaluation['total_score'],
                        'percentage': self._calculate_percentage(evaluation['total_score'])
                    }
            
            # Calcular porcentaje (sobre puntuación máxima posible)
            max_possible_score = self._get_max_possible_score()
            percentage_score = (total_score / max_possible_score * 100) if max_possible_score > 0 else Decimal('0')
            
            ranked_participants.append({
                'participant': participant,
                'total_score': total_score,
                'percentage_score': percentage_score,
                'judge_scores': judge_scores,
                'completed_evaluations': completed_evaluations,
                'total_evaluations': len(evaluations)
            })
        
        # Ordenar por puntuación (mayor a menor)
        ranked_participants.sort(key=lambda x: x['total_score'], reverse=True)
        
        return ranked_participants
    
    def _resolve_ties(self, ranked_participants: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Resolver empates según reglas FEI"""
        if not ranked_participants:
            return ranked_participants
        
        # Detectar empates
        tied_groups = []
        current_group = [ranked_participants[0]]
        current_score = ranked_participants[0]['total_score']
        
        for participant in ranked_participants[1:]:
            if participant['total_score'] == current_score:
                current_group.append(participant)
            else:
                if len(current_group) > 1:
                    tied_groups.append(current_group)
                current_group = [participant]
                current_score = participant['total_score']
        
        # Agregar último grupo si hay empate
        if len(current_group) > 1:
            tied_groups.append(current_group)
        
        # Resolver empates
        for tied_group in tied_groups:
            resolved_group = self._resolve_tie_group(tied_group)
            
            # Marcar como empatados si no se pudo resolver
            if len(set(p['total_score'] for p in resolved_group)) == 1:
                participant_ids = [str(p['participant'].id) for p in resolved_group]
                for participant_data in resolved_group:
                    participant_data['is_tied'] = True
                    participant_data['tied_with'] = [pid for pid in participant_ids 
                                                   if pid != str(participant_data['participant'].id)]
        
        return ranked_participants
    
    def _resolve_tie_group(self, tied_group: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Resolver empate entre un grupo de participantes"""
        if self.config.tie_break_method == 'PERCENTAGE':
            # Ordenar por porcentaje más alto
            tied_group.sort(key=lambda x: x['percentage_score'], reverse=True)
        
        elif self.config.tie_break_method == 'COLLECTIVE_MARKS':
            # Ordenar por notas colectivas (parámetros con coeficiente > 1)
            for participant_data in tied_group:
                collective_score = Decimal('0')
                for evaluation in participant_data.get('evaluations', []):
                    for param_id, param_data in evaluation.get('parameter_scores', {}).items():
                        if param_data['coefficient'] > 1:
                            collective_score += Decimal(str(param_data['weighted_score']))
                participant_data['collective_score'] = collective_score
            
            tied_group.sort(key=lambda x: x.get('collective_score', Decimal('0')), reverse=True)
        
        elif self.config.tie_break_method == 'TECHNICAL_SCORE':
            # Ordenar por puntuación técnica (parámetros específicos)
            for participant_data in tied_group:
                technical_score = Decimal('0')
                for evaluation in participant_data.get('evaluations', []):
                    for param_id, param_data in evaluation.get('parameter_scores', {}).items():
                        # Considerar parámetros técnicos específicos
                        if param_data['coefficient'] in [3, 4, 5]:  # Coeficientes técnicos
                            technical_score += Decimal(str(param_data['weighted_score']))
                participant_data['technical_score'] = technical_score
            
            tied_group.sort(key=lambda x: x.get('technical_score', Decimal('0')), reverse=True)
        
        return tied_group
    
    def _create_snapshot(self, ranked_participants: List[Dict[str, Any]]) -> RankingSnapshot:
        """Crear snapshot del ranking"""
        # Marcar snapshots anteriores como no actuales
        RankingSnapshot.objects.filter(
            competition=self.competition,
            category=self.category,
            is_current=True
        ).update(is_current=False)
        
        # Crear nuevo snapshot
        snapshot = RankingSnapshot.objects.create(
            competition=self.competition,
            category=self.category,
            total_participants=len(ranked_participants),
            completed_evaluations=sum(p['completed_evaluations'] for p in ranked_participants),
            progress_percentage=self._calculate_progress_percentage(ranked_participants),
            is_current=True
        )
        
        # Crear entradas del ranking
        for position, participant_data in enumerate(ranked_participants, 1):
            RankingEntry.objects.create(
                snapshot=snapshot,
                participant=participant_data['participant'],
                position=position,
                total_score=participant_data['total_score'],
                percentage_score=participant_data['percentage_score'],
                judge_scores=participant_data['judge_scores'],
                evaluations_completed=participant_data['completed_evaluations'],
                evaluations_total=participant_data['total_evaluations'],
                is_tied=participant_data.get('is_tied', False),
                tied_with=participant_data.get('tied_with', [])
            )
        
        return snapshot
    
    def _detect_position_changes(self, ranked_participants: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detectar cambios de posición desde el último ranking"""
        try:
            last_snapshot = RankingSnapshot.objects.filter(
                competition=self.competition,
                category=self.category,
                is_current=False
            ).order_by('-timestamp').first()
            
            if not last_snapshot:
                return []
            
            # Obtener posiciones anteriores
            previous_positions = {}
            for entry in last_snapshot.entries.all():
                previous_positions[str(entry.participant.id)] = entry.position
            
            # Detectar cambios
            position_changes = []
            for current_position, participant_data in enumerate(ranked_participants, 1):
                participant_id = str(participant_data['participant'].id)
                previous_position = previous_positions.get(participant_id)
                
                if previous_position and previous_position != current_position:
                    position_changes.append({
                        'participant_id': participant_id,
                        'participant_name': participant_data['participant'].rider.name,
                        'horse_name': participant_data['participant'].horse.name,
                        'old_position': previous_position,
                        'new_position': current_position,
                        'change': previous_position - current_position  # Positivo = subió
                    })
            
            return position_changes
            
        except Exception as e:
            logger.error(f"Error detectando cambios de posición: {str(e)}")
            return []
    
    def _create_live_update(self, position_changes: List[Dict[str, Any]]):
        """Crear actualización para broadcast en tiempo real"""
        if not position_changes:
            return
        
        LiveRankingUpdate.objects.create(
            competition=self.competition,
            category=self.category,
            update_type='POSITION_CHANGE',
            affected_participants=[change['participant_id'] for change in position_changes],
            change_data={'position_changes': position_changes}
        )
    
    def _calculate_percentage(self, score: float) -> float:
        """Calcular porcentaje de puntuación"""
        max_score = self._get_max_possible_score()
        return (score / max_score * 100) if max_score > 0 else 0
    
    def _get_max_possible_score(self) -> Decimal:
        """Obtener puntuación máxima posible para la categoría"""
        cache_key = f"max_score_{self.category.id}"
        max_score = cache.get(cache_key)
        
        if max_score is None:
            # Calcular basado en los parámetros de evaluación
            from apps.scoring.models import EvaluationParameter
            
            parameters = EvaluationParameter.objects.filter(category=self.category)
            max_score = Decimal('0')
            
            for param in parameters:
                max_score += Decimal('10') * param.coefficient
            
            # Multiplicar por número de jueces
            judge_count = self.competition.judges.count()
            max_score *= judge_count
            
            cache.set(cache_key, max_score, 3600)  # Cache por 1 hora
        
        return max_score
    
    def _calculate_progress_percentage(self, ranked_participants: List[Dict[str, Any]]) -> Decimal:
        """Calcular porcentaje de progreso de la competencia"""
        if not ranked_participants:
            return Decimal('0')
        
        total_evaluations = sum(p['total_evaluations'] for p in ranked_participants)
        completed_evaluations = sum(p['completed_evaluations'] for p in ranked_participants)
        
        if total_evaluations == 0:
            return Decimal('0')
        
        return Decimal(completed_evaluations) / Decimal(total_evaluations) * 100
    
    def _invalidate_cache(self):
        """Invalidar cache relacionado con rankings"""
        cache_keys = [
            f"ranking_{self.competition.id}_{self.category.id}",
            f"live_ranking_{self.competition.id}_{self.category.id}",
            f"ranking_progress_{self.competition.id}_{self.category.id}"
        ]
        
        for key in cache_keys:
            cache.delete(key)
    
    def get_current_ranking(self) -> Optional[RankingSnapshot]:
        """Obtener ranking actual"""
        return RankingSnapshot.objects.filter(
            competition=self.competition,
            category=self.category,
            is_current=True
        ).first()
    
    def should_recalculate(self) -> bool:
        """Determinar si el ranking debe ser recalculado"""
        if not self.config.auto_calculate:
            return False
        
        last_calculation = RankingCalculation.objects.filter(
            competition=self.competition,
            category=self.category,
            success=True
        ).order_by('-calculation_start').first()
        
        if not last_calculation:
            return True
        
        # Verificar si ha pasado el intervalo de tiempo
        elapsed_seconds = (timezone.now() - last_calculation.calculation_start).total_seconds()
        return elapsed_seconds >= self.config.calculation_interval


class RankingBroadcaster:
    """Manejador de broadcast de rankings en tiempo real"""
    
    @staticmethod
    def broadcast_ranking_update(update: LiveRankingUpdate):
        """Enviar actualización de ranking a través de WebSocket"""
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("No hay channel layer configurado para WebSockets")
            return
        
        room_name = f"ranking_{update.competition.id}_{update.category.id}"
        
        message = {
            'type': 'ranking_update',
            'data': {
                'update_type': update.update_type,
                'timestamp': update.timestamp.isoformat(),
                'competition_id': str(update.competition.id),
                'category_id': str(update.category.id),
                'change_data': update.change_data
            }
        }
        
        try:
            async_to_sync(channel_layer.group_send)(room_name, message)
            update.mark_broadcasted()
            logger.info(f"Ranking update broadcasted to {room_name}")
        except Exception as e:
            logger.error(f"Error broadcasting ranking update: {str(e)}")
    
    @staticmethod
    def broadcast_pending_updates():
        """Enviar todas las actualizaciones pendientes"""
        pending_updates = LiveRankingUpdate.objects.filter(
            broadcasted=False
        ).order_by('timestamp')
        
        for update in pending_updates:
            RankingBroadcaster.broadcast_ranking_update(update)