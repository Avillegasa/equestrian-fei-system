/**
 * Componente indicador de estado offline/online
 * Muestra el estado de conectividad y sincronización
 */

import React from 'react';
import { useOffline } from '../../hooks/useOffline';

const OfflineIndicator = ({ showDetails = false, className = '' }) => {
  const {
    isOnline,
    syncStatus,
    isSyncing,
    syncProgress,
    syncMessage,
    hasOfflineData,
    needsSync,
    manualSync
  } = useOffline();

  const getStatusColor = () => {
    if (isSyncing) return 'bg-yellow-500';
    if (!isOnline) return 'bg-red-500';
    if (needsSync) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (!isOnline) return 'Sin conexión';
    if (needsSync) return 'Pendiente sync';
    return 'En línea';
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }

    if (!isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636L5.636 18.364m0-12.728L18.364 18.364M8.111 16.89A4.5 4.5 0 109.89 15.11m6.222-6.222a4.5 4.5 0 01-6.222 6.222M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
          />
        </svg>
      );
    }

    if (needsSync) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.111 16.89A4.5 4.5 0 109.89 15.11m6.222-6.222a4.5 4.5 0 01-6.222 6.222M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
        />
      </svg>
    );
  };

  const handleSyncClick = async () => {
    if (!isOnline || isSyncing) return;

    try {
      await manualSync();
    } catch (error) {
      console.error('Error en sincronización manual:', error);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Indicador principal */}
      <div
        className={`flex items-center space-x-2 px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor()}`}
        title={syncMessage || getStatusText()}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>

        {/* Botón de sincronización manual */}
        {isOnline && needsSync && !isSyncing && (
          <button
            onClick={handleSyncClick}
            className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="Sincronizar ahora"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Detalles adicionales */}
      {showDetails && (
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {hasOfflineData && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
              <span>
                {syncStatus.totalOfflineData} elementos offline
              </span>
            </div>
          )}

          {syncStatus.pendingActions > 0 && (
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              <span>{syncStatus.pendingActions} pendientes</span>
            </div>
          )}
        </div>
      )}

      {/* Barra de progreso */}
      {isSyncing && syncProgress > 0 && (
        <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-24">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${syncProgress}%` }}
          ></div>
        </div>
      )}

      {/* Mensaje de sincronización */}
      {syncMessage && (
        <div className="text-sm text-gray-600 max-w-48 truncate">
          {syncMessage}
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;