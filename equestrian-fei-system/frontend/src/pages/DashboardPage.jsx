import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: '👑',
      organizer: '🏆',
      judge: '⚖️', 
      viewer: '👁️'
    };
    return icons[role] || '👤';
  };

  const getRoleDisplay = (role) => {
    const roles = {
      admin: 'Administrador',
      organizer: 'Organizador',
      judge: 'Juez',
      viewer: 'Espectador'
    };
    return roles[role] || role;
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      admin: 'Gestionar todo el sistema, usuarios y competencias',
      organizer: 'Crear y gestionar competencias ecuestres',
      judge: 'Evaluar y calificar competencias',
      viewer: 'Visualizar competencias y resultados'
    };
    return descriptions[role] || 'Usuario del sistema';
  };

  const getRoleLinks = (role) => {
    switch(role) {
      case 'admin':
        return [
          { href: '/admin', label: 'Panel de Administración', icon: '⚙️' },
          { href: '/admin/users', label: 'Gestión de Usuarios', icon: '👥' },
          { href: '/admin/competitions', label: 'Gestión de Competencias', icon: '🏆' }
        ];
      case 'organizer':
        return [
          { href: '/organizer', label: 'Panel de Organizador', icon: '📋' },
          { href: '/competitions/create', label: 'Crear Competencia', icon: '➕' },
          { href: '/competitions/my', label: 'Mis Competencias', icon: '🏆' }
        ];
      case 'judge':
        return [
          { href: '/judge', label: 'Panel de Juez', icon: '⚖️' },
          { href: '/competitions/judge', label: 'Competencias Asignadas', icon: '📝' },
          { href: '/evaluations', label: 'Evaluaciones', icon: '⭐' }
        ];
      default:
        return [
          { href: '/competitions', label: 'Ver Competencias', icon: '🏆' },
          { href: '/results', label: 'Resultados', icon: '🏅' }
        ];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Sistema FEI
              </h1>
              <span className="ml-2 text-gray-500">Competencias Ecuestres</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/reports"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                📊 Reportes
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
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                    {getRoleIcon(user?.role)}
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    ¡Bienvenido, {user?.first_name}!
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getRoleDisplay(user?.role)}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    {getRoleDescription(user?.role)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {getRoleLinks(user?.role).map((link, index) => (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">
                        {link.icon}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Acción Rápida
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">
                            {link.label}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={link.href}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Ir a {link.label}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* System Status */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Estado del Sistema
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-green-600 text-2xl">✅</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Autenticación
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            Activo
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-blue-600 text-2xl">🔐</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Sesión
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            Segura
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-purple-600 text-2xl">⚡</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Sistema
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            Operativo
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Development Status */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Estado del Desarrollo
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">✅</div>
                  <span className="text-sm text-gray-900">ETAPA 1: Configuración del Entorno Base</span>
                </div>
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">✅</div>
                  <span className="text-sm text-gray-900">ETAPA 2: Sistema de Autenticación y Usuarios</span>
                </div>
                <div className="flex items-center">
                  <div className="text-gray-400 mr-3">⏳</div>
                  <span className="text-sm text-gray-500">ETAPA 3: Sistema de Gestión de Competencias</span>
                </div>
                <div className="flex items-center">
                  <div className="text-gray-400 mr-3">⏳</div>
                  <span className="text-sm text-gray-500">ETAPA 4: Sistema de Evaluación y Puntuación</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;