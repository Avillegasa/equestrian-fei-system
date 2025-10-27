import { Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';

const ViewerDashboard = () => {
  const { user, logout } = useAuth();

  // Conectar al store de competencias
  const { competitions, loading, loadCompetitions } = useCompetitionStore();

  // Cargar competencias al montar
  useEffect(() => {
    loadCompetitions();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Competencias públicas disponibles para ver
  const publicCompetitions = useMemo(() => {
    return competitions
      .filter(c => c.status !== 'draft' && c.status !== 'cancelled')
      .sort((a, b) => new Date(b.startDate || b.start_date) - new Date(a.startDate || a.start_date));
  }, [competitions]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      published: 'bg-blue-100 text-blue-800 border-blue-300',
      open_registration: 'bg-green-100 text-green-800 border-green-300',
      registration_closed: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusDisplay = (status) => {
    const statuses = {
      published: 'Publicada',
      open_registration: 'Inscripción Abierta',
      registration_closed: 'Inscripción Cerrada',
      in_progress: 'En Progreso',
      completed: 'Completada'
    };
    return statuses[status] || status;
  };

  // Loading state
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">👁️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Espectador</h1>
                <p className="text-sm text-gray-600">Sistema FEI - Solo Lectura</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                to="/profile"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                👤 Mi Perfil
              </Link>
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
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-lg p-6 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">
            ¡Bienvenido, {user?.first_name}! 👁️
          </h2>
          <p className="text-gray-100">
            Explora las competencias FEI y sigue los resultados en tiempo real.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Competencias</p>
                <p className="text-3xl font-bold text-gray-900">{publicCompetitions.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-3xl font-bold text-gray-900">
                  {publicCompetitions.filter(c => c.status === 'in_progress').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">▶️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {publicCompetitions.filter(c => c.status === 'completed').length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Competencias Públicas */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">🏆</span>
              Competencias Disponibles
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {publicCompetitions.length} competencia(s) • Explora y ve los resultados
            </p>
          </div>

          <div className="p-6">
            {publicCompetitions.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📭</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay competencias disponibles</h3>
                <p className="text-gray-500">
                  No hay competencias públicas en este momento. Vuelve pronto.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicCompetitions.map((competition) => (
                  <div
                    key={competition.id}
                    className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">🏇</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(competition.status)}`}>
                        {getStatusDisplay(competition.status)}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {competition.name}
                    </h4>

                    <div className="space-y-2 text-sm mb-4">
                      <p className="text-gray-600 flex items-center">
                        <span className="mr-2">📍</span>
                        {competition.venueCity || competition.venue_city}, {competition.venueCountry || competition.venue_country}
                      </p>
                      <p className="text-gray-600 flex items-center">
                        <span className="mr-2">📅</span>
                        {formatDate(competition.startDate || competition.start_date)}
                      </p>
                      <p className="text-gray-600 flex items-center">
                        <span className="mr-2">🎯</span>
                        <span className="capitalize">{competition.discipline}</span>
                      </p>
                      {competition.participantCount > 0 && (
                        <p className="text-gray-600 flex items-center">
                          <span className="mr-2">👥</span>
                          {competition.participantCount || competition.participant_count || 0} participantes
                        </p>
                      )}
                    </div>

                    <Link
                      to={`/rankings/${competition.id}`}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>📊</span>
                      <span>Ver Resultados</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl flex-shrink-0">ℹ️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-blue-900 mb-2">Modo Espectador</h4>
              <p className="text-xs text-blue-700">
                Como espectador, puedes ver todas las competencias públicas y sus resultados en tiempo real.
                No puedes inscribirte, calificar ni organizar competencias. Si deseas participar activamente,
                contacta al administrador para cambiar tu rol.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewerDashboard;
