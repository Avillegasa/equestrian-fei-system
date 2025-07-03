import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.cache import cache
from urllib.parse import parse_qs

logger = logging.getLogger(__name__)


class RankingConsumer(AsyncWebsocketConsumer):
    """Consumer para actualizaciones de ranking en tiempo real"""
    
    async def connect(self):
        """Conectar cliente WebSocket"""
        # Obtener parámetros de la URL
        query_params = parse_qs(self.scope['query_string'].decode())
        
        self.competition_id = query_params.get('competition_id', [None])[0]
        self.category_id = query_params.get('category_id', [None])[0]
        
        if not self.competition_id or not self.category_id:
            await self.close()
            return
        
        # Verificar autenticación
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return
        
        # Verificar permisos
        has_permission = await self.check_permissions(user)
        if not has_permission:
            await self.close()
            return
        
        # Crear nombre de grupo
        self.room_group_name = f"ranking_{self.competition_id}_{self.category_id}"
        
        # Unirse al grupo
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Enviar ranking inicial
        await self.send_initial_ranking()
        
        logger.info(f"Cliente conectado a ranking: {self.room_group_name}")
    
    async def disconnect(self, close_code):
        """Desconectar cliente"""
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"Cliente desconectado de ranking: {self.room_group_name}")
    
    async def receive(self, text_data):
        """Recibir mensaje del cliente"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'request_ranking':
                await self.send_current_ranking()
            elif message_type == 'request_progress':
                await self.send_progress_update()
            elif message_type == 'subscribe_updates':
                await self.handle_subscription(data)
            else:
                logger.warning(f"Tipo de mensaje desconocido: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Error decodificando mensaje JSON")
        except Exception as e:
            logger.error(f"Error procesando mensaje: {str(e)}")
    
    async def ranking_update(self, event):
        """Enviar actualización de ranking"""
        await self.send(text_data=json.dumps({
            'type': 'ranking_update',
            'data': event['data']
        }))
    
    async def position_change(self, event):
        """Enviar cambio de posición"""
        await self.send(text_data=json.dumps({
            'type': 'position_change',
            'data': event['data']
        }))
    
    async def progress_update(self, event):
        """Enviar actualización de progreso"""
        await self.send(text_data=json.dumps({
            'type': 'progress_update',
            'data': event['data']
        }))
    
    async def score_update(self, event):
        """Enviar actualización de puntuación"""
        await self.send(text_data=json.dumps({
            'type': 'score_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def check_permissions(self, user):
        """Verificar permisos del usuario"""
        try:
            from apps.competitions.models import Competition
            
            competition = Competition.objects.get(id=self.competition_id)
            
            # Administradores y organizadores tienen acceso completo
            if user.is_staff or hasattr(user, 'organizerprofile'):
                return True
            
            # Jueces tienen acceso a sus competencias
            if hasattr(user, 'judgeprofile'):
                return competition.judges.filter(id=user.judgeprofile.id).exists()
            
            # Competencias públicas son accesibles para todos
            return competition.is_public
            
        except Exception as e:
            logger.error(f"Error verificando permisos: {str(e)}")
            return False
    
    async def send_initial_ranking(self):
        """Enviar ranking inicial al conectarse"""
        try:
            ranking_data = await self.get_current_ranking()
            if ranking_data:
                await self.send(text_data=json.dumps({
                    'type': 'initial_ranking',
                    'data': ranking_data
                }))
        except Exception as e:
            logger.error(f"Error enviando ranking inicial: {str(e)}")
    
    async def send_current_ranking(self):
        """Enviar ranking actual"""
        try:
            ranking_data = await self.get_current_ranking()
            if ranking_data:
                await self.send(text_data=json.dumps({
                    'type': 'current_ranking',
                    'data': ranking_data
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'No hay ranking disponible'
                }))
        except Exception as e:
            logger.error(f"Error enviando ranking actual: {str(e)}")
    
    async def send_progress_update(self):
        """Enviar actualización de progreso"""
        try:
            progress_data = await self.get_progress_data()
            if progress_data:
                await self.send(text_data=json.dumps({
                    'type': 'progress_data',
                    'data': progress_data
                }))
        except Exception as e:
            logger.error(f"Error enviando progreso: {str(e)}")
    
    async def handle_subscription(self, data):
        """Manejar suscripciones a tipos específicos de actualizaciones"""
        subscription_types = data.get('subscription_types', [])
        
        # Almacenar suscripciones en memoria (podrías usar Redis para persistencia)
        cache_key = f"ws_subscriptions_{self.channel_name}"
        cache.set(cache_key, subscription_types, 3600)
        
        await self.send(text_data=json.dumps({
            'type': 'subscription_confirmed',
            'subscriptions': subscription_types
        }))
    
    @database_sync_to_async
    def get_current_ranking(self):
        """Obtener ranking actual desde la base de datos"""
        try:
            from .models import RankingSnapshot
            from .serializers import RankingDisplaySerializer
            
            snapshot = RankingSnapshot.objects.filter(
                competition_id=self.competition_id,
                category_id=self.category_id,
                is_current=True
            ).first()
            
            if not snapshot:
                return None
            
            serializer = RankingDisplaySerializer(snapshot)
            return serializer.data
            
        except Exception as e:
            logger.error(f"Error obteniendo ranking: {str(e)}")
            return None
    
    @database_sync_to_async
    def get_progress_data(self):
        """Obtener datos de progreso"""
        try:
            from .models import RankingSnapshot
            
            snapshot = RankingSnapshot.objects.filter(
                competition_id=self.competition_id,
                category_id=self.category_id,
                is_current=True
            ).first()
            
            if not snapshot:
                return None
            
            return {
                'total_participants': snapshot.total_participants,
                'completed_evaluations': snapshot.completed_evaluations,
                'progress_percentage': float(snapshot.progress_percentage),
                'timestamp': snapshot.timestamp.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error obteniendo progreso: {str(e)}")
            return None


class RankingBroadcastConsumer(AsyncWebsocketConsumer):
    """Consumer para broadcasting masivo de rankings"""
    
    async def connect(self):
        """Conectar para broadcasting"""
        user = self.scope.get('user')
        
        # Solo organizadores y administradores pueden usar broadcasting
        if not user or not user.is_authenticated:
            await self.close()
            return
        
        has_permission = await self.check_broadcast_permissions(user)
        if not has_permission:
            await self.close()
            return
        
        # Unirse al grupo de broadcasting
        self.broadcast_group_name = "ranking_broadcast"
        
        await self.channel_layer.group_add(
            self.broadcast_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info("Cliente conectado a broadcasting de rankings")
    
    async def disconnect(self, close_code):
        """Desconectar de broadcasting"""
        if hasattr(self, 'broadcast_group_name'):
            await self.channel_layer.group_discard(
                self.broadcast_group_name,
                self.channel_name
            )
            logger.info("Cliente desconectado de broadcasting")
    
    async def receive(self, text_data):
        """Recibir comandos de broadcasting"""
        try:
            data = json.loads(text_data)
            command = data.get('command')
            
            if command == 'broadcast_ranking':
                await self.handle_broadcast_ranking(data)
            elif command == 'broadcast_all_rankings':
                await self.handle_broadcast_all_rankings()
            elif command == 'get_active_rooms':
                await self.send_active_rooms()
            else:
                logger.warning(f"Comando desconocido: {command}")
                
        except json.JSONDecodeError:
            logger.error("Error decodificando comando JSON")
        except Exception as e:
            logger.error(f"Error procesando comando: {str(e)}")
    
    async def handle_broadcast_ranking(self, data):
        """Manejar broadcast de ranking específico"""
        competition_id = data.get('competition_id')
        category_id = data.get('category_id')
        
        if not competition_id or not category_id:
            await self.send_error("competition_id y category_id son requeridos")
            return
        
        try:
            # Obtener ranking actual
            ranking_data = await self.get_ranking_for_broadcast(competition_id, category_id)
            
            if not ranking_data:
                await self.send_error("No hay ranking disponible")
                return
            
            # Enviar a todos los clientes en la sala
            room_name = f"ranking_{competition_id}_{category_id}"
            await self.channel_layer.group_send(
                room_name,
                {
                    'type': 'ranking_update',
                    'data': ranking_data
                }
            )
            
            await self.send_success(f"Ranking enviado a sala {room_name}")
            
        except Exception as e:
            await self.send_error(f"Error enviando ranking: {str(e)}")
    
    async def handle_broadcast_all_rankings(self):
        """Broadcast de todos los rankings activos"""
        try:
            active_competitions = await self.get_active_competitions()
            
            broadcast_count = 0
            for comp_data in active_competitions:
                room_name = f"ranking_{comp_data['competition_id']}_{comp_data['category_id']}"
                
                await self.channel_layer.group_send(
                    room_name,
                    {
                        'type': 'ranking_update',
                        'data': comp_data['ranking']
                    }
                )
                broadcast_count += 1
            
            await self.send_success(f"Broadcast enviado a {broadcast_count} salas")
            
        except Exception as e:
            await self.send_error(f"Error en broadcast masivo: {str(e)}")
    
    async def send_active_rooms(self):
        """Enviar lista de salas activas"""
        try:
            active_rooms = await self.get_active_rooms()
            await self.send(text_data=json.dumps({
                'type': 'active_rooms',
                'rooms': active_rooms
            }))
        except Exception as e:
            await self.send_error(f"Error obteniendo salas activas: {str(e)}")
    
    async def send_error(self, message):
        """Enviar mensaje de error"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))
    
    async def send_success(self, message):
        """Enviar mensaje de éxito"""
        await self.send(text_data=json.dumps({
            'type': 'success',
            'message': message
        }))
    
    @database_sync_to_async
    def check_broadcast_permissions(self, user):
        """Verificar permisos para broadcasting"""
        return user.is_staff or hasattr(user, 'organizerprofile')
    
    @database_sync_to_async
    def get_ranking_for_broadcast(self, competition_id, category_id):
        """Obtener ranking para broadcast"""
        try:
            from .models import RankingSnapshot
            from .serializers import RankingDisplaySerializer
            
            snapshot = RankingSnapshot.objects.filter(
                competition_id=competition_id,
                category_id=category_id,
                is_current=True
            ).first()
            
            if not snapshot:
                return None
            
            serializer = RankingDisplaySerializer(snapshot)
            return serializer.data
            
        except Exception as e:
            logger.error(f"Error obteniendo ranking para broadcast: {str(e)}")
            return None
    
    @database_sync_to_async
    def get_active_competitions(self):
        """Obtener competencias activas"""
        try:
            from .models import RankingSnapshot
            from .serializers import RankingDisplaySerializer
            
            active_snapshots = RankingSnapshot.objects.filter(
                is_current=True,
                competition__is_active=True
            )
            
            results = []
            for snapshot in active_snapshots:
                serializer = RankingDisplaySerializer(snapshot)
                results.append({
                    'competition_id': str(snapshot.competition.id),
                    'category_id': str(snapshot.category.id),
                    'ranking': serializer.data
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error obteniendo competencias activas: {str(e)}")
            return []
    
    @database_sync_to_async
    def get_active_rooms(self):
        """Obtener lista de salas activas"""
        try:
            from .models import RankingSnapshot
            
            active_snapshots = RankingSnapshot.objects.filter(
                is_current=True,
                competition__is_active=True
            ).select_related('competition', 'category')
            
            rooms = []
            for snapshot in active_snapshots:
                rooms.append({
                    'room_name': f"ranking_{snapshot.competition.id}_{snapshot.category.id}",
                    'competition_name': snapshot.competition.name,
                    'category_name': snapshot.category.name,
                    'participants': snapshot.total_participants,
                    'progress': float(snapshot.progress_percentage)
                })
            
            return rooms
            
        except Exception as e:
            logger.error(f"Error obteniendo salas activas: {str(e)}")
            return []