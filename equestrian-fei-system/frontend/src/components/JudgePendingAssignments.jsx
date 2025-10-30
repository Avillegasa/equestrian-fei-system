import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import staffService from '../services/staffService';
import competitionService from '../services/competitionService';

const JudgePendingAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingAssignments();
  }, []);

  const loadPendingAssignments = async () => {
    setLoading(true);
    try {
      // Obtener todas las asignaciones del juez actual
      const staffData = await staffService.getMyAssignments();
      console.log('📋 Asignaciones del juez:', staffData);

      // Filtrar solo las pendientes de confirmación
      const pending = staffData.filter(assignment => !assignment.is_confirmed);

      // Cargar información de cada competencia
      const assignmentsWithCompetition = await Promise.all(
        pending.map(async (assignment) => {
          try {
            const competition = await competitionService.getCompetitionById(assignment.competition);
            return {
              ...assignment,
              competition_data: competition
            };
          } catch (error) {
            console.error('Error cargando competencia:', error);
            return {
              ...assignment,
              competition_data: { name: 'Competencia', id: assignment.competition }
            };
          }
        })
      );

      setAssignments(assignmentsWithCompetition);
    } catch (error) {
      console.error('❌ Error cargando asignaciones:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (assignmentId) => {
    try {
      console.log('✅ Aceptando asignación:', assignmentId);
      await staffService.confirmAssignment(assignmentId, true);
      await loadPendingAssignments();
      alert('✅ Asignación aceptada exitosamente');
    } catch (error) {
      console.error('❌ Error aceptando asignación:', error);
      alert('Error al aceptar asignación. Verifica la consola.');
    }
  };

  const handleReject = async (assignmentId) => {
    const confirm = window.confirm('¿Estás seguro de rechazar esta asignación?');
    if (!confirm) return;

    try {
      console.log('❌ Rechazando asignación:', assignmentId);
      await staffService.rejectAssignment(assignmentId);
      await loadPendingAssignments();
      alert('Asignación rechazada');
    } catch (error) {
      console.error('❌ Error rechazando asignación:', error);
      alert('Error al rechazar asignación. Verifica la consola.');
    }
  };

  const getRoleDisplay = (role) => {
    const roles = {
      chief_judge: 'Juez Principal',
      judge: 'Juez',
      observer: 'Observador',
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Asignaciones Pendientes
        </h2>
        <p className="text-gray-600">Cargando asignaciones...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Asignaciones Pendientes
        </h2>
        <p className="text-gray-600">No tienes asignaciones pendientes de confirmación.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          ⏳ Asignaciones Pendientes de Confirmación
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Revisa y acepta/rechaza tus asignaciones como juez
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {assignment.competition_data?.name || 'Competencia'}
                  </h3>
                  <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Pendiente
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Rol asignado:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {getRoleDisplay(assignment.role)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha de asignación:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(assignment.assigned_date).toLocaleDateString()}
                    </span>
                  </div>
                  {assignment.competition_data?.start_date && (
                    <div>
                      <span className="text-gray-500">Fecha de competencia:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(assignment.competition_data.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {assignment.competition_data?.venue_name && (
                    <div>
                      <span className="text-gray-500">Lugar:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {assignment.competition_data.venue_name}
                      </span>
                    </div>
                  )}
                </div>

                {assignment.notes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Notas:</span> {assignment.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-6">
                <button
                  onClick={() => handleAccept(assignment.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  ✓ Aceptar
                </button>
                <button
                  onClick={() => handleReject(assignment.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  ✗ Rechazar
                </button>
                <Link
                  to={`/admin/competitions/${assignment.competition}/staff`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
                >
                  Ver Detalles
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JudgePendingAssignments;
