import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';
import AssignStaffModal from '../components/AssignStaffModal';

const CompetitionStaffPage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const [staff, setStaff] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Usar store en lugar de estado local
  const {
    currentCompetition,
    loading,
    loadCompetitionById
  } = useCompetitionStore();

  const handleLogout = async () => {
    await logout();
  };

  // Cargar datos reales de la competencia
  useEffect(() => {
    if (competitionId) {
      console.log('📋 Cargando competencia:', competitionId);
      loadCompetitionById(competitionId);
    }
  }, [competitionId, loadCompetitionById]);

  // Inicializar staff vacío (se puede cargar del backend en el futuro)
  useEffect(() => {
    // TODO: Cargar personal desde el backend cuando esté disponible
    // Por ahora iniciamos con array vacío
    console.log('👥 Inicializando personal de la competencia');
    setStaff([]);
  }, [competitionId]);

  const handleAssignStaff = (staffData) => {
    // Generar un ID temporal para el nuevo miembro del personal
    const newStaff = {
      id: staff.length + 1,
      staff_member: {
        id: staff.length + 10,
        first_name: staffData.first_name,
        last_name: staffData.last_name,
        email: staffData.email,
        role: staffData.user_role
      },
      role: staffData.staff_role,
      is_confirmed: false,
      assigned_date: new Date().toISOString().split('T')[0],
      notes: staffData.notes || ''
    };

    // Agregar el nuevo miembro al estado
    setStaff(prev => [newStaff, ...prev]);

    // Mostrar mensaje de éxito
    alert('✅ Personal asignado exitosamente!');
  };

  const handleRemoveStaff = (member) => {
    console.log('🗑️ Abriendo modal de eliminación para:', member);
    setStaffToDelete(member);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!staffToDelete) return;

    console.log('🗑️ Eliminando staff ID:', staffToDelete.id);
    setStaff(prev => prev.filter(s => s.id !== staffToDelete.id));
    setShowDeleteModal(false);
    setStaffToDelete(null);
    alert('✅ Personal removido exitosamente!');
  };

  const cancelDelete = () => {
    console.log('🗑️ Eliminación cancelada');
    setShowDeleteModal(false);
    setStaffToDelete(null);
  };

  const getRoleDisplay = (role) => {
    const roles = {
      chief_judge: 'Juez Principal',
      judge: 'Juez',
      technical_delegate: 'Delegado Técnico',
      steward: 'Comisario',
      veterinarian: 'Veterinario',
      course_designer: 'Diseñador de Pista',
      announcer: 'Locutor',
      timekeeper: 'Cronometrador',
      scorer: 'Anotador'
    };
    return roles[role] || role;
  };

  const getRoleIcon = (role) => {
    const icons = {
      chief_judge: '👨‍⚖️',
      judge: '⚖️',
      technical_delegate: '📋',
      steward: '🛡️',
      veterinarian: '🩺',
      course_designer: '📐',
      announcer: '📢',
      timekeeper: '⏱️',
      scorer: '📊'
    };
    return icons[role] || '👤';
  };

  const getStatusColor = (isConfirmed) => {
    return isConfirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  if (loading || !currentCompetition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Cargando información de la competencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Profesional */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/competitions"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 bg-blue-50 px-3 py-2 rounded-lg"
              >
                <span>←</span>
                <span className="font-medium">Competencias</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">👥</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Personal de la Competencia</h1>
                  <p className="text-sm text-gray-600">Gestión de equipo técnico FEI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600">Gestor de Personal</p>
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Competition Info Card */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg mb-8 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{currentCompetition.name}</h2>
                <div className="flex items-center space-x-4 text-blue-100">
                  <span className="flex items-center">
                    <span className="mr-1">🎯</span>
                    {currentCompetition.discipline}
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1">📍</span>
                    {currentCompetition.location}
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1">📅</span>
                    {currentCompetition.startDate || currentCompetition.start_date} - {currentCompetition.endDate || currentCompetition.end_date}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white bg-opacity-20 backdrop-blur-sm">
                  {currentCompetition.status === 'open_registration' ? 'Inscripción Abierta' : currentCompetition.status}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards Profesionales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Personal</p>
                  <p className="text-3xl font-bold text-gray-900">{staff.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-blue-600 font-medium">
                  Equipo completo
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Jueces</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {staff.filter(s => s.role === 'judge' || s.role === 'chief_judge').length}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <span className="text-2xl">⚖️</span>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-purple-600 font-medium">
                  Oficiales FEI
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmados</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {staff.filter(s => s.is_confirmed).length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">
                  Listos para trabajar
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 transform hover:scale-105 transition-transform duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {staff.filter(s => !s.is_confirmed).length}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <span className="text-2xl">⏳</span>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-orange-600 font-medium">
                  Esperando confirmación
                </span>
              </div>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white shadow-xl rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Personal Asignado
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Lista de todo el personal asignado a esta competencia FEI
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {staff.length} Total
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {staff.filter(s => s.is_confirmed).length} Confirmados
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando personal...</p>
                </div>
              </div>
            ) : staff.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="text-6xl mb-4 block">👥</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay personal asignado</h3>
                <p className="text-gray-500 mb-6">Comienza asignando miembros del equipo a esta competencia</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  + Asignar Primer Miembro
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {staff.map((member) => (
                  <div key={member.id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                            <span className="text-3xl">
                              {getRoleIcon(member.role)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 truncate">
                              {member.staff_member.first_name} {member.staff_member.last_name}
                            </h4>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.is_confirmed)}`}>
                              {member.is_confirmed ? '✓ Confirmado' : '⏳ Pendiente'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <span className="mr-1">💼</span>
                              {getRoleDisplay(member.role)}
                            </span>
                            <span className="flex items-center">
                              <span className="mr-1">📧</span>
                              {member.staff_member.email}
                            </span>
                            <span className="flex items-center">
                              <span className="mr-1">📅</span>
                              Asignado: {member.assigned_date}
                            </span>
                          </div>
                          {member.notes && (
                            <div className="mt-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="font-medium">Notas:</span> {member.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() => handleRemoveStaff(member)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                        >
                          <span>🗑️</span>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons Profesionales */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-3">Gestión de Personal</h3>
              <p className="text-blue-100 text-sm mb-4">Administra el equipo técnico de la competencia</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Asignar Personal</span>
                </button>
                <button
                  onClick={() => alert('Funcionalidad de confirmación masiva próximamente')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <span>✅</span>
                  <span>Confirmar Todos</span>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-3">Comunicación y Reportes</h3>
              <p className="text-green-100 text-sm mb-4">Envía invitaciones y genera documentos oficiales</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => alert('📧 Invitaciones enviadas a todo el personal pendiente')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <span>📧</span>
                  <span>Enviar Invitaciones</span>
                </button>
                <button
                  onClick={() => alert('📄 Exportando lista de personal...')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <span>📄</span>
                  <span>Exportar Lista</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal de Asignar Personal */}
          <AssignStaffModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onSubmit={handleAssignStaff}
          />

          {/* Modal de Confirmación de Eliminación */}
          {showDeleteModal && staffToDelete && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative mx-auto p-8 border w-full max-w-md shadow-2xl rounded-xl bg-white">
                <div className="text-center">
                  {/* Icono de advertencia */}
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                    <span className="text-4xl">⚠️</span>
                  </div>

                  {/* Título */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ¿Quitar Personal?
                  </h3>

                  {/* Nombre del miembro */}
                  <p className="text-lg font-semibold text-red-600 mb-2">
                    {staffToDelete.staff_member.first_name} {staffToDelete.staff_member.last_name}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {getRoleDisplay(staffToDelete.role)}
                  </p>

                  {/* Advertencia */}
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-left">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      Esta acción quitará a este miembro del equipo:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Se eliminará de la lista de personal</li>
                      <li>• Perderá acceso a esta competencia</li>
                      <li>• Las asignaciones serán removidas</li>
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
                      Sí, Quitar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CompetitionStaffPage;