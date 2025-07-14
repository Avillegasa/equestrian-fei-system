// frontend/src/hooks/usePremiumScoring.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  ScoringSessionPremium,
  ParticipantPremium,
  EvaluationParameterPremium,
  ScoreEntryPremium,
  ScoringHookOptions,
  ScoreValidationResult,
  ScoringEvent
} from '@/types/scoring-premium';

interface UsePremiumScoringProps {
  sessionId: number;
  options?: ScoringHookOptions;
}

interface ScoringState {
  session: ScoringSessionPremium | null;
  currentParticipantIndex: number;
  currentParameterIndex: number;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: string | null;
  syncStatus: 'synced' | 'pending' | 'error';
  offlineMode: boolean;
}

export function usePremiumScoring({ 
  sessionId, 
  options = {} 
}: UsePremiumScoringProps) {
  const queryClient = useQueryClient();
  const autoSaveTimer = useRef<NodeJS.Timeout>();
  const eventListeners = useRef<((event: ScoringEvent) => void)[]>([]);

  // Estado principal
  const [state, setState] = useState<ScoringState>({
    session: null,
    currentParticipantIndex: 0,
    currentParameterIndex: 0,
    isLoading: false,
    isSaving: false,
    hasUnsavedChanges: false,
    lastSaved: null,
    syncStatus: 'synced',
    offlineMode: false
  });

  // Cache temporal para cambios no guardados
  const [pendingScores, setPendingScores] = useState<Map<string, ScoreEntryPremium>>(new Map());

  // Query para obtener la sesión de calificación
  const { data: session, isLoading: sessionLoading, error } = useQuery({
    queryKey: ['scoring-session', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/scoring/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Error al cargar la sesión');
      return response.json() as ScoringSessionPremium;
    },
    staleTime: 30000, // 30 segundos
    gcTime: 300000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchInterval: options.real_time_updates ? 10000 : false, // Cada 10s si está habilitado
  });

  // Mutation para guardar puntuaciones
  const saveScoreMutation = useMutation({
    mutationFn: async (scoreData: Partial<ScoreEntryPremium>) => {
      const response = await fetch(`/api/scoring/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData)
      });
      if (!response.ok) throw new Error('Error al guardar puntuación');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Actualizar cache local
      queryClient.invalidateQueries({ queryKey: ['scoring-session', sessionId] });
      
      // Limpiar pending scores
      const key = `${variables.participant_id}-${variables.parameter_id}`;
      setPendingScores(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });

      setState(prev => ({ 
        ...prev, 
        hasUnsavedChanges: false, 
        lastSaved: new Date().toISOString(),
        syncStatus: 'synced'
      }));

      // Emitir evento
      emitEvent({
        type: 'SCORE_UPDATED',
        payload: data
      });

      toast.success('Puntuación guardada correctamente');
    },
    onError: (error) => {
      setState(prev => ({ ...prev, syncStatus: 'error' }));
      toast.error('Error al guardar: ' + error.message);
    }
  });

  // Validación de puntuaciones
  const validateScore = useCallback((
    score: number, 
    parameter: EvaluationParameterPremium
  ): ScoreValidationResult => {
    const result: ScoreValidationResult = {
      is_valid: true,
      warnings: [],
      errors: [],
      needs_justification: false,
      suggested_actions: []
    };

    // Validar rango
    if (score < 0 || score > parameter.max_score) {
      result.is_valid = false;
      result.errors.push(`La puntuación debe estar entre 0 y ${parameter.max_score}`);
    }

    // Validar incrementos de 0.5
    if (score % 0.5 !== 0) {
      result.is_valid = false;
      result.errors.push('La puntuación debe ser en incrementos de 0.5');
    }

    // Verificar si necesita justificación
    if (score <= 3.0 || score >= 8.5) {
      result.needs_justification = true;
      result.warnings.push('Esta puntuación requiere justificación según el reglamento FEI');
      result.suggested_actions.push('Proporcione una justificación detallada');
    }

    // Verificar consistencia (si hay puntuaciones previas)
    if (session) {
      const avgScore = calculateAverageScore(session.participants[state.currentParticipantIndex]);
      if (avgScore > 0 && Math.abs(score - avgScore) > 2.0) {
        result.warnings.push('Esta puntuación difiere significativamente del promedio del participante');
        result.suggested_actions.push('Verifique que la puntuación sea correcta');
      }
    }

    return result;
  }, [session, state.currentParticipantIndex]);

  // Función para calcular promedio de puntuaciones
  const calculateAverageScore = useCallback((participant: ParticipantPremium): number => {
    if (!session) return 0;
    
    const scores = session.evaluation_parameters
      .filter(p => p.is_scored && p.current_score !== undefined)
      .map(p => p.current_score!);
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }, [session]);

  // Auto-save functionality
  useEffect(() => {
    if (!options.auto_save || !state.hasUnsavedChanges) return;

    const interval = options.auto_save_interval || 30000; // 30 segundos por defecto
    
    autoSaveTimer.current = setTimeout(() => {
      saveAllPendingScores();
    }, interval);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [state.hasUnsavedChanges, options.auto_save, options.auto_save_interval]);

  // Función para guardar todas las puntuaciones pendientes
  const saveAllPendingScores = useCallback(async () => {
    if (pendingScores.size === 0) return;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      const promises = Array.from(pendingScores.values()).map(score => 
        saveScoreMutation.mutateAsync(score)
      );
      
      await Promise.all(promises);
      setPendingScores(new Map());
      
    } catch (error) {
      console.error('Error guardando puntuaciones:', error);
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  }, [pendingScores, saveScoreMutation]);

  // Función para actualizar puntuación
  const updateScore = useCallback((
    participantId: number,
    parameterId: number,
    score: number,
    justification?: string
  ) => {
    const parameter = session?.evaluation_parameters.find(p => p.id === parameterId);
    if (!parameter) return;

    // Validar puntuación
    const validation = validateScore(score, parameter);
    if (!validation.is_valid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Mostrar advertencias
    validation.warnings.forEach(warning => toast.warning(warning));

    // Crear entrada de puntuación
    const scoreEntry: ScoreEntryPremium = {
      participant_id: participantId,
      parameter_id: parameterId,
      score,
      justification,
      scored_at: new Date().toISOString(),
      judge_id: session?.judge_id || 0,
      is_final: !validation.needs_justification || Boolean(justification),
      revision_count: 0,
      weighted_score: score * parameter.coefficient,
      validation_status: validation.warnings.length > 0 ? 'warning' : 'valid',
      validation_messages: [...validation.warnings, ...validation.errors]
    };

    // Agregar a pending scores
    const key = `${participantId}-${parameterId}`;
    setPendingScores(prev => new Map(prev.set(key, scoreEntry)));
    
    setState(prev => ({ 
      ...prev, 
      hasUnsavedChanges: true,
      syncStatus: 'pending' 
    }));

    // Auto-guardar si está habilitado y no requiere justificación
    if (options.auto_save && scoreEntry.is_final) {
      saveScoreMutation.mutate(scoreEntry);
    }
  }, [session, validateScore, options.auto_save, saveScoreMutation]);

  // Navegación entre participantes
  const navigateToParticipant = useCallback((index: number) => {
    if (!session || index < 0 || index >= session.participants.length) return;

    const oldIndex = state.currentParticipantIndex;
    setState(prev => ({ ...prev, currentParticipantIndex: index }));

    emitEvent({
      type: 'PARTICIPANT_CHANGED',
      payload: { from: oldIndex, to: index }
    });
  }, [session, state.currentParticipantIndex]);

  // Navegación entre parámetros
  const navigateToParameter = useCallback((index: number) => {
    if (!session || index < 0 || index >= session.evaluation_parameters.length) return;

    const oldIndex = state.currentParameterIndex;
    setState(prev => ({ ...prev, currentParameterIndex: index }));

    emitEvent({
      type: 'PARAMETER_CHANGED',
      payload: { from: oldIndex, to: index }
    });
  }, [session, state.currentParameterIndex]);

  // Sistema de eventos
  const emitEvent = useCallback((event: ScoringEvent) => {
    eventListeners.current.forEach(listener => listener(event));
  }, []);

  const addEventListener = useCallback((listener: (event: ScoringEvent) => void) => {
    eventListeners.current.push(listener);
    
    return () => {
      eventListeners.current = eventListeners.current.filter(l => l !== listener);
    };
  }, []);

  // Funciones de utilidad
  const getCurrentParticipant = useCallback((): ParticipantPremium | null => {
    return session?.participants[state.currentParticipantIndex] || null;
  }, [session, state.currentParticipantIndex]);

  const getCurrentParameter = useCallback((): EvaluationParameterPremium | null => {
    return session?.evaluation_parameters[state.currentParameterIndex] || null;
  }, [session, state.currentParameterIndex]);

  const getCompletionStats = useCallback(() => {
    if (!session) return { completed: 0, total: 0, percentage: 0 };

    const completed = session.evaluation_parameters.filter(p => p.is_scored).length;
    const total = session.evaluation_parameters.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }, [session]);

  // Actualizar estado cuando cambie la sesión
  useEffect(() => {
    if (session) {
      setState(prev => ({ ...prev, session, isLoading: false }));
    }
  }, [session]);

  // Detectar modo offline
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, offlineMode: false }));
    const handleOffline = () => setState(prev => ({ ...prev, offlineMode: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    // Estado
    session,
    isLoading: sessionLoading || state.isLoading,
    isSaving: state.isSaving,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSaved: state.lastSaved,
    syncStatus: state.syncStatus,
    offlineMode: state.offlineMode,
    error,

    // Datos actuales
    currentParticipant: getCurrentParticipant(),
    currentParameter: getCurrentParameter(),
    currentParticipantIndex: state.currentParticipantIndex,
    currentParameterIndex: state.currentParameterIndex,

    // Estadísticas
    completionStats: getCompletionStats(),
    pendingScoresCount: pendingScores.size,

    // Acciones
    updateScore,
    navigateToParticipant,
    navigateToParameter,
    saveAllPendingScores,
    validateScore,

    // Sistema de eventos
    addEventListener,

    // Utilidades
    calculateAverageScore
  };
}