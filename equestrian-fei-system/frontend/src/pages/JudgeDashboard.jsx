import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';
import competitionService from '../services/competitionService';

const JudgeDashboard = () => {
  const { user, logout } = useAuth();
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [confirmedAssignments, setConfirmedAssignments] = useState([]);
  const [assignedCompetitionsData, setAssignedCompetitionsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar competencias asignadas al juez desde el API
  useEffect(() => {
    if (!user) return;

    const loadAssignedCompetitions = async () => {
      setLoading(true);
      try {
        console.log('🔍 Cargando competencias asignadas al juez desde API...');

        // Llamar al API para obtener competencias asignadas
        const assigned = await competitionService.getMyAssignedCompetitions();

        console.log('✅ Competencias asignadas obtenidas:', assigned.length);
        setAssignedCompetitionsData(assigned);

        // Extraer asignaciones pendientes y confirmadas
        const pending = [];
        const confirmed = [];

        assigned.forEach(comp => {
          // Obtener staff assignments del localStorage (fallback)
          const storageKey = `fei_staff_${comp.id}`;
          const savedStaff = localStorage.getItem(storageKey);

          if (savedStaff) {
            try {
              const staff = JSON.parse(savedStaff);
              const myAssignment = staff.find(s => {
                const emailMatch = s.staff_member?.email?.toLowerCase() === user.email?.toLowerCase();
                const idMatch = s.staff_member?.id === user.id;
                return emailMatch || idMatch;
              });

              if (myAssignment) {
                const assignmentData = {
                  ...myAssignment,
                  competition: comp
                };

                if (myAssignment.is_confirmed) {
                  confirmed.push(assignmentData);
                } else {
                  pending.push(assignmentData);
                }
              }
            } catch (error) {
              console.error('Error procesando staff de localStorage:', error);
            }
          }
        });

        setPendingAssignments(pending);
        setConfirmedAssignments(confirmed);

      } catch (error) {
        console.error('❌ Error cargando competencias asignadas:', error);
        // Fallback a localStorage ya implementado en competitionService
      } finally {
        setLoading(false);
      }
    };

    loadAssignedCompetitions();
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  // Aceptar asignación
  const handleAcceptAssignment = (assignment) => {
    const competitionId = assignment.competition.id;
    const storageKey = `fei_staff_${competitionId}`;
    const savedStaff = localStorage.getItem(storageKey);

    if (savedStaff) {
      try {
        const staff = JSON.parse(savedStaff);
        // Actualizar la confirmación del staff member
        const updatedStaff = staff.map(s => {
          if (s.id === assignment.id) {
            return { ...s, is_confirmed: true };
          }
          return s;
        });

        localStorage.setItem(storageKey, JSON.stringify(updatedStaff));
        console.log('✅ Asignación aceptada para competencia:', competitionId);

        // Actualizar estados
        setPendingAssignments(prev => prev.filter(a => a.id !== assignment.id));
        setConfirmedAssignments(prev => [...prev, { ...assignment, is_confirmed: true }]);

        alert('✅ Has aceptado la asignación a la competencia!');
      } catch (error) {
        console.error('Error al aceptar asignación:', error);
        alert('❌ Error al aceptar la asignación');
      }
    }
  };

  // Rechazar asignación
  const handleRejectAssignment = (assignment) => {
    if (!window.confirm('¿Estás seguro de que quieres rechazar esta asignación?')) {
      return;
    }

    const competitionId = assignment.competition.id;
    const storageKey = `fei_staff_${competitionId}`;
    const savedStaff = localStorage.getItem(storageKey);

    if (savedStaff) {
      try {
        const staff = JSON.parse(savedStaff);
        // Eliminar la asignación del personal
        const updatedStaff = staff.filter(s => s.id !== assignment.id);

        localStorage.setItem(storageKey, JSON.stringify(updatedStaff));
        console.log('❌ Asignación rechazada para competencia:', competitionId);

        // Actualizar estados
        setPendingAssignments(prev => prev.filter(a => a.id !== assignment.id));

        alert('❌ Has rechazado la asignación a la competencia');
      } catch (error) {
        console.error('Error al rechazar asignación:', error);
        alert('❌ Error al rechazar la asignación');
      }
    }
  };

  // Mapear competencias asignadas desde el API
  const assignedCompetitions = useMemo(() => {
    return assignedCompetitionsData.map(c => ({
      id: c.id,
      name: c.name,
      date: c.start_date,
      location: `${c.venue_city || 'Ciudad'}, ${c.venue_country || 'País'}`,
      discipline: c.discipline || 'Dressage',
      participants: c.participant_count || 0,
      status: c.status === 'completed' ? 'completed' :
              c.status === 'in_progress' ? 'pending_evaluation' : 'upcoming',
      myRole: 'Juez Asignado'
    }));
  }, [assignedCompetitionsData]);

  // Calcular estadísticas reales desde competencias asignadas
  const stats = useMemo(() => {
    const activeCompetitions = assignedCompetitionsData.filter(c =>
      ['open_registration', 'in_progress', 'registration_closed'].includes(c.status)
    );

    return {
      assignedCompetitions: assignedCompetitions.length,
      completedEvaluations: assignedCompetitionsData.filter(c => c.status === 'completed').length,
      pendingEvaluations: activeCompetitions.filter(c => c.status === 'in_progress').length,
      totalParticipantsJudged: assignedCompetitionsData.reduce((sum, c) => sum + (c.participant_count || 0), 0),
      upcomingJudging: assignedCompetitionsData.filter(c =>
        ['open_registration', 'published'].includes(c.status) &&
        new Date(c.start_date) > new Date()
      ).length,
      averageRating: 4.7 // TODO: Calcular desde evaluaciones reales
    };
  }, [assignedCompetitionsData, assignedCompetitions]);

  // Evaluaciones pendientes (temporal - conectar a scoring después)
  const pendingEvaluations = useMemo(() => {
    const activeComps = assignedCompetitions.filter(c => c.status === 'pending_evaluation');
    return activeComps.slice(0, 3).map((c, index) => ({
      id: index + 1,
      participant: `Participante ${index + 1}`,
      horse: `Caballo ${index + 1}`,
      competition: c.name,
      discipline: c.discipline,
      deadline: new Date(c.date).toLocaleDateString('es-ES')
    }));
  }, [assignedCompetitions]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'pending_evaluation': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'upcoming': return 'Próxima';
      case 'pending_evaluation': return 'Pendiente Evaluación';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando competencias asignadas...</p>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">
                ⚖️ Panel de Juez
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard General
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bienvenido, {user?.first_name}
              </h2>
              <p className="text-gray-600">
                Panel de juez del Sistema FEI. Gestiona tus evaluaciones, revisa competencias asignadas y mantén tu historial de calificaciones.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-blue-600 text-3xl">⚖️</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Competencias Asignadas
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.assignedCompetitions}
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
                    <div className="text-green-600 text-3xl">✅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Evaluaciones Completadas
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.completedEvaluations}
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
                    <div className="text-red-600 text-3xl">⏰</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Evaluaciones Pendientes
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.pendingEvaluations}
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
                    <div className="text-purple-600 text-3xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Participantes Evaluados
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.totalParticipantsJudged}
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
                    <div className="text-orange-600 text-3xl">📅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Próximas Evaluaciones
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.upcomingJudging}
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
                    <div className="text-yellow-600 text-3xl">⭐</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Valoración Promedio
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900">
                        {stats.averageRating}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Link
              to="/judge/competitions"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="text-lg font-bold">Mis Competencias</h3>
                <p className="text-sm opacity-90 mt-1">Ver asignaciones FEI</p>
              </div>
            </Link>

            {/* Botón Rankings - solo si tiene asignaciones */}
            {(confirmedAssignments.length > 0 || pendingAssignments.length > 0) ? (
              <Link
                to={`/rankings/${(confirmedAssignments[0] || pendingAssignments[0]).competition.id}`}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-lg font-bold">Rankings</h3>
                  <p className="text-sm opacity-90 mt-1">Ver clasificaciones</p>
                </div>
              </Link>
            ) : (
              <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white p-6 rounded-xl shadow-lg opacity-60 cursor-not-allowed">
                <div className="text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-lg font-bold">Rankings</h3>
                  <p className="text-sm opacity-90 mt-1">Sin asignaciones</p>
                </div>
              </div>
            )}

            <Link
              to="/profile"
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white p-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-4xl mb-3">👤</div>
                <h3 className="text-lg font-bold">Mi Perfil</h3>
                <p className="text-sm opacity-90 mt-1">Configuración de juez</p>
              </div>
            </Link>
          </div>

          {/* Asignaciones Pendientes de Confirmación */}
          {pendingAssignments.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-8">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">⏳</div>
                <div>
                  <h3 className="text-lg font-bold text-yellow-900">
                    Asignaciones Pendientes de Confirmación
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Tienes {pendingAssignments.length} asignación(es) que requieren tu aceptación
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {pendingAssignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                          {assignment.competition.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <span className="mr-2">📋</span>
                            <span className="font-medium">Rol:</span>
                            <span className="ml-1">
                              {assignment.role === 'judge' && 'Juez'}
                              {assignment.role === 'chief_judge' && 'Juez Principal'}
                              {assignment.role === 'observer' && 'Observador'}
                              {assignment.role === 'organizer' && 'Organizador'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">📅</span>
                            <span className="font-medium">Asignado:</span>
                            <span className="ml-1">{assignment.assigned_date}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">📍</span>
                            <span className="font-medium">Ubicación:</span>
                            <span className="ml-1">{assignment.competition.location || 'Por definir'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">🗓️</span>
                            <span className="font-medium">Fechas:</span>
                            <span className="ml-1">
                              {assignment.competition.start_date} - {assignment.competition.end_date}
                            </span>
                          </div>
                        </div>
                        {assignment.notes && (
                          <div className="bg-gray-50 p-2 rounded text-sm text-gray-700 mb-3">
                            <span className="font-medium">Notas:</span> {assignment.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleRejectAssignment(assignment)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        <span>❌</span>
                        <span>Rechazar</span>
                      </button>
                      <button
                        onClick={() => handleAcceptAssignment(assignment)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        <span>✅</span>
                        <span>Aceptar Asignación</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assigned Competitions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Competencias Asignadas
                </h3>
                <div className="space-y-4">
                  {assignedCompetitions.map((competition) => (
                    <div key={competition.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {competition.name}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(competition.status)
                        }`}>
                          {getStatusText(competition.status)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p>📅 {new Date(competition.date).toLocaleDateString('es-ES')}</p>
                        <p>📍 {competition.location}</p>
                        <p>🏆 {competition.discipline}</p>
                        <p>👥 {competition.participants} participantes</p>
                        <p className="font-medium text-gray-700">🎯 {competition.myRole}</p>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Link
                          to={`/judge/scoring/${competition.id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          ⚖️ Calificar
                        </Link>
                        <Link
                          to={`/rankings/${competition.id}`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          📊 Rankings
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    to="/judge/competitions"
                    className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm font-medium rounded-md transition-colors"
                  >
                    ⚖️ Ver todas mis competencias
                  </Link>
                </div>
              </div>
            </div>

            {/* Pending Evaluations */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Evaluaciones Pendientes Urgentes
                </h3>
                <div className="space-y-4">
                  {pendingEvaluations.map((evaluation) => (
                    <div key={evaluation.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {evaluation.participant} - {evaluation.horse}
                        </h4>
                        <span className="text-xs text-red-600 font-medium">
                          ⏰ Vence: {new Date(evaluation.deadline).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>🏆 {evaluation.competition}</p>
                        <p>🎯 Disciplina: {evaluation.discipline}</p>
                      </div>
                      <div className="mt-3">
                        {confirmedAssignments.length > 0 ? (
                          <Link
                            to={`/judge/scoring/${confirmedAssignments[0].competition.id}`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            ⚖️ Evaluar ahora
                          </Link>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-400 cursor-not-allowed">
                            ⚖️ Sin asignaciones confirmadas
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <p className="text-center text-sm text-gray-500">
                    Sistema de evaluaciones disponible próximamente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JudgeDashboard;