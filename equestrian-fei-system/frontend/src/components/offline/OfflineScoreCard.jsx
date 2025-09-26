/**
 * Componente de puntuación con capacidades offline
 * Integra la funcionalidad offline en el sistema de puntuación existente
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useOfflineScoring } from '../../hooks/useOfflineScoring';
import { useOffline } from '../../hooks/useOffline';
import OfflineIndicator from './OfflineIndicator';

const OfflineScoreCard = ({
  evaluation,
  parameters = [],
  onScoreChange,
  onSave,
  isReadOnly = false
}) => {
  const evaluationId = evaluation?.id;
  const {
    saveScoreOffline,
    saveEvaluationOffline,
    validateScore,
    calculateTotals,
    enableAutoSave,
    hasUnsavedChanges
  } = useOfflineScoring(evaluationId);

  const { isOnline } = useOffline();

  const [scores, setScores] = useState({});
  const [justifications, setJustifications] = useState({});
  const [totals, setTotals] = useState({ totalScore: 0, percentage: 0 });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Inicializar puntuaciones desde la evaluación
  useEffect(() => {
    if (evaluation?.scores) {
      const scoreMap = {};
      const justificationMap = {};

      evaluation.scores.forEach(score => {
        scoreMap[score.parameter_id] = score.score;
        if (score.justification) {
          justificationMap[score.parameter_id] = score.justification;
        }
      });

      setScores(scoreMap);
      setJustifications(justificationMap);
    }
  }, [evaluation]);

  // Recalcular totales cuando cambien las puntuaciones
  useEffect(() => {
    const scoreEntries = parameters.map(param => ({
      parameterId: param.id,
      score: scores[param.id] || 0,
      coefficient: param.coefficient || 1,
      weightedScore: (scores[param.id] || 0) * (param.coefficient || 1)
    }));

    const calculatedTotals = calculateTotals(scoreEntries);
    setTotals(calculatedTotals);

    // Notificar cambio al componente padre
    onScoreChange?.({
      scores: scoreEntries,
      totals: calculatedTotals,
      isValid: Object.keys(validationErrors).length === 0
    });
  }, [scores, parameters, calculateTotals, onScoreChange, validationErrors]);

  // Autoguardado
  useEffect(() => {
    if (!evaluationId || isReadOnly) return;

    const cleanup = enableAutoSave({
      id: evaluationId,
      scores: Object.entries(scores).map(([parameterId, score]) => ({
        parameterId,
        score,
        coefficient: parameters.find(p => p.id === parameterId)?.coefficient || 1,
        weightedScore: score * (parameters.find(p => p.id === parameterId)?.coefficient || 1),
        justification: justifications[parameterId] || ''
      })),
      totalScore: totals.totalScore,
      percentage: totals.percentage,
      status: 'draft'
    });

    return cleanup;
  }, [evaluationId, scores, justifications, totals, parameters, enableAutoSave, isReadOnly]);

  // Manejar cambio de puntuación
  const handleScoreChange = useCallback(async (parameterId, newScore) => {
    if (isReadOnly) return;

    // Validar puntuación
    const validation = validateScore(newScore);

    setValidationErrors(prev => {
      const updated = { ...prev };
      if (validation.isValid) {
        delete updated[parameterId];
      } else {
        updated[parameterId] = validation.errors;
      }
      return updated;
    });

    // Actualizar puntuación
    setScores(prev => ({
      ...prev,
      [parameterId]: newScore
    }));

    // Guardar offline si no hay conexión
    if (!isOnline) {
      try {
        await saveScoreOffline({
          parameterId,
          score: newScore,
          evaluationId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error guardando puntuación offline:', error);
      }
    }
  }, [isReadOnly, validateScore, isOnline, saveScoreOffline, evaluationId]);

  // Manejar cambio de justificación
  const handleJustificationChange = useCallback((parameterId, justification) => {
    if (isReadOnly) return;

    setJustifications(prev => ({
      ...prev,
      [parameterId]: justification
    }));
  }, [isReadOnly]);

  // Guardar evaluación completa
  const handleSave = useCallback(async () => {
    if (isReadOnly || isSaving) return;

    try {
      setIsSaving(true);

      const evaluationData = {
        id: evaluationId,
        scores: Object.entries(scores).map(([parameterId, score]) => ({
          parameterId,
          score,
          coefficient: parameters.find(p => p.id === parameterId)?.coefficient || 1,
          weightedScore: score * (parameters.find(p => p.id === parameterId)?.coefficient || 1),
          justification: justifications[parameterId] || ''
        })),
        totalScore: totals.totalScore,
        percentage: totals.percentage,
        status: 'submitted',
        submissionTime: new Date().toISOString()
      };

      if (isOnline) {
        // Guardar en línea
        await onSave?.(evaluationData);
      } else {
        // Guardar offline
        await saveEvaluationOffline(evaluationData);
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [
    isReadOnly,
    isSaving,
    evaluationId,
    scores,
    parameters,
    justifications,
    totals,
    isOnline,
    onSave,
    saveEvaluationOffline
  ]);

  // Obtener opciones de puntuación (incrementos de 0.5)
  const getScoreOptions = () => {
    const options = [];
    for (let i = 0; i <= 10; i += 0.5) {
      options.push(i);
    }
    return options;
  };

  // Verificar si una puntuación necesita justificación
  const needsJustification = (score) => {
    return score <= 3.0 || score >= 8.5;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header con indicador offline */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Puntuación - {evaluation?.participant?.name || 'Participante'}
        </h3>
        <OfflineIndicator showDetails={true} />
      </div>

      {/* Mensaje de modo offline */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-sm text-yellow-800">
              <strong>Modo offline:</strong> Las puntuaciones se guardan localmente y se sincronizarán cuando vuelva la conexión.
            </span>
          </div>
        </div>
      )}

      {/* Tabla de puntuación */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-900">
                Ejercicio
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">
                Coeficiente
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">
                Puntuación
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-900">
                Puntos
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-900">
                Justificación
              </th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((parameter) => {
              const currentScore = scores[parameter.id] || 0;
              const hasError = validationErrors[parameter.id];
              const needsJust = needsJustification(currentScore);
              const weightedScore = currentScore * (parameter.coefficient || 1);

              return (
                <tr key={parameter.id} className={hasError ? 'bg-red-50' : ''}>
                  {/* Ejercicio */}
                  <td className="border border-gray-300 px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {parameter.exercise_name}
                      </div>
                      {parameter.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {parameter.description}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Coeficiente */}
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {parameter.coefficient || 1}
                    </span>
                  </td>

                  {/* Puntuación */}
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <select
                      value={currentScore}
                      onChange={(e) => handleScoreChange(parameter.id, parseFloat(e.target.value))}
                      disabled={isReadOnly}
                      className={`w-20 px-2 py-1 border rounded text-center ${
                        hasError
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-100' : ''}`}
                    >
                      {getScoreOptions().map(score => (
                        <option key={score} value={score}>
                          {score.toFixed(1)}
                        </option>
                      ))}
                    </select>
                    {hasError && (
                      <div className="text-xs text-red-600 mt-1">
                        {hasError.join(', ')}
                      </div>
                    )}
                  </td>

                  {/* Puntos ponderados */}
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <span className="font-medium">
                      {weightedScore.toFixed(1)}
                    </span>
                  </td>

                  {/* Justificación */}
                  <td className="border border-gray-300 px-4 py-3">
                    <textarea
                      value={justifications[parameter.id] || ''}
                      onChange={(e) => handleJustificationChange(parameter.id, e.target.value)}
                      disabled={isReadOnly}
                      placeholder={needsJust ? 'Justificación requerida' : 'Justificación opcional'}
                      className={`w-full px-2 py-1 border rounded text-sm resize-none ${
                        needsJust && !justifications[parameter.id]
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-100' : ''}`}
                      rows="2"
                    />
                    {needsJust && !justifications[parameter.id] && (
                      <div className="text-xs text-yellow-600 mt-1">
                        Se requiere justificación para puntuaciones ≤3.0 o ≥8.5
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Puntuación Total</div>
            <div className="text-2xl font-bold text-gray-900">
              {totals.totalScore.toFixed(3)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Máximo Posible</div>
            <div className="text-lg font-medium text-gray-700">
              {totals.maxPossibleScore.toFixed(3)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Porcentaje</div>
            <div className="text-2xl font-bold text-blue-600">
              {totals.percentage.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Estado de guardado */}
      {lastSaved && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Última vez guardado: {lastSaved.toLocaleTimeString()}
          {hasUnsavedChanges && (
            <span className="ml-2 text-yellow-600">(cambios sin guardar)</span>
          )}
        </div>
      )}

      {/* Botones de acción */}
      {!isReadOnly && (
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={handleSave}
            disabled={isSaving || Object.keys(validationErrors).length > 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : (isOnline ? 'Enviar Puntuación' : 'Guardar Offline')}
          </button>
        </div>
      )}
    </div>
  );
};

export default OfflineScoreCard;