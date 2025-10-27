import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';
import RegisterParticipantModal from '../components/RegisterParticipantModal';

// Modal de confirmación para eliminar
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, participantName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="relative mx-auto p-8 border border-red-200 w-full max-w-md shadow-2xl rounded-2xl bg-white transform transition-all">
        <div className="text-center">
          {/* Icono de advertencia animado */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 mb-4 animate-pulse">
            <span className="text-4xl">⚠️</span>
          </div>

          {/* Título */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Quitar Participante
          </h3>

          {/* Mensaje */}
          <div className="mb-6 px-4">
            <p className="text-base text-gray-600 mb-3">
              ¿Estás seguro de que deseas quitar a
            </p>
            <p className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              {participantName}
            </p>
            <p className="text-base text-gray-600 mt-3">
              de la competencia?
            </p>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Esta acción no se puede deshacer
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 px-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 border border-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-base font-semibold rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Quitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ParticipantsPage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const {
    currentCompetition,
    participants,
    loading,
    participantsLoading,
    loadCompetitionById,
    loadParticipants,
    registerParticipant,
    deleteParticipant
  } = useCompetitionStore();

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);

  const handleLogout = async () => {
    await logout();
  };

  // Cargar datos de la competencia y participantes
  useEffect(() => {
    if (competitionId) {
      loadCompetitionById(competitionId);
      loadParticipants({ competition: competitionId });
    }
  }, [competitionId, loadCompetitionById, loadParticipants]);

  const handleRegisterParticipant = async (participantData) => {
    try {
      // Preparar datos para enviar al backend
      const payload = {
        competition: competitionId,
        rider_id: participantData.rider_id,
        rider_first_name: participantData.rider_first_name,
        rider_last_name: participantData.rider_last_name,
        rider_email: participantData.rider_email,
        rider_nationality: participantData.rider_nationality,
        rider_category: participantData.rider_category,
        fei_license: participantData.fei_license,
        bib_number: participants.length + 1,
        is_confirmed: false,
        is_paid: false
      };

      const result = await registerParticipant(payload);

      if (result && result.success) {
        // Recargar participantes
        await loadParticipants({ competition: competitionId });
        return result;
      } else {
        console.error('Error registrando participante:', result?.error);
        return result;
      }
    } catch (error) {
      console.error('Error registrando participante:', error);
      return { success: false, error: error.message };
    }
  };

  const handleConfirmParticipant = async (participantId) => {
    try {
      // En producción, esto haría una llamada al backend para actualizar el participante
      // Por ahora, usamos localStorage
      const participantsKey = `fei_participants_${competitionId}`;
      const storedParticipants = JSON.parse(localStorage.getItem(participantsKey) || '[]');
      const updatedParticipants = storedParticipants.map(p =>
        p.id === participantId ? { ...p, is_confirmed: true } : p
      );
      localStorage.setItem(participantsKey, JSON.stringify(updatedParticipants));

      // Recargar participantes
      await loadParticipants({ competition: competitionId });
      alert('✅ Participante confirmado!');
    } catch (error) {
      console.error('Error confirmando participante:', error);
      alert('❌ Error confirmando participante');
    }
  };

  const handleMarkPaid = async (participantId) => {
    try {
      // En producción, esto haría una llamada al backend para actualizar el participante
      // Por ahora, usamos localStorage
      const participantsKey = `fei_participants_${competitionId}`;
      const storedParticipants = JSON.parse(localStorage.getItem(participantsKey) || '[]');
      const updatedParticipants = storedParticipants.map(p =>
        p.id === participantId ? { ...p, is_paid: true } : p
      );
      localStorage.setItem(participantsKey, JSON.stringify(updatedParticipants));

      // Recargar participantes
      await loadParticipants({ competition: competitionId });
      alert('✅ Pago registrado!');
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('❌ Error registrando pago');
    }
  };

  const handleRemoveParticipant = (participant) => {
    setParticipantToDelete(participant);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (participantToDelete) {
      try {
        const result = await deleteParticipant(participantToDelete.id);

        if (result.success) {
          alert('✅ Participante removido exitosamente!');
          // Recargar participantes
          await loadParticipants({ competition: competitionId });
        } else {
          alert('❌ Error: ' + (result.error || 'No se pudo eliminar el participante'));
        }
      } catch (error) {
        console.error('Error eliminando participante:', error);
        alert('❌ Error eliminando participante');
      } finally {
        setShowDeleteModal(false);
        setParticipantToDelete(null);
      }
    }
  };

  const handleGenerateStartList = () => {
    if (!currentCompetition || !participants || participants.length === 0) {
      alert('⚠️ No hay participantes para generar la lista de salida');
      return;
    }

    // Ordenar participantes por categoría y número de dorsal
    const sortedParticipants = [...participants].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return (a.bib_number || 0) - (b.bib_number || 0);
    });

    // Crear contenido de texto para la lista de salida
    let content = `LISTA DE SALIDA - ${currentCompetition.name}\n`;
    content += `${currentCompetition.discipline || 'Disciplina'} • ${currentCompetition.location || 'Ubicación'}\n`;
    content += `${currentCompetition.startDate || currentCompetition.start_date} - ${currentCompetition.endDate || currentCompetition.end_date}\n`;
    content += `\n${'='.repeat(80)}\n\n`;

    let currentCategory = '';
    sortedParticipants.forEach((p, index) => {
      if (p.category !== currentCategory) {
        currentCategory = p.category;
        content += `\n--- ${currentCategory} ---\n\n`;
      }
      const firstName = p.rider?.first_name || p.rider_first_name || '';
      const lastName = p.rider?.last_name || p.rider_last_name || '';
      const horseName = p.horse?.name || p.horse_name || 'N/A';
      const nationality = p.rider?.nationality || p.rider_nationality || 'N/A';

      content += `${index + 1}. #${p.bib_number || 'N/A'} - ${firstName} ${lastName} + ${horseName}\n`;
      content += `   Nacionalidad: ${nationality} | Categoría: ${p.category}\n`;
      content += `   Estado: ${getStatusText(p)}\n\n`;
    });

    // Crear un blob y descargarlo
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista_salida_${currentCompetition.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ Lista de salida generada y descargada!');
  };

  const handleExportList = () => {
    if (!currentCompetition || !participants || participants.length === 0) {
      alert('⚠️ No hay participantes para exportar');
      return;
    }

    // Crear CSV con todos los datos
    let csv = 'Dorsal,Nombre,Apellido,Email,Nacionalidad,Caballo,Categoría,Confirmado,Pagado\n';

    participants.forEach(p => {
      const firstName = p.rider?.first_name || p.rider_first_name || '';
      const lastName = p.rider?.last_name || p.rider_last_name || '';
      const email = p.rider?.email || p.rider_email || '';
      const nationality = p.rider?.nationality || p.rider_nationality || '';
      const horseName = p.horse?.name || p.horse_name || 'N/A';

      csv += `${p.bib_number || 'N/A'},`;
      csv += `${firstName},${lastName},`;
      csv += `${email},${nationality},`;
      csv += `${horseName},`;
      csv += `${p.category},`;
      csv += `${p.is_confirmed ? 'Sí' : 'No'},${p.is_paid ? 'Sí' : 'No'}\n`;
    });

    // Descargar CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes_${currentCompetition.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ Lista de participantes exportada a CSV!');
  };

  const getStatusColor = (participant) => {
    if (participant.is_confirmed && participant.is_paid) {
      return 'bg-green-100 text-green-800';
    } else if (participant.is_confirmed) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (participant) => {
    if (participant.is_confirmed && participant.is_paid) {
      return 'Completo';
    } else if (participant.is_confirmed) {
      return 'Pendiente Pago';
    } else {
      return 'Pendiente Confirmación';
    }
  };

  // Asegurar que participants sea siempre un array
  const participantsList = Array.isArray(participants) ? participants : [];

  if (loading && !currentCompetition) {
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
                🏇 Participantes de la Competencia
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
          {currentCompetition && (
            <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{currentCompetition.name}</h2>
                    <p className="text-sm text-gray-500">
                      {currentCompetition.discipline} • {currentCompetition.location}
                    </p>
                    <p className="text-sm text-gray-500">
                      {currentCompetition.startDate || currentCompetition.start_date} - {currentCompetition.endDate || currentCompetition.end_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {currentCompetition.status === 'open_registration' ? 'Inscripción Abierta' : currentCompetition.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🏇</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Participantes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {participantsList.length}
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
                        {participantsList.filter(p => p.is_confirmed).length}
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
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pagados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {participantsList.filter(p => p.is_paid).length}
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
                        {participantsList.filter(p => !p.is_confirmed || !p.is_paid).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Participants Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Lista de Participantes
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Jinetes y caballos registrados en la competencia
              </p>
            </div>

            {participantsLoading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando participantes...</p>
                </div>
              </div>
            ) : participantsList.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">🏇</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay participantes registrados
                </h3>
                <p className="text-sm text-gray-500">
                  Haz clic en "Registrar Participante" para agregar jinetes a esta competencia
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {participantsList.map((participant) => (
                  <li key={participant.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center">
                              <span className="text-blue-600 font-bold">#{participant.bib_number}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {participant.rider?.first_name || participant.rider_first_name} {participant.rider?.last_name || participant.rider_last_name}
                                {(participant.horse?.name || participant.horse_name) && ` + ${participant.horse?.name || participant.horse_name}`}
                              </div>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(participant)}`}>
                                {getStatusText(participant)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Categoría: {participant.category}
                            </div>
                            {(participant.horse?.breed || participant.horse_breed) && (
                              <div className="text-sm text-gray-500">
                                Caballo: {participant.horse?.breed || participant.horse_breed}
                                {(participant.horse?.age || participant.horse_age) && `, ${participant.horse?.age || participant.horse_age} años`}
                                {(participant.horse?.height || participant.horse_height) && `, ${participant.horse?.height || participant.horse_height}cm`}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              Email: {participant.rider?.email || participant.rider_email} • Nacionalidad: {participant.rider?.nationality || participant.rider_nationality}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-3">
                          <div className="text-right text-xs text-gray-400">
                            Registrado: {participant.registration_date}
                          </div>
                          <div className="flex gap-2">
                            {!participant.is_confirmed && (
                              <button
                                onClick={() => handleConfirmParticipant(participant.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow"
                                title="Confirmar participante"
                              >
                                <span className="text-sm">✓</span>
                                <span>Confirmar</span>
                              </button>
                            )}
                            {!participant.is_paid && (
                              <button
                                onClick={() => handleMarkPaid(participant.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow"
                                title="Marcar como pagado"
                              >
                                <span className="text-sm">💰</span>
                                <span>Pagado</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveParticipant(participant)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow"
                              title="Quitar de la competencia"
                            >
                              <span className="text-sm">🗑️</span>
                              <span>Quitar</span>
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
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Acciones Rápidas</h3>
                <p className="text-sm text-gray-600">Gestiona participantes y exporta información</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm transform hover:scale-105"
                >
                  <span className="text-lg">➕</span>
                  <span>Registrar Participante</span>
                </button>
                <button
                  onClick={handleGenerateStartList}
                  disabled={participantsList.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title={participantsList.length === 0 ? 'No hay participantes para generar la lista' : 'Generar lista de salida'}
                >
                  <span className="text-lg">📋</span>
                  <span>Lista de Salida</span>
                </button>
                <button
                  onClick={handleExportList}
                  disabled={participantsList.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title={participantsList.length === 0 ? 'No hay participantes para exportar' : 'Exportar lista a CSV'}
                >
                  <span className="text-lg">📥</span>
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal de Registrar Participante */}
          <RegisterParticipantModal
            isOpen={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
            onSubmit={handleRegisterParticipant}
            acceptedCategories={currentCompetition?.acceptedCategories || currentCompetition?.accepted_categories || []}
          />

          {/* Modal de Confirmación para Eliminar */}
          <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setParticipantToDelete(null);
            }}
            onConfirm={confirmDelete}
            participantName={
              participantToDelete
                ? `${participantToDelete.rider?.first_name || participantToDelete.rider_first_name || ''} ${participantToDelete.rider?.last_name || participantToDelete.rider_last_name || ''}`
                : ''
            }
          />
        </div>
      </main>
    </div>
  );
};

export default ParticipantsPage;