import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';
import useParticipantStore from '../store/participantStore';
import ApplyCompetitionModal from '../components/ApplyCompetitionModal';

const RiderDashboard = () => {
  const { user, logout } = useAuth();

  // Conectar a los stores
  const { competitions, loading: compsLoading, loadCompetitions } = useCompetitionStore();
  const {
    applications,
    applicationsLoading,
    loadMyApplications,
    applyToCompetition
  } = useParticipantStore();

  // State para el modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  // Cargar competencias y mis aplicaciones al montar
  useEffect(() => {
    loadCompetitions();
    if (user?.id) {
      loadMyApplications(user.id);
    }
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
  };

  const handleApplyClick = (competition) => {
    setSelectedCompetition(competition);
    setShowApplyModal(true);
  };

  const handleConfirmApply = async (competitionId) => {
    const result = await applyToCompetition(competitionId, user);
    if (result.success) {
      alert('✅ ¡Inscripción enviada exitosamente!\n\nTu solicitud ha sido enviada al organizador. Recibirás una notificación cuando sea revisada.');
      setShowApplyModal(false);
      setSelectedCompetition(null);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  // Estadísticas del rider
  const stats = useMemo(() => {
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;

    return {
      totalApplications: applications.length,
      pendingApplications: pending,
      approvedApplications: approved,
      rejectedApplications: rejected,
      availableCompetitions: competitions.filter(c =>
        c.status === 'open_registration' || c.status === 'published'
      ).length
    };
  }, [applications, competitions]);

  // Competencias disponibles para inscripción
  const availableCompetitions = useMemo(() => {
    const applicationCompIds = applications.map(app => app.competitionId);

    return competitions
      .filter(c =>
        (c.status === 'open_registration' || c.status === 'published') &&
        new Date(c.startDate || c.start_date) > new Date() &&
        !applicationCompIds.includes(c.id)
      )
      .sort((a, b) => new Date(a.startDate || a.start_date) - new Date(b.startDate || b.start_date))
      .slice(0, 6);
  }, [competitions, applications]);

  // Mis inscripciones con información de competencias
  const myApplicationsWithCompetitions = useMemo(() => {
    return applications.map(app => {
      const competition = competitions.find(c => c.id == app.competitionId);
      return {
        ...app,
        competition
      };
    }).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
  }, [applications, competitions]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada'
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badges[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Loading state
  if ((compsLoading || applicationsLoading) && competitions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">🏇</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Jinete</h1>
                <p className="text-sm text-gray-600">Sistema de Inscripción FEI</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600">Jinete/Competidor</p>
              </div>
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">
            ¡Bienvenido, {user?.first_name}! 🏇
          </h2>
          <p className="text-blue-100">
            Inscríbete en competencias FEI y sigue tus rankings en tiempo real.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Competencias Disponibles</p>
                <p className="text-3xl font-bold text-gray-900">{stats.availableCompetitions}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mis Inscripciones</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingApplications}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.approvedApplications}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.rejectedApplications}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Competencias Disponibles */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">🏆</span>
              Competencias Disponibles para Inscripción
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {availableCompetitions.length} competencia(s) abiertas • Aplica ahora
            </p>
          </div>

          <div className="p-6">
            {availableCompetitions.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📭</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay competencias disponibles</h3>
                <p className="text-gray-500">
                  No hay competencias abiertas para inscripción en este momento. Vuelve pronto.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCompetitions.map((competition) => (
                  <div
                    key={competition.id}
                    className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">🏇</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                        Abierta
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2">{competition.name}</h4>

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
                    </div>

                    <button
                      onClick={() => handleApplyClick(competition)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>✅</span>
                      <span>Aplicar a Competencia</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mis Inscripciones */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">📋</span>
              Mis Inscripciones
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {myApplicationsWithCompetitions.length} inscripción(es) • Revisa el estado de tus solicitudes
            </p>
          </div>

          <div className="p-6">
            {myApplicationsWithCompetitions.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📝</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes inscripciones</h3>
                <p className="text-gray-500">
                  Aún no te has inscrito en ninguna competencia. ¡Explora las competencias disponibles arriba!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplicationsWithCompetitions.map((app) => (
                  <div
                    key={app.id}
                    className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">
                            {app.competitionName || app.competition?.name || 'Competencia'}
                          </h4>
                          {getStatusBadge(app.status)}
                        </div>

                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">Aplicado:</span> {formatDate(app.appliedAt)}
                          </p>
                          {app.competition && (
                            <>
                              <p className="text-gray-600">
                                <span className="font-medium">Ubicación:</span> {app.competition.venueCity || app.competition.venue_city}, {app.competition.venueCountry || app.competition.venue_country}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Fecha inicio:</span> {formatDate(app.competition.startDate || app.competition.start_date)}
                              </p>
                            </>
                          )}
                          {app.reviewedBy && (
                            <p className="text-gray-600">
                              <span className="font-medium">Revisado por:</span> {app.reviewedBy} el {formatDate(app.reviewedAt)}
                            </p>
                          )}
                          {app.status === 'rejected' && app.rejectionReason && (
                            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-red-800">Motivo de rechazo:</p>
                              <p className="text-sm text-red-700">{app.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {app.status === 'approved' && app.competition && (
                        <Link
                          to={`/rankings/${app.competitionId}`}
                          className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 whitespace-nowrap"
                        >
                          <span>📊</span>
                          <span>Ver Rankings</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Aplicación */}
      <ApplyCompetitionModal
        isOpen={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setSelectedCompetition(null);
        }}
        onConfirm={handleConfirmApply}
        competition={selectedCompetition}
      />
    </div>
  );
};

export default RiderDashboard;
