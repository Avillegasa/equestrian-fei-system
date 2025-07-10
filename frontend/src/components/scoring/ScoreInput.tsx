// frontend/src/components/scoring/ScoreInput.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useOfflineCapable } from '@/hooks/useOffline';
import { Wifi, WifiOff, Save, AlertCircle } from 'lucide-react';
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
  const [isClient, setIsClient] = useState(false);

  // Verificar si hay cambios pendientes para esta evaluación
  const hasPendingChanges = isClient && pendingActions.some(action => 
    action.type === 'score_update' && 
    action.data.participant_id === participantId &&
    action.data.judge_id === judgeId &&
    action.data.scores[evaluationId]
  );

  // Fix hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setScore(currentScore);
    setHasLocalChanges(false);
  }, [currentScore]);

  // Clases CSS estáticas para evitar hydration mismatch
  const baseClasses = "w-20 px-3 py-2 text-center border rounded-md font-mono text-lg font-bold transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50";
  
  const getInputClasses = () => {
    if (!isClient) {
      // SSR: clases básicas sin estados dinámicos
      return `${baseClasses} bg-white border-gray-300 text-black`;
    }
    
    // Cliente: clases dinámicas solo después de hidratación
    if (readonly) {
      return `${baseClasses} bg-gray-100 cursor-not-allowed text-gray-500`;
    }
    
    if (hasLocalChanges || hasPendingChanges) {
      return `${baseClasses} border-yellow-400 text-yellow-800 bg-yellow-50`;
    }
    
    return `${baseClasses} bg-white border-gray-300 text-black`;
  };

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
            throw new Error('Error actualizando puntuación');
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

  return (
    <div className="relative">
      {/* Indicador de estado */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Puntuación FEI
        </label>
        <div className="flex items-center space-x-2">
          {/* Estado de conexión */}
          {isClient && (
            <>
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-orange-500" />
              )}
            </>
          )}
          
          {/* Indicador de cambios pendientes */}
          {isClient && (hasLocalChanges || hasPendingChanges) && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                {hasPendingChanges ? 'Pendiente sync' : 'Guardando...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Input de puntuación */}
      <div className="flex items-center space-x-2">
        {/* Botón decrementar */}
        <button
          onClick={() => incrementScore(-0.5)}
          disabled={readonly || isLoading || score <= 0}
          className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          className={getInputClasses()}
        />

        {/* Botón incrementar */}
        <button
          onClick={() => incrementScore(0.5)}
          disabled={readonly || isLoading || score >= 10}
          className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>

      {/* Indicadores de estado adicionales */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {isClient && !isOnline && (
          <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
            <WifiOff className="w-3 h-3" />
            <span>Modo offline - cambios se sincronizarán automáticamente</span>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
            <Save className="w-3 h-3 animate-pulse" />
            <span>Guardando...</span>
          </div>
        )}
      </div>
    </div>
  );
}