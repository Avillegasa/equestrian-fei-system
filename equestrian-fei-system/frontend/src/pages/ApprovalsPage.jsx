import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ApprovalsPage = () => {
  const { user, logout } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await logout();
  };

  // Datos de ejemplo para demostración
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setApprovals([
        {
          id: 1,
          type: 'judge_registration',
          applicant: 'María Carmen López',
          email: 'maria.lopez@example.com',
          requestedRole: 'judge',
          certificationLevel: 'FEI 3*',
          experience: '8 años',
          submittedAt: '2025-09-24T10:30:00Z',
          status: 'pending',
          documents: ['Certificación FEI', 'CV', 'Referencias']
        },
        {
          id: 2,
          type: 'organizer_verification',
          applicant: 'Club Ecuestre Valencia',
          email: 'admin@clubvalencia.es',
          requestedRole: 'organizer',
          organizationType: 'Club Deportivo',
          license: 'RFHE-2024-045',
          submittedAt: '2025-09-23T14:15:00Z',
          status: 'pending',
          documents: ['Licencia RFHE', 'Seguros', 'Instalaciones']
        },
        {
          id: 3,
          type: 'competition_approval',
          applicant: 'Federación Andaluza',
          email: 'competiciones@fedand.es',
          requestedRole: 'organizer',
          competitionName: 'Copa Andalucía Dressage 2025',
          category: 'Regional',
          submittedAt: '2025-09-22T09:45:00Z',
          status: 'approved',
          documents: ['Reglamento', 'Programa', 'Jueces']
        },
        {
          id: 4,
          type: 'judge_registration',
          applicant: 'Roberto Fernández',
          email: 'r.fernandez@juez.es',
          requestedRole: 'judge',
          certificationLevel: 'FEI 4*',
          experience: '15 años',
          submittedAt: '2025-09-21T16:20:00Z',
          status: 'rejected',
          documents: ['Certificación FEI', 'CV', 'Referencias'],
          rejectionReason: 'Documentación incompleta'
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      under_review: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
    const icons = {
      judge_registration: '⚖️',
      organizer_verification: '🏢',
      competition_approval: '🏆',
      license_renewal: '📄'
    };
    return icons[type] || '📋';
  };

  const getTypeDisplay = (type) => {
    const types = {
      judge_registration: 'Registro de Juez',
      organizer_verification: 'Verificación de Organizador',
      competition_approval: 'Aprobación de Competencia',
      license_renewal: 'Renovación de Licencia'
    };
    return types[type] || type;
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

  const handleApprove = (id) => {
    setApprovals(approvals.map(approval =>
      approval.id === id ? { ...approval, status: 'approved' } : approval
    ));
  };

  const handleReject = (id) => {
    setApprovals(approvals.map(approval =>
      approval.id === id ? { ...approval, status: 'rejected' } : approval
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/admin" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Volver al Panel Admin
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                ✅ Gestión de Aprobaciones
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
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Solicitudes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {approvals.length}
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
                        {approvals.filter(a => a.status === 'pending').length}
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
                        Aprobadas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {approvals.filter(a => a.status === 'approved').length}
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
                    <span className="text-2xl">❌</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Rechazadas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {approvals.filter(a => a.status === 'rejected').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Approvals Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Lista de Solicitudes de Aprobación
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Gestiona todas las solicitudes de registro, verificación y aprobación del sistema FEI
              </p>
            </div>

            {loading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando solicitudes...</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {approvals.map((approval) => (
                  <li key={approval.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="text-2xl">
                              {getTypeIcon(approval.type)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {approval.applicant}
                              </div>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                                {getStatusDisplay(approval.status)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {getTypeDisplay(approval.type)} • {approval.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              Enviado: {formatDate(approval.submittedAt)}
                            </div>
                            {approval.certificationLevel && (
                              <div className="text-sm text-gray-500">
                                Nivel: {approval.certificationLevel} • Experiencia: {approval.experience}
                              </div>
                            )}
                            {approval.competitionName && (
                              <div className="text-sm text-gray-500">
                                Competencia: {approval.competitionName} ({approval.category})
                              </div>
                            )}
                            {approval.rejectionReason && (
                              <div className="text-sm text-red-600 mt-1">
                                Motivo de rechazo: {approval.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right mr-4">
                            <div className="text-sm font-medium text-gray-900">
                              {approval.documents.length} documentos
                            </div>
                            <div className="text-sm text-gray-500">
                              {approval.documents.join(', ')}
                            </div>
                          </div>
                          {approval.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(approval.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleReject(approval.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                          <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                            Ver Detalles
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
            <div className="flex space-x-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Aprobar Seleccionadas
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Rechazar Seleccionadas
              </button>
            </div>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Exportar Reporte
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApprovalsPage;