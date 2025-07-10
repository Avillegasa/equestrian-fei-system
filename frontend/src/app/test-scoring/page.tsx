'use client';

// frontend/src/app/test-scoring/page.tsx

import React, { useState } from 'react';
import { ScoreInput } from '@/components/scoring/ScoreInput';
import { useOffline } from '@/hooks/useOffline';
import { Wifi, WifiOff, Database, Users, Award } from 'lucide-react';

export default function TestScoringPage() {
  const { isOnline, pendingActions, lastSyncTime } = useOffline();
  const [testScores, setTestScores] = useState<Record<string, number>>({
    'movement_1': 7.5,
    'movement_2': 8.0,
    'movement_3': 6.5,
    'movement_4': 0,
    'movement_5': 0,
  });

  const mockParticipants = [
    { id: '1', name: 'Ana García', horse: 'Thunder' },
    { id: '2', name: 'Carlos López', horse: 'Stella' },
    { id: '3', name: 'María Rodríguez', horse: 'Apollo' },
  ];

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

  return (
    <>
      {/* CSS de respaldo inline para offline */}
      <style jsx>{`
        .test-container {
          min-height: 100vh;
          background-color: #ffffff;
          padding: 2rem 0;
        }
        .test-wrapper {
          max-width: 56rem;
          margin: 0 auto;
          padding: 0 1rem;
        }
        .test-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) {
          .test-grid {
            grid-template-columns: 1fr 2fr;
          }
        }
        .test-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .test-instructions {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        .test-movement {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .test-summary {
          background: #f9fafb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1.5rem;
        }
        .test-pending {
          background: #fefce8;
          border: 1px solid #fde047;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1.5rem;
        }
      `}</style>
      
      <div className="test-container min-h-screen bg-white py-8">
        <div className="test-wrapper container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="test-card bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🧪 Test de Calificaciones Offline
              </h1>
              <p className="text-gray-600">
                Prueba el sistema de calificaciones con funcionalidad offline
              </p>
            </div>
            
            {/* Estado de conexión */}
            <div className="mt-4 sm:mt-0 flex flex-col items-end space-y-2" style={{marginTop: '1rem'}}>
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-500" style={{width: '1.25rem', height: '1.25rem', color: '#10b981'}} />
                    <span className="text-green-600 font-medium" style={{color: '#059669', fontWeight: '500'}}>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-500" style={{width: '1.25rem', height: '1.25rem', color: '#ef4444'}} />
                    <span className="text-red-600 font-medium" style={{color: '#dc2626', fontWeight: '500'}}>Offline</span>
                  </>
                )}
              </div>
              
              {pendingActions.length > 0 && (
                <div className="flex items-center space-x-1 text-sm">
                  <Database className="w-4 h-4 text-yellow-500" style={{width: '1rem', height: '1rem', color: '#eab308'}} />
                  <span className="text-yellow-600" style={{color: '#ca8a04', fontSize: '0.875rem'}}>
                    {pendingActions.length} pendientes
                  </span>
                </div>
              )}
              
              {lastSyncTime && (
                <div className="text-xs text-gray-500" style={{fontSize: '0.75rem', color: '#6b7280'}}>
                  Última sync: {lastSyncTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="test-instructions bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2" style={{fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem'}}>
            📋 Instrucciones de prueba:
          </h3>
          <ol className="text-sm text-blue-800 space-y-1" style={{fontSize: '0.875rem', color: '#1e40af'}}>
            <li style={{marginBottom: '0.25rem'}}><strong>1.</strong> Modifica las puntuaciones mientras estás <strong>online</strong></li>
            <li style={{marginBottom: '0.25rem'}}><strong>2.</strong> Activa el <strong>modo offline</strong> en DevTools (Application → Service Workers → Offline)</li>
            <li style={{marginBottom: '0.25rem'}}><strong>3.</strong> Modifica más puntuaciones y observa los indicadores</li>
            <li style={{marginBottom: '0.25rem'}}><strong>4.</strong> Desactiva el modo offline y observa la sincronización</li>
          </ol>
        </div>

        {/* Panel principal */}
        <div className="test-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de participantes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Participante de Prueba
            </h2>
            
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white">Ana García</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Caballo: Thunder</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Categoría: Intermedio I</p>
              </div>
            </div>
          </div>

          {/* Panel de calificaciones */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Calificaciones FEI
            </h2>
            
            <div className="space-y-4">
              {mockMovements.map((movement) => (
                <div key={movement.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {movement.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Coeficiente: {movement.coefficient}x
                      </p>
                    </div>
                  </div>
                  
                  <ScoreInput
                    participantId="1"
                    judgeId="judge-test"
                    evaluationId={movement.id}
                    currentScore={testScores[movement.id] || 0}
                    onScoreChange={(score) => handleScoreChange(movement.id, score)}
                  />
                </div>
              ))}
            </div>

            {/* Resumen de puntuación */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Puntos totales
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {maxPossibleScore}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Máximo posible
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Porcentaje
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de debugging offline */}
        {pendingActions.length > 0 && (
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              🔄 Acciones pendientes de sincronización:
            </h3>
            <div className="space-y-2">
              {pendingActions.map((action) => (
                <div key={action.id} className="text-sm font-mono bg-yellow-100 dark:bg-yellow-800/20 p-2 rounded">
                  <strong>Tipo:</strong> {action.type} | 
                  <strong> ID:</strong> {action.id.substring(0, 8)}... | 
                  <strong> Reintentos:</strong> {action.retryCount}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
);
}