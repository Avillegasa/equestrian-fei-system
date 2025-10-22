import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { competitions, categories, loadCompetitions, loadCategories } = useCompetitionStore();

  // Cargar datos reales
  useEffect(() => {
    loadCompetitions();
    loadCategories();
  }, [loadCompetitions, loadCategories]);

  // Asegurar que sean arrays
  const safeCompetitions = Array.isArray(competitions) ? competitions : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const handleLogout = async () => {
    await logout();
  };

  // Calcular estadísticas reales desde los datos
  const stats = {
    totalUsers: 1, // Por ahora, hardcodeado (necesitaría un endpoint de usuarios)
    activeCompetitions: safeCompetitions.filter(c => c.status === 'in_progress').length,
    totalCompetitions: safeCompetitions.length,
    totalJudges: 0, // Necesitaría endpoint de usuarios con rol judge
    totalOrganizers: 0, // Necesitaría endpoint de usuarios con rol organizer
    pendingApprovals: 0 // Necesitaría endpoint de aprobaciones pendientes
  };

  // Obtener próximas competencias (ordenadas por fecha)
  const upcomingCompetitions = safeCompetitions
    .filter(c => new Date(c.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 3);

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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
                    <div className="text-purple-600 text-3xl">📋</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Categorías FEI
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {safeCategories.length}
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
              to="/admin/categories"
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📋</div>
                <h3 className="text-lg font-semibold">Gestionar Categorías</h3>
                <p className="text-sm opacity-90">Administrar categorías FEI oficiales</p>
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
              className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="text-lg font-semibold">Reportes</h3>
                <p className="text-sm opacity-90">Estadísticas y análisis</p>
              </div>
            </Link>

            <Link
              to="/admin/activity-log"
              className="bg-gray-600 hover:bg-gray-700 text-white p-6 rounded-lg shadow transition-colors"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="text-lg font-semibold">Actividad del Sistema</h3>
                <p className="text-sm opacity-90">Monitor y logs de actividad</p>
              </div>
            </Link>
          </div>

          {/* Próximas Competencias */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Próximas Competencias
              </h3>
              {upcomingCompetitions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingCompetitions.map((competition) => (
                    <div key={competition.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className="text-3xl">🏆</span>
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">
                            {competition.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(competition.start_date).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          competition.status === 'open_registration' ? 'bg-green-100 text-green-800' :
                          competition.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {competition.status === 'open_registration' ? 'Inscripción Abierta' :
                           competition.status === 'upcoming' ? 'Próximamente' :
                           competition.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">📅</span>
                  <p className="text-gray-500">No hay competencias programadas</p>
                </div>
              )}
              <div className="mt-6">
                <Link
                  to="/admin/competitions"
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Ver todas las competencias
                </Link>
              </div>
            </div>
          </div>

          {/* Estado del Sistema */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md mt-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Estado del Sistema
              </h3>
              <div className="flex items-center space-x-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-green-700 font-medium">Operativo</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Todos los servicios funcionando correctamente
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;