import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncItems } from '../services/offlineService';

/**
 * Hook personalizado para detectar estado de conexión offline
 * y gestionar sincronización pendiente
 */
const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'

  // Detectar cambios en el estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      setIsOnline(true);
      setWasOffline(true); // Marca que estuvo offline

      // Intentar sincronización automática
      setTimeout(() => {
        syncPendingData();
      }, 1000);
    };

    const handleOffline = () => {
      console.log('📵 Modo offline activado');
      setIsOnline(false);
    };

    // Listeners de eventos de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cargar items pendientes de sincronización
  useEffect(() => {
    loadPendingSync();
  }, [isOnline]);

  // Cargar datos pendientes de sincronización desde IndexedDB
  const loadPendingSync = useCallback(async () => {
    try {
      const pending = await getPendingSyncItems();
      setPendingSync(pending);
      console.log(`📊 Items pendientes de sincronización: ${pending.length}`);
    } catch (error) {
      console.error('Error cargando items pendientes:', error);
    }
  }, []);

  // Sincronizar datos pendientes
  const syncPendingData = useCallback(async () => {
    if (!isOnline || pendingSync.length === 0) {
      return;
    }

    console.log('🔄 Iniciando sincronización de datos pendientes...');
    setSyncStatus('syncing');

    try {
      // Aquí se implementaría la lógica de sincronización real con el backend
      // Por ahora, simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000));

      // En producción, enviarías los datos al backend:
      // for (const item of pendingSync) {
      //   await api.post('/sync', item.data);
      //   await markAsSynced(item.id);
      // }

      console.log('✅ Sincronización completada');
      setSyncStatus('success');
      await loadPendingSync(); // Recargar la lista

      // Resetear estado después de 3 segundos
      setTimeout(() => {
        setSyncStatus('idle');
        setWasOffline(false);
      }, 3000);
    } catch (error) {
      console.error('❌ Error sincronizando datos:', error);
      setSyncStatus('error');

      // Resetear estado después de 5 segundos
      setTimeout(() => {
        setSyncStatus('idle');
      }, 5000);
    }
  }, [isOnline, pendingSync, loadPendingSync]);

  // Forzar sincronización manual
  const forceSync = useCallback(() => {
    console.log('🔄 Sincronización manual iniciada');
    syncPendingData();
  }, [syncPendingData]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    pendingSync,
    pendingCount: pendingSync.length,
    syncStatus,
    forceSync,
    hasPendingSync: pendingSync.length > 0
  };
};

export default useOffline;
