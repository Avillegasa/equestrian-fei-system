import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scoringAPI } from '@/lib/api/scoring';
import type {
  EvaluationParameter,
  ScoreEntry,
  ScoreEntryCreate,
  JudgeScorecard,
  JudgeEvaluation,
  Ranking,
  CompetitionProgress,
  ScoringAnomaly,
  BulkScoreUpdate,
  ScoreValidation,
  ScoringState,
  ScoringTotals
} from '@/types/scoring';

// ================================
// HOOK PRINCIPAL DE SCORING
// ================================

export function useScoring() {
  const queryClient = useQueryClient();

  // Estado local del sistema de scoring
  const [state, setState] = useState<ScoringState>({
    currentScorecard: null,
    isLoading: false,
    error: null,
    isDirty: false,
    autoSaveEnabled: true
  });

  // Limpiar estado
  const resetState = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentScorecard: null,
      error: null,
      isDirty: false
    }));
  }, []);

  // Actualizar estado
  const updateState = useCallback((updates: Partial<ScoringState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    state,
    updateState,
    resetState,
    queryClient
  };
}

// ================================
// HOOK PARA PARÁMETROS DE EVALUACIÓN
// ================================

export function useEvaluationParameters(categoryId?: number) {
  return useQuery({
    queryKey: ['evaluation-parameters', categoryId],
    queryFn: () => categoryId 
      ? scoringAPI.getParametersByCategory(categoryId)
      : scoringAPI.getEvaluationParameters(),
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });
}

// ================================
// HOOK PARA TARJETA DE PUNTUACIÓN
// ================================

export function useJudgeScorecard(participantId?: number, judgePositionId?: number) {
  const queryClient = useQueryClient();
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Query para obtener la tarjeta
  const scorecardQuery = useQuery({
    queryKey: ['judge-scorecard', participantId, judgePositionId],
    queryFn: () => scoringAPI.getJudgeScorecard(participantId!, judgePositionId!),
    enabled: !!participantId && !!judgePositionId,
    refetchOnWindowFocus: false,
  });

  // Mutación para actualizar puntuación individual
  const updateScoreMutation = useMutation({
    mutationFn: (scoreData: ScoreEntryCreate) => scoringAPI.createScoreEntry(scoreData),
    onSuccess: (newScore, variables) => {
      // Actualizar cache local optimísticamente
      queryClient.setQueryData(
        ['judge-scorecard', participantId, judgePositionId],
        (oldData: JudgeScorecard | undefined) => {
          if (!oldData) return oldData;
          
          const updatedScorecard = oldData.scorecard.map(entry => {
            if (entry.parameter.id === variables.evaluation_parameter) {
              return {
                ...entry,
                score_entry: newScore,
                weighted_score: newScore.weighted_score,
                is_scored: true
              };
            }
            return entry;
          });

          // Recalcular totales localmente
          const scores = updatedScorecard
            .filter(entry => entry.score_entry)
            .map(entry => ({
              score: entry.score_entry!.score,
              coefficient: entry.parameter.coefficient,
              max_score: entry.parameter.max_score
            }));

          const totals = scoringAPI.calculateLocalTotals(scores);

          return {
            ...oldData,
            scorecard: updatedScorecard,
            totals
          };
        }
      );

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['judge-evaluations'] });
    },
    onError: (error) => {
      console.error('Error updating score:', error);
      // Revertir cambios optimistas
      queryClient.invalidateQueries({ 
        queryKey: ['judge-scorecard', participantId, judgePositionId] 
      });
    }
  });

  // Función para actualizar puntuación con auto-save
  const updateScore = useCallback(async (scoreData: ScoreEntryCreate) => {
    try {
      await updateScoreMutation.mutateAsync(scoreData);
    } catch (error) {
      throw error;
    }
  }, [updateScoreMutation]);

  // Auto-save con debounce
  const scheduleAutoSave = useCallback((scoreData: ScoreEntryCreate) => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      updateScore(scoreData);
    }, 2000); // 2 segundos de delay

    setAutoSaveTimer(timer);
  }, [autoSaveTimer, updateScore]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // Validar puntuación antes de guardar
  const validateAndUpdateScore = useCallback((
    evaluationParameterId: number,
    score: number,
    justification?: string
  ) => {
    if (!participantId || !judgePositionId) return;

    const parameter = scorecardQuery.data?.scorecard.find(
      entry => entry.parameter.id === evaluationParameterId
    )?.parameter;

    if (!parameter) return;

    const validation = scoringAPI.validateScore(score, parameter.coefficient, justification);
    
    if (!validation.is_valid) {
      throw new Error(validation.errors.join(', '));
    }

    const scoreData: ScoreEntryCreate = {
      participant: participantId,
      judge_position: judgePositionId,
      evaluation_parameter: evaluationParameterId,
      score,
      justification: justification || ''
    };

    return updateScore(scoreData);
  }, [participantId, judgePositionId, scorecardQuery.data, updateScore]);

  return {
    scorecard: scorecardQuery.data,
    isLoading: scorecardQuery.isLoading || updateScoreMutation.isPending,
    error: scorecardQuery.error || updateScoreMutation.error,
    updateScore: validateAndUpdateScore,
    scheduleAutoSave,
    refetch: scorecardQuery.refetch
  };
}

// ================================
// HOOK PARA RANKINGS EN TIEMPO REAL
// ================================

export function useLiveRankings(competitionId: number, categoryId?: number, refreshInterval: number = 30000) {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  
  const rankingsQuery = useQuery({
    queryKey: ['live-rankings', competitionId, categoryId],
    queryFn: () => scoringAPI.getLiveRankings({ competition_id: competitionId, category_id: categoryId }),
    refetchInterval: isAutoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: true,
    enabled: !!competitionId,
  });

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefresh(prev => !prev);
  }, []);

  const forceRefresh = useCallback(() => {
    rankingsQuery.refetch();
  }, [rankingsQuery]);

  return {
    rankings: rankingsQuery.data?.rankings || [],
    competition: rankingsQuery.data?.competition,
    lastUpdated: rankingsQuery.data?.last_updated,
    isLoading: rankingsQuery.isLoading,
    error: rankingsQuery.error,
    isAutoRefresh,
    toggleAutoRefresh,
    forceRefresh
  };
}

// ================================
// HOOK PARA PROGRESO DE COMPETENCIA
// ================================

export function useCompetitionProgress(competitionId: number) {
  return useQuery({
    queryKey: ['competition-progress', competitionId],
    queryFn: () => scoringAPI.getCompetitionProgress(competitionId),
    enabled: !!competitionId,
    refetchInterval: 60000, // 1 minuto
  });
}

// ================================
// HOOK PARA DETECCIÓN DE ANOMALÍAS
// ================================

export function useAnomalyDetection(competitionId: number) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const anomaliesQuery = useQuery({
    queryKey: ['scoring-anomalies', competitionId],
    queryFn: () => scoringAPI.detectAnomalies(competitionId),
    enabled: !!competitionId && isMonitoring,
    refetchInterval: isMonitoring ? 120000 : false, // 2 minutos cuando está monitoreando
  });

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  return {
    anomalies: anomaliesQuery.data?.anomalies || [],
    anomaliesCount: anomaliesQuery.data?.anomalies_count || 0,
    checkedAt: anomaliesQuery.data?.checked_at,
    isLoading: anomaliesQuery.isLoading,
    error: anomaliesQuery.error,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refetch: anomaliesQuery.refetch
  };
}

// ================================
// HOOK PARA ACTUALIZACIÓN MASIVA
// ================================

export function useBulkScoreUpdate() {
  const queryClient = useQueryClient();
  
  const bulkUpdateMutation = useMutation({
    mutationFn: (scores: BulkScoreUpdate[]) => scoringAPI.bulkUpdateScores(scores),
    onSuccess: (result) => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['judge-scorecard'] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['judge-evaluations'] });
      
      return result;
    }
  });

  return {
    bulkUpdate: bulkUpdateMutation.mutate,
    bulkUpdateAsync: bulkUpdateMutation.mutateAsync,
    isLoading: bulkUpdateMutation.isPending,
    error: bulkUpdateMutation.error,
    data: bulkUpdateMutation.data
  };
}

// ================================
// HOOK PARA VALIDACIÓN EN TIEMPO REAL
// ================================

export function useScoreValidation() {
  const [validationCache, setValidationCache] = useState<Map<string, ScoreValidation>>(new Map());

  const validateScore = useCallback((
    score: number,
    coefficient: number,
    justification?: string
  ): ScoreValidation => {
    const cacheKey = `${score}-${coefficient}-${justification || ''}`;
    
    if (validationCache.has(cacheKey)) {
      return validationCache.get(cacheKey)!;
    }

    const validation = scoringAPI.validateScore(score, coefficient, justification);
    
    setValidationCache(prev => new Map(prev.set(cacheKey, validation)));
    
    return validation;
  }, [validationCache]);

  const clearCache = useCallback(() => {
    setValidationCache(new Map());
  }, []);

  return {
    validateScore,
    clearCache
  };
}

// ================================
// HOOK PARA ESTADÍSTICAS DE JUEZ
// ================================

export function useJudgeStatistics(judgeId: number, competitionId?: number) {
  return useQuery({
    queryKey: ['judge-statistics', judgeId, competitionId],
    queryFn: () => scoringAPI.getJudgeStatistics(judgeId, competitionId),
    enabled: !!judgeId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ================================
// HOOK PARA COMPARACIÓN DE PARTICIPANTES
// ================================

export function useParticipantComparison(participantIds: number[]) {
  return useQuery({
    queryKey: ['participant-comparison', ...participantIds.sort()],
    queryFn: () => scoringAPI.compareParticipants(participantIds),
    enabled: participantIds.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// ================================
// HOOK PARA GESTIÓN DE ESTADO LOCAL
// ================================

export function useScoringState() {
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [justifications, setJustifications] = useState<Map<string, string>>(new Map());
  const [isDirty, setIsDirty] = useState(false);

  const getScoreKey = useCallback((participantId: number, parameterId: number): string => {
    return `${participantId}-${parameterId}`;
  }, []);

  const updateScore = useCallback((
    participantId: number,
    parameterId: number,
    score: number,
    justification?: string
  ) => {
    const key = getScoreKey(participantId, parameterId);
    
    setScores(prev => new Map(prev.set(key, score)));
    
    if (justification !== undefined) {
      setJustifications(prev => new Map(prev.set(key, justification)));
    }
    
    setIsDirty(true);
  }, [getScoreKey]);

  const getScore = useCallback((participantId: number, parameterId: number): number | undefined => {
    const key = getScoreKey(participantId, parameterId);
    return scores.get(key);
  }, [scores, getScoreKey]);

  const getJustification = useCallback((participantId: number, parameterId: number): string => {
    const key = getScoreKey(participantId, parameterId);
    return justifications.get(key) || '';
  }, [justifications, getScoreKey]);

  const clearChanges = useCallback(() => {
    setScores(new Map());
    setJustifications(new Map());
    setIsDirty(false);
  }, []);

  const getPendingChanges = useCallback((): BulkScoreUpdate[] => {
    const changes: BulkScoreUpdate[] = [];
    
    scores.forEach((score, key) => {
      const [participantId, parameterId] = key.split('-').map(Number);
      const justification = justifications.get(key) || '';
      
      changes.push({
        participant_id: participantId,
        judge_position_id: 0, // Será completado por el componente padre
        evaluation_parameter_id: parameterId,
        score,
        justification
      });
    });
    
    return changes;
  }, [scores, justifications]);

  return {
    updateScore,
    getScore,
    getJustification,
    clearChanges,
    getPendingChanges,
    isDirty,
    changesCount: scores.size
  };
}

// ================================
// HOOK PARA NAVEGACIÓN ENTRE PARTICIPANTES
// ================================

export function useParticipantNavigation(participantIds: number[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentParticipantId = participantIds[currentIndex];
  
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => 
      prev < participantIds.length - 1 ? prev + 1 : prev
    );
  }, [participantIds.length]);
  
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : prev);
  }, []);
  
  const goToParticipant = useCallback((participantId: number) => {
    const index = participantIds.indexOf(participantId);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [participantIds]);
  
  const canGoNext = currentIndex < participantIds.length - 1;
  const canGoPrevious = currentIndex > 0;
  
  return {
    currentParticipantId,
    currentIndex,
    totalParticipants: participantIds.length,
    goToNext,
    goToPrevious,
    goToParticipant,
    canGoNext,
    canGoPrevious
  };
}

// ================================
// HOOK PARA CÁLCULOS EN TIEMPO REAL
// ================================

export function useRealtimeCalculations(scorecard?: JudgeScorecard) {
  const [livePercentage, setLivePercentage] = useState<number>(0);
  const [liveTotal, setLiveTotal] = useState<number>(0);
  
  useEffect(() => {
    if (!scorecard) return;
    
    const scoredEntries = scorecard.scorecard.filter(entry => entry.score_entry);
    if (scoredEntries.length === 0) {
      setLivePercentage(0);
      setLiveTotal(0);
      return;
    }
    
    const totalWeighted = scoredEntries.reduce(
      (sum, entry) => sum + entry.weighted_score, 0
    );
    
    const totalPossible = scorecard.scorecard.reduce(
      (sum, entry) => sum + (entry.parameter.max_score * entry.parameter.coefficient), 0
    );
    
    const percentage = totalPossible > 0 ? (totalWeighted / totalPossible) * 100 : 0;
    
    setLiveTotal(totalWeighted);
    setLivePercentage(Number(percentage.toFixed(2)));
  }, [scorecard]);
  
  return {
    livePercentage,
    liveTotal,
    completionRate: scorecard ? 
      (scorecard.scorecard.filter(e => e.is_scored).length / scorecard.scorecard.length) * 100 : 0
  };
}