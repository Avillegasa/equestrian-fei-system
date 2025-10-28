import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';

const AdminDashboardPro = () => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentActivity, setRecentActivity] = useState([]);

  const {
    competitions,
    categories,
    loading,
    loadCompetitions,
    loadCategories
  } = useCompetitionStore();

  useEffect(() => {
    loadCompetitions();
    loadCategories();

    // Actualizar la hora cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [loadCompetitions, loadCategories]);

  const handleLogout = async () => {
    await logout();
  };

  // Calcular estadísticas reales
  const stats = {
    totalCompetitions: competitions.length,
    activeCompetitions: competitions.filter(c => c.status === 'in_progress' || c.status === 'open_registration').length,
    draftCompetitions: competitions.filter(c => c.status === 'draft').length,
    completedCompetitions: competitions.filter(c => c.status === 'completed').length,
    totalCategories: categories.length,
    activeCategories: categories.filter(c => c.is_active).length,
  };

  const quickActions = [
    {
      title: 'Nueva Competencia',
      description: 'Crear y configurar competencia FEI',
      icon: '🏆',
      href: '/admin/competitions',
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    },
    {
      title: 'Gestionar Categorías',
      description: 'Administrar categorías oficiales',
      icon: '📋',
      href: '/admin/categories',
      color: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-white'
    },
    {
      title: 'Usuarios del Sistema',
      description: 'Gestión de roles y permisos',
      icon: '👥',
      href: '/admin/users',
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-white'
    },
    // DISABLED: Reports feature temporarily disabled
    // {
    //   title: 'Reportes FEI',
    //   description: 'Generar reportes oficiales',
    //   icon: '📊',
    //   href: '/admin/reports',
    //   color: 'bg-orange-600 hover:bg-orange-700',
    //   textColor: 'text-white'
    // },
    {
      title: 'Aprobaciones',
      description: 'Revisar solicitudes pendientes',
      icon: '✅',
      href: '/admin/approvals',
      color: 'bg-red-600 hover:bg-red-700',
      textColor: 'text-white'
    },
    {
      title: 'Actividad del Sistema',
      description: 'Monitor y logs de actividad',
      icon: '📈',
      href: '/admin/activity-log',
      color: 'bg-gray-600 hover:bg-gray-700',
      textColor: 'text-white'
    }
  ];

  const upcomingCompetitions = competitions
    .filter(c => new Date(c.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 3);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Profesional */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">FEI</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                  <p className="text-sm text-gray-600">Sistema de Gestión FEI Ecuestre</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600">Administrador FEI</p>
                <p className="text-xs text-gray-500">{formatTime(currentTime)}</p>
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
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  ¡Bienvenido, {user?.first_name}!
                </h2>
                <p className="text-blue-100 text-lg">
                  Sistema de gestión para competencias ecuestres oficiales FEI
                </p>
                <p className="text-blue-200 text-sm mt-2">
                  Hoy es {formatDate(currentTime.toISOString())}
                </p>
              </div>
              <div className="text-6xl opacity-20">
                🏇
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Competencias</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCompetitions}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                {stats.activeCompetitions} activas
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categorías FEI</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                {stats.activeCategories} activas
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeCompetitions}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-orange-600 font-medium">
                {stats.draftCompetitions} borradores
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedCompetitions}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-blue-600 font-medium">
                Este año
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className={`${action.color} ${action.textColor} p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {action.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{action.title}</h4>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Upcoming Competitions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Próximas Competencias</h3>
              <Link
                to="/admin/competitions"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver todas →
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : upcomingCompetitions.length > 0 ? (
              <div className="space-y-4">
                {upcomingCompetitions.map((competition) => (
                  <div key={competition.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{competition.name}</h4>
                        <p className="text-sm text-gray-600">{competition.venue_city}, {competition.venue_country}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(competition.start_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {competition.discipline}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-4 block">📅</span>
                <p>No hay competencias programadas</p>
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Estado del Sistema</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Servicios FEI</span>
                </div>
                <span className="text-green-600 text-sm font-medium">Operativo</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Base de Datos</span>
                </div>
                <span className="text-green-600 text-sm font-medium">Conectada</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Sistema de Rankings</span>
                </div>
                <span className="text-green-600 text-sm font-medium">En Línea</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">Backup Automático</span>
                </div>
                <span className="text-yellow-600 text-sm font-medium">Programado</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Información del Sistema</h4>
              <p className="text-blue-700 text-sm">
                Versión FEI: 2024.1.0<br />
                Última actualización: {formatDate(new Date().toISOString())}<br />
                Modo: Producción
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPro;