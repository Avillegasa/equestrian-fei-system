import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const stats = {
    totalUsers: 156,
    activeCompetitions: 8,
    totalCompetitions: 45,
    totalJudges: 23,
    totalOrganizers: 12,
    pendingApprovals: 5
  };

  const recentActivity = [
    {
      id: 1,
      action: 'Nuevo usuario registrado',
      user: 'María González',
      time: 'Hace 5 minutos',
      type: 'user'
    },
    {
      id: 2,
      action: 'Competencia creada',
      user: 'Carlos Rodríguez',
      time: 'Hace 15 minutos',
      type: 'competition'
    },
    {
      id: 3,
      action: 'Solicitud de juez aprobada',
      user: 'Ana Martín',
      time: 'Hace 30 minutos',
      type: 'approval'
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
                👑 Panel de Administración
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Panel Admin
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
                Panel de administración del Sistema FEI. Aquí puedes gestionar usuarios, competencias y supervisar toda la actividad del sistema.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-blue-600 text-3xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total de Usuarios
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.totalUsers}
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
                    <div className="text-green-600 text-3xl">🏆</div>
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
                    <div className="text-purple-600 text-3xl">⚖️</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total de Jueces
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.totalJudges}
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
                    <div className="text-orange-600 text-3xl">📋</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Organizadores
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.totalOrganizers}
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
                        Total Competencias
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.totalCompetitions}
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
                        Pendientes Aprobación
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.pendingApprovals}
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
              to="/admin/users"
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-lg font-semibold">Gestionar Usuarios</h3>
                <p className="text-sm opacity-90">Ver, editar y administrar usuarios</p>
              </div>
            </Link>

            <Link
              to="/admin/competitions"
              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="text-lg font-semibold">Competencias</h3>
                <p className="text-sm opacity-90">Supervisar todas las competencias</p>
              </div>
            </Link>

            <Link
              to="/admin/approvals"
              className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="text-lg font-semibold">Aprobaciones</h3>
                <p className="text-sm opacity-90">Revisar solicitudes pendientes</p>
              </div>
            </Link>

            <Link
              to="/admin/reports"
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="text-lg font-semibold">Reportes</h3>
                <p className="text-sm opacity-90">Estadísticas y análisis</p>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Actividad Reciente del Sistema
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
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              activity.type === 'user' ? 'bg-blue-500' :
                              activity.type === 'competition' ? 'bg-green-500' :
                              'bg-purple-500'
                            }`}>
                              <span className="text-white text-sm">
                                {activity.type === 'user' ? '👤' :
                                 activity.type === 'competition' ? '🏆' :
                                 '✅'}
                              </span>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {activity.action}: <span className="font-medium text-gray-900">{activity.user}</span>
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
                  to="/admin/activity-log"
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Ver toda la actividad
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;