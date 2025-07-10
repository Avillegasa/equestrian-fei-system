'use client';

// frontend/src/components/scoring/ScoreInputV3.tsx - VERSIÓN SUPER SIMPLE

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
  const { executeOfflineCapable, isOnline, pendingActions } = useOfflineCapable();
  const [score, setScore] = useState<number>(currentScore);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fix hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setScore(currentScore);
  }, [currentScore]);

  // SIMPLE: Solo verificar si hay acciones pendientes para esta evaluación
  const hasPendingForThisInput = pendingActions.some(action => {
    return action.type === 'score_update' && 
           action.data.participant_id === participantId &&
           action.data.judge_id === judgeId &&
           action.data.scores && 
           action.data.scores[evaluationId];
  });

  // FORCE RE-RENDER: Crear una key única basada en los estados
  const stateKey = `${isLoading}-${hasPendingForThisInput}-${isOnline}-${pendingActions.length}`;

  const handleScoreUpdate = async (newScore: number) => {
    if (readonly) return;
    
    if (newScore < 0 || newScore > 10 || (newScore * 2) % 1 !== 0) {
      toast.error('La puntuación debe estar entre 0 y 10 en incrementos de 0.5');
      return;
    }

    console.log(`🔄 ${evaluationId}: Actualizando de ${score} a ${newScore}`);
    
    setScore(newScore);
    setIsLoading(true);

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
          
          // SIMPLE: Limpiar loading inmediatamente si online
          setIsLoading(false);
          onScoreChange?.(newScore);
          toast.success('Puntuación guardada');
          
          console.log(`✅ ${evaluationId}: Guardado online exitoso`);
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

      // Si estamos offline, solo quitar loading
      if (!isOnline) {
        setIsLoading(false);
        toast.success('Guardado offline');
        console.log(`💾 ${evaluationId}: Guardado offline`);
      }

    } catch (error) {
      console.error(`❌ ${evaluationId}: Error:`, error);
      setScore(currentScore);
      setIsLoading(false);
      toast.error('Error guardando');
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newScore = parseFloat(event.target.value) || 0;
    handleScoreUpdate(newScore);
  };

  // Loading inicial
  if (!isHydrated) {
    return (
      <div className="relative">
        <label className="text-sm font-medium text-gray-700 block mb-2">Puntuación FEI</label>
        <input
          type="number"
          value={score}
          disabled
          className="w-20 px-3 py-2 text-center border border-gray-300 rounded-md font-mono text-lg font-bold bg-white text-black"
          style={{ color: '#000000', fontWeight: '700' }}
        />
      </div>
    );
  }

  // DETERMINAR ESTADO VISUAL - MUY SIMPLE
  const isPending = isLoading || hasPendingForThisInput;
  
  let statusText = 'Online';
  let statusColor = 'text-green-600';
  let dotColor = 'bg-green-500';
  let inputBg = 'bg-white';
  let borderColor = 'border-gray-300';

  if (!isOnline) {
    statusText = 'Offline';
    statusColor = 'text-red-600';
    dotColor = 'bg-red-500';
  }

  if (isLoading) {
    statusText = 'Guardando...';
    statusColor = 'text-yellow-600';
    dotColor = 'bg-yellow-500';
    inputBg = 'bg-yellow-50';
    borderColor = 'border-yellow-400';
  } else if (hasPendingForThisInput) {
    statusText = isOnline ? 'Sincronizando...' : 'Pendiente';
    statusColor = 'text-yellow-600';
    dotColor = 'bg-yellow-500';
    inputBg = 'bg-yellow-50';
    borderColor = 'border-yellow-400';
  }

  // FORZAR ESTILOS CON STYLE DIRECTO
  const inputStyle = {
    color: '#000000',
    fontWeight: '700',
    backgroundColor: isPending ? '#fefce8' : '#ffffff'
  };

  console.log(`🎨 ${evaluationId} RENDER:`, {
    stateKey,
    isPending,
    statusText,
    isLoading,
    hasPendingForThisInput,
    inputBg,
    style: inputStyle
  });

  return (
    <div className="relative" key={stateKey}>
      {/* Header con estado */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          Puntuación FEI
        </label>
        
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full ${dotColor}`}></div>
          <span className={`text-xs font-medium ${statusColor}`}>
            {statusText}
          </span>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center space-x-2">
        <input
          type="number"
          step="0.5"
          min="0"
          max="10"
          value={score}
          onChange={handleInputChange}
          disabled={readonly || isLoading}
          className={`score-input-v3 w-20 px-3 py-2 text-center border rounded-md font-mono text-lg font-bold focus:ring-2 focus:ring-blue-500 ${borderColor} ${inputBg}`}
          style={inputStyle}
        />
        
        <div className="flex flex-col">
          <button
            onClick={() => handleScoreUpdate(Math.min(10, score + 0.5))}
            disabled={readonly || isLoading || score >= 10}
            className="px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-t disabled:opacity-50"
          >
            +0.5
          </button>
          <button
            onClick={() => handleScoreUpdate(Math.max(0, score - 0.5))}
            disabled={readonly || isLoading || score <= 0}
            className="px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-b disabled:opacity-50"
          >
            -0.5
          </button>
        </div>
      </div>

      {/* Debug info */}
      <div className="mt-2 text-xs">
        <div className="text-gray-500">Valor: {score.toFixed(1)}</div>
        <div className="text-gray-400">
          loading: {isLoading.toString()}, pending: {hasPendingForThisInput.toString()}, online: {isOnline.toString()}
        </div>
        {isPending && (
          <div className="text-yellow-600 font-medium">
            🟡 FONDO AMARILLO ACTIVO - números en negro
          </div>
        )}
      </div>
    </div>
  );
}