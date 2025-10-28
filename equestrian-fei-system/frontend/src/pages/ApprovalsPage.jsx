import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useParticipantStore from '../store/participantStore';

const ApprovalsPage = () => {
  const { user, logout } = useAuth();

  // Conectar al store de participantes
  const {
    applications,
    applicationsLoading,
    loadAllApplications,
    approveApplication,
    rejectApplication
  } = useParticipantStore();

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleLogout = async () => {
    await logout();
  };

  // Cargar aplicaciones de riders
  useEffect(() => {
    loadAllApplications();
  }, []);

  // Cargar aplicaciones reales de riders
  useEffect(() => {
    setTimeout(() => {
      // Convertir aplicaciones de riders al formato de approvals
      const riderApplications = applications.map(app => ({
        id: app.id,
        type: 'rider_competition_application',
        applicant: app.riderName,
        email: app.riderEmail,
        requestedRole: 'rider',
        competitionName: app.competitionName,
        competitionId: app.competitionId,
        submittedAt: app.appliedAt,
        status: app.status,
        documents: [],
        phone: '-',
        country: 'No especificado',
        reviewedBy: app.reviewedBy,
        reviewedAt: app.reviewedAt,
        rejectionReason: app.rejectionReason
      }));

      // Ordenar por fecha (más recientes primero)
      const sortedApprovals = riderApplications.sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      );

      setApprovals(sortedApprovals);
      setLoading(false);
    }, 500);
  }, [applications]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      under_review: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusDisplay = (status) => {
    const statuses = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      under_review: 'En Revisión'
    };
    return statuses[status] || status;
  };

  const getTypeIcon = (type) => {
    // Solo manejamos inscripciones de jinetes por ahora
    return type === 'rider_competition_application' ? '🏇' : '📋';
  };

  const getTypeDisplay = (type) => {
    // Solo manejamos inscripciones de jinetes por ahora
    return type === 'rider_competition_application' ? 'Inscripción de Jinete' : type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (approval) => {
    setSelectedApproval(approval);
    setShowDetailsModal(true);
  };

  const handleApproveClick = (approval) => {
    setSelectedApproval(approval);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    console.log('✅ Aprobando solicitud:', selectedApproval.id);

    // Si es una aplicación de rider, usar el store
    if (selectedApproval.type === 'rider_competition_application') {
      const result = await approveApplication(selectedApproval.id, user?.username || 'Admin');
      if (result.success) {
        alert('✅ Inscripción de jinete aprobada exitosamente!');
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } else {
      // Para otros tipos, actualizar estado local
      setApprovals(approvals.map(approval =>
        approval.id === selectedApproval.id
          ? {
              ...approval,
              status: 'approved',
              approvedBy: user?.username || 'Admin',
              approvedAt: new Date().toISOString()
            }
          : approval
      ));
      alert('✅ Solicitud aprobada exitosamente!');
    }

    setShowApproveModal(false);
    setSelectedApproval(null);
  };

  const handleRejectClick = (approval) => {
    setSelectedApproval(approval);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('⚠️ Por favor, proporciona un motivo de rechazo');
      return;
    }

    console.log('❌ Rechazando solicitud:', selectedApproval.id, 'Motivo:', rejectReason);

    // Si es una aplicación de rider, usar el store
    if (selectedApproval.type === 'rider_competition_application') {
      const result = await rejectApplication(
        selectedApproval.id,
        user?.username || 'Admin',
        rejectReason
      );
      if (result.success) {
        alert('✅ Inscripción de jinete rechazada');
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } else {
      // Para otros tipos, actualizar estado local
      setApprovals(approvals.map(approval =>
        approval.id === selectedApproval.id
          ? {
              ...approval,
              status: 'rejected',
              rejectionReason: rejectReason,
              rejectedBy: user?.username || 'Admin',
              rejectedAt: new Date().toISOString()
            }
          : approval
      ));
      alert('✅ Solicitud rechazada');
    }

    setShowRejectModal(false);
    setSelectedApproval(null);
    setRejectReason('');
  };

  const filteredApprovals = filterStatus === 'all'
    ? approvals
    : approvals.filter(a => a.status === filterStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Profesional */}
      <header className="bg-white shadow-lg border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors duration-200 bg-green-50 px-3 py-2 rounded-lg"
              >
                <span>←</span>
                <span className="font-medium">Panel Admin</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">✅</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Aprobaciones</h1>
                  <p className="text-sm text-gray-600">Sistema de Verificación FEI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600">Administrador</p>
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

        {/* Mensaje Informativo */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-lg shadow-md">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-3xl">ℹ️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                Gestión de Inscripciones de Jinetes
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                Esta página administra las <strong>solicitudes de inscripción de jinetes</strong> a competencias FEI.
                Los jinetes envían aplicaciones para participar en competencias, y aquí puedes aprobarlas o rechazarlas.
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                <li><strong>Aprobar:</strong> El jinete queda inscrito y puede competir</li>
                <li><strong>Rechazar:</strong> Se debe proporcionar un motivo claro del rechazo</li>
                <li>Las solicitudes provienen del sistema de inscripción de competencias</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats Cards Profesionales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                <p className="text-3xl font-bold text-gray-900">{approvals.length}</p>
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
                <p className="text-3xl font-bold text-gray-900">
                  {approvals.filter(a => a.status === 'pending').length}
                </p>
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
                <p className="text-3xl font-bold text-gray-900">
                  {approvals.filter(a => a.status === 'approved').length}
                </p>
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
                <p className="text-3xl font-bold text-gray-900">
                  {approvals.filter(a => a.status === 'rejected').length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-xl rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filtrar Solicitudes</h3>
              <p className="text-sm text-gray-600">Selecciona el estado para filtrar</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterStatus === 'all'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas ({approvals.length})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendientes ({approvals.filter(a => a.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterStatus === 'approved'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aprobadas ({approvals.filter(a => a.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterStatus === 'rejected'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rechazadas ({approvals.filter(a => a.status === 'rejected').length})
              </button>
            </div>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
            <h3 className="text-xl font-bold text-gray-900">
              Lista de Solicitudes
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {filteredApprovals.length} solicitud(es) • Gestiona todas las solicitudes de registro y verificación
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-lg font-medium text-gray-700">Cargando solicitudes...</p>
              </div>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="text-6xl mb-4 block">📭</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes</h3>
              <p className="text-gray-500">
                {filterStatus === 'all'
                  ? 'No hay solicitudes en el sistema'
                  : `No hay solicitudes con estado "${getStatusDisplay(filterStatus)}"`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApprovals.map((approval) => (
                <div key={approval.id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icono */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                          <span className="text-3xl">{getTypeIcon(approval.type)}</span>
                        </div>
                      </div>

                      {/* Info Principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {approval.applicant}
                          </h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(approval.status)}`}>
                            {getStatusDisplay(approval.status)}
                          </span>
                        </div>

                        <div className="space-y-1 mb-3">
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="font-medium mr-2">Tipo:</span>
                            {getTypeDisplay(approval.type)}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="font-medium mr-2">Email:</span>
                            {approval.email}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="font-medium mr-2">Enviado:</span>
                            {formatDate(approval.submittedAt)}
                          </p>
                          {approval.certificationLevel && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <span className="font-medium mr-2">Nivel:</span>
                              {approval.certificationLevel} • {approval.experience} de experiencia
                            </p>
                          )}
                          {approval.competitionName && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <span className="font-medium mr-2">Competencia:</span>
                              {approval.competitionName}{approval.category ? ` (${approval.category})` : ''}
                            </p>
                          )}
                        </div>

                        {/* Documentos */}
                        <div className="flex flex-wrap gap-2">
                          {approval.documents.map((doc, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              📄 {doc}
                            </span>
                          ))}
                        </div>

                        {/* Motivo de rechazo */}
                        {approval.status === 'rejected' && approval.rejectionReason && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-red-800 mb-1">Motivo de rechazo:</p>
                            <p className="text-sm text-red-700">{approval.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex flex-col gap-2 ml-6">
                      <button
                        onClick={() => handleViewDetails(approval)}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
                      >
                        👁️ Ver Detalles
                      </button>

                      {approval.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveClick(approval)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                          >
                            ✅ Aprobar
                          </button>
                          <button
                            onClick={() => handleRejectClick(approval)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                          >
                            ❌ Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Detalles */}
        {showDetailsModal && selectedApproval && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-8 border w-full max-w-2xl shadow-2xl rounded-lg bg-white">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">{getTypeIcon(selectedApproval.type)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Detalles de Solicitud
                      </h3>
                      <p className="text-sm text-gray-600">ID: #{selectedApproval.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Contenido */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Solicitante</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedApproval.applicant}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Estado</label>
                      <p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedApproval.status)}`}>
                          {getStatusDisplay(selectedApproval.status)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{selectedApproval.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Teléfono</label>
                      <p className="text-sm text-gray-900">{selectedApproval.phone || 'No proporcionado'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500">Tipo de Solicitud</label>
                    <p className="text-sm text-gray-900">{getTypeDisplay(selectedApproval.type)}</p>
                  </div>

                  {selectedApproval.certificationLevel && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Nivel de Certificación</label>
                        <p className="text-sm font-semibold text-gray-900">{selectedApproval.certificationLevel}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Experiencia</label>
                        <p className="text-sm text-gray-900">{selectedApproval.experience}</p>
                      </div>
                    </div>
                  )}

                  {selectedApproval.competitionName && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Competencia</label>
                      <p className="text-sm text-gray-900">{selectedApproval.competitionName} ({selectedApproval.category})</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-2">Documentos Adjuntos</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedApproval.documents.map((doc, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          📄 {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Fecha de Envío</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedApproval.submittedAt)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">País</label>
                      <p className="text-sm text-gray-900">{selectedApproval.country || 'No especificado'}</p>
                    </div>
                  </div>

                  {selectedApproval.status === 'approved' && selectedApproval.approvedBy && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-800 mb-1">Aprobado por:</p>
                      <p className="text-sm text-green-700">{selectedApproval.approvedBy} el {formatDate(selectedApproval.approvedAt)}</p>
                    </div>
                  )}

                  {selectedApproval.status === 'rejected' && selectedApproval.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-800 mb-1">Rechazado por:</p>
                      <p className="text-sm text-red-700 mb-2">{selectedApproval.rejectedBy} el {formatDate(selectedApproval.rejectedAt)}</p>
                      <p className="text-sm font-medium text-red-800 mb-1">Motivo:</p>
                      <p className="text-sm text-red-700">{selectedApproval.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                  {selectedApproval.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleApproveClick(selectedApproval);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleRejectClick(selectedApproval);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        ❌ Rechazar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Aprobar */}
        {showApproveModal && selectedApproval && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-8 border w-full max-w-md shadow-2xl rounded-lg bg-white">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <span className="text-4xl">✅</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  ¿Aprobar solicitud?
                </h3>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    Estás a punto de aprobar la solicitud de:
                  </p>
                  <p className="text-base font-semibold text-gray-900 mb-2">
                    {selectedApproval.applicant}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    {getTypeDisplay(selectedApproval.type)}
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      El solicitante recibirá una notificación de aprobación y tendrá acceso al sistema según su rol.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmApprove}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-600 border-2 border-green-600 rounded-lg hover:bg-green-700 hover:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Sí, aprobar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Rechazar */}
        {showRejectModal && selectedApproval && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-8 border w-full max-w-md shadow-2xl rounded-lg bg-white">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <span className="text-4xl">❌</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  ¿Rechazar solicitud?
                </h3>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    Estás a punto de rechazar la solicitud de:
                  </p>
                  <p className="text-base font-semibold text-gray-900 mb-4">
                    {selectedApproval.applicant}
                  </p>

                  {/* Mensaje de instrucción */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-blue-900 text-center">
                      ⚠️ Debes proporcionar un motivo antes de rechazar
                    </p>
                  </div>

                  <div className="text-left mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de rechazo * (mínimo 2 caracteres)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Explica el motivo del rechazo. El solicitante recibirá esta información."
                    />
                    {rejectReason.trim().length > 0 && rejectReason.trim().length < 2 && (
                      <p className="text-xs text-red-600 mt-1">
                        Mínimo 2 caracteres requeridos (tienes {rejectReason.trim().length})
                      </p>
                    )}
                    {rejectReason.trim().length >= 2 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Motivo válido ({rejectReason.trim().length} caracteres)
                      </p>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Nota:</strong> El solicitante recibirá una notificación con el motivo del rechazo.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmReject}
                    disabled={rejectReason.trim().length < 2}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-white border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                      rejectReason.trim().length < 2
                        ? 'bg-gray-400 border-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700 focus:ring-red-500 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {rejectReason.trim().length < 2 ? '🔒 Sí, rechazar' : 'Sí, rechazar'}
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

export default ApprovalsPage;
