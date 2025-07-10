'use client';

// frontend/src/components/ui/SmartNotifications.tsx

import React, { useEffect, useState, useRef } from 'react';
import { useOffline } from '@/hooks/useOffline';

interface Notification {
  id: string;
  type: 'success' | 'offline' | 'syncing';
  message: string;
  persistent?: boolean;
}

export function SmartNotifications() {
  const { isOnline, pendingActions, lastSyncTime } = useOffline();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const wasOnlineRef = useRef(isOnline);
  const lastPendingCountRef = useRef(pendingActions.length);
  const lastSyncRef = useRef(lastSyncTime);

  // Función para agregar notificación
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { ...notification, id };
    
    setNotifications(prev => {
      // Si es persistente, reemplazar cualquier notificación persistente anterior
      if (notification.persistent) {
        return [...prev.filter(n => !n.persistent), newNotification];
      }
      // Si no es persistente, agregar normalmente
      return [...prev, newNotification];
    });

    // Auto-remover notificaciones no persistentes después de 3 segundos
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 3000);
    }
  };

  // Remover notificación específica
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Detectar cuando se actualiza una calificación (se crea una acción pendiente)
  useEffect(() => {
    const currentPendingCount = pendingActions.length;
    const lastPendingCount = lastPendingCountRef.current;

    // Si aumentó el número de acciones pendientes = nueva calificación
    if (currentPendingCount > lastPendingCount) {
      addNotification({
        type: 'success',
        message: '✅ Calificación actualizada',
        persistent: false
      });
    }

    lastPendingCountRef.current = currentPendingCount;
  }, [pendingActions.length]);

  // Detectar cambios de conectividad
  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    
    if (wasOnline && !isOnline) {
      // Se fue offline
      addNotification({
        type: 'offline',
        message: '📵 Modo offline - Reestableciendo conexión...',
        persistent: true
      });
    } else if (!wasOnline && isOnline) {
      // Volvió online
      // Remover notificación de offline
      setNotifications(prev => prev.filter(n => n.type !== 'offline'));
      
      // Si hay acciones pendientes, mostrar sincronizando
      if (pendingActions.length > 0) {
        addNotification({
          type: 'syncing',
          message: '🔄 Conexión restablecida - Sincronizando...',
          persistent: true
        });
      } else {
        // No hay nada que sincronizar
        addNotification({
          type: 'success',
          message: '🌐 Conexión restablecida',
          persistent: false
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
    if (currentSyncTime && currentSyncTime !== lastSync && pendingActions.length === 0) {
      // Remover notificación de sincronizando
      setNotifications(prev => prev.filter(n => n.type !== 'syncing'));
      
      // Mostrar éxito
      addNotification({
        type: 'success',
        message: '✅ Datos guardados exitosamente',
        persistent: false
      });
    }

    lastSyncRef.current = currentSyncTime;
  }, [lastSyncTime, pendingActions.length]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            flex items-center justify-between min-w-80 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border
            ${notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : notification.type === 'offline'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }
            transform transition-all duration-300 ease-in-out
            animate-in slide-in-from-right
          `}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'syncing' && (
              <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            )}
            <span className="text-sm font-medium">
              {notification.message}
            </span>
          </div>
          
          {notification.persistent && (
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-3 text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}