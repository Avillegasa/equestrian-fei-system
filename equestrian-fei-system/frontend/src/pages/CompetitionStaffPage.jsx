import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AssignStaffModal from '../components/AssignStaffModal';

const CompetitionStaffPage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const [staff, setStaff] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Datos de ejemplo para demostración
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setCompetition({
        id: competitionId || 1,
        name: 'Copa Internacional de Salto 2024',
        discipline: 'Show Jumping',
        location: 'Madrid, España',
        startDate: '2025-10-03',
        endDate: '2025-10-06',
        status: 'draft'
      });

      setStaff([
        {
          id: 1,
          staff_member: {
            id: 1,
            first_name: 'Ana',
            last_name: 'García',
            email: 'ana.garcia@example.com',
            role: 'judge'
          },
          role: 'chief_judge',
          is_confirmed: true,
          assigned_date: '2024-09-15',
          notes: 'Juez principal con 15 años de experiencia'
        },
        {
          id: 2,
          staff_member: {
            id: 2,
            first_name: 'Carlos',
            last_name: 'Martínez',
            email: 'carlos.martinez@example.com',
            role: 'judge'
          },
          role: 'judge',
          is_confirmed: true,
          assigned_date: '2024-09-16',
          notes: 'Especialista en salto ecuestre'
        },
        {
          id: 3,
          staff_member: {
            id: 3,
            first_name: 'María',
            last_name: 'López',
            email: 'maria.lopez@example.com',
            role: 'veterinarian'
          },
          role: 'veterinarian',
          is_confirmed: false,
          assigned_date: '2024-09-17',
          notes: 'Veterinaria oficial FEI'
        }
      ]);
      setLoading(false);
    }, 500);
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

  const handleConfirmStaff = (staffId) => {
    setStaff(prev =>
      prev.map(s =>
        s.id === staffId ? { ...s, is_confirmed: true } : s
      )
    );
    alert('✅ Personal confirmado!');
  };

  const handleRemoveStaff = (staffId) => {
    if (window.confirm('¿Estás seguro de que deseas quitar a este miembro del personal?')) {
      setStaff(prev => prev.filter(s => s.id !== staffId));
      alert('✅ Personal removido!');
    }
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

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/admin/competitions" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Volver a Competencias
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                👥 Personal de la Competencia
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hola, {user?.first_name || 'Administrador'}
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

          {/* Competition Info */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{competition.name}</h2>
                  <p className="text-sm text-gray-500">
                    {competition.discipline} • {competition.location}
                  </p>
                  <p className="text-sm text-gray-500">
                    {competition.startDate} - {competition.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {competition.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Personal
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {staff.length}
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
                    <span className="text-2xl">⚖️</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Jueces
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {staff.filter(s => s.role === 'judge' || s.role === 'chief_judge').length}
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
                        Confirmados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {staff.filter(s => s.is_confirmed).length}
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
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pendientes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {staff.filter(s => !s.is_confirmed).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Personal Asignado
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Lista de todo el personal asignado a esta competencia
              </p>
            </div>

            {loading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando personal...</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {staff.map((member) => (
                  <li key={member.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="text-2xl">
                              {getRoleIcon(member.role)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {member.staff_member.first_name} {member.staff_member.last_name}
                              </div>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.is_confirmed)}`}>
                                {member.is_confirmed ? 'Confirmado' : 'Pendiente'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {getRoleDisplay(member.role)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.staff_member.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              Asignado: {member.assigned_date}
                            </div>
                            {member.notes && (
                              <div className="text-sm text-gray-500 mt-1">
                                Notas: {member.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!member.is_confirmed && (
                            <button
                              onClick={() => handleConfirmStaff(member.id)}
                              className="text-green-600 hover:text-green-500 text-sm font-medium"
                            >
                              Confirmar
                            </button>
                          )}
                          <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                            Editar
                          </button>
                          <button
                            onClick={() => handleRemoveStaff(member.id)}
                            className="text-red-600 hover:text-red-500 text-sm font-medium"
                          >
                            Quitar
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
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Asignar Personal
            </button>
            <div className="flex space-x-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Enviar Invitaciones
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Exportar Lista
              </button>
            </div>
          </div>

          {/* Modal de Asignar Personal */}
          <AssignStaffModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onSubmit={handleAssignStaff}
          />
        </div>
      </main>
    </div>
  );
};

export default CompetitionStaffPage;