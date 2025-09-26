/**
 * Componente para resolución manual de conflictos
 * Permite al usuario resolver conflictos de sincronización
 */

import React, { useState, useEffect } from 'react';
import { useOffline } from '../../hooks/useOffline';

const ConflictResolver = ({ conflictId, conflict, onResolve, onCancel }) => {
  const { resolveConflict, autoResolveConflict } = useOffline();
  const [selectedStrategy, setSelectedStrategy] = useState('last_write_wins');
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [manualData, setManualData] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (conflict?.resolved_data) {
      setManualData(JSON.stringify(conflict.resolved_data, null, 2));
    } else if (conflict?.client_data) {
      setManualData(JSON.stringify(conflict.client_data, null, 2));
    }
  }, [conflict]);

  const strategies = [
    {
      value: 'server_wins',
      label: 'Mantener datos del servidor',
      description: 'Se mantendrán los datos actuales del servidor',
      icon: '🏢'
    },
    {
      value: 'client_wins',
      label: 'Usar datos locales',
      description: 'Se usarán los datos modificados localmente',
      icon: '📱'
    },
    {
      value: 'last_write_wins',
      label: 'Última modificación gana',
      description: 'Se usará el dato modificado más recientemente',
      icon: '⏰'
    },
    {
      value: 'merge',
      label: 'Fusionar automáticamente',
      description: 'Intentar combinar ambos conjuntos de datos',
      icon: '🔄'
    },
    {
      value: 'manual_resolution',
      label: 'Resolución manual',
      description: 'Editar manualmente los datos finales',
      icon: '✏️'
    }
  ];

  const handleStrategyChange = (strategy) => {
    setSelectedStrategy(strategy);
    setShowManualEditor(strategy === 'manual_resolution');
  };

  const handleAutoResolve = async () => {
    if (selectedStrategy === 'manual_resolution') {
      setShowManualEditor(true);
      return;
    }

    try {
      setIsResolving(true);
      await autoResolveConflict(conflictId, selectedStrategy);
      onResolve?.({ strategy: selectedStrategy, auto: true });
    } catch (error) {
      console.error('Error auto-resolviendo conflicto:', error);
      alert('Error resolviendo conflicto: ' + error.message);
    } finally {
      setIsResolving(false);
    }
  };

  const handleManualResolve = async () => {
    try {
      setIsResolving(true);

      // Validar JSON
      let resolvedData;
      try {
        resolvedData = JSON.parse(manualData);
      } catch (error) {
        alert('Los datos JSON no son válidos: ' + error.message);
        return;
      }

      await resolveConflict(conflictId, {
        strategy: 'manual_resolution',
        resolvedData,
        notes: resolutionNotes
      });

      onResolve?.({
        strategy: 'manual_resolution',
        auto: false,
        resolvedData,
        notes: resolutionNotes
      });
    } catch (error) {
      console.error('Error resolviendo conflicto manualmente:', error);
      alert('Error resolviendo conflicto: ' + error.message);
    } finally {
      setIsResolving(false);
    }
  };

  const formatData = (data) => {
    if (!data) return 'Sin datos';
    return JSON.stringify(data, null, 2);
  };

  if (!conflict) {
    return (
      <div className="p-4 text-center text-gray-500">
        No se encontró información del conflicto
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Resolver Conflicto de Sincronización
            </h3>
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
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Información del conflicto */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h4 className="font-medium text-yellow-800">Conflicto detectado</h4>
            </div>
            <p className="text-sm text-yellow-700">
              Los datos locales difieren de los datos del servidor.
              Campos en conflicto: <strong>{conflict.conflict_fields?.join(', ') || 'Múltiples campos'}</strong>
            </p>
          </div>

          {/* Comparación de datos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Datos del servidor */}
            <div className="border border-gray-200 rounded-lg">
              <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                <h4 className="font-medium text-blue-900 flex items-center">
                  🏢 Datos del servidor
                </h4>
              </div>
              <div className="p-4">
                <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto max-h-64">
                  {formatData(conflict.server_data)}
                </pre>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="border border-gray-200 rounded-lg">
              <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
                <h4 className="font-medium text-green-900 flex items-center">
                  📱 Datos locales
                </h4>
              </div>
              <div className="p-4">
                <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto max-h-64">
                  {formatData(conflict.client_data)}
                </pre>
              </div>
            </div>
          </div>

          {/* Estrategias de resolución */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">
              Seleccionar estrategia de resolución:
            </h4>
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <label
                  key={strategy.value}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStrategy === strategy.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="strategy"
                    value={strategy.value}
                    checked={selectedStrategy === strategy.value}
                    onChange={(e) => handleStrategyChange(e.target.value)}
                    className="mt-1 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{strategy.icon}</span>
                      <span className="font-medium text-gray-900">
                        {strategy.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {strategy.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Editor manual */}
          {showManualEditor && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">
                Editar datos manualmente:
              </h4>
              <textarea
                value={manualData}
                onChange={(e) => setManualData(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="Ingrese los datos JSON finales..."
              />
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de resolución (opcional):
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  rows="3"
                  placeholder="Explique la razón de esta resolución..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isResolving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          {showManualEditor ? (
            <button
              onClick={handleManualResolve}
              disabled={isResolving || !manualData.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isResolving ? 'Resolviendo...' : 'Aplicar resolución manual'}
            </button>
          ) : (
            <button
              onClick={handleAutoResolve}
              disabled={isResolving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isResolving ? 'Resolviendo...' : 'Resolver automáticamente'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConflictResolver;