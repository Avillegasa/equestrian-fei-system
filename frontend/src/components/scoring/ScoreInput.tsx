'use client';

// frontend/src/components/scoring/ScoreInput.tsx

import React, { useState, useEffect } from 'react';
import { useOfflineCapable } from '@/hooks/useOffline';
import { toast } from 'react-hot-toast';

interface ScoreInputProps {
  participantId: string;
  judgeId: string;
  evaluationId: string;
  currentScore?: number;
  onScoreChange?: (score: number) => void;
  readonly?: boolean;
}

export function ScoreInput({ 
  participantId, 
  judgeId, 
  evaluationId, 
  currentScore = 0,
  onScoreChange,
  readonly = false 
}: ScoreInputProps) {
  const { executeOfflineCapable, isOnline, pendingActions } = useOfflineCapable();
  const [score, setScore] = useState<number>(currentScore);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Verificar si hay cambios pendientes para esta evaluación
  const hasPendingChanges = mounted && pendingActions.some(action => 
    action.type === 'score_update' && 
    action.data.participant_id === participantId &&
    action.data.judge_id === judgeId &&
    action.data.scores[evaluationId]
  );

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setScore(currentScore);
    setHasLocalChanges(false);
  }, [currentScore]);

  const handleScoreUpdate = async (newScore: number) => {
    if (readonly) return;
    
    // Validar rango de puntuación FEI (0-10 en incrementos de 0.5)
    if (newScore < 0 || newScore > 10 || (newScore * 2) % 1 !== 0) {
      toast.error('La puntuación debe estar entre 0 y 10 en incrementos de 0.5');
      return;
    }

    setScore(newScore);
    setIsLoading(true);
    setHasLocalChanges(true);

    try {
      await executeOfflineCapable(
        // Acción online - llamada a la API
        async () => {
          const response = await fetch('/api/scores/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              participant_id: participantId,
              judge_id: judgeId,
              evaluation_id: evaluationId,
              score: newScore,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
          }

          const result = await response.json();
          setHasLocalChanges(false);
          onScoreChange?.(newScore);
          
          if (isOnline) {
            toast.success('Puntuación guardada correctamente');
          }
          
          return result;
        },
        // Acción offline de respaldo
        {
          type: 'score_update',
          data: {
            participant_id: participantId,
            judge_id: judgeId,
            scores: {
              [evaluationId]: {
                value: newScore,
                timestamp: new Date().toISOString()
              }
            }
          }
        }
      );

      if (!isOnline) {
        toast.success('Puntuación guardada offline - se sincronizará automáticamente');
      }

    } catch (error) {
      console.error('Error guardando puntuación:', error);
      toast.error('Error guardando puntuación');
      setScore(currentScore); // Revertir al valor anterior
      setHasLocalChanges(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newScore = parseFloat(event.target.value) || 0;
    handleScoreUpdate(newScore);
  };

  const incrementScore = (increment: number) => {
    const newScore = Math.min(10, Math.max(0, score + increment));
    handleScoreUpdate(newScore);
  };

  // Clases estáticas para evitar hydration mismatch
  const inputClasses = `
    score-input w-20 px-3 py-2 text-center border rounded-md font-mono text-lg font-bold 
    transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50
    ${readonly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${mounted && (hasLocalChanges || hasPendingChanges) ? 'border-yellow-400 bg-yellow-50 score-input-pending' : 'border-gray-300'}
  `.trim();

  return (
    <div className="relative">
      {/* Indicador de estado */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          Puntuación FEI
        </label>
        
        {/* Indicadores de estado - solo después de mount */}
        {mounted && (
          <div className="flex items-center space-x-2">
            {/* Estado de conexión */}
            <div className="flex items-center space-x-1">
              <div 
                className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} 
                title={isOnline ? 'Online' : 'Offline'}
              />
              <span className={`text-xs font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Indicador de cambios pendientes */}
            {(hasLocalChanges || hasPendingChanges) && (
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded-full bg-yellow-500" title="Cambios pendientes" />
                <span className="text-xs text-yellow-600">
                  {hasPendingChanges ? 'Pendiente sync' : 'Guardando...'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input de puntuación */}
      <div className="flex items-center space-x-2">
        {/* Botón decrementar */}
        <button
          onClick={() => incrementScore(-0.5)}
          disabled={readonly || isLoading || score <= 0}
          className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          -
        </button>

        {/* Campo de entrada */}
        <input
          type="number"
          min="0"
          max="10"
          step="0.5"
          value={score}
          onChange={handleInputChange}
          disabled={readonly || isLoading}
          className={inputClasses}
        />

        {/* Botón incrementar */}
        <button
          onClick={() => incrementScore(0.5)}
          disabled={readonly || isLoading || score >= 10}
          className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>

      {/* Indicadores de estado adicionales */}
      {mounted && (
        <div className="mt-2 text-xs text-gray-500">
          {!isOnline && (
            <div className="flex items-center space-x-1 text-orange-600">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Modo offline - cambios se sincronizarán automáticamente</span>
            </div>
          )}
          
          {isLoading && (
            <div className="flex items-center space-x-1 text-blue-600">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <span>Guardando...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}