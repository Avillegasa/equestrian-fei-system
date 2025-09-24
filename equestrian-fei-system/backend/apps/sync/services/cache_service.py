import json
import hashlib
import logging
from typing import Any, Optional, List, Dict
from datetime import datetime, timedelta
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from django.db import models
from ..models import CacheEntry

logger = logging.getLogger(__name__)


class CacheService:
    """Servicio de cache avanzado con Redis y base de datos"""
    
    DEFAULT_TIMEOUT = 3600  # 1 hour
    
    def __init__(self):
        self.redis_available = self._check_redis()
        
    def _check_redis(self) -> bool:
        """Verificar si Redis está disponible"""
        try:
            cache.get('test')
            return True
        except Exception as e:
            logger.warning(f"Redis no disponible: {e}")
            return False
    
    def _generate_key(self, key: str, namespace: str = None) -> str:
        """Generar clave de cache con namespace"""
        if namespace:
            return f"{namespace}:{key}"
        return key
    
    def _serialize_data(self, data: Any) -> str:
        """Serializar datos para almacenamiento"""
        return json.dumps(data, default=str, ensure_ascii=False)
    
    def _deserialize_data(self, data: str) -> Any:
        """Deserializar datos del cache"""
        try:
            return json.loads(data)
        except (json.JSONDecodeError, TypeError):
            return data
    
    def get(self, key: str, namespace: str = None, default: Any = None) -> Any:
        """Obtener valor del cache"""
        cache_key = self._generate_key(key, namespace)
        
        # Intentar Redis primero
        if self.redis_available:
            try:
                value = cache.get(cache_key)
                if value is not None:
                    # Actualizar contador de acceso en DB
                    self._update_db_access(cache_key)
                    return self._deserialize_data(value)
            except Exception as e:
                logger.error(f"Error obteniendo de Redis: {e}")
        
        # Fallback a base de datos
        return self._get_from_db(cache_key, default)
    
    def set(self, key: str, value: Any, timeout: int = None, 
            namespace: str = None, cache_type: str = 'api_response', 
            tags: List[str] = None) -> bool:
        """Almacenar valor en cache"""
        cache_key = self._generate_key(key, namespace)
        timeout = timeout or self.DEFAULT_TIMEOUT
        serialized_value = self._serialize_data(value)
        
        success = False
        
        # Almacenar en Redis
        if self.redis_available:
            try:
                cache.set(cache_key, serialized_value, timeout)
                success = True
            except Exception as e:
                logger.error(f"Error almacenando en Redis: {e}")
        
        # Almacenar en base de datos como respaldo
        try:
            self._set_in_db(cache_key, value, timeout, cache_type, tags)
            success = True
        except Exception as e:
            logger.error(f"Error almacenando en DB: {e}")
        
        return success
    
    def delete(self, key: str, namespace: str = None) -> bool:
        """Eliminar valor del cache"""
        cache_key = self._generate_key(key, namespace)
        
        success = False
        
        # Eliminar de Redis
        if self.redis_available:
            try:
                cache.delete(cache_key)
                success = True
            except Exception as e:
                logger.error(f"Error eliminando de Redis: {e}")
        
        # Eliminar de base de datos
        try:
            CacheEntry.objects.filter(cache_key=cache_key).delete()
            success = True
        except Exception as e:
            logger.error(f"Error eliminando de DB: {e}")
        
        return success
    
    def clear_namespace(self, namespace: str) -> bool:
        """Limpiar todo el namespace"""
        try:
            # En Redis, buscar por patrón
            if self.redis_available:
                pattern = f"{namespace}:*"
                # Nota: esto requiere implementación específica según el backend
                
            # En base de datos, buscar por prefix
            CacheEntry.objects.filter(cache_key__startswith=f"{namespace}:").delete()
            
            return True
        except Exception as e:
            logger.error(f"Error limpiando namespace {namespace}: {e}")
            return False
    
    def invalidate_by_tags(self, tags: List[str]) -> int:
        """Invalidar cache por tags"""
        try:
            count = 0
            for tag in tags:
                entries = CacheEntry.objects.filter(
                    tags__contains=[tag],
                    expires_at__gt=timezone.now()
                )
                
                for entry in entries:
                    # Eliminar de Redis
                    if self.redis_available:
                        try:
                            cache.delete(entry.cache_key)
                        except Exception:
                            pass
                    
                    count += 1
                
                # Eliminar de base de datos
                entries.delete()
            
            return count
        except Exception as e:
            logger.error(f"Error invalidando por tags: {e}")
            return 0
    
    def get_or_set(self, key: str, callable_func, timeout: int = None, 
                   namespace: str = None, cache_type: str = 'computed_value',
                   tags: List[str] = None) -> Any:
        """Obtener del cache o ejecutar función y cachear resultado"""
        cached_value = self.get(key, namespace)
        
        if cached_value is not None:
            return cached_value
        
        # Ejecutar función y cachear resultado
        try:
            value = callable_func()
            self.set(key, value, timeout, namespace, cache_type, tags)
            return value
        except Exception as e:
            logger.error(f"Error ejecutando función para cache: {e}")
            raise
    
    def _get_from_db(self, cache_key: str, default: Any = None) -> Any:
        """Obtener valor de la base de datos"""
        try:
            entry = CacheEntry.objects.get(
                cache_key=cache_key,
                expires_at__gt=timezone.now()
            )
            entry.increment_access()
            return entry.data
        except CacheEntry.DoesNotExist:
            return default
    
    def _set_in_db(self, cache_key: str, value: Any, timeout: int, 
                   cache_type: str, tags: List[str] = None) -> None:
        """Almacenar valor en base de datos"""
        expires_at = timezone.now() + timedelta(seconds=timeout)
        
        # Calcular tamaño aproximado
        size_bytes = len(self._serialize_data(value).encode('utf-8'))
        
        CacheEntry.objects.update_or_create(
            cache_key=cache_key,
            defaults={
                'cache_type': cache_type,
                'data': value,
                'expires_at': expires_at,
                'size_bytes': size_bytes,
                'tags': tags or [],
                'access_count': 1,
                'last_accessed': timezone.now()
            }
        )
    
    def _update_db_access(self, cache_key: str) -> None:
        """Actualizar contador de acceso en base de datos"""
        try:
            CacheEntry.objects.filter(cache_key=cache_key).update(
                access_count=models.F('access_count') + 1,
                last_accessed=timezone.now()
            )
        except Exception:
            pass  # No crítico si falla
    
    def cleanup_expired(self) -> int:
        """Limpiar entradas expiradas"""
        try:
            deleted_count = CacheEntry.objects.filter(
                expires_at__lt=timezone.now()
            ).delete()[0]
            
            logger.info(f"Limpiadas {deleted_count} entradas de cache expiradas")
            return deleted_count
        except Exception as e:
            logger.error(f"Error limpiando cache expirado: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas del cache"""
        try:
            now = timezone.now()
            
            total_entries = CacheEntry.objects.count()
            active_entries = CacheEntry.objects.filter(expires_at__gt=now).count()
            expired_entries = total_entries - active_entries
            
            # Estadísticas por tipo
            type_stats = CacheEntry.objects.filter(
                expires_at__gt=now
            ).values('cache_type').annotate(
                count=models.Count('id'),
                total_size=models.Sum('size_bytes'),
                avg_access=models.Avg('access_count')
            )
            
            # Tamaño total
            total_size = CacheEntry.objects.filter(
                expires_at__gt=now
            ).aggregate(
                total=models.Sum('size_bytes')
            )['total'] or 0
            
            return {
                'total_entries': total_entries,
                'active_entries': active_entries,
                'expired_entries': expired_entries,
                'total_size_bytes': total_size,
                'total_size_mb': round(total_size / 1024 / 1024, 2),
                'type_stats': list(type_stats),
                'redis_available': self.redis_available,
                'last_cleanup': timezone.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de cache: {e}")
            return {'error': str(e)}


# Instancia singleton del servicio de cache
cache_service = CacheService()


# Decoradores útiles para cache
def cache_result(timeout: int = None, namespace: str = None, 
                cache_type: str = 'computed_value', tags: List[str] = None):
    """Decorador para cachear resultados de funciones"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generar clave basada en función y argumentos
            key_data = {
                'function': func.__name__,
                'args': args,
                'kwargs': kwargs
            }
            cache_key = hashlib.md5(
                json.dumps(key_data, default=str, sort_keys=True).encode()
            ).hexdigest()
            
            return cache_service.get_or_set(
                key=cache_key,
                callable_func=lambda: func(*args, **kwargs),
                timeout=timeout,
                namespace=namespace,
                cache_type=cache_type,
                tags=tags
            )
        return wrapper
    return decorator


def invalidate_cache(key: str = None, namespace: str = None, 
                    tags: List[str] = None) -> bool:
    """Función helper para invalidar cache"""
    if key:
        return cache_service.delete(key, namespace)
    elif tags:
        return cache_service.invalidate_by_tags(tags) > 0
    elif namespace:
        return cache_service.clear_namespace(namespace)
    return False