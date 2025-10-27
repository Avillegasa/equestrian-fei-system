import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LiveRankings from '../components/scoring/LiveRankings';

const RankingsPage = () => {
  const { user, logout, isRider } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                to={isRider() ? "/rider" : "/dashboard"}
                className="text-blue-600 hover:text-blue-500 mr-4"
              >
                ← Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                🏆 Rankings en Tiempo Real
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hola, {user?.first_name || 'Usuario'}
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

          {/* Información del Sistema */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Sistema FEI Rankings</h2>
                  <p className="text-sm text-gray-500">
                    Rankings oficiales en tiempo real según normativas FEI
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🔴 En Vivo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Componente LiveRankings */}
          <LiveRankings />

          {/* Información FEI */}
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              📖 Sistema de Puntuación FEI
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">Rankings Oficiales:</h4>
                <ul className="space-y-1">
                  <li>• Actualizaciones automáticas cada 30 segundos</li>
                  <li>• Puntuación FEI oficial</li>
                  <li>• Desempates automáticos por tiempo</li>
                  <li>• Clasificaciones por categoría</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Visualización:</h4>
                <ul className="space-y-1">
                  <li>• 🥇 Oro, 🥈 Plata, 🥉 Bronce automáticos</li>
                  <li>• Información completa de participantes</li>
                  <li>• Puntuaciones técnicas y artísticas</li>
                  <li>• Penalizaciones detalladas</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default RankingsPage;