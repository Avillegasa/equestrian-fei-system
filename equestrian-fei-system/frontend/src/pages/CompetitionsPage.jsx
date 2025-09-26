import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const CompetitionsPage = () => {
  const { user, logout } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await logout();
  };

  // Datos de ejemplo para demostración
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setCompetitions([
        {
          id: 1,
          name: 'FEI Dressage Madrid 2024',
          discipline: 'Dressage',
          location: 'Madrid, Spain',
          startDate: '2025-10-03',
          endDate: '2025-10-06',
          status: 'open_registration',
          participants: 25,
          maxParticipants: 50,
          organizer: 'Club Hípico Madrid'
        },
        {
          id: 2,
          name: 'Copa Nacional de Salto',
          discipline: 'Show Jumping',
          location: 'Barcelona, Spain',
          startDate: '2025-11-15',
          endDate: '2025-11-17',
          status: 'upcoming',
          participants: 0,
          maxParticipants: 40,
          organizer: 'Federación Catalana'
        },
        {
          id: 3,
          name: 'Concurso Completo Internacional',
          discipline: 'Eventing',
          location: 'Sevilla, Spain',
          startDate: '2025-09-20',
          endDate: '2025-09-22',
          status: 'completed',
          participants: 35,
          maxParticipants: 35,
          organizer: 'Club Ecuestre Andaluz'
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      open_registration: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplay = (status) => {
    const statuses = {
      open_registration: 'Inscripción Abierta',
      upcoming: 'Próximamente',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return statuses[status] || status;
  };

  const getDisciplineIcon = (discipline) => {
    const icons = {
      Dressage: '🎭',
      'Show Jumping': '🐎',
      Eventing: '🏇',
      Endurance: '🏃',
      Vaulting: '🤸',
      Driving: '🛷'
    };
    return icons[discipline] || '🏆';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                🏆 Gestión de Competencias
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
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Competencias
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {competitions.length}
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
                    <span className="text-2xl">🟢</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Inscripción Abierta
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {competitions.filter(c => c.status === 'open_registration').length}
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
                    <span className="text-2xl">🔵</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Próximamente
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {competitions.filter(c => c.status === 'upcoming').length}
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
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completadas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {competitions.filter(c => c.status === 'completed').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Competitions Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Lista de Competencias
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Gestiona todas las competencias del sistema FEI
              </p>
            </div>

            {loading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando competencias...</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {competitions.map((competition) => (
                  <li key={competition.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="text-2xl">
                              {getDisciplineIcon(competition.discipline)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {competition.name}
                              </div>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(competition.status)}`}>
                                {getStatusDisplay(competition.status)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {competition.discipline} • {competition.location}
                            </div>
                            <div className="text-sm text-gray-500">
                              {competition.startDate} - {competition.endDate}
                            </div>
                            <div className="text-sm text-gray-500">
                              Organizador: {competition.organizer}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {competition.participants}/{competition.maxParticipants}
                            </div>
                            <div className="text-sm text-gray-500">
                              Participantes
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                              Ver
                            </button>
                            <button className="text-green-600 hover:text-green-500 text-sm font-medium">
                              Editar
                            </button>
                          </div>
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
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              + Crear Nueva Competencia
            </button>
            <div className="flex space-x-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Exportar Resultados
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Generar Reporte
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompetitionsPage;