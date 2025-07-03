import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useCallback } from 'react';
import { rankingsAPI } from '@/lib/api/rankings';
import type {
  RankingSnapshot,
  RankingEntry,
  RankingProgress,
  RankingConfiguration,
  RankingSearchParams,
  RankingFilters,
  WebSocketMessage,
  RankingStats,
  RankingDisplay
} from '@/types/rankings';

// Hook principal para rankings
export function useRankings(filters: RankingFilters = {}) {
  const queryClient = useQueryClient();
  
  const {
    data: rankings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['rankings', filters],
    queryFn: () => rankingsAPI.getRankings(filters),
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  const calculateRankingMutation = useMutation({
    mutationFn: ({ competitionId, categoryId }: { competitionId: string; categoryId: string }) =>
      rankingsAPI.calculateRanking(competitionId, categoryId),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['live-ranking'] });
      queryClient.invalidateQueries({ queryKey: ['ranking-progress'] });
    },
  });

  return {
    rankings: rankings?.results || [],
    isLoading,
    error,
    refetch,
    calculateRanking: calculateRankingMutation.mutate,
    isCalculating: calculateRankingMutation.isLoading,
  };
}

// Hook para ranking en tiempo real
export function useLiveRanking(params: RankingSearchParams) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const {
    data: ranking,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['live-ranking', params.competition_id, params.category_id],
    queryFn: () => rankingsAPI.getLiveRanking(params),
    enabled: !!params.competition_id && !!params.category_id,
    staleTime: 5 * 1000, // 5 segundos
    refetchInterval: 10 * 1000, // Backup polling cada 10 segundos
  });

  // Conectar WebSocket
  useEffect(() => {
    if (!params.competition_id || !params.category_id) return;

    const connectWebSocket = () => {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/ranking/?competition_id=${params.competition_id}&category_id=${params.category_id}`;
      
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          setIsConnected(true);
          setConnectionError(null);
          console.log('WebSocket conectado para ranking');
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'initial_ranking':
              case 'current_ranking':
              case 'ranking_update':
                // Actualizar datos en cache
                queryClient.setQueryData(
                  ['live-ranking', params.competition_id, params.category_id],
                  message.data
                );
                break;
              
              case 'position_change':
                // Mostrar notificación de cambio
                console.log('Cambio de posición:', message.data);
                break;
              
              case 'progress_update':
                // Actualizar progreso
                queryClient.setQueryData(
                  ['ranking-progress', params.competition_id, params.category_id],
                  message.data
                );
                break;
              
              case 'error':
                console.error('Error WebSocket:', message.message);
                setConnectionError(message.message || 'Error desconocido');
                break;
            }
          } catch (error) {
            console.error('Error procesando mensaje WebSocket:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('Error WebSocket:', error);
          setConnectionError('Error de conexión WebSocket');
        };

        wsRef.current.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket desconectado');
          
          // Reconectar después de 5 segundos
          setTimeout(connectWebSocket, 5000);
        };
      } catch (error) {
        console.error('Error creando WebSocket:', error);
        setConnectionError('No se pudo crear conexión WebSocket');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [params.competition_id, params.category_id, queryClient]);

  // Solicitar ranking actual
  const requestRanking = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'request_ranking' }));
    }
  }, []);

  // Solicitar progreso
  const requestProgress = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'request_progress' }));
    }
  }, []);

  return {
    ranking,
    isLoading,
    error,
    refetch,
    isConnected,
    connectionError,
    requestRanking,
    requestProgress,
  };
}

// Hook para progreso de ranking
export function useRankingProgress(competitionId: string, categoryId: string) {
  return useQuery({
    queryKey: ['ranking-progress', competitionId, categoryId],
    queryFn: () => rankingsAPI.getRankingProgress(competitionId, categoryId),
    enabled: !!competitionId && !!categoryId,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 30 * 1000, // Actualizar cada 30 segundos
  });
}

// Hook para configuración de ranking
export function useRankingConfiguration(competitionId?: string, categoryId?: string) {
  const queryClient = useQueryClient();

  const {
    data: configurations,
    isLoading,
    error
  } = useQuery({
    queryKey: ['ranking-configurations'],
    queryFn: () => rankingsAPI.getRankingConfigurations(),
    staleTime: 60 * 1000, // 1 minuto
  });

  const createConfigurationMutation = useMutation({
    mutationFn: rankingsAPI.createRankingConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking-configurations'] });
    },
  });

  const updateConfigurationMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config: Partial<RankingConfiguration> }) =>
      rankingsAPI.updateRankingConfiguration(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking-configurations'] });
    },
  });

  const deleteConfigurationMutation = useMutation({
    mutationFn: rankingsAPI.deleteRankingConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking-configurations'] });
    },
  });

  // Encontrar configuración específica
  const currentConfiguration = configurations?.results.find(
    config => config.competition === competitionId && config.category === categoryId
  );

  return {
    configurations: configurations?.results || [],
    currentConfiguration,
    isLoading,
    error,
    createConfiguration: createConfigurationMutation.mutate,
    updateConfiguration: updateConfigurationMutation.mutate,
    deleteConfiguration: deleteConfigurationMutation.mutate,
    isCreating: createConfigurationMutation.isLoading,
    isUpdating: updateConfigurationMutation.isLoading,
    isDeleting: deleteConfigurationMutation.isLoading,
  };
}

// Hook para estadísticas de ranking
export function useRankingStats(competitionId: string, categoryId: string) {
  return useQuery({
    queryKey: ['ranking-stats', competitionId, categoryId],
    queryFn: () => rankingsAPI.getRankingStats(competitionId, categoryId),
    enabled: !!competitionId && !!categoryId,
    staleTime: 60 * 1000, // 1 minuto
    refetchInterval: 60 * 1000, // Actualizar cada minuto
  });
}

// Hook para display público
export function useRankingDisplay(competitionId: string, categoryId: string) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayConfig, setDisplayConfig] = useState({
    refreshInterval: 10,
    showAnimations: true,
    showPositionChanges: true,
    topN: 20,
    theme: 'light' as 'light' | 'dark'
  });

  const {
    data: displayData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['ranking-display', competitionId, categoryId],
    queryFn: () => rankingsAPI.getRankingDisplay(competitionId, categoryId),
    enabled: !!competitionId && !!categoryId,
    staleTime: displayConfig.refreshInterval * 1000,
    refetchInterval: displayConfig.refreshInterval * 1000,
  });

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Detectar cambios de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return {
    displayData,
    isLoading,
    error,
    isFullscreen,
    displayConfig,
    setDisplayConfig,
    toggleFullscreen,
  };
}

// Hook para historial de rankings
export function useRankingHistory(competitionId: string, categoryId: string, limit = 10) {
  return useQuery({
    queryKey: ['ranking-history', competitionId, categoryId, limit],
    queryFn: () => rankingsAPI.getRankingHistory(competitionId, categoryId, limit),
    enabled: !!competitionId && !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para comparación de participantes
export function useParticipantComparison(
  participantIds: string[],
  competitionId: string,
  categoryId: string
) {
  return useQuery({
    queryKey: ['participant-comparison', participantIds, competitionId, categoryId],
    queryFn: () => rankingsAPI.compareParticipants(participantIds, competitionId, categoryId),
    enabled: participantIds.length > 0 && !!competitionId && !!categoryId,
    staleTime: 60 * 1000, // 1 minuto
  });
}

// Hook para métricas del sistema
export function useSystemMetrics() {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: () => rankingsAPI.getSystemMetrics(),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Actualizar cada minuto
  });
}

// Hook para notificaciones
export function useRankingNotifications(limit = 20) {
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    error
  } = useQuery({
    queryKey: ['ranking-notifications', limit],
    queryFn: () => rankingsAPI.getNotifications(limit),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Actualizar cada minuto
  });

  const markAsReadMutation = useMutation({
    mutationFn: rankingsAPI.markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking-notifications'] });
    },
  });

  const unreadCount = notifications?.results.filter(n => !n.read).length || 0;

  return {
    notifications: notifications?.results || [],
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
  };
}

// Hook para exportación
export function useRankingExport() {
  const exportMutation = useMutation({
    mutationFn: ({ snapshotId, options }: { snapshotId: string; options: any }) =>
      rankingsAPI.exportRanking(snapshotId, options),
    onSuccess: (data, variables) => {
      // Crear y descargar archivo
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ranking_${variables.snapshotId}.${variables.options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });

  return {
    exportRanking: exportMutation.mutate,
    isExporting: exportMutation.isLoading,
    exportError: exportMutation.error,
  };
}

// Hook personalizado para animaciones de cambio de posición
export function usePositionChangeAnimations() {
  const [animations, setAnimations] = useState<Array<{
    participantId: string;
    fromPosition: number;
    toPosition: number;
    duration: number;
  }>>([]);

  const addAnimation = useCallback((
    participantId: string,
    fromPosition: number,
    toPosition: number,
    duration = 1000
  ) => {
    setAnimations(prev => [
      ...prev,
      { participantId, fromPosition, toPosition, duration }
    ]);

    // Remover animación después de completarse
    setTimeout(() => {
      setAnimations(prev => prev.filter(a => a.participantId !== participantId));
    }, duration);
  }, []);

  const clearAnimations = useCallback(() => {
    setAnimations([]);
  }, []);

  return {
    animations,
    addAnimation,
    clearAnimations,
  };
}

// Hook para auto-refresh inteligente
export function useSmartRefresh(queryKeys: string[][], enabled = true) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await Promise.all(
        queryKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, queryKeys, isRefreshing]);

  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(refresh, 30000); // Cada 30 segundos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refresh]);

  return {
    refresh,
    isRefreshing,
  };
}