// frontend/src/app/offline/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { 
  WifiOff, 
  RefreshCw, 
  Clock, 
  Database, 
  AlertCircle,
  CheckCircle,
  Smartphone,
  Laptop,
  Monitor
} from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const {
    isOnline,
    isServiceWorkerReady,
    pendingActions,
    cacheStatus,
    getCacheStatus,
    syncPendingActions
  } = useOffline();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Redirigir si vuelve la conexión
  useEffect(() => {
    if (isOnline) {
      router.push('/');
    }
  }, [isOnline, router]);

  // Actualizar estado del cache al cargar
  useEffect(() => {
    getCacheStatus();
  }, [getCacheStatus]);

  const handleRetry = async () => {
    setIsRefreshing(true);
    setRetryCount(prev => prev + 1);
    
    // Simular intento de reconexión
    setTimeout(() => {
      setIsRefreshing(false);
      // Verificar conexión real
      if (navigator.onLine) {
        window.location.reload();
      }
    }, 2000);
  };

  const handleGoBack = () => {
    router.back();
  };

  const getDeviceIcon = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone/.test(userAgent)) {
      return <Smartphone className="w-8 h-8" />;
    } else if (/tablet|ipad/.test(userAgent)) {
      return <Laptop className="w-8 h-8" />;
    }
    return <Monitor className="w-8 h-8" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header con icono */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sin Conexión
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            No se puede conectar al servidor. Puedes seguir trabajando con los datos guardados.
          </p>
        </div>

        {/* Estado del dispositivo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            {getDeviceIcon()}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Modo Offline Activo
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tus cambios se guardarán y sincronizarán automáticamente
              </p>
            </div>
          </div>

          {/* Estado del Service Worker */}
          <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Service Worker</span>
            <div className="flex items-center space-x-1">
              {isServiceWorkerReady ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">Activo</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400">No disponible</span>
                </>
              )}
            </div>
          </div>

          {/* Datos en cache */}
          {cacheStatus && (
            <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Datos guardados</span>
              <div className="flex items-center space-x-1">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {cacheStatus.totalEntries} elementos
                </span>
              </div>
            </div>
          )}

          {/* Acciones pendientes */}
          {pendingActions.length > 0 && (
            <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cambios pendientes</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  {pendingActions.length} acciones
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Lista de acciones pendientes */}
        {pendingActions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cambios Pendientes de Sincronización
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingActions.map((action) => (
                <div 
                  key={action.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {action.retryCount > 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Reintento {action.retryCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sugerencias para el usuario */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            ¿Qué puedes hacer ahora?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Continúa trabajando normalmente, tus cambios se guardarán localmente</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Revisa las puntuaciones y participantes ya cargados</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Los datos se sincronizarán automáticamente cuando vuelva la conexión</span>
            </li>
            {!isServiceWorkerReady && (
              <li className="flex items-start space-x-2">
                <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                <span>Funcionalidad offline limitada sin Service Worker</span>
              </li>
            )}
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshing ? 'Verificando conexión...' : 'Intentar Reconectar'}
            </span>
          </button>

          <button
            onClick={handleGoBack}
            className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Volver a la Aplicación
          </button>
        </div>

        {/* Información técnica colapsible */}
        <details className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <summary className="px-6 py-4 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Información Técnica
          </summary>
          <div className="px-6 pb-4 text-xs text-gray-500 dark:text-gray-400 space-y-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <span>Navigator.onLine:</span>
              <span className={navigator.onLine ? 'text-green-600' : 'text-red-600'}>
                {navigator.onLine ? 'true' : 'false'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Service Worker:</span>
              <span className={isServiceWorkerReady ? 'text-green-600' : 'text-red-600'}>
                {isServiceWorkerReady ? 'Registrado' : 'No disponible'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>User Agent:</span>
              <span className="truncate ml-2">{navigator.userAgent}</span>
            </div>
            <div className="flex justify-between">
              <span>Intentos de reconexión:</span>
              <span>{retryCount}</span>
            </div>
            {cacheStatus && (
              <div className="flex justify-between">
                <span>Última actualización cache:</span>
                <span>{new Date(cacheStatus.lastUpdate).toLocaleString()}</span>
              </div>
            )}
          </div>
        </details>

        {/* Footer con tiempo desde la desconexión */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          La aplicación seguirá intentando reconectarse automáticamente
        </div>
      </div>
    </div>
  );
}