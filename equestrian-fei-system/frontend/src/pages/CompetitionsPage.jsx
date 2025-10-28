import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';
import CreateCompetitionModal from '../components/CreateCompetitionModal';

const CompetitionsPage = () => {
  const { user, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] = useState(null);

  // Usar store en lugar de estado local
  const {
    competitions: competitionsRaw,
    loading,
    error,
    loadCompetitions,
    createCompetition,
    updateCompetition,
    deleteCompetition
  } = useCompetitionStore();

  // Asegurar que competitions siempre sea un array
  const competitions = Array.isArray(competitionsRaw) ? competitionsRaw : [];

  // Debug: ver qué tiene el componente
  useEffect(() => {
    console.log('🎯 CompetitionsPage - Competitions actuales:', competitions.length, competitions);
  }, [competitions]);

  const handleLogout = async () => {
    await logout();
  };

  // Cargar competencias reales del store
  useEffect(() => {
    console.log('🚀 CompetitionsPage - Montado, cargando competencias...');
    loadCompetitions();
  }, [loadCompetitions]);

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

  const handleCreateCompetition = async (competitionData) => {
    try {
      console.log('📋 Datos de competencia a crear:', competitionData);
      const result = await createCompetition(competitionData);
      console.log('📊 Resultado de creación:', result);

      if (result.success) {
        alert('✅ Competencia creada exitosamente!');
        setShowCreateModal(false);
        // Recargar competencias para mostrar la nueva
        await loadCompetitions();
      } else {
        // Mostrar errores de validación si existen
        if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
          alert('❌ Errores de validación:\n' + errorMessages);
        } else {
          alert('❌ Error al crear competencia: ' + (result.error?.detail || 'Error desconocido'));
        }
      }
    } catch (error) {
      console.error('❌ Error creando competencia:', error);
      alert('❌ Error al crear competencia: ' + error.message);
    }
  };

  const handleEditCompetition = (competition) => {
    setEditingCompetition(competition);
    setShowEditModal(true);
  };

  const handleUpdateCompetition = async (competitionData) => {
    try {
      console.log('📝 Actualizando competencia ID:', editingCompetition.id);
      console.log('📝 Datos a actualizar:', competitionData);
      console.log('📝 Competencia original:', editingCompetition);
      const result = await updateCompetition(editingCompetition.id, competitionData);

      if (result.success) {
        alert('✅ Competencia actualizada exitosamente!');
        setShowEditModal(false);
        setEditingCompetition(null);
        await loadCompetitions();
      } else {
        if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
          alert('❌ Errores de validación:\n' + errorMessages);
        } else {
          alert('❌ Error al actualizar competencia: ' + (result.error?.detail || 'Error desconocido'));
        }
      }
    } catch (error) {
      console.error('❌ Error actualizando competencia:', error);
      alert('❌ Error al actualizar competencia: ' + error.message);
    }
  };

  const handleDeleteCompetition = (competition) => {
    console.log('🗑️ Abriendo modal de confirmación para:', competition);
    setCompetitionToDelete(competition);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!competitionToDelete) return;

    try {
      console.log('🗑️ Eliminando competencia ID:', competitionToDelete.id);
      const result = await deleteCompetition(competitionToDelete.id);
      console.log('🗑️ Resultado de eliminación:', result);

      if (result.success) {
        alert('✅ Competencia eliminada exitosamente');
        setShowDeleteModal(false);
        setCompetitionToDelete(null);
        await loadCompetitions();
      } else {
        alert('❌ Error al eliminar competencia: ' + (result.error?.detail || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error eliminando competencia:', error);
      alert('❌ Error al eliminar competencia: ' + error.message);
    }
  };

  const cancelDelete = () => {
    console.log('🗑️ Eliminación cancelada');
    setShowDeleteModal(false);
    setCompetitionToDelete(null);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Profesional */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 bg-blue-50 px-3 py-2 rounded-lg"
              >
                <span>←</span>
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">🏆</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Competencias</h1>
                  <p className="text-sm text-gray-600">Sistema FEI - Competencias Ecuestres</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600">Gestor de Competencias</p>
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

        {/* Stats Cards Profesionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Competencias</p>
                <p className="text-3xl font-bold text-gray-900">{competitions.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-blue-600 font-medium">
                Sistema FEI
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inscripción Abierta</p>
                <p className="text-3xl font-bold text-gray-900">
                  {competitions.filter(c => c.status === 'open_registration').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">🟢</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                Activas ahora
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-3xl font-bold text-gray-900">
                  {competitions.filter(c => c.status === 'in_progress').length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-purple-600 font-medium">
                Eventos activos
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {competitions.filter(c => c.status === 'completed').length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-orange-600 font-medium">
                Este período
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-xl shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error en el sistema</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={() => loadCompetitions()}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  🔄 Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Competitions Table */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Lista de Competencias FEI
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Gestiona todas las competencias del sistema ecuestre oficial
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {competitions.length} Total
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {competitions.filter(c => c.status === 'open_registration').length} Activas
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-lg font-medium text-gray-700">Cargando competencias...</p>
                <p className="text-sm text-gray-500">Conectando con el sistema FEI</p>
              </div>
            </div>
          ) : competitions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="text-6xl mb-4 block">🏆</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay competencias registradas</h3>
              <p className="text-gray-500 mb-6">Comienza creando tu primera competencia FEI</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                + Crear Primera Competencia
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {competitions.map((competition) => (
                <div key={competition.id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">
                            {getDisciplineIcon(competition.discipline)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {competition.name}
                          </h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(competition.status)}`}>
                            {getStatusDisplay(competition.status)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <span className="mr-1">🎯</span>
                            {competition.discipline}
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">📍</span>
                            {competition.location}
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">📅</span>
                            {competition.startDate} - {competition.endDate}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Organizador: {competition.organizer}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {competition.participants}/{competition.maxParticipants}
                        </div>
                        <div className="text-xs text-gray-500">
                          Participantes
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/rankings/${competition.id}`}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            📊 Rankings
                          </Link>

                          {/* Botones solo para Admin y Organizer */}
                          {(user?.role === 'admin' || user?.role === 'organizer') && (
                            <>
                              <Link
                                to={`/admin/competitions/${competition.id}/staff`}
                                className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                              >
                                👥 Personal
                              </Link>
                              <Link
                                to={`/admin/competitions/${competition.id}/participants`}
                                className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                              >
                                🏇 Participantes
                              </Link>
                              <Link
                                to={`/admin/competitions/${competition.id}/schedule`}
                                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                                title="Gestionar programación (Admin/Organizer)"
                              >
                                📋 Gestionar Programación
                              </Link>
                            </>
                          )}

                          {/* Botón para todos los roles */}
                          <Link
                            to={`/schedule/${competition.id}`}
                            className="bg-cyan-100 hover:bg-cyan-200 text-cyan-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                            title="Ver programación publicada"
                          >
                            📅 Ver Programación
                          </Link>
                        </div>
                        {/* Botones de edición solo para Admin y Organizer */}
                        {(user?.role === 'admin' || user?.role === 'organizer') && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleEditCompetition(competition)}
                              className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDeleteCompetition(competition)}
                              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>

        {/* Action Buttons Profesionales */}
        <div className="mt-8 grid grid-cols-1 gap-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-3">Gestión de Competencias</h3>
            <p className="text-blue-100 text-sm mb-4">Crear y administrar competencias FEI oficiales</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Nueva Competencia</span>
              </button>
              <Link
                to="/admin/categories"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Gestionar Categorías</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Modal de Crear Competencia */}
        <CreateCompetitionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCompetition}
        />

        {/* Modal de Editar Competencia */}
        <CreateCompetitionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingCompetition(null);
          }}
          onSubmit={handleUpdateCompetition}
          initialData={editingCompetition}
          isEditMode={true}
        />

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteModal && competitionToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-8 border w-full max-w-md shadow-2xl rounded-xl bg-white">
              <div className="text-center">
                {/* Icono de advertencia */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <span className="text-4xl">⚠️</span>
                </div>

                {/* Título */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¿Eliminar Competencia?
                </h3>

                {/* Nombre de la competencia */}
                <p className="text-lg font-semibold text-red-600 mb-4">
                  "{competitionToDelete.name}"
                </p>

                {/* Advertencia */}
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-left">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Esta acción no se puede deshacer y eliminará:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Toda la información de la competencia</li>
                    <li>• Personal asignado</li>
                    <li>• Participantes inscritos</li>
                    <li>• Puntuaciones y rankings</li>
                  </ul>
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CompetitionsPage;