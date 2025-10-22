import { Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';

const JudgeDashboard = () => {
  const { user, logout } = useAuth();

  // Conectar al store de competencias
  const {
    competitions,
    loading,
    error,
    loadCompetitions
  } = useCompetitionStore();

  // Cargar competencias al montar
  useEffect(() => {
    loadCompetitions();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Filtrar competencias donde podría ser juez asignado
  // TODO: Cuando tengamos el endpoint my_assigned, usarlo
  const assignedCompetitions = useMemo(() => {
    return competitions
      .filter(c => c.status !== 'draft')
      .slice(0, 3)
      .map(c => ({
        id: c.id,
        name: c.name,
        date: c.start_date,
        location: `${c.venue_city || 'Ciudad'}, ${c.venue_country || 'País'}`,
        discipline: c.discipline || 'Dressage',
        participants: c.participant_count || 0,
        status: c.status === 'completed' ? 'completed' :
                c.status === 'in_progress' ? 'pending_evaluation' : 'upcoming',
        myRole: 'Juez Asignado'
      }));
  }, [competitions]);

  // Calcular estadísticas reales
  const stats = useMemo(() => {
    const activeCompetitions = competitions.filter(c =>
      ['open_registration', 'in_progress', 'registration_closed'].includes(c.status)
    );

    return {
      assignedCompetitions: assignedCompetitions.length,
      completedEvaluations: competitions.filter(c => c.status === 'completed').length,
      pendingEvaluations: activeCompetitions.filter(c => c.status === 'in_progress').length,
      totalParticipantsJudged: competitions.reduce((sum, c) => sum + (c.participant_count || 0), 0),
      upcomingJudging: competitions.filter(c =>
        ['open_registration', 'published'].includes(c.status) &&
        new Date(c.start_date) > new Date()
      ).length,
      averageRating: 4.7 // TODO: Calcular desde evaluaciones reales
    };
  }, [competitions, assignedCompetitions]);

  // Evaluaciones pendientes (temporal - conectar a scoring después)
  const pendingEvaluations = useMemo(() => {
    const activeComps = assignedCompetitions.filter(c => c.status === 'pending_evaluation');
    return activeComps.slice(0, 3).map((c, index) => ({
      id: index + 1,
      participant: `Participante ${index + 1}`,
      horse: `Caballo ${index + 1}`,
      competition: c.name,
      discipline: c.discipline,
      deadline: new Date(c.date).toLocaleDateString('es-ES')
    }));
  }, [assignedCompetitions]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'pending_evaluation': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'upcoming': return 'Próxima';
      case 'pending_evaluation': return 'Pendiente Evaluación';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  // Mostrar loading
  if (loading && competitions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando competencias asignadas...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                ⚖️ Panel de Juez
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard General
              </Link>
              <Link
                to="/profile"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mi Perfil
              </Link>
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
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bienvenido, {user?.first_name}
              </h2>
              <p className="text-gray-600">
                Panel de juez del Sistema FEI. Gestiona tus evaluaciones, revisa competencias asignadas y mantén tu historial de calificaciones.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-blue-600 text-3xl">⚖️</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Competencias Asignadas
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.assignedCompetitions}
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
                    <div className="text-green-600 text-3xl">✅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Evaluaciones Completadas
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.completedEvaluations}
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
                    <div className="text-red-600 text-3xl">⏰</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Evaluaciones Pendientes
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.pendingEvaluations}
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
                    <div className="text-purple-600 text-3xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Participantes Evaluados
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.totalParticipantsJudged}
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
                    <div className="text-orange-600 text-3xl">📅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Próximas Evaluaciones
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.upcomingJudging}
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
                    <div className="text-yellow-600 text-3xl">⭐</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Valoración Promedio
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.averageRating}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Link
              to="/judge/competitions"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="text-lg font-bold">Mis Competencias</h3>
                <p className="text-sm opacity-90 mt-1">Ver asignaciones FEI</p>
              </div>
            </Link>

            <Link
              to="/judge/scoring/1"
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">⚖️</div>
                <h3 className="text-lg font-bold">Calificar</h3>
                <p className="text-sm opacity-90 mt-1">Sistema de puntuación</p>
              </div>
            </Link>

            <Link
              to="/rankings/1"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-lg font-bold">Rankings</h3>
                <p className="text-sm opacity-90 mt-1">Ver clasificaciones</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">👤</div>
                <h3 className="text-lg font-bold">Mi Perfil</h3>
                <p className="text-sm opacity-90 mt-1">Configuración de juez</p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assigned Competitions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Competencias Asignadas
                </h3>
                <div className="space-y-4">
                  {assignedCompetitions.map((competition) => (
                    <div key={competition.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {competition.name}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(competition.status)
                        }`}>
                          {getStatusText(competition.status)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p>📅 {new Date(competition.date).toLocaleDateString('es-ES')}</p>
                        <p>📍 {competition.location}</p>
                        <p>🏆 {competition.discipline}</p>
                        <p>👥 {competition.participants} participantes</p>
                        <p className="font-medium text-gray-700">🎯 {competition.myRole}</p>
                      </div>
                      <div className="mt-3 space-x-2">
                        {competition.status === 'pending_evaluation' && (
                          <Link
                            to={`/judge/scoring/${competition.id}`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            ⚖️ Evaluar
                          </Link>
                        )}
                        <Link
                          to={`/rankings/${competition.id}`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          📊 Rankings
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    to="/judge/competitions"
                    className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm font-medium rounded-md transition-colors"
                  >
                    ⚖️ Ver todas mis competencias
                  </Link>
                </div>
              </div>
            </div>

            {/* Pending Evaluations */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Evaluaciones Pendientes Urgentes
                </h3>
                <div className="space-y-4">
                  {pendingEvaluations.map((evaluation) => (
                    <div key={evaluation.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {evaluation.participant} - {evaluation.horse}
                        </h4>
                        <span className="text-xs text-red-600 font-medium">
                          ⏰ Vence: {new Date(evaluation.deadline).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>🏆 {evaluation.competition}</p>
                        <p>🎯 Disciplina: {evaluation.discipline}</p>
                      </div>
                      <div className="mt-3">
                        <Link
                          to={`/judge/scoring/${assignedCompetitions[0]?.id || 1}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          ⚖️ Evaluar ahora
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <p className="text-center text-sm text-gray-500">
                    Sistema de evaluaciones disponible próximamente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JudgeDashboard;