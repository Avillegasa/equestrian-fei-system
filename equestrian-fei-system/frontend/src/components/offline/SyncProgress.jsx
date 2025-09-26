/**
 * Componente de progreso de sincronización
 * Muestra el progreso detallado de la sincronización
 */

import React from 'react';

const SyncProgress = ({
  isVisible = false,
  progress = 0,
  message = '',
  details = null,
  onCancel = null,
  showDetails = false
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Sincronizando datos
            </h3>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Mensaje actual */}
          {message && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 text-center">
                {message}
              </p>
            </div>
          )}

          {/* Icono de carga */}
          <div className="flex justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
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
          </div>

          {/* Detalles expandibles */}
          {showDetails && details && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Detalles de sincronización
              </h4>

              {details.sessionId && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Sesión:</span>
                  <span className="font-mono text-xs">
                    {details.sessionId.substring(0, 8)}...
                  </span>
                </div>
              )}

              {details.syncedCount !== undefined && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Sincronizados:</span>
                  <span className="text-green-600 font-medium">
                    {details.syncedCount}
                  </span>
                </div>
              )}

              {details.failedCount !== undefined && details.failedCount > 0 && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Fallidos:</span>
                  <span className="text-red-600 font-medium">
                    {details.failedCount}
                  </span>
                </div>
              )}

              {details.conflictCount !== undefined && details.conflictCount > 0 && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Conflictos:</span>
                  <span className="text-yellow-600 font-medium">
                    {details.conflictCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Los datos se guardan automáticamente durante el proceso
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncProgress;