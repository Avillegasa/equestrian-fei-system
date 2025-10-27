import { useEffect, useState } from 'react';
import useOffline from '../hooks/useOffline';

/**
 * Indicador visual de estado offline/online con sincronización
 */
const OfflineIndicator = () => {
  const {
    isOnline,
    isOffline,
    wasOffline,
    pendingCount,
    syncStatus,
    forceSync
  } = useOffline();

  const [showIndicator, setShowIndicator] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mostrar indicador cuando está offline o hay datos pendientes
  useEffect(() => {
    if (isOffline || (wasOffline && syncStatus !== 'idle')) {
      setShowIndicator(true);
    } else if (isOnline && syncStatus === 'idle' && !wasOffline) {
      // Ocultar después de un delay cuando vuelve a estar online
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, isOnline, wasOffline, syncStatus]);

  // Mostrar mensaje de éxito después de sincronizar
  useEffect(() => {
    if (syncStatus === 'success') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  if (!showIndicator && !showSuccess) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
      {/* Indicador de Offline */}
      {isOffline && (
        <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3 animate-pulse">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <div>
            <p className="font-bold text-sm">Modo Offline</p>
            <p className="text-xs opacity-90">
              Los datos se guardarán localmente
            </p>
          </div>
        </div>
      )}

      {/* Indicador de Sincronización */}
      {isOnline && pendingCount > 0 && syncStatus === 'syncing' && (
        <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3">
          <svg
            className="w-6 h-6 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <div>
            <p className="font-bold text-sm">Sincronizando...</p>
            <p className="text-xs opacity-90">
              {pendingCount} elementos pendientes
            </p>
          </div>
        </div>
      )}

      {/* Indicador de Datos Pendientes */}
      {isOnline && pendingCount > 0 && syncStatus === 'idle' && (
        <div className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-2xl">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-bold text-sm">Datos sin sincronizar</p>
                <p className="text-xs opacity-90">
                  {pendingCount} elementos esperando
                </p>
              </div>
            </div>
            <button
              onClick={forceSync}
              className="bg-white text-yellow-600 px-3 py-1 rounded-md text-xs font-medium hover:bg-yellow-50 transition-colors"
            >
              Sincronizar
            </button>
          </div>
        </div>
      )}

      {/* Mensaje de Éxito */}
      {showSuccess && (
        <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3 animate-bounce-short">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-bold text-sm">Sincronización Completa</p>
            <p className="text-xs opacity-90">
              Todos los datos están actualizados
            </p>
          </div>
        </div>
      )}

      {/* Error de Sincronización */}
      {syncStatus === 'error' && (
        <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-bold text-sm">Error de Sincronización</p>
                <p className="text-xs opacity-90">
                  No se pudieron sincronizar los datos
                </p>
              </div>
            </div>
            <button
              onClick={forceSync}
              className="bg-white text-red-600 px-3 py-1 rounded-md text-xs font-medium hover:bg-red-50 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
