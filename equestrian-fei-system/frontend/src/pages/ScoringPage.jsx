import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import competitionService from '../services/competitionService';
import scoringService from '../services/scoringService';
import ScoreParticipantModal from '../components/ScoreParticipantModal';
import DressageScoreModal from '../components/scoring/DressageScoreModal';

const ScoringPage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [participants, setParticipants] = useState([]);
  const [scores, setScores] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedScorecard, setSelectedScorecard] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadCompetitionData();
  }, [competitionId, user]);

  const loadCompetitionData = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Cargar competencia
      const compData = await competitionService.getCompetitionById(competitionId);
      setCompetition(compData);

      // 2. Cargar participantes REALES
      const participantsData = await competitionService.getCompetitionParticipants(competitionId);
      // Filtrar solo participantes confirmados
      const confirmedParticipants = participantsData.filter(p => p.is_confirmed);
      setParticipants(confirmedParticipants);

      // 3. Cargar scores existentes del juez
      const existingScores = await scoringService.getScoreCards({
        competition: competitionId,
        judge: user.id
      });
      setScores(existingScores);

    } catch (err) {
      console.error('Error loading competition data:', err);
      setError('Error al cargar los datos de la competencia');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleScoreParticipant = async (participant) => {
    try {
      // Verificar si ya existe scorecard
      let scorecard = scores.find(s => s.participant === participant.id || s.participant_id === participant.id);

      if (!scorecard) {
        // Crear nuevo scorecard en backend
        scorecard = await scoringService.createScoreCard({
          participant: participant.id,
          judge: user.id,
          competition: competitionId,
          status: 'in_progress'
        });

        setScores([...scores, scorecard]);
      }

      setSelectedParticipant(participant);
      setSelectedScorecard(scorecard);
      setShowScoreModal(true);

    } catch (err) {
      console.error('Error creating scorecard:', err);
      setError('Error al crear la tarjeta de calificación');
    }
  };

  const handleSubmitScore = async (scoreData) => {
    try {
      const isDressage = competition.discipline?.toLowerCase() === 'dressage';

      if (isDressage) {
        // Guardar movimientos de Dressage
        if (scoreData.exercises) {
          for (const exercise of scoreData.exercises) {
            await scoringService.createDressageMovement({
              score_card: selectedScorecard.id,
              movement_number: exercise.number,
              movement_name: exercise.description,
              score: exercise.score,
              coefficient: exercise.coefficient || 1,
              remarks: exercise.remarks || ''
            });
          }
        }

        // Guardar marcas colectivas
        if (scoreData.collectiveMarks) {
          for (const mark of scoreData.collectiveMarks) {
            await scoringService.createIndividualScore({
              score_card: selectedScorecard.id,
              criteria: mark.aspect || mark.category,
              raw_score: mark.score,
              weighted_score: mark.score * (mark.coefficient || 1)
            });
          }
        }
      } else {
        // Show Jumping - actualizar scorecard con tiempo y faltas
        await scoringService.updateScoreCard(selectedScorecard.id, {
          time_seconds: scoreData.time || 0,
          time_faults: scoreData.timeFaults || 0,
          jumping_faults: scoreData.faults || 0,
          refusals: scoreData.refusals || 0,
          status: 'completed'
        });

        // Si hay faltas, crear registro de falta
        if (scoreData.faults > 0) {
          await scoringService.createJumpingFault({
            score_card: selectedScorecard.id,
            fault_type: 'knockdown',
            obstacle_number: scoreData.obstacleNumber || 0,
            penalty_points: scoreData.faults
          });
        }
      }

      // Completar evaluación
      await scoringService.completeEvaluation(selectedScorecard.id);

      // Recargar scores
      await loadCompetitionData();

      setShowScoreModal(false);
      setSelectedParticipant(null);
      setSelectedScorecard(null);
      setSuccess('✅ Calificación guardada exitosamente');

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error submitting score:', err);
      setError('❌ Error al guardar la calificación');

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleViewScore = (participant) => {
    const scorecard = scores.find(s => s.participant === participant.id || s.participant_id === participant.id);
    if (scorecard) {
      setSelectedParticipant(participant);
      setSelectedScorecard(scorecard);
      setShowScoreModal(true);
    }
  };

  const getParticipantStatus = (participant) => {
    const scorecard = scores.find(s => s.participant === participant.id || s.participant_id === participant.id);

    if (!scorecard) {
      return { status: 'pending', text: '⏳ Pendiente', color: 'bg-gray-100 text-gray-800' };
    }

    switch (scorecard.status) {
      case 'in_progress':
        return { status: 'in_progress', text: '🔄 En Progreso', color: 'bg-blue-100 text-blue-800' };
      case 'completed':
        return {
          status: 'completed',
          text: `✅ ${scorecard.final_score?.toFixed(2) || 'Calificado'}`,
          color: 'bg-green-100 text-green-800',
          score: scorecard.final_score
        };
      default:
        return { status: 'pending', text: '⏳ Pendiente', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getFilteredParticipants = () => {
    let filtered = [...participants];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p => {
        const riderName = `${p.rider?.first_name || ''} ${p.rider?.last_name || ''}`.toLowerCase();
        const horseName = p.horse?.name?.toLowerCase() || '';
        const bibNumber = p.bib_number?.toString() || '';

        return riderName.includes(searchTerm.toLowerCase()) ||
               horseName.includes(searchTerm.toLowerCase()) ||
               bibNumber.includes(searchTerm);
      });
    }

    // Filtro de categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category?.name === categoryFilter || p.category_name === categoryFilter);
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => {
        const status = getParticipantStatus(p);
        return status.status === statusFilter;
      });
    }

    return filtered;
  };

  const getUniqueCategories = () => {
    const categories = participants.map(p => p.category?.name || p.category_name).filter(Boolean);
    return [...new Set(categories)];
  };

  const getStats = () => {
    const total = participants.length;
    const scored = scores.filter(s => s.status === 'completed').length;
    const inProgress = scores.filter(s => s.status === 'in_progress').length;
    const pending = total - scored - inProgress;

    return { total, scored, inProgress, pending };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de calificación...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Competencia no encontrada</h3>
          <p className="text-gray-600 mb-4">No se pudo cargar la información de la competencia</p>
          <button
            onClick={() => navigate('/judge/competitions')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Volver a Mis Competencias
          </button>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const filteredParticipants = getFilteredParticipants();
  const categories = getUniqueCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* LEFT SIDE */}
            <div className="flex items-center space-x-4">
              <Link
                to="/judge/competitions"
                className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors duration-200 bg-orange-50 px-3 py-2 rounded-lg font-medium"
              >
                <span>←</span>
                <span>Mis Competencias</span>
              </Link>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📝</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Calificación de Participantes</h1>
                  <p className="text-sm text-gray-600">Sistema de Scoring FEI</p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600">Juez FEI</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Competition Info Card */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 overflow-hidden shadow-xl rounded-xl mb-8">
            <div className="px-6 py-8 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {competition.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
                    <span className="flex items-center">
                      🏆 {competition.discipline || 'Disciplina no especificada'}
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="flex items-center">
                      📍 {competition.location || competition.venue_city}
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="flex items-center">
                      📅 {new Date(competition.start_date || competition.startDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-white text-orange-600 shadow-lg">
                    📝 Calificación Activa
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Total Participantes
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {stats.total}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">👥</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-green-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Calificados
                    </dt>
                    <dd className="text-3xl font-bold text-green-600">
                      {stats.scored}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">✅</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      En Progreso
                    </dt>
                    <dd className="text-3xl font-bold text-blue-600">
                      {stats.inProgress}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">🔄</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-gray-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Pendientes
                    </dt>
                    <dd className="text-3xl font-bold text-gray-600">
                      {stats.pending}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">⏳</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Buscar Participante
                </label>
                <input
                  type="text"
                  placeholder="Jinete, caballo o número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 Categoría
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="in_progress">En progreso</option>
                  <option value="completed">Calificados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Participants Table */}
          <div className="bg-white shadow-xl rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Lista de Participantes ({filteredParticipants.length})
              </h3>
            </div>

            {filteredParticipants.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-6xl mb-4 block">🔍</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No se encontraron participantes
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Aún no hay participantes registrados en esta competencia'}
                </p>
                {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setStatusFilter('all');
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jinete
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Caballo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredParticipants.map((participant) => {
                      const status = getParticipantStatus(participant);
                      return (
                        <tr key={participant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-800 font-bold">
                              {participant.bib_number || '?'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {participant.rider?.first_name} {participant.rider?.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {participant.rider?.email || 'Email no disponible'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              🐴 {participant.horse?.name || 'Caballo no asignado'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              {participant.category?.name || participant.category_name || 'Sin categoría'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {status.status === 'completed' ? (
                              <button
                                onClick={() => handleViewScore(participant)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                              >
                                <span>👁️</span>
                                <span>Ver Score</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleScoreParticipant(participant)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                              >
                                <span>📝</span>
                                <span>Calificar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showScoreModal && selectedParticipant && (
        competition.discipline?.toLowerCase() === 'dressage' ? (
          <DressageScoreModal
            isOpen={showScoreModal}
            onClose={() => {
              setShowScoreModal(false);
              setSelectedParticipant(null);
              setSelectedScorecard(null);
            }}
            onSubmit={handleSubmitScore}
            participant={selectedParticipant}
            competition={competition}
            existingScorecard={selectedScorecard}
          />
        ) : (
          <ScoreParticipantModal
            isOpen={showScoreModal}
            onClose={() => {
              setShowScoreModal(false);
              setSelectedParticipant(null);
              setSelectedScorecard(null);
            }}
            onSubmit={handleSubmitScore}
            participant={selectedParticipant}
            competition={competition}
            existingScorecard={selectedScorecard}
          />
        )
      )}
    </div>
  );
};

export default ScoringPage;
