import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ActivityLogPage = () => {
  const { user, logout } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const handleLogout = async () => {
    await logout();
  };

  // Datos de ejemplo para demostración
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setActivities([
        {
          id: 1,
          action: 'user_login',
          description: 'Usuario inició sesión',
          user: 'admin',
          userRole: 'admin',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2025-09-26T19:15:30Z',
          level: 'info',
          details: { loginMethod: 'username_password', success: true }
        },
        {
          id: 2,
          action: 'competition_created',
          description: 'Nueva competencia creada',
          user: 'organizer1',
          userRole: 'organizer',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (macOS Intel Mac OS X 10_15_7)',
          timestamp: '2025-09-26T18:45:12Z',
          level: 'info',
          details: { competitionName: 'FEI Dressage Madrid 2024', discipline: 'dressage' }
        },
        {
          id: 3,
          action: 'score_submitted',
          description: 'Puntuación enviada',
          user: 'judge1',
          userRole: 'judge',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
          timestamp: '2025-09-26T17:30:45Z',
          level: 'info',
          details: { scoreCard: 'SC001', participant: 'Ana Martínez', score: 8.5 }
        },
        {
          id: 4,
          action: 'user_registration',
          description: 'Nuevo usuario registrado',
          user: 'system',
          userRole: 'system',
          ipAddress: '192.168.1.103',
          userAgent: 'Mozilla/5.0 (Android 11; Mobile)',
          timestamp: '2025-09-26T16:20:18Z',
          level: 'info',
          details: { newUser: 'rider2', role: 'viewer' }
        },
        {
          id: 5,
          action: 'authentication_failed',
          description: 'Intento de login fallido',
          user: 'unknown',
          userRole: 'unknown',
          ipAddress: '192.168.1.200',
          userAgent: 'Python-requests/2.25.1',
          timestamp: '2025-09-26T15:10:22Z',
          level: 'warning',
          details: { attemptedUsername: 'hacker', reason: 'invalid_credentials' }
        },
        {
          id: 6,
          action: 'data_export',
          description: 'Exportación de datos realizada',
          user: 'admin',
          userRole: 'admin',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          timestamp: '2025-09-26T14:55:33Z',
          level: 'info',
          details: { exportType: 'competition_results', format: 'excel' }
        },
        {
          id: 7,
          action: 'system_error',
          description: 'Error en el sistema',
          user: 'system',
          userRole: 'system',
          ipAddress: 'internal',
          userAgent: 'Django/5.0.6',
          timestamp: '2025-09-26T13:42:15Z',
          level: 'error',
          details: { error: 'Database connection timeout', module: 'sync_service' }
        },
        {
          id: 8,
          action: 'offline_sync',
          description: 'Sincronización offline completada',
          user: 'judge1',
          userRole: 'judge',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0)',
          timestamp: '2025-09-26T12:30:08Z',
          level: 'info',
          details: { syncedItems: 15, conflicts: 0, duration: '2.3s' }
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getLevelColor = (level) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      debug: 'bg-gray-100 text-gray-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getLevelIcon = (level) => {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    };
    return icons[level] || 'ℹ️';
  };

  const getActionIcon = (action) => {
    const icons = {
      user_login: '🔑',
      user_logout: '🚪',
      user_registration: '👤',
      competition_created: '🏆',
      competition_updated: '✏️',
      score_submitted: '📝',
      authentication_failed: '🚫',
      data_export: '📊',
      system_error: '⚠️',
      offline_sync: '🔄',
      user_updated: '👥',
      competition_deleted: '🗑️'
    };
    return icons[action] || '📋';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.level === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/admin" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Volver al Panel Admin
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                📊 Registro de Actividad
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hola, {user?.username || 'Usuario'}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Eventos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {activities.length}
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
                    <span className="text-2xl">ℹ️</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Info
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {activities.filter(a => a.level === 'info').length}
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
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Warnings
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {activities.filter(a => a.level === 'warning').length}
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
                    <span className="text-2xl">❌</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Errores
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {activities.filter(a => a.level === 'error').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filtrar por nivel:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todos</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <span className="text-sm text-gray-500">
                Mostrando {filteredActivities.length} de {activities.length} eventos
              </span>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Registro de Actividad del Sistema
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Monitoreo completo de todas las acciones realizadas en el sistema FEI
              </p>
            </div>

            {loading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando registro de actividad...</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <li key={activity.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="text-xl">
                              {getActionIcon(activity.action)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {activity.description}
                              </div>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(activity.level)}`}>
                                {getLevelIcon(activity.level)} {activity.level.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Usuario: {activity.user} ({activity.userRole}) • IP: {activity.ipAddress}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(activity.timestamp)}
                            </div>
                            {activity.details && (
                              <div className="text-sm text-gray-600 mt-1">
                                Detalles: {JSON.stringify(activity.details, null, 2).slice(1, -1)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                            Ver Más
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between">
            <div className="flex space-x-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Exportar Log
              </button>
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Limpiar Log Antiguo
              </button>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Configurar Alertas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActivityLogPage;