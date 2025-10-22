import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ScoreParticipantModal from '../components/ScoreParticipantModal';

const ScoringPage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [scores, setScores] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  const handleLogout = async () => {
    await logout();
  };

  // Datos de ejemplo para demostración
  useEffect(() => {
    console.log('🎯 ScoringPage montada, competitionId:', competitionId);

    // Simular carga de datos
    setTimeout(() => {
      const compId = competitionId || '1';
      console.log('✅ Cargando competencia:', compId);

      setCompetition({
        id: compId,
        name: 'Copa Internacional de Salto 2024',
        discipline: 'Show Jumping',
        location: 'Madrid, España',
        startDate: '2025-10-03',
        endDate: '2025-10-06',
        status: 'in_progress'
      });

      setParticipants([
        {
          id: 1,
          rider: { first_name: 'María', last_name: 'González' },
          horse: { name: 'Thunder' },
          category: 'Juvenil 1.20m',
          bib_number: 1,
          order: 1
        },
        {
          id: 2,
          rider: { first_name: 'Ana', last_name: 'Martín' },
          horse: { name: 'Lightning' },
          category: 'Senior 1.40m',
          bib_number: 2,
          order: 2
        },
        {
          id: 3,
          rider: { first_name: 'Carlos', last_name: 'Rodríguez' },
          horse: { name: 'Storm' },
          category: 'Juvenil 1.20m',
          bib_number: 3,
          order: 3
        }
      ]);

      setScores([
        {
          id: 1,
          participant_id: 1,
          judge_id: user?.id || 1,
          judge_name: user?.first_name + ' ' + user?.last_name || 'Juez Principal',
          time_seconds: 65.50,
          faults: 0,
          time_faults: 0,
          refusals: 0,
          final_score: 0,
          status: 'completed',
          created_at: '2024-10-03T09:15:00'
        }
      ]);

      setLoading(false);
    }, 500);
  }, [competitionId, user]);

  const handleScoreParticipant = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    setSelectedParticipant(participant);
    setShowScoreModal(true);
  };

  const handleSubmitScore = (scoreData) => {
    // Calcular puntuación final según reglas FEI de salto
    const finalScore = scoreData.faults + scoreData.time_faults + (scoreData.refusals * 4);

    const newScore = {
      id: scores.length + 1,
      participant_id: selectedParticipant.id,
      judge_id: user?.id || 1,
      judge_name: user?.first_name + ' ' + user?.last_name || 'Juez Principal',
      time_seconds: parseFloat(scoreData.time_seconds),
      faults: parseInt(scoreData.faults),
      time_faults: parseFloat(scoreData.time_faults),
      refusals: parseInt(scoreData.refusals),
      final_score: finalScore,
      status: 'completed',
      notes: scoreData.notes || '',
      created_at: new Date().toISOString()
    };

    setScores(prev => [...prev, newScore]);
    alert('✅ Puntuación registrada exitosamente!');
  };

  const getParticipantScore = (participantId) => {
    return scores.find(s => s.participant_id === participantId);
  };

  const getStatusColor = (participantId) => {
    const score = getParticipantScore(participantId);
    if (!score) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (participantId) => {
    const score = getParticipantScore(participantId);
    if (!score) return 'Pendiente';
    return 'Calificado';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de calificación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/judge" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                ⚖️ Sistema de Calificación
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Juez: {user?.first_name || 'Usuario'} {user?.last_name || ''}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Competition Info */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{competition.name}</h2>
                  <p className="text-sm text-gray-500">
                    {competition.discipline} • {competition.location}
                  </p>
                  <p className="text-sm text-gray-500">
                    {competition.startDate} - {competition.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🔴 En Vivo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🏇</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Participantes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {participants.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Calificados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {scores.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pendientes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {participants.length - scores.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Progreso
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.round((scores.length / participants.length) * 100)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Participants List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Orden de Participación
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Participantes en orden de salida - FEI Show Jumping Rules
              </p>
            </div>

            {loading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando participantes...</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {participants.map((participant) => {
                  const score = getParticipantScore(participant.id);
                  return (
                    <li key={participant.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center">
                                <span className="text-blue-600 font-bold">#{participant.bib_number}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {participant.rider.first_name} {participant.rider.last_name} + {participant.horse.name}
                                </div>
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(participant.id)}`}>
                                  {getStatusText(participant.id)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                Categoría: {participant.category} • Orden: {participant.order}
                              </div>
                              {score && (
                                <div className="text-sm text-gray-600 mt-1">
                                  <div className="grid grid-cols-4 gap-4">
                                    <span>⏱️ Tiempo: {formatTime(score.time_seconds)}</span>
                                    <span>❌ Faltas: {score.faults}</span>
                                    <span>⏰ Tiempo: {score.time_faults}</span>
                                    <span>🚫 Rehusos: {score.refusals}</span>
                                  </div>
                                  <div className="mt-1">
                                    <span className="font-semibold">Puntuación Final: {score.final_score} puntos</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {score && (
                              <div className="text-right text-sm text-gray-500">
                                Calificado: {new Date(score.created_at).toLocaleTimeString('es-ES')}
                              </div>
                            )}
                            <div className="flex space-x-2">
                              {!score ? (
                                <button
                                  onClick={() => handleScoreParticipant(participant.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                >
                                  Calificar
                                </button>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleScoreParticipant(participant.id)}
                                    className="text-yellow-600 hover:text-yellow-500 text-sm font-medium"
                                  >
                                    Editar
                                  </button>
                                  <span className="text-green-600 text-sm font-medium">
                                    ✅ Completado
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Reglas FEI */}
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              📖 Reglas FEI de Puntuación - Salto Ecuestre
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">Penalizaciones por Faltas:</h4>
                <ul className="space-y-1">
                  <li>• Derribo de obstáculo: 4 puntos</li>
                  <li>• Primera desobediencia: 4 puntos</li>
                  <li>• Segunda desobediencia: Eliminación</li>
                  <li>• Caída del jinete: Eliminación</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Penalizaciones por Tiempo:</h4>
                <ul className="space-y-1">
                  <li>• Cada segundo excedido: 1 punto</li>
                  <li>• Tiempo máximo: 2x tiempo permitido</li>
                  <li>• Menor puntuación = mejor resultado</li>
                  <li>• En caso de empate: tiempo menor gana</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Modal de Calificación */}
          <ScoreParticipantModal
            isOpen={showScoreModal}
            onClose={() => setShowScoreModal(false)}
            onSubmit={handleSubmitScore}
            participant={selectedParticipant}
            existingScore={selectedParticipant ? getParticipantScore(selectedParticipant.id) : null}
          />
        </div>
      </main>
    </div>
  );
};

export default ScoringPage;