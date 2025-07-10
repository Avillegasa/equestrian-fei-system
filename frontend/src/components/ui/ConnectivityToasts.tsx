'use client';

// frontend/src/components/ui/ConnectivityToasts.tsx

import { useEffect, useRef } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { toast } from 'react-hot-toast';

export function ConnectivityToasts() {
  const { isOnline, pendingActions, lastSyncTime } = useOffline();
  const wasOnlineRef = useRef(isOnline);
  const offlineToastId = useRef<string | null>(null);
  const syncingToastId = useRef<string | null>(null);
  const lastSyncRef = useRef(lastSyncTime);

  // Detectar cambios de conectividad
  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    
    if (wasOnline && !isOnline) {
      // Se fue offline
      console.log('🔴 Detectado: Se fue offline');
      
      // Descartar cualquier toast previo
      if (offlineToastId.current) {
        toast.dismiss(offlineToastId.current);
      }
      
      // Mostrar toast persistente de offline
      offlineToastId.current = toast('📵 Modo offline - Reestableciendo conexión...', {
        duration: Infinity, // Persistente
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: 'white',
          fontWeight: '500',
          minWidth: '300px'
        }
      });
      
    } else if (!wasOnline && isOnline) {
      // Volvió online
      console.log('🟢 Detectado: Volvió online, acciones pendientes:', pendingActions.length);
      
      // Cerrar toast de offline
      if (offlineToastId.current) {
        toast.dismiss(offlineToastId.current);
        offlineToastId.current = null;
      }
      
      if (pendingActions.length > 0) {
        // Hay datos para sincronizar
        syncingToastId.current = toast('🔄 Conexión restablecida - Sincronizando...', {
          duration: Infinity, // Persistente hasta que termine
          position: 'top-right',
          style: {
            background: '#F59E0B',
            color: 'white',
            fontWeight: '500',
            minWidth: '300px'
          }
        });
      } else {
        // No hay nada que sincronizar
        toast.success('🌐 Conexión restablecida', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: '500'
          }
        });
      }
    }

    wasOnlineRef.current = isOnline;
  }, [isOnline, pendingActions.length]);

  // Detectar cuando se completa la sincronización
  useEffect(() => {
    const currentSyncTime = lastSyncTime;
    const lastSync = lastSyncRef.current;

    // Si hay una nueva sincronización y no hay acciones pendientes
    if (currentSyncTime && 
        currentSyncTime !== lastSync && 
        pendingActions.length === 0 && 
        isOnline &&
        syncingToastId.current) {
      
      console.log('✅ Detectado: Sincronización completada');
      
      // Cerrar toast de sincronización
      toast.dismiss(syncingToastId.current);
      syncingToastId.current = null;
      
      // Mostrar éxito
      toast.success('✅ Datos guardados exitosamente', {
        position: 'top-right',
        duration: 4000,
        style: {
          background: '#10B981',
          color: 'white',
          fontWeight: '500'
        }
      });
    }

    lastSyncRef.current = currentSyncTime;
  }, [lastSyncTime, pendingActions.length, isOnline]);

  // Limpiar toasts al desmontar
  useEffect(() => {
    return () => {
      if (offlineToastId.current) {
        toast.dismiss(offlineToastId.current);
      }
      if (syncingToastId.current) {
        toast.dismiss(syncingToastId.current);
      }
    };
  }, []);

  return null; // Este componente no renderiza nada visible
}