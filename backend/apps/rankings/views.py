from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import logging

from .models import (
    RankingSnapshot, RankingEntry, RankingCalculation, 
    LiveRankingUpdate, RankingConfiguration
)
from .serializers import (
    RankingSnapshotSerializer, RankingEntrySerializer, 
    RankingCalculationSerializer, LiveRankingUpdateSerializer,
    RankingConfigurationSerializer
)
from .calculators import RankingCalculator, RankingBroadcaster
from apps.competitions.models import Competition, Category
from apps.users.permissions import IsJudge, IsOrganizer

logger = logging.getLogger(__name__)


class RankingViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para consultar rankings"""
    
    serializer_class = RankingSnapshotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar rankings según permisos del usuario"""
        user = self.request.user
        
        # Administradores y organizadores ven todos los rankings
        if user.is_staff or hasattr(user, 'organizerprofile'):
            return RankingSnapshot.objects.all()
        
        # Jueces solo ven rankings de sus competencias
        if hasattr(user, 'judgeprofile'):
            return RankingSnapshot.objects.filter(
                competition__judges=user.judgeprofile
            )
        
        # Otros usuarios solo ven rankings públicos
        return RankingSnapshot.objects.filter(
            competition__is_public=True
        )
    
    @action(detail=False, methods=['get'])
    def live(self, request):
        """Obtener rankings en tiempo real"""
        competition_id = request.query_params.get('competition_id')
        category_id = request.query_params.get('category_id')
        
        if not competition_id or not category_id:
            return Response(
                {'error': 'competition_id y category_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar permisos
        competition = get_object_or_404(Competition, id=competition_id)
        category = get_object_or_404(Category, id=category_id)
        
        # Cache key para optimizar
        cache_key = f"live_ranking_{competition_id}_{category_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        # Obtener ranking actual
        try:
            snapshot = RankingSnapshot.objects.get(
                competition=competition,
                category=category,
                is_current=True
            )
            
            # Serializar con detalles completos
            serializer = RankingSnapshotSerializer(snapshot, context={'request': request})
            data = serializer.data
            
            # Agregar información adicional
            data['last_updated'] = snapshot.timestamp.isoformat()
            data['auto_refresh'] = RankingConfiguration.objects.filter(
                competition=competition,
                category=category
            ).values_list('broadcast_interval', flat=True).first() or 5
            
            # Cache por 10 segundos
            cache.set(cache_key, data, 10)
            
            return Response(data)
            
        except RankingSnapshot.DoesNotExist:
            return Response(
                {'error': 'No hay ranking disponible para esta competencia/categoría'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Forzar recálculo de ranking"""
        if not (request.user.is_staff or hasattr(request.user, 'organizerprofile')):
            return Response(
                {'error': 'No tienes permisos para realizar esta acción'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        competition_id = request.data.get('competition_id')
        category_id = request.data.get('category_id')
        
        if not competition_id or not category_id:
            return Response(
                {'error': 'competition_id y category_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            competition = Competition.objects.get(id=competition_id)
            category = Category.objects.get(id=category_id)
            
            calculator = RankingCalculator(competition, category)
            snapshot = calculator.calculate_ranking(triggered_by=request.user)
            
            # Broadcast de actualización
            RankingBroadcaster.broadcast_pending_updates()
            
            serializer = RankingSnapshotSerializer(snapshot, context={'request': request})
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error calculando ranking: {str(e)}")
            return Response(
                {'error': f'Error calculando ranking: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def progress(self, request):
        """Obtener progreso de competencia"""
        competition_id = request.query_params.get('competition_id')
        category_id = request.query_params.get('category_id')
        
        if not competition_id or not category_id:
            return Response(
                {'error': 'competition_id y category_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f"ranking_progress_{competition_id}_{category_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        try:
            competition = Competition.objects.get(id=competition_id)
            category = Category.objects.get(id=category_id)
            
            # Obtener snapshot actual
            snapshot = RankingSnapshot.objects.filter(
                competition=competition,
                category=category,
                is_current=True
            ).first()
            
            if not snapshot:
                return Response(
                    {'error': 'No hay datos de progreso disponibles'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Calcular estadísticas de progreso
            entries = snapshot.entries.all()
            total_participants = len(entries)
            fully_evaluated = sum(1 for entry in entries if entry.evaluations_completed == entry.evaluations_total)
            partially_evaluated = sum(1 for entry in entries if 0 < entry.evaluations_completed < entry.evaluations_total)
            not_evaluated = total_participants - fully_evaluated - partially_evaluated
            
            # Progreso por juez
            judge_progress = {}
            for entry in entries:
                for judge_id, judge_data in entry.judge_scores.items():
                    if judge_id not in judge_progress:
                        judge_progress[judge_id] = {
                            'judge_name': judge_data['judge_name'],
                            'completed': 0,
                            'total': total_participants
                        }
                    judge_progress[judge_id]['completed'] += 1
            
            data = {
                'competition_id': str(competition.id),
                'category_id': str(category.id),
                'total_participants': total_participants,
                'fully_evaluated': fully_evaluated,
                'partially_evaluated': partially_evaluated,
                'not_evaluated': not_evaluated,
                'progress_percentage': float(snapshot.progress_percentage),
                'judge_progress': list(judge_progress.values()),
                'last_updated': snapshot.timestamp.isoformat()
            }
            
            # Cache por 30 segundos
            cache.set(cache_key, data, 30)
            
            return Response(data)
            
        except Competition.DoesNotExist:
            return Response(
                {'error': 'Competencia no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Category.DoesNotExist:
            return Response(
                {'error': 'Categoría no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Obtener historial de rankings"""
        competition_id = request.query_params.get('competition_id')
        category_id = request.query_params.get('category_id')
        limit = int(request.query_params.get('limit', 10))
        
        if not competition_id or not category_id:
            return Response(
                {'error': 'competition_id y category_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            snapshots = RankingSnapshot.objects.filter(
                competition_id=competition_id,
                category_id=category_id
            ).order_by('-timestamp')[:limit]
            
            serializer = RankingSnapshotSerializer(snapshots, many=True, context={'request': request})
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Error obteniendo historial: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RankingEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para entradas individuales de ranking"""
    
    serializer_class = RankingEntrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar entradas según permisos"""
        snapshot_id = self.request.query_params.get('snapshot_id')
        if snapshot_id:
            return RankingEntry.objects.filter(snapshot_id=snapshot_id)
        return RankingEntry.objects.none()
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Obtener detalles completos de una entrada"""
        entry = self.get_object()
        serializer = RankingEntrySerializer(entry, context={'request': request})
        
        # Agregar información adicional
        data = serializer.data
        data['position_history'] = self._get_position_history(entry.participant)
        data['judge_breakdown'] = self._get_judge_breakdown(entry)
        
        return Response(data)
    
    def _get_position_history(self, participant):
        """Obtener historial de posiciones del participante"""
        entries = RankingEntry.objects.filter(
            participant=participant,
            snapshot__competition=participant.competition,
            snapshot__category=participant.category
        ).order_by('-snapshot__timestamp')[:10]
        
        return [
            {
                'timestamp': entry.snapshot.timestamp.isoformat(),
                'position': entry.position,
                'score': float(entry.total_score),
                'percentage': float(entry.percentage_score)
            }
            for entry in entries
        ]
    
    def _get_judge_breakdown(self, entry):
        """Obtener desglose detallado por juez"""
        breakdown = []
        for judge_id, judge_data in entry.judge_scores.items():
            breakdown.append({
                'judge_id': judge_id,
                'judge_name': judge_data['judge_name'],
                'score': judge_data['score'],
                'percentage': judge_data['percentage']
            })
        return breakdown


class RankingCalculationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para historial de cálculos"""
    
    serializer_class = RankingCalculationSerializer
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def get_queryset(self):
        """Solo organizadores pueden ver cálculos"""
        return RankingCalculation.objects.all().order_by('-calculation_start')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas de cálculos"""
        # Últimas 24 horas
        since = timezone.now() - timedelta(hours=24)
        
        calculations = RankingCalculation.objects.filter(
            calculation_start__gte=since
        )
        
        stats = {
            'total_calculations': calculations.count(),
            'successful_calculations': calculations.filter(success=True).count(),
            'failed_calculations': calculations.filter(success=False).count(),
            'average_duration_ms': calculations.filter(
                success=True,
                duration_ms__isnull=False
            ).aggregate(avg_duration=models.Avg('duration_ms'))['avg_duration'],
            'recent_errors': calculations.filter(
                success=False
            ).values('error_message', 'calculation_start')[:5]
        }
        
        return Response(stats)


class LiveRankingUpdateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para actualizaciones en tiempo real"""
    
    serializer_class = LiveRankingUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar actualizaciones según permisos"""
        competition_id = self.request.query_params.get('competition_id')
        category_id = self.request.query_params.get('category_id')
        
        queryset = LiveRankingUpdate.objects.all()
        
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        return queryset.order_by('-timestamp')
    
    @action(detail=False, methods=['post'])
    def broadcast_pending(self, request):
        """Enviar actualizaciones pendientes"""
        if not (request.user.is_staff or hasattr(request.user, 'organizerprofile')):
            return Response(
                {'error': 'No tienes permisos para realizar esta acción'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            RankingBroadcaster.broadcast_pending_updates()
            return Response({'message': 'Actualizaciones enviadas exitosamente'})
        except Exception as e:
            return Response(
                {'error': f'Error enviando actualizaciones: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RankingConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet para configuración de rankings"""
    
    serializer_class = RankingConfigurationSerializer
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def get_queryset(self):
        """Solo organizadores pueden gestionar configuraciones"""
        return RankingConfiguration.objects.all()
    
    @action(detail=True, methods=['post'])
    def test_calculation(self, request, pk=None):
        """Probar cálculo de ranking con configuración"""
        config = self.get_object()
        
        try:
            calculator = RankingCalculator(config.competition, config.category)
            snapshot = calculator.calculate_ranking(triggered_by=request.user)
            
            serializer = RankingSnapshotSerializer(snapshot, context={'request': request})
            return Response({
                'message': 'Cálculo de prueba exitoso',
                'snapshot': serializer.data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error en cálculo de prueba: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reset_cache(self, request, pk=None):
        """Limpiar cache de ranking"""
        config = self.get_object()
        
        cache_keys = [
            f"ranking_{config.competition.id}_{config.category.id}",
            f"live_ranking_{config.competition.id}_{config.category.id}",
            f"ranking_progress_{config.competition.id}_{config.category.id}",
            f"max_score_{config.category.id}"
        ]
        
        for key in cache_keys:
            cache.delete(key)
        
        return Response({'message': 'Cache limpiado exitosamente'})
    
    @action(detail=False, methods=['get'])
    def default_config(self, request):
        """Obtener configuración por defecto"""
        default_config = {
            'auto_calculate': True,
            'calculation_interval': 30,
            'tie_break_method': 'PERCENTAGE',
            'broadcast_enabled': True,
            'broadcast_interval': 5,
            'show_percentages': True,
            'show_judge_breakdown': True,
            'show_position_changes': True
        }
        
        return Response(default_config)