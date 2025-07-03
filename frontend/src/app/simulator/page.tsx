'use client';

import { useState, useEffect } from 'react';

interface Parameter {
  id: number;
  exercise_number: number;
  exercise_name: string;
  coefficient: number;
  max_score: string;
  weighted_max_score: string;
  is_collective_mark: boolean;
}

interface ScoreEntry {
  parameterId: number;
  score: string;
  justification: string;
}

interface CalculationResult {
  totalScore: number;
  percentage: number;
  weightedTotal: number;
  maxPossible: number;
}

export default function ScoringSimulator() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [scores, setScores] = useState<{ [key: number]: ScoreEntry }>({});
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar parámetros al iniciar
  useEffect(() => {
    loadParameters();
  }, []);

  // Recalcular cuando cambien las puntuaciones
  useEffect(() => {
    calculateTotals();
  }, [scores, parameters]);

  const loadParameters = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/scoring/test/parameters/');
      const data = await response.json();
      
      if (data.status === 'success' && data.sample_parameters) {
        setParameters(data.sample_parameters);
        
        // Inicializar scores
        const initialScores: { [key: number]: ScoreEntry } = {};
        data.sample_parameters.forEach((param: Parameter) => {
          initialScores[param.id] = {
            parameterId: param.id,
            score: '',
            justification: ''
          };
        });
        setScores(initialScores);
      }
      setIsLoading(false);
    } catch (err) {
      setError('Error cargando parámetros');
      setIsLoading(false);
    }
  };

  const validateScore = (score: string): { isValid: boolean; error?: string } => {
    if (!score) return { isValid: true };
    
    const numScore = parseFloat(score);
    
    if (isNaN(numScore)) {
      return { isValid: false, error: 'Debe ser un número válido' };
    }
    
    if (numScore < 0 || numScore > 10) {
      return { isValid: false, error: 'Debe estar entre 0.0 y 10.0' };
    }
    
    // Verificar incrementos de 0.5
    if ((numScore * 2) % 1 !== 0) {
      return { isValid: false, error: 'Debe ser en incrementos de 0.5' };
    }
    
    return { isValid: true };
  };

  const handleScoreChange = (parameterId: number, score: string) => {
    setScores(prev => ({
      ...prev,
      [parameterId]: {
        ...prev[parameterId],
        score
      }
    }));
  };

  const handleJustificationChange = (parameterId: number, justification: string) => {
    setScores(prev => ({
      ...prev,
      [parameterId]: {
        ...prev[parameterId],
        justification
      }
    }));
  };

  const calculateTotals = () => {
    if (parameters.length === 0) return;

    let weightedTotal = 0;
    let maxPossible = 0;
    let validScoresCount = 0;

    parameters.forEach(param => {
      const scoreEntry = scores[param.id];
      if (scoreEntry && scoreEntry.score) {
        const score = parseFloat(scoreEntry.score);
        if (!isNaN(score)) {
          const weighted = score * param.coefficient;
          weightedTotal += weighted;
          validScoresCount++;
        }
      }
      maxPossible += parseFloat(param.max_score) * param.coefficient;
    });

    const percentage = maxPossible > 0 ? (weightedTotal / maxPossible) * 100 : 0;

    setCalculation({
      totalScore: validScoresCount,
      percentage: Math.round(percentage * 100) / 100,
      weightedTotal: Math.round(weightedTotal * 100) / 100,
      maxPossible: Math.round(maxPossible * 100) / 100
    });
  };

  const resetScores = () => {
    const resetScores: { [key: number]: ScoreEntry } = {};
    parameters.forEach(param => {
      resetScores[param.id] = {
        parameterId: param.id,
        score: '',
        justification: ''
      };
    });
    setScores(resetScores);
  };

  const fillRandomScores = () => {
    const randomScores: { [key: number]: ScoreEntry } = {};
    const validScores = ['6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];
    
    parameters.forEach(param => {
      const randomScore = validScores[Math.floor(Math.random() * validScores.length)];
      randomScores[param.id] = {
        parameterId: param.id,
        score: randomScore,
        justification: parseFloat(randomScore) <= 6.5 || parseFloat(randomScore) >= 8.5 
          ? 'Puntuación justificada para demostración' 
          : ''
      };
    });
    setScores(randomScores);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando simulador...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button onClick={loadParameters} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎯 Simulador de Calificación FEI
          </h1>
          <p className="text-lg text-gray-600">
            Simula el proceso de calificación según estándares FEI
          </p>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <button
              onClick={fillRandomScores}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🎲 Llenar Aleatorio
            </button>
            <button
              onClick={resetScores}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Limpiar Todo
            </button>
          </div>
          
          {/* Resultados en tiempo real */}
          {calculation && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                📊 Cálculos FEI en Tiempo Real
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Puntuación Total:</span>
                  <div className="font-bold text-blue-900">{calculation.weightedTotal}</div>
                </div>
                <div>
                  <span className="text-gray-600">Máximo Posible:</span>
                  <div className="font-bold text-blue-900">{calculation.maxPossible}</div>
                </div>
                <div>
                  <span className="text-gray-600">Porcentaje FEI:</span>
                  <div className="font-bold text-blue-900">{calculation.percentage}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Ejercicios Calificados:</span>
                  <div className="font-bold text-blue-900">{calculation.totalScore}/{parameters.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de calificación */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              📋 Tarjeta de Calificación
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ejercicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coef.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntuación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ponderada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Justificación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parameters.map((param) => {
                  const scoreEntry = scores[param.id] || { score: '', justification: '' };
                  const validation = validateScore(scoreEntry.score);
                  const score = parseFloat(scoreEntry.score) || 0;
                  const weightedScore = score * param.coefficient;
                  const isExtreme = score > 0 && (score <= 3.0 || score >= 8.5);
                  
                  return (
                    <tr key={param.id} className={param.is_collective_mark ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {param.exercise_number}
                          </span>
                          {param.is_collective_mark && (
                            <span className="ml-2 px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded">
                              Conjunto
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {param.exercise_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-blue-600">
                          {param.coefficient}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="10"
                            value={scoreEntry.score}
                            onChange={(e) => handleScoreChange(param.id, e.target.value)}
                            className={`w-20 px-3 py-2 border rounded-md text-sm ${
                              !validation.isValid
                                ? 'border-red-500 bg-red-50'
                                : isExtreme
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-gray-300'
                            }`}
                            placeholder="0.0"
                          />
                          {!validation.isValid && (
                            <div className="text-xs text-red-600 mt-1">
                              {validation.error}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {scoreEntry.score ? weightedScore.toFixed(1) : '0.0'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={scoreEntry.justification}
                          onChange={(e) => handleJustificationChange(param.id, e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md text-sm ${
                            isExtreme && !scoreEntry.justification
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder={isExtreme ? 'Justificación requerida' : 'Opcional'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Información FEI */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ℹ️ Estándares FEI Implementados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Validaciones:</h4>
              <ul className="space-y-1">
                <li>• Puntuaciones: 0.0 - 10.0</li>
                <li>• Incrementos de 0.5 puntos</li>
                <li>• Coeficientes: 1, 2, 3, 4, 5</li>
                <li>• Justificación para extremas (≤3.0 o ≥8.5)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cálculos:</h4>
              <ul className="space-y-1">
                <li>• Puntuación ponderada = Puntuación × Coeficiente</li>
                <li>• Total = Suma de puntuaciones ponderadas</li>
                <li>• Porcentaje = (Total / Máximo posible) × 100</li>
                <li>• Precisión: 2 decimales</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}