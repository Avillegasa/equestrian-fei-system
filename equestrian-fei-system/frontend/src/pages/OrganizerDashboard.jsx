import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const OrganizerDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const stats = {
    myCompetitions: 12,
    activeCompetitions: 3,
    totalParticipants: 156,
    upcomingEvents: 5,
    completedEvents: 7,
    draftEvents: 2
  };

  const upcomingCompetitions = [
    {
      id: 1,
      name: 'Campeonato Nacional de Salto',
      date: '2024-02-15',
      location: 'Madrid, España',
      participants: 45,
      status: 'confirmed'
    },
    {
      id: 2,
      name: 'Copa de Primavera Dressage',
      date: '2024-03-20',
      location: 'Barcelona, España',
      participants: 32,
      status: 'draft'
    },
    {
      id: 3,
      name: 'Torneo Regional Concurso Completo',
      date: '2024-04-10',
      location: 'Valencia, España',
      participants: 28,
      status: 'confirmed'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Nuevo participante registrado',
      competition: 'Campeonato Nacional de Salto',
      time: 'Hace 10 minutos'
    },
    {
      id: 2,
      action: 'Competencia publicada',
      competition: 'Copa de Primavera Dressage',
      time: 'Hace 2 horas'
    },
    {
      id: 3,
      action: 'Juez asignado',
      competition: 'Torneo Regional Concurso Completo',
      time: 'Hace 1 día'
    }
  ];

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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Link
              to="/competitions/create"
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">➕</div>
                <h3 className="text-lg font-semibold">Nueva Competencia</h3>
                <p className="text-sm opacity-90">Crear evento ecuestre</p>
              </div>
            </Link>

            <Link
              to="/competitions/my"
              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="text-lg font-semibold">Mis Competencias</h3>
                <p className="text-sm opacity-90">Gestionar mis eventos</p>
              </div>
            </Link>

            <Link
              to="/participants"
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-lg font-semibold">Participantes</h3>
                <p className="text-sm opacity-90">Gestionar inscripciones</p>
              </div>
            </Link>

            <Link
              to="/organizer/reports"
              className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="text-lg font-semibold">Reportes</h3>
                <p className="text-sm opacity-90">Estadísticas de eventos</p>
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
                  {upcomingCompetitions.map((competition) => (
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
                          to={`/competitions/${competition.id}/edit`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Editar
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    to="/competitions/my"
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Ver todas mis competencias
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
                  <Link
                    to="/organizer/activity"
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Ver toda la actividad
                  </Link>
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