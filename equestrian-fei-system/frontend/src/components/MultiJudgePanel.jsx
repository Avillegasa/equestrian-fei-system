import { useState, useEffect } from 'react';

/**
 * Panel de Administración Multi-Juez
 * Muestra las calificaciones de todos los jueces en tiempo real
 * y calcula los promedios automáticamente
 */

const MultiJudgePanel = ({ competitionId, participants }) => {
  const [allScores, setAllScores] = useState({});
  const [judges, setJudges] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Cargar jueces asignados y sus calificaciones
  useEffect(() => {
    if (!competitionId) return;

    // Cargar personal/jueces asignados
    const staffKey = `fei_staff_${competitionId}`;
    const savedStaff = localStorage.getItem(staffKey);

    if (savedStaff) {
      const staff = JSON.parse(savedStaff);
      const judgesOnly = staff.filter(s =>
        s.role === 'judge' || s.role === 'chief_judge'
      );
      setJudges(judgesOnly);
    }

    // Cargar todas las calificaciones
    const scoresKey = `fei_scores_${competitionId}`;
    const savedScores = localStorage.getItem(scoresKey);

    if (savedScores) {
      const scores = JSON.parse(savedScores);

      // Organizar por participante y juez
      const organized = {};
      scores.forEach(score => {
        if (!organized[score.participant_id]) {
          organized[score.participant_id] = {};
        }
        organized[score.participant_id][score.judge_id] = score;
      });

      setAllScores(organized);
    }
  }, [competitionId]);

  // Calcular promedio de calificaciones para un participante
  const calculateAverage = (participantId) => {
    const participantScores = allScores[participantId];
    if (!participantScores || Object.keys(participantScores).length === 0) {
      return null;
    }

    const scores = Object.values(participantScores);

    if (scores[0]?.discipline === 'dressage') {
      // Promedio de Adiestramiento
      const totalSum = scores.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      const percentageSum = scores.reduce((sum, s) => sum + (s.percentage || 0), 0);

      return {
        discipline: 'dressage',
        averageTotal: (totalSum / scores.length).toFixed(2),
        averagePercentage: (percentageSum / scores.length).toFixed(2),
        judgeCount: scores.length,
        maxScore: scores[0].maxScore
      };
    } else {
      // Promedio de Salto
      const totalSum = scores.reduce((sum, s) => sum + (s.final_score || 0), 0);

      return {
        discipline: 'show_jumping',
        averageScore: (totalSum / scores.length).toFixed(2),
        judgeCount: scores.length
      };
    }
  };

  // Obtener color según calificación
  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <span className="mr-3">👥</span>
          Panel Multi-Juez
        </h2>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{judges.length}</span> jueces calificando
        </div>
      </div>

      {/* Información de Jueces */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Jueces Asignados:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {judges.map((judge) => (
            <div key={judge.id} className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {judge.staff_member.first_name} {judge.staff_member.last_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {judge.role === 'chief_judge' ? 'Juez Principal (C)' :
                     judge.role === 'judge' ? 'Juez (B/H)' : judge.role}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  judge.is_confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {judge.is_confirmed ? '✓' : '⏳'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de Calificaciones */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participante
              </th>
              {judges.map((judge) => (
                <th key={judge.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {judge.staff_member.first_name}
                  <br />
                  <span className="text-blue-600 font-bold">
                    {judge.role === 'chief_judge' ? 'C' : 'B'}
                  </span>
                </th>
              ))}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                Promedio
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map((participant, index) => {
              const average = calculateAverage(participant.id);
              const participantScores = allScores[participant.id] || {};

              return (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{participant.bib_number || index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {participant.rider.first_name} {participant.rider.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {participant.horse.name}
                    </div>
                  </td>

                  {/* Calificaciones por Juez */}
                  {judges.map((judge) => {
                    const score = participantScores[judge.staff_member.id];

                    return (
                      <td key={judge.id} className="px-4 py-4 whitespace-nowrap text-center">
                        {score ? (
                          <div>
                            {score.discipline === 'dressage' ? (
                              <>
                                <div className={`text-lg font-bold ${getScoreColor(score.percentage)}`}>
                                  {score.totalScore}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {score.percentage}%
                                </div>
                              </>
                            ) : (
                              <div className="text-lg font-bold text-blue-600">
                                {score.final_score}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Promedio */}
                  <td className="px-6 py-4 whitespace-nowrap text-center bg-green-50">
                    {average ? (
                      <div>
                        {average.discipline === 'dressage' ? (
                          <>
                            <div className={`text-xl font-bold ${getScoreColor(average.averagePercentage)}`}>
                              {average.averageTotal}
                            </div>
                            <div className="text-sm text-gray-700 font-medium">
                              {average.averagePercentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              ({average.judgeCount} jueces)
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xl font-bold text-blue-600">
                              {average.averageScore}
                            </div>
                            <div className="text-xs text-gray-500">
                              ({average.judgeCount} jueces)
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Pendiente</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setSelectedParticipant(participant)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle (placeholder) */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Detalle de Calificaciones
              </h3>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-bold text-gray-900">
                {selectedParticipant.rider.first_name} {selectedParticipant.rider.last_name}
              </h4>
              <p className="text-sm text-gray-600">
                Caballo: {selectedParticipant.horse.name}
              </p>
            </div>

            <div className="space-y-4">
              {judges.map((judge) => {
                const score = allScores[selectedParticipant.id]?.[judge.staff_member.id];

                return (
                  <div key={judge.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-gray-900">
                        {judge.staff_member.first_name} {judge.staff_member.last_name}
                        <span className="ml-2 text-blue-600">({judge.role === 'chief_judge' ? 'C' : 'B'})</span>
                      </h5>
                      {score && (
                        <span className="text-xs text-gray-500">
                          {new Date(score.created_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {score ? (
                      <div>
                        {score.discipline === 'dressage' ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Subtotal Ejercicios:</p>
                              <p className="text-lg font-bold text-gray-900">{score.exercisesSubtotal}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Subtotal Conjunto:</p>
                              <p className="text-lg font-bold text-gray-900">{score.collectiveSubtotal}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total:</p>
                              <p className="text-xl font-bold text-blue-600">{score.totalScore}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Porcentaje:</p>
                              <p className="text-xl font-bold text-green-600">{score.percentage}%</p>
                            </div>
                            {score.comments && (
                              <div className="col-span-2">
                                <p className="text-sm text-gray-600 mb-1">Comentarios:</p>
                                <p className="text-sm text-gray-900 bg-white p-2 rounded">
                                  {score.comments}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Tiempo:</p>
                              <p className="text-lg font-bold text-gray-900">{score.time_seconds}s</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Faltas:</p>
                              <p className="text-lg font-bold text-gray-900">{score.faults}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Rechazos:</p>
                              <p className="text-lg font-bold text-gray-900">{score.refusals}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Puntuación Final:</p>
                              <p className="text-xl font-bold text-blue-600">{score.final_score}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Sin calificación aún</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setSelectedParticipant(null)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Leyenda:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-bold">●</span>
            <span>≥ 80% Excelente</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 font-bold">●</span>
            <span>70-79% Muy Bueno</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600 font-bold">●</span>
            <span>60-69% Bueno</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-red-600 font-bold">●</span>
            <span>&lt; 60% Mejorable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiJudgePanel;
