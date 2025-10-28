import { Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';

const OrganizerDashboard = () => {
  const { user, logout } = useAuth();

  // Conectar al store de competencias
  const {
    competitions,
    loading,
    error,
    loadCompetitions
  } = useCompetitionStore();

  // Cargar competencias al montar el componente
  useEffect(() => {
    // Cargar todas las competencias en lugar de solo "mis competencias"
    // porque loadMyCompetitions puede estar filtrando incorrectamente
    loadCompetitions();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Calcular estadísticas reales desde el estado
  const stats = useMemo(() => {
    const activeStatuses = ['open_registration', 'in_progress', 'registration_closed'];
    const upcomingStatuses = ['published', 'open_registration'];
    const completedStatuses = ['completed'];
    const draftStatuses = ['draft'];

    return {
      myCompetitions: competitions.length,
      activeCompetitions: competitions.filter(c => activeStatuses.includes(c.status)).length,
      totalParticipants: competitions.reduce((sum, c) => sum + (c.participant_count || 0), 0),
      upcomingEvents: competitions.filter(c =>
        upcomingStatuses.includes(c.status) && new Date(c.start_date) > new Date()
      ).length,
      completedEvents: competitions.filter(c => completedStatuses.includes(c.status)).length,
      draftEvents: competitions.filter(c => draftStatuses.includes(c.status)).length
    };
  }, [competitions]);

  // Obtener próximas competencias (reales)
  const upcomingCompetitions = useMemo(() => {
    return competitions
      .filter(c => new Date(c.start_date) > new Date())
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, 3)
      .map(c => ({
        id: c.id,
        name: c.name,
        date: c.start_date,
        location: `${c.venue_city || 'Ciudad'}, ${c.venue_country || 'País'}`,
        participants: c.participant_count || 0,
        status: c.status
      }));
  }, [competitions]);

  // Actividad reciente (temporal - se puede conectar a audit logs después)
  const recentActivity = useMemo(() => {
    return competitions
      .slice(0, 3)
      .map((c, index) => ({
        id: c.id,
        action: index === 0 ? 'Competencia actualizada' :
                index === 1 ? 'Competencia creada' : 'Estado cambiado',
        competition: c.name,
        time: new Date(c.updated_at || c.created_at).toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric'
        })
      }));
  }, [competitions]);

  // Mostrar loading
  if (loading && competitions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando competencias...</p>
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
                🏆 Panel de Organizador
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
                Panel de organizador del Sistema FEI. Gestiona tus competencias, participantes y eventos ecuestres.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-blue-600 text-3xl">🏆</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Mis Competencias
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.myCompetitions}
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
                        Competencias Activas
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.activeCompetitions}
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
                        Total Participantes
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.totalParticipants}
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
                        Eventos Próximos
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.upcomingEvents}
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
                    <div className="text-gray-600 text-3xl">🏅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Eventos Completados
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.completedEvents}
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
                    <div className="text-yellow-600 text-3xl">📝</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Borradores
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.draftEvents}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <Link
              to="/organizer/competitions"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="text-lg font-bold">Mis Competencias</h3>
                <p className="text-sm opacity-90 mt-1">Gestionar todos mis eventos</p>
              </div>
            </Link>

            <Link
              to="/organizer/participants"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-lg font-bold">Participantes</h3>
                <p className="text-sm opacity-90 mt-1">Gestionar inscripciones</p>
              </div>
            </Link>

            <Link
              to="/organizer/categories"
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-lg font-bold">Categorías</h3>
                <p className="text-sm opacity-90 mt-1">Gestionar categorías FEI</p>
              </div>
            </Link>

            <Link
              to="/organizer/templates"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">📄</div>
                <h3 className="text-lg font-bold">Plantillas</h3>
                <p className="text-sm opacity-90 mt-1">Gestionar plantillas de calificación</p>
              </div>
            </Link>

            {/* DISABLED: Reports feature temporarily disabled */}
            {/* <Link
              to="/reports"
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-lg font-bold">Reportes</h3>
                <p className="text-sm opacity-90 mt-1">Estadísticas y análisis</p>
              </div>
            </Link> */}

            <Link
              to="/profile"
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">👤</div>
                <h3 className="text-lg font-bold">Mi Perfil</h3>
                <p className="text-sm opacity-90 mt-1">Configuración personal</p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Competitions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Próximas Competencias
                </h3>
                <div className="space-y-4">
                  {upcomingCompetitions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl mb-4 block">📅</span>
                      <p>No hay competencias programadas</p>
                      <Link
                        to="/organizer/competitions"
                        className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        ➕ Crear nueva competencia
                      </Link>
                    </div>
                  ) : (
                    upcomingCompetitions.map((competition) => (
                    <div key={competition.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {competition.name}
                          </h4>
                          <p className="text-sm text-gray-500 mb-1">
                            📅 {new Date(competition.date).toLocaleDateString('es-ES')}
                          </p>
                          <p className="text-sm text-gray-500 mb-1">
                            📍 {competition.location}
                          </p>
                          <p className="text-sm text-gray-500">
                            👥 {competition.participants} participantes
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            competition.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {competition.status === 'confirmed' ? 'Confirmada' : 'Borrador'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link
                          to={`/organizer/competitions/${competition.id}/staff`}
                          className="inline-flex items-center px-3 py-1 mr-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          👥 Personal
                        </Link>
                        <Link
                          to={`/organizer/competitions/${competition.id}/participants`}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          🏇 Participantes
                        </Link>
                      </div>
                    </div>
                    ))
                  )}
                </div>
                <div className="mt-6">
                  <Link
                    to="/organizer/competitions"
                    className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm font-medium rounded-md transition-colors"
                  >
                    🏆 Ver todas mis competencias
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Actividad Reciente
                </h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {recentActivity.map((activity, index) => (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {index !== recentActivity.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <span className="text-white text-sm">📝</span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {activity.action}
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.competition}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>{activity.time}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <p className="text-center text-sm text-gray-500">
                    Actividad del sistema disponible próximamente
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

export default OrganizerDashboard;