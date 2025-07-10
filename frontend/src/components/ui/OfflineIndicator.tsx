'use client';

// frontend/src/components/ui/OfflineIndicator.tsx

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RotateCw, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
}

export function OfflineIndicator({ 
  showDetails = true, 
  position = 'top-right',
  compact = false 
}: OfflineIndicatorProps) {
  const {
    isOnline,
    isServiceWorkerReady,
    lastSyncTime,
    pendingActions,
    cacheStatus,
    syncPendingActions
  } = useOffline();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncPendingActions();
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (pendingActions.length > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (isSyncing) return <RotateCw className="w-4 h-4 animate-spin" />;
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (pendingActions.length > 0) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (!isOnline) return 'Sin conexión';
    if (pendingActions.length > 0) return `${pendingActions.length} pendientes`;
    return 'Sincronizado';
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (compact) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <div 
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm
            ${getStatusColor()} text-white cursor-pointer hover:opacity-90 transition-all
          `}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {getStatusIcon()}
          {!compact && <span className="text-sm font-medium">{getStatusText()}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Indicador Principal */}
      <div 
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm
          bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700
          cursor-pointer hover:shadow-xl transition-all duration-200
          ${isExpanded ? 'rounded-b-none' : ''}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {getStatusText()}
        </span>
        
        {pendingActions.length > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            {pendingActions.length}
          </span>
        )}
      </div>

      {/* Panel Expandido */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-lg shadow-lg p-4 min-w-80">
          <div className="space-y-4">
            {/* Header con botón cerrar */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">Estado de Sincronización</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Estado de Conexión */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Conexión</span>
                <div className="flex items-center space-x-1">
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Offline</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Service Worker</span>
                <div className="flex items-center space-x-1">
                  {isServiceWorkerReady ? (
                    <>
                      <Cloud className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Activo</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Inactivo</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones Pendientes */}
            {pendingActions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Acciones Pendientes
                  </span>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    {pendingActions.length}
                  </span>
                </div>
                
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {pendingActions.slice(0, 5).map((action) => (
                    <div 
                      key={action.id}
                      className="flex items-center justify-between text-xs p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {action.type.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {action.retryCount > 0 && `Reintento ${action.retryCount}`}
                      </span>
                    </div>
                  ))}
                  {pendingActions.length > 5 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{pendingActions.length - 5} más...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Última Sincronización */}
            {lastSyncTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Última sync</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {new Intl.DateTimeFormat('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }).format(lastSyncTime)}
                </span>
              </div>
            )}

            {/* Estado del Cache */}
            {cacheStatus && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Cache</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {cacheStatus.totalEntries} elementos
                </span>
              </div>
            )}

            {/* Acciones */}
            <div className="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {isOnline && pendingActions.length > 0 && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
              )}
              
              {!isOnline && (
                <div className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm rounded">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Modo Offline</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente simplificado para la barra de estado
export function OfflineStatusBar() {
  const { isOnline, pendingActions } = useOffline();

  if (isOnline && pendingActions.length === 0) {
    return null; // No mostrar nada si todo está bien
  }

  return (
    <div className={`
      w-full px-4 py-2 text-center text-sm font-medium
      ${!isOnline 
        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      }
    `}>
      {!isOnline ? (
        <div className="flex items-center justify-center space-x-1">
          <WifiOff className="w-4 h-4" />
          <span>Trabajando sin conexión - Los cambios se sincronizarán automáticamente</span>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{pendingActions.length} cambios pendientes de sincronización</span>
        </div>
      )}
    </div>
  );
}

// Hook para mostrar notificaciones de estado offline
export function useOfflineNotifications() {
  const { isOnline, pendingActions } = useOffline();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      setWasOffline(true);
      // Aquí puedes disparar una notificación toast
      console.log('Modo offline activado');
    } else if (isOnline && wasOffline) {
      setWasOffline(false);
      if (pendingActions.length > 0) {
        console.log(`Conexión restaurada. Sincronizando ${pendingActions.length} cambios...`);
      } else {
        console.log('Conexión restaurada');
      }
    }
  }, [isOnline, wasOffline, pendingActions.length]);

  return { wasOffline };
}