'use client';

import React, { useState, useEffect } from 'react';
import { ScoreInputV3 } from '@/components/scoring/ScoreInputV3';
import { useOffline } from '@/hooks/useOffline';

export default function TestScoringPage() {
  const { isOnline, pendingActions, lastSyncTime } = useOffline();
  const [isHydrated, setIsHydrated] = useState(false);
  const [testScores, setTestScores] = useState<Record<string, number>>({
    'movement_1': 7.5,
    'movement_2': 8.0,
    'movement_3': 6.5,
    'movement_4': 0,
    'movement_5': 0,
  });

  // Fix hydration - Esperar montaje completo
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const mockMovements = [
    { id: 'movement_1', name: 'Entrada y Alto', coefficient: 1 },
    { id: 'movement_2', name: 'Paso Reunido', coefficient: 2 },
    { id: 'movement_3', name: 'Trote de Trabajo', coefficient: 1 },
    { id: 'movement_4', name: 'Galope Reunido', coefficient: 2 },
    { id: 'movement_5', name: 'Saludo Final', coefficient: 1 },
  ];

  const handleScoreChange = (movementId: string, newScore: number) => {
    setTestScores(prev => ({
      ...prev,
      [movementId]: newScore
    }));
  };

  const totalScore = mockMovements.reduce((total, movement) => {
    return total + (testScores[movement.id] || 0) * movement.coefficient;
  }, 0);

  const maxPossibleScore = mockMovements.reduce((total, movement) => {
    return total + 10 * movement.coefficient;
  }, 0);

  const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

  // Loading state durante hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando Test de Calificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                🏆 Test de Calificaciones Offline
                <span className={`ml-3 px-2 py-1 text-sm rounded-full ${
                  isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </h1>
              <p className="text-gray-600 mt-1">
                Prueba el sistema de calificaciones con funcionalidad offline
              </p>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones de prueba:</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li>Modifica las puntuaciones mientras estás online</li>
            <li>Activa el modo offline en DevTools (Application → Service Workers → Offline)</li>
            <li>Modifica más puntuaciones y observa los indicadores</li>
            <li>Desactiva el modo offline y observa la sincronización</li>
          </ol>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Información del participante */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Participante de Prueba</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Nombre:</span> Ana García</div>
              <div><span className="font-medium">Caballo:</span> Thunder</div>
              <div><span className="font-medium">Categoría:</span> Intermedio I</div>
            </div>
          </div>

          {/* Calificaciones totales */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Calificaciones FEI</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Puntuación Total:</span>
                <span className="font-mono font-bold text-lg text-black">
                  {totalScore.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Máximo Posible:</span>
                <span className="font-mono text-black">
                  {maxPossibleScore.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Porcentaje:</span>
                <span className="font-mono font-bold text-lg text-black">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Estado del sistema */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Estado del Sistema</h3>
            <div className="space-y-3">
              
              {/* Conectividad */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Conectividad:</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-xs font-medium ${
                    isOnline ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isOnline ? 'En línea' : 'Offline'}
                  </span>
                </div>
              </div>
              
              {/* Acciones pendientes */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Pendientes:</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    pendingActions.length > 0 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    {pendingActions.length} en cola
                  </span>
                </div>
              </div>
              
              {/* Última sincronización */}
              <div className="text-xs text-gray-500">
                Última sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Nunca'}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de movimientos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Movimientos y Calificaciones</h3>
            <p className="text-sm text-gray-600 mt-1">
              Los números deberían verse en NEGRO y en negrita. Fondo amarillo = cambios pendientes.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Movimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coeficiente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntuación FEI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos Totales
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockMovements.map((movement, index) => (
                  <tr key={movement.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{movement.name}</div>
                      <div className="text-sm text-gray-500">Movimiento #{index + 1}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {movement.coefficient}x
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ScoreInputV3
                        participantId="test_participant_001"
                        judgeId="test_judge_001"
                        evaluationId={movement.id}
                        currentScore={testScores[movement.id]}
                        onScoreChange={(newScore) => handleScoreChange(movement.id, newScore)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-bold text-black">
                        {((testScores[movement.id] || 0) * movement.coefficient).toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    TOTAL:
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-mono font-bold text-black">
                      {totalScore.toFixed(1)} / {maxPossibleScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Debug - Acciones pendientes */}
        {pendingActions.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-yellow-900">🔄 Acciones Pendientes de Sincronización:</h4>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    const { syncPendingActions } = useOffline();
                    syncPendingActions();
                  }}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!isOnline}
                >
                  Sincronizar Ahora
                </button>
                <button
                  onClick={() => {
                    const { clearPendingActions } = useOffline();
                    clearPendingActions();
                  }}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Limpiar Cola
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {pendingActions.map((action, index) => (
                <div key={index} className="text-sm text-yellow-800 font-mono bg-yellow-100 p-2 rounded">
                  <div><strong>Tipo:</strong> {action.type}</div>
                  <div><strong>ID:</strong> {action.id || 'N/A'}</div>
                  <div><strong>Reintentos:</strong> {action.retryCount || 0}</div>
                  <div><strong>Datos:</strong> {JSON.stringify(action.data, null, 2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nota importante */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">⚠️ Prueba de Visibilidad:</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>✅ CORRECTO:</strong> Números en <span className="font-mono font-bold text-black">NEGRO y NEGRITA</span>
            </p>
            <p>
              <strong>❌ PROBLEMA:</strong> Si los números se ven grises, borrosos o invisibles
            </p>
            <p>
              <strong>🟡 CAMBIOS PENDIENTES:</strong> Fondo amarillo con números aún en negro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}