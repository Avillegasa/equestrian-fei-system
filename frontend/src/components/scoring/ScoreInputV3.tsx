'use client';

// frontend/src/components/scoring/ScoreInputV3.tsx - CON TOASTS DIRECTOS

import React, { useState, useEffect } from 'react';
import { useOfflineCapable } from '@/hooks/useOffline';
import { toast } from 'react-hot-toast';

interface ScoreInputV3Props {
  participantId: string;
  judgeId: string;
  evaluationId: string;
  currentScore?: number;
  onScoreChange?: (score: number) => void;
  readonly?: boolean;
}

export function ScoreInputV3({ 
  participantId, 
  judgeId, 
  evaluationId, 
  currentScore = 0,
  onScoreChange,
  readonly = false 
}: ScoreInputV3Props) {
  const { executeOfflineCapable, isOnline } = useOfflineCapable();
  const [score, setScore] = useState<number>(currentScore);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fix hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setScore(currentScore);
  }, [currentScore]);

  const handleScoreUpdate = async (newScore: number) => {
    if (readonly) return;
    
    if (newScore < 0 || newScore > 10 || (newScore * 2) % 1 !== 0) {
      return;
    }

    setScore(newScore);

    try {
      await executeOfflineCapable(
        // Acción online
        async () => {
          const response = await fetch('/api/scores/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participant_id: participantId,
              judge_id: judgeId,
              evaluation_id: evaluationId,
              score: newScore,
            }),
          });

          if (!response.ok) {
            throw new Error(`Error ${response.status}`);
          }

          const result = await response.json();
          onScoreChange?.(newScore);
          
          // TOAST DIRECTO: Calificación actualizada online
          toast.success('✅ Calificación actualizada', {
            position: 'top-right',
            duration: 3000,
            style: {
              background: '#10B981',
              color: 'white',
              fontWeight: '500'
            }
          });
          
          return result;
        },
        // Acción offline
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

      // Si estamos offline
      if (!isOnline) {
        // TOAST DIRECTO: Calificación guardada offline
        toast.success('✅ Calificación actualizada (offline)', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#F59E0B',
            color: 'white',
            fontWeight: '500'
          }
        });
      }

    } catch (error) {
      console.error('Error guardando puntuación:', error);
      setScore(currentScore);
      
      toast.error('❌ Error guardando calificación', {
        position: 'top-right',
        duration: 3000
      });
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

  // Loading inicial
  if (!isHydrated) {
    return (
      <div className="relative">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Puntuación FEI
        </label>
        <input
          type="number"
          value={score}
          disabled
          className="w-20 px-3 py-2 text-center border border-gray-300 rounded-md font-mono text-lg font-bold bg-white"
          style={{ color: '#000000', fontWeight: '700' }}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* SOLO EL LABEL SIMPLE */}
      <label className="text-sm font-medium text-gray-700 block mb-2">
        Puntuación FEI
      </label>

      {/* Input limpio */}
      <div className="flex items-center space-x-2">
        <input
          type="number"
          step="0.5"
          min="0"
          max="10"
          value={score}
          onChange={handleInputChange}
          disabled={readonly}
          className="score-input-v3 w-20 px-3 py-2 text-center border border-gray-300 rounded-md font-mono text-lg font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          style={{ 
            color: '#000000', 
            fontWeight: '700',
            backgroundColor: '#ffffff'
          }}
        />
        
        {/* Botones de incremento */}
        <div className="flex flex-col">
          <button
            onClick={() => incrementScore(0.5)}
            disabled={readonly || score >= 10}
            className="px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-t disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +0.5
          </button>
          <button
            onClick={() => incrementScore(-0.5)}
            disabled={readonly || score <= 0}
            className="px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-b disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -0.5
          </button>
        </div>
      </div>

      {/* Info simple */}
      <div className="mt-1 text-xs text-gray-500">
        Valor actual: {score.toFixed(1)}
      </div>
    </div>
  );
}