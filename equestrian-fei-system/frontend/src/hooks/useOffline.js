/**
 * Hook para manejo de funcionalidad offline
 * Proporciona estado de conectividad, sincronización y almacenamiento offline
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '../services/offlineService';
import { syncService } from '../services/syncService';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    pendingActions: 0,
    unsyncedScores: 0,
    totalOfflineData: 0,
    lastSyncAttempt: null
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [conflicts, setConflicts] = useState([]);

  // Actualizar estado de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Intentar sincronización automática al volver online
      if (!isSyncing) {
        autoSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSyncing]);

  // Obtener estadísticas offline
  const refreshSyncStatus = useCallback(async () => {
    try {
      const stats = await offlineService.getOfflineStats();
      setSyncStatus(stats);
      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas offline:', error);
      return null;
    }
  }, []);

  // Cargar estadísticas iniciales
  useEffect(() => {
    refreshSyncStatus();

    // Actualizar cada 30 segundos
    const interval = setInterval(refreshSyncStatus, 30000);
    return () => clearInterval(interval);
  }, [refreshSyncStatus]);

  // Sincronización automática
  const autoSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      setSyncMessage('Sincronizando automáticamente...');

      await offlineService.syncWhenOnline();
      await refreshSyncStatus();

      setSyncMessage('Sincronización automática completada');
    } catch (error) {
      console.error('Error en sincronización automática:', error);
      setSyncMessage('Error en sincronización automática');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(''), 3000);
    }
  }, [isOnline, isSyncing, refreshSyncStatus]);

  // Sincronización manual completa
  const manualSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('No hay conexión a internet');
    }

    try {
      setIsSyncing(true);
      setSyncProgress(0);
      setSyncMessage('Iniciando sincronización manual...');

      const deviceId = offlineService.deviceId;

      const result = await syncService.fullSync(deviceId, (message, progress) => {
        setSyncMessage(message);
        setSyncProgress(progress);
      });

      await refreshSyncStatus();

      setSyncMessage(`Sincronización completada: ${result.syncedCount} elementos`);
      return result;

    } catch (error) {
      console.error('Error en sincronización manual:', error);
      setSyncMessage(`Error: ${error.message}`);
      throw error;
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncMessage('');
        setSyncProgress(0);
      }, 5000);
    }
  }, [isOnline, refreshSyncStatus]);

  // Obtener conflictos pendientes
  const loadConflicts = useCallback(async () => {
    try {
      const conflictData = await syncService.getPendingConflicts();
      setConflicts(conflictData.results || []);
      return conflictData;
    } catch (error) {
      console.error('Error cargando conflictos:', error);
      return { results: [] };
    }
  }, []);

  // Resolver conflicto
  const resolveConflict = useCallback(async (conflictId, resolution) => {
    try {
      const result = await syncService.resolveConflict(conflictId, resolution);
      await loadConflicts(); // Recargar conflictos
      return result;
    } catch (error) {
      console.error('Error resolviendo conflicto:', error);
      throw error;
    }
  }, [loadConflicts]);

  // Auto-resolver conflicto
  const autoResolveConflict = useCallback(async (conflictId, strategy = 'last_write_wins') => {
    try {
      const result = await syncService.autoResolveConflict(conflictId, strategy);
      await loadConflicts(); // Recargar conflictos
      return result;
    } catch (error) {
      console.error('Error auto-resolviendo conflicto:', error);
      throw error;
    }
  }, [loadConflicts]);

  return {
    // Estado
    isOnline,
    syncStatus,
    isSyncing,
    syncProgress,
    syncMessage,
    conflicts,

    // Acciones
    refreshSyncStatus,
    manualSync,
    autoSync,
    loadConflicts,
    resolveConflict,
    autoResolveConflict,

    // Utilidades
    deviceId: offlineService.deviceId,
    hasOfflineData: syncStatus.totalOfflineData > 0,
    needsSync: syncStatus.pendingActions > 0 || syncStatus.unsyncedScores > 0
  };
};

export default useOffline;