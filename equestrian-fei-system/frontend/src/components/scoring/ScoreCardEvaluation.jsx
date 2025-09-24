import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useScoringStore from '../../store/scoringStore';
import scoringService from '../../services/scoringService';

const ScoreCardEvaluation = () => {
  const { scorecardId } = useParams();
  const navigate = useNavigate();
  
  const {
    currentScorecard,
    criteriaByDiscipline,
    individualScores,
    scorecardsLoading,
    scoresError,
    loadScoreCardById,
    loadCriteriaByDiscipline,
    loadIndividualScores,
    startEvaluation,
    completeEvaluation,
    createIndividualScore,
    updateIndividualScore,
    disqualifyParticipant,
    clearErrors
  } = useScoringStore();

  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState('');

  useEffect(() => {
    if (scorecardId) {
      loadScoreCardById(scorecardId);
      loadCriteriaByDiscipline();
      loadIndividualScores({ scorecard: scorecardId });
    }
    clearErrors();
  }, [scorecardId]);

  useEffect(() => {
    if (currentScorecard?.individual_scores) {
      const initialScores = {};
      const initialNotes = {};
      
      currentScorecard.individual_scores.forEach(score => {
        initialScores[score.criteria] = score.raw_score;
        initialNotes[score.criteria] = score.notes || '';
      });
      
      setScores(initialScores);
      setNotes(initialNotes);
    }
  }, [currentScorecard]);

  const handleStartEvaluation = async () => {
    setIsSubmitting(true);
    const result = await startEvaluation(scorecardId);
    
    if (result.success) {
      // La evaluación se ha iniciado
    } else {
      console.error('Error iniciando evaluación:', result.error);
    }
    setIsSubmitting(false);
  };

  const handleScoreChange = (criteriaId, value) => {
    setScores(prev => ({ ...prev, [criteriaId]: value }));
  };

  const handleNotesChange = (criteriaId, value) => {
    setNotes(prev => ({ ...prev, [criteriaId]: value }));
  };

  const handleSaveScore = async (criteriaId) => {
    if (!scores[criteriaId] && scores[criteriaId] !== 0) return;

    setIsSubmitting(true);
    
    const scoreData = {
      scorecard: scorecardId,
      criteria: criteriaId,
      raw_score: parseFloat(scores[criteriaId]),
      notes: notes[criteriaId] || '',
      is_final: true
    };

    // Verificar si ya existe una puntuación
    const existingScore = currentScorecard?.individual_scores?.find(
      s => s.criteria === criteriaId
    );

    let result;
    if (existingScore) {
      result = await updateIndividualScore(existingScore.id, scoreData);
    } else {
      result = await createIndividualScore(scoreData);
    }

    if (result.success) {
      // Actualizar datos del scorecard
      await loadScoreCardById(scorecardId);
    } else {
      console.error('Error guardando puntuación:', result.error);
    }
    
    setIsSubmitting(false);
  };

  const handleCompleteEvaluation = async () => {
    setIsSubmitting(true);
    const result = await completeEvaluation(scorecardId);
    
    if (result.success) {
      navigate('/scoring/evaluations');
    } else {
      console.error('Error completando evaluación:', result.error);
    }
    setIsSubmitting(false);
  };

  const handleDisqualify = async () => {
    if (!disqualifyReason.trim()) return;

    setIsSubmitting(true);
    const result = await disqualifyParticipant(scorecardId, disqualifyReason);
    
    if (result.success) {
      setShowDisqualifyModal(false);
      navigate('/scoring/evaluations');
    } else {
      console.error('Error descalificando participante:', result.error);
    }
    setIsSubmitting(false);
  };

  if (scorecardsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentScorecard) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Scorecard no encontrado</h2>
      </div>
    );
  }

  const discipline = currentScorecard.discipline_name;
  const criteria = criteriaByDiscipline[discipline] || [];
  const canEvaluate = currentScorecard.status === 'in_progress' && !currentScorecard.is_disqualified;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Evaluación</h1>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                <span className="text-sm text-gray-500">
                  {currentScorecard.participant_name}
                </span>
                <span className="text-sm text-gray-500">
                  🐎 {currentScorecard.horse_name}
                </span>
                <span className="text-sm text-gray-500">
                  #{currentScorecard.participant_number}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scoringService.getStatusColor(currentScorecard.status)}`}>
                  {scoringService.getStatusText(currentScorecard.status)}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {currentScorecard.status === 'pending' && (
                <button
                  onClick={handleStartEvaluation}
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Iniciar Evaluación
                </button>
              )}
              
              {canEvaluate && (
                <>
                  <button
                    onClick={handleCompleteEvaluation}
                    disabled={isSubmitting}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Completar Evaluación
                  </button>
                  
                  <button
                    onClick={() => setShowDisqualifyModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Descalificar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Puntuación actual */}
        {currentScorecard.final_score > 0 && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Puntuación Final</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentScorecard.final_score}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Técnica</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentScorecard.technical_score || 0}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Artística</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentScorecard.artistic_score || 0}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Penalizaciones</div>
                <div className="text-lg font-semibold text-red-600">
                  {currentScorecard.penalties || 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evaluación por criterios */}
      {canEvaluate && criteria.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Criterios de Evaluación - {discipline}
            </h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {criterion.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {criterion.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>Min: {criterion.min_score}</span>
                        <span>Max: {criterion.max_score}</span>
                        <span>Peso: {criterion.weight}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {criterion.is_required && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Requerido
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        criterion.criteria_type === 'technical' ? 'bg-blue-100 text-blue-800' :
                        criterion.criteria_type === 'artistic' ? 'bg-purple-100 text-purple-800' :
                        criterion.criteria_type === 'time' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {criterion.criteria_type}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Puntuación
                      </label>
                      <input
                        type="number"
                        min={criterion.min_score}
                        max={criterion.max_score}
                        step="0.1"
                        value={scores[criterion.id] || ''}
                        onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`${criterion.min_score} - ${criterion.max_score}`}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas
                      </label>
                      <input
                        type="text"
                        value={notes[criterion.id] || ''}
                        onChange={(e) => handleNotesChange(criterion.id, e.target.value)}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Observaciones..."
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={() => handleSaveScore(criterion.id)}
                        disabled={!scores[criterion.id] && scores[criterion.id] !== 0}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>

                  {/* Mostrar puntuación guardada */}
                  {currentScorecard.individual_scores?.some(s => s.criteria === criterion.id) && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      {(() => {
                        const savedScore = currentScorecard.individual_scores.find(s => s.criteria === criterion.id);
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-800">
                              ✓ Puntuación guardada: <strong>{savedScore.raw_score}</strong>
                              {savedScore.weighted_score && (
                                <span className="ml-2">(Ponderada: {savedScore.weighted_score})</span>
                              )}
                            </span>
                            {savedScore.notes && (
                              <span className="text-xs text-green-600">
                                "{savedScore.notes}"
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {scoresError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {scoresError}
        </div>
      )}

      {/* Modal de descalificación */}
      {showDisqualifyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Descalificar Participante
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón de la descalificación:
                </label>
                <textarea
                  value={disqualifyReason}
                  onChange={(e) => setDisqualifyReason(e.target.value)}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  placeholder="Describa la razón de la descalificación..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDisqualifyModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDisqualify}
                  disabled={!disqualifyReason.trim() || isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Descalificando...' : 'Descalificar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreCardEvaluation;