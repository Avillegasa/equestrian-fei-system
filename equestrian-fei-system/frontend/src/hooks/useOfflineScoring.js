/**
 * Hook específico para puntuación offline
 * Maneja la lógica de calificación cuando no hay conexión
 */

import { useState, useCallback, useEffect } from 'react';
import { offlineService } from '../services/offlineService';
import { useOffline } from './useOffline';

export const useOfflineScoring = (evaluationId) => {
  const { isOnline, isSyncing } = useOffline();
  const [offlineScores, setOfflineScores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cargar puntuaciones offline para la evaluación
  const loadOfflineScores = useCallback(async () => {
    if (!evaluationId) return;

    try {
      setIsLoading(true);
      const scores = await offlineService.getOfflineScores(evaluationId);
      setOfflineScores(scores);
    } catch (error) {
      console.error('Error cargando puntuaciones offline:', error);
    } finally {
      setIsLoading(false);
    }
  }, [evaluationId]);

  // Cargar puntuaciones al inicializar o cambiar evaluación
  useEffect(() => {
    loadOfflineScores();
  }, [loadOfflineScores]);

  // Guardar puntuación offline
  const saveScoreOffline = useCallback(async (scoreData) => {
    try {
      const offlineScore = await offlineService.saveOfflineScore({
        ...scoreData,
        evaluationId,
        lastModified: new Date().toISOString()
      });

      // Actualizar lista local
      setOfflineScores(prev => {
        const existingIndex = prev.findIndex(s => s.id === offlineScore.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = offlineScore;
          return updated;
        } else {
          return [...prev, offlineScore];
        }
      });

      setHasUnsavedChanges(true);

      return offlineScore;
    } catch (error) {
      console.error('Error guardando puntuación offline:', error);
      throw error;
    }
  }, [evaluationId]);

  // Guardar evaluación completa offline
  const saveEvaluationOffline = useCallback(async (evaluationData) => {
    try {
      const offlineEvaluation = {
        id: evaluationData.id || `offline_eval_${Date.now()}`,
        evaluationId,
        scores: evaluationData.scores || [],
        totalScore: evaluationData.totalScore || 0,
        percentage: evaluationData.percentage || 0,
        status: evaluationData.status || 'draft',
        submissionTime: evaluationData.submissionTime,
        notes: evaluationData.notes || '',
        lastModified: new Date().toISOString()
      };

      await offlineService.saveOfflineScore(offlineEvaluation);
      setHasUnsavedChanges(true);

      return offlineEvaluation;
    } catch (error) {
      console.error('Error guardando evaluación offline:', error);
      throw error;
    }
  }, [evaluationId]);

  // Validar puntuación según reglas FEI
  const validateScore = useCallback((score) => {
    const errors = [];

    // Validar rango (0.0 - 10.0)
    if (score < 0 || score > 10) {
      errors.push('La puntuación debe estar entre 0.0 y 10.0');
    }

    // Validar incrementos de 0.5
    if ((score * 2) % 1 !== 0) {
      errors.push('La puntuación debe ser en incrementos de 0.5');
    }

    // Validar justificación para scores extremos
    if ((score <= 3.0 || score >= 8.5) && !score.justification) {
      errors.push('Se requiere justificación para puntuaciones ≤3.0 o ≥8.5');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Calcular totales de evaluación
  const calculateTotals = useCallback((scores) => {
    if (!Array.isArray(scores) || scores.length === 0) {
      return {
        totalScore: 0,
        maxPossibleScore: 0,
        percentage: 0
      };
    }

    const totalScore = scores.reduce((sum, score) => {
      return sum + (score.weightedScore || (score.score * (score.coefficient || 1)));
    }, 0);

    const maxPossibleScore = scores.reduce((sum, score) => {
      return sum + (10 * (score.coefficient || 1));
    }, 0);

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      totalScore: Number(totalScore.toFixed(3)),
      maxPossibleScore: Number(maxPossibleScore.toFixed(3)),
      percentage: Number(percentage.toFixed(2))
    };
  }, []);

  // Autoguardado cada cierto tiempo
  const enableAutoSave = useCallback((evaluationData, interval = 30000) => {
    const autoSaveInterval = setInterval(async () => {
      if (hasUnsavedChanges && evaluationData) {
        try {
          await saveEvaluationOffline(evaluationData);
          setHasUnsavedChanges(false);
          console.log('Autoguardado offline completado');
        } catch (error) {
          console.error('Error en autoguardado offline:', error);
        }
      }
    }, interval);

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, saveEvaluationOffline]);

  // Obtener última puntuación guardada
  const getLastSavedScore = useCallback(async (parameterId) => {
    const scores = await offlineService.getOfflineScores(evaluationId);
    const parameterScores = scores.filter(s =>
      s.scores && s.scores.some(score => score.parameterId === parameterId)
    );

    if (parameterScores.length === 0) return null;

    // Obtener la más reciente
    const latest = parameterScores.reduce((latest, current) => {
      return new Date(current.lastModified) > new Date(latest.lastModified)
        ? current
        : latest;
    });

    return latest.scores.find(s => s.parameterId === parameterId);
  }, [evaluationId]);

  // Exportar datos de puntuación para backup
  const exportScoringData = useCallback(async () => {
    try {
      const allScores = await offlineService.getOfflineScores();
      const evaluationScores = allScores.filter(s => s.evaluationId === evaluationId);

      return {
        evaluationId,
        exportDate: new Date().toISOString(),
        scoresCount: evaluationScores.length,
        scores: evaluationScores
      };
    } catch (error) {
      console.error('Error exportando datos de puntuación:', error);
      throw error;
    }
  }, [evaluationId]);

  // Limpiar datos temporales
  const clearTempData = useCallback(async () => {
    try {
      // Implementar lógica para limpiar datos temporales
      setOfflineScores([]);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error limpiando datos temporales:', error);
    }
  }, []);

  return {
    // Estado
    offlineScores,
    isLoading,
    hasUnsavedChanges,
    isOnline,
    isSyncing,

    // Acciones de puntuación
    saveScoreOffline,
    saveEvaluationOffline,
    loadOfflineScores,

    // Utilidades de validación
    validateScore,
    calculateTotals,

    // Funciones auxiliares
    getLastSavedScore,
    enableAutoSave,
    exportScoringData,
    clearTempData,

    // Estado computed
    hasOfflineData: offlineScores.length > 0,
    canSaveOffline: true, // Siempre se puede guardar offline
    needsSync: offlineScores.some(s => !s.isSynced)
  };
};

export default useOfflineScoring;