'use client';

// frontend/src/hooks/useOffline.ts - VERSION CON DEBUG MEJORADO

import { useState, useEffect, useCallback } from 'react';

export interface OfflineState {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  lastSyncTime: Date | null;
  pendingActions: PendingAction[];
  cacheStatus: CacheStatus | null;
}

export interface PendingAction {
  id: string;
  type: 'score_update' | 'participant_registration' | 'judge_assignment';
  data: any;
  timestamp: Date;
  retryCount: number;
}

export interface CacheStatus {
  totalEntries: number;
  cachedUrls: string[];
  lastUpdate: string;
}

const MAX_RETRY_ATTEMPTS = 3;
const SYNC_INTERVAL = 30000; // 30 segundos

// Función auxiliar para procesar acciones
const processAction = async (action: PendingAction) => {
  switch (action.type) {
    case 'score_update':
      console.log('🔄 Procesando acción offline:', action.type, action.data);
      
      const response = await fetch(`/api/scores/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action.data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en API response:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Acción sincronizada exitosamente:', result);
      return result;
      
    case 'participant_registration':
      console.log('🔄 Procesando registro de participante...');
      break;
      
    case 'judge_assignment':
      console.log('🔄 Procesando asignación de juez...');
      break;
      
    default:
      throw new Error(`Tipo de acción no soportado: ${action.type}`);
  }
};

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isServiceWorkerReady: false,
    lastSyncTime: null,
    pendingActions: [],
    cacheStatus: null,
  });

  // DEBUG: Log del estado cada vez que cambia
  useEffect(() => {
    console.log('🔍 DEBUG - Estado actual:', {
      isOnline: state.isOnline,
      pendingActionsCount: state.pendingActions.length,
      pendingActionIds: state.pendingActions.map(a => `${a.type}-${a.id.slice(-8)}`),
    });
  }, [state.isOnline, state.pendingActions.length]);

  // Inicializar Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration);
          setState(prev => ({ ...prev, isServiceWorkerReady: true }));
        })
        .catch((error) => {
          console.error('Error registrando Service Worker:', error);
        });
    }
  }, []);

  // Escuchar cambios de conectividad
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('🌐 Conexión restaurada - iniciando sincronización...');
      setState(prev => {
        console.log('🔍 DEBUG - Acciones antes de volver online:', prev.pendingActions.length);
        return { ...prev, isOnline: true };
      });
      // Intentar sincronizar cuando vuelva la conexión - CON DELAY
      setTimeout(() => {
        console.log('🔍 DEBUG - Ejecutando sincronización después del delay...');
        syncPendingActions();
      }, 2000); // Aumentar delay a 2 segundos
    };

    const handleOffline = () => {
      console.log('📴 Conexión perdida - modo offline activado');
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Remover dependencia de syncPendingActions para evitar recreación

  // Cargar datos pendientes del localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPendingActions = () => {
      try {
        const stored = localStorage.getItem('pendingActions');
        if (stored) {
          const actions = JSON.parse(stored).map((action: any) => ({
            ...action,
            timestamp: new Date(action.timestamp),
          }));
          console.log(`📋 Cargadas ${actions.length} acciones pendientes del localStorage:`, 
            actions.map(a => `${a.type}-${a.id.slice(-8)}`));
          setState(prev => ({ ...prev, pendingActions: actions }));
        } else {
          console.log('📋 No hay acciones pendientes en localStorage');
        }
      } catch (error) {
        console.error('Error cargando acciones pendientes:', error);
      }
    };

    loadPendingActions();
  }, []);

  // Agregar acción pendiente
  const addPendingAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const newAction: PendingAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0,
    };

    console.log('➕ Agregando acción pendiente:', newAction.type, newAction.id.slice(-8));

    setState(prev => {
      const newPendingActions = [...prev.pendingActions, newAction];
      console.log('🔍 DEBUG - Nuevas acciones pendientes:', newPendingActions.length);
      
      // Guardar en localStorage INMEDIATAMENTE
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pendingActions', JSON.stringify(newPendingActions));
          console.log('💾 Guardado en localStorage:', newPendingActions.length, 'acciones');
          
          // VERIFICAR que se guardó correctamente
          const verification = localStorage.getItem('pendingActions');
          if (verification) {
            const parsed = JSON.parse(verification);
            console.log('✅ Verificación localStorage:', parsed.length, 'acciones guardadas');
          }
        } catch (error) {
          console.error('❌ Error guardando en localStorage:', error);
        }
      }
      
      return { ...prev, pendingActions: newPendingActions };
    });

    // NO intentar sincronizar inmediatamente si está online
    // Dejar que sea manual o por intervalo
  }, []);

  // Sincronizar acciones pendientes - MEJORADO CON MÁS DEBUG
  const syncPendingActions = useCallback(async () => {
    console.log('🔍 DEBUG - syncPendingActions llamado');
    console.log('🔍 DEBUG - Estado actual en sync:', {
      isOnline: state.isOnline,
      pendingCount: state.pendingActions.length
    });

    // Obtener acciones más recientes del localStorage ANTES de sincronizar
    let currentActions = state.pendingActions;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('pendingActions');
        if (stored) {
          currentActions = JSON.parse(stored).map((action: any) => ({
            ...action,
            timestamp: new Date(action.timestamp),
          }));
          console.log('🔍 DEBUG - Acciones desde localStorage:', currentActions.length);
        }
      } catch (error) {
        console.error('Error leyendo localStorage en sync:', error);
      }
    }

    if (!state.isOnline || currentActions.length === 0) {
      console.log('🔄 No se puede sincronizar:', !state.isOnline ? 'sin conexión' : 'no hay acciones pendientes');
      console.log('🔍 DEBUG - Detalles:', {
        isOnline: state.isOnline,
        actionsFromState: state.pendingActions.length,
        actionsFromStorage: currentActions.length
      });
      return;
    }

    console.log(`🔄 Iniciando sincronización de ${currentActions.length} acciones...`);
    
    const actionsToSync = [...currentActions];
    const failedActions: PendingAction[] = [];
    let successCount = 0;

    for (const action of actionsToSync) {
      try {
        await processAction(action);
        console.log(`✅ Acción sincronizada: ${action.type} (${action.id.slice(-8)})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error sincronizando acción ${action.type} (${action.id.slice(-8)}):`, error);
        
        // Incrementar contador de reintentos
        const updatedAction = {
          ...action,
          retryCount: action.retryCount + 1,
        };

        // Si no ha superado el máximo de reintentos, mantener en cola
        if (updatedAction.retryCount < MAX_RETRY_ATTEMPTS) {
          failedActions.push(updatedAction);
          console.log(`🔄 Acción ${action.type} reintentará (${updatedAction.retryCount}/${MAX_RETRY_ATTEMPTS})`);
        } else {
          console.error(`💀 Acción ${action.type} descartada después de ${MAX_RETRY_ATTEMPTS} reintentos`);
        }
      }
    }

    console.log(`📊 Sincronización completada: ${successCount} exitosas, ${failedActions.length} fallidas`);

    // Actualizar estado con acciones que fallaron
    setState(prev => {
      const newState = { 
        ...prev, 
        pendingActions: failedActions,
        lastSyncTime: new Date()
      };
      
      // Actualizar localStorage
      if (typeof window !== 'undefined') {
        if (failedActions.length === 0) {
          localStorage.removeItem('pendingActions');
          console.log('🧹 localStorage limpiado - todas las acciones sincronizadas');
        } else {
          localStorage.setItem('pendingActions', JSON.stringify(failedActions));
          console.log(`💾 ${failedActions.length} acciones guardadas en localStorage para reintento`);
        }
      }
      
      return newState;
    });
  }, [state.isOnline, state.pendingActions]);

  // Cachear competencia
  const cacheCompetition = useCallback(async (competitionId: string): Promise<boolean> => {
    if (!state.isServiceWorkerReady) return false;

    try {
      const channel = new MessageChannel();
      
      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };
        
        navigator.serviceWorker.controller?.postMessage(
          { 
            type: 'CACHE_COMPETITION', 
            competitionId 
          },
          [channel.port2]
        );
      });
    } catch (error) {
      console.error('Error cacheando competencia:', error);
      return false;
    }
  }, [state.isServiceWorkerReady]);

  // Limpiar cache
  const clearCache = useCallback(async (): Promise<boolean> => {
    if (!state.isServiceWorkerReady) return false;

    try {
      const channel = new MessageChannel();
      
      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };
        
        navigator.serviceWorker.controller?.postMessage(
          { type: 'CLEAR_CACHE' },
          [channel.port2]
        );
      });
    } catch (error) {
      console.error('Error limpiando cache:', error);
      return false;
    }
  }, [state.isServiceWorkerReady]);

  // Obtener estado del cache
  const getCacheStatus = useCallback(async (): Promise<CacheStatus | null> => {
    if (!state.isServiceWorkerReady) return null;

    try {
      const channel = new MessageChannel();
      
      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          if (event.data.success) {
            setState(prev => ({ ...prev, cacheStatus: event.data.status }));
            resolve(event.data.status);
          } else {
            resolve(null);
          }
        };
        
        navigator.serviceWorker.controller?.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [channel.port2]
        );
      });
    } catch (error) {
      console.error('Error obteniendo estado del cache:', error);
      return null;
    }
  }, [state.isServiceWorkerReady]);

  // Limpiar acciones pendientes manualmente
  const clearPendingActions = useCallback(() => {
    console.log('🧹 Limpiando acciones pendientes manualmente');
    setState(prev => ({ ...prev, pendingActions: [] }));
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pendingActions');
    }
  }, []);

  // Sincronizar automáticamente - MEJORADO
  useEffect(() => {
    if (!state.isOnline) return;

    const interval = setInterval(() => {
      // Verificar acciones en localStorage directamente
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('pendingActions');
        if (stored) {
          try {
            const actions = JSON.parse(stored);
            if (actions.length > 0) {
              console.log('⏰ Sincronización automática programada - acciones en localStorage:', actions.length);
              syncPendingActions();
            }
          } catch (error) {
            console.error('Error verificando localStorage en intervalo:', error);
          }
        }
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [state.isOnline, syncPendingActions]);

  return {
    ...state,
    addPendingAction,
    syncPendingActions,
    cacheCompetition,
    clearCache,
    getCacheStatus,
    clearPendingActions,
  };
}

// Hook para uso en componentes que necesitan funcionalidad offline
export function useOfflineCapable() {
  const offline = useOffline();
  
  const executeOfflineCapable = useCallback(async (
    action: () => Promise<any>,
    fallbackAction?: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>
  ) => {
    if (offline.isOnline) {
      try {
        const result = await action();
        console.log('✅ Acción ejecutada online exitosamente');
        return result;
      } catch (error) {
        console.error('❌ Error ejecutando acción online:', error);
        // Si falla estando online, agregar a cola offline
        if (fallbackAction) {
          console.log('💾 Guardando acción como pendiente por error online');
          offline.addPendingAction(fallbackAction);
        }
        throw error;
      }
    } else {
      // Si está offline, agregar directamente a cola
      if (fallbackAction) {
        console.log('📴 Guardando acción offline');
        offline.addPendingAction(fallbackAction);
        return Promise.resolve(null);
      } else {
        throw new Error('No hay conexión y no se proporcionó acción de respaldo');
      }
    }
  }, [offline]);

  return {
    ...offline,
    executeOfflineCapable,
  };
}