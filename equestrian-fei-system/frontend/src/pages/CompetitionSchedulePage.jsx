import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import scheduleService from '../services/scheduleService';
import useCompetitionStore from '../store/competitionStore';
import CreateScheduleModal from '../components/CreateScheduleModal';

const CompetitionSchedulePage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showPublishAllConfirm, setShowPublishAllConfirm] = useState(false);
  const [unpublishedCount, setUnpublishedCount] = useState(0);

  const { loadCompetitionById } = useCompetitionStore();

  const handleLogout = async () => {
    await logout();
  };

  // Cargar competencia desde el store
  useEffect(() => {
    if (competitionId) {
      console.log('📋 Cargando competencia:', competitionId);
      loadCompetitionById(competitionId).then(comp => {
        if (comp) {
          setCompetition({
            id: comp.id,
            name: comp.name,
            discipline: comp.discipline,
            location: comp.location || `${comp.venue_city}, ${comp.venue_country}`,
            startDate: comp.start_date || comp.startDate,
            endDate: comp.end_date || comp.endDate,
            status: comp.status
          });
        }
      });
    }
  }, [competitionId, loadCompetitionById]);

  // Cargar programación desde API usando scheduleService
  const loadSchedule = async () => {
    if (!competitionId) return;

    setLoading(true);
    try {
      console.log('📅 Cargando programación desde API');
      const scheduleData = await scheduleService.getCompetitionSchedule(competitionId);
      console.log('✅ Programación cargada desde API:', scheduleData.length, 'eventos');
      setSchedule(scheduleData);
      setUnpublishedCount(scheduleData.filter(e => !e.is_published).length);
    } catch (error) {
      console.error('❌ Error al cargar programación:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [competitionId]);

  const handleCreateSchedule = async (scheduleData) => {
    try {
      console.log('➕ Creando evento en programación');
      await scheduleService.createScheduleEvent(competitionId, scheduleData);

      // Recargar programación
      await loadSchedule();

      // Mostrar mensaje de éxito
      alert('✅ Evento programado exitosamente!');
    } catch (error) {
      console.error('❌ Error al crear evento:', error);
      alert('Error al programar evento. Verifica la consola para más detalles.');
    }
  };

  const handleUpdateSchedule = async (scheduleData) => {
    try {
      console.log('📝 Actualizando evento ID:', editingEventId);
      await scheduleService.updateScheduleEvent(editingEventId, scheduleData);

      // Recargar programación
      await loadSchedule();

      // Cerrar modal y limpiar estado de edición
      setShowEditModal(false);
      setEditingEventId(null);

      // Mostrar mensaje de éxito
      alert('✅ Evento actualizado exitosamente!');
    } catch (error) {
      console.error('❌ Error al actualizar evento:', error);
      alert('Error al actualizar evento. Verifica la consola para más detalles.');
    }
  };

  // Funciones auxiliares (deben estar antes de los handlers que las usan)
  const getScheduleTypeDisplay = (type) => {
    const types = {
      competition_start: 'Inicio de Competencia',
      discipline_start: 'Inicio de Disciplina',
      category_start: 'Inicio de Categoría',
      break: 'Descanso',
      lunch: 'Almuerzo',
      awards: 'Premiación',
      special_event: 'Evento Especial'
    };
    return types[type] || type;
  };

  const getScheduleTypeIcon = (type) => {
    const icons = {
      competition_start: '🏁',
      discipline_start: '🎯',
      category_start: '🏆',
      break: '☕',
      lunch: '🍽️',
      awards: '🏅',
      special_event: '⭐'
    };
    return icons[type] || '📅';
  };

  const getStatusColor = (event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now > endTime) {
      return 'bg-gray-100 text-gray-800'; // Completado
    } else if (now >= startTime && now <= endTime) {
      return 'bg-green-100 text-green-800'; // En progreso
    } else {
      return event.is_published ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'; // Programado/Borrador
    }
  };

  const getStatusText = (event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now > endTime) {
      return 'Completado';
    } else if (now >= startTime && now <= endTime) {
      return 'En Progreso';
    } else {
      return event.is_published ? 'Programado' : 'Borrador';
    }
  };

  const formatTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long'
    });
  };

  // Handlers de eventos
  const handlePublishSchedule = (e, scheduleId) => {
    e.stopPropagation();
    e.preventDefault();

    const updatedSchedule = schedule.map(s =>
      s.id === scheduleId ? { ...s, is_published: true } : s
    );

    // Guardar en localStorage
    const scheduleKey = `fei_schedule_${competitionId}`;
    localStorage.setItem(scheduleKey, JSON.stringify(updatedSchedule));

    setSchedule(updatedSchedule);
    alert('✅ Evento publicado!');
  };

  const handleStartEvent = (e, scheduleId) => {
    e.stopPropagation();
    e.preventDefault();

    // Simular inicio de evento
    alert('🚀 Evento iniciado! Los participantes pueden proceder.');
  };

  const handleDeleteSchedule = (e, scheduleId) => {
    // Prevenir propagación de eventos
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    console.log('🗑️ Iniciando eliminación de evento:', {
      scheduleId,
      totalEventos: schedule.length,
      competitionId
    });

    const event = schedule.find(s => s.id === scheduleId);

    if (!event) {
      console.error('❌ Evento no encontrado:', scheduleId);
      alert('⚠️ Error: Evento no encontrado');
      return;
    }

    console.log('📋 Evento a eliminar:', {
      id: event.id,
      title: event.title,
      is_published: event.is_published
    });

    // Abrir modal de confirmación en lugar de window.confirm
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!eventToDelete) return;

    try {
      const updatedSchedule = schedule.filter(s => s.id !== eventToDelete.id);
      console.log('✅ Schedule actualizado:', {
        eventosAntes: schedule.length,
        eventosDespues: updatedSchedule.length,
        eliminados: schedule.length - updatedSchedule.length
      });

      // Guardar en localStorage
      const scheduleKey = `fei_schedule_${competitionId}`;
      localStorage.setItem(scheduleKey, JSON.stringify(updatedSchedule));
      console.log('💾 Guardado en localStorage:', scheduleKey);

      // Verificar que se guardó correctamente
      const verificacion = JSON.parse(localStorage.getItem(scheduleKey) || '[]');
      console.log('✔️ Verificación localStorage:', verificacion.length, 'eventos');

      // Actualizar estado
      setSchedule(updatedSchedule);

      alert('✅ Evento eliminado exitosamente!');
      console.log('🎉 Eliminación completada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando evento:', {
        error: error.message,
        stack: error.stack,
        scheduleId: eventToDelete.id
      });
      alert('❌ Error al eliminar el evento. Por favor intenta de nuevo.');
    } finally {
      // Cerrar modal y limpiar estado
      setShowDeleteConfirm(false);
      setEventToDelete(null);
    }
  };

  const cancelDelete = () => {
    console.log('❌ Eliminación cancelada por el usuario');
    setShowDeleteConfirm(false);
    setEventToDelete(null);
  };

  const handleEditSchedule = (e, scheduleId) => {
    e.stopPropagation();
    e.preventDefault();

    console.log('✏️ Editar evento ID:', scheduleId);
    const event = schedule.find(s => s.id === scheduleId);
    if (event) {
      setEditingEventId(scheduleId);
      setShowEditModal(true);
    } else {
      alert('⚠️ Error: Evento no encontrado');
    }
  };

  const handlePublishAll = () => {
    const count = schedule.filter(s => !s.is_published).length;

    if (count === 0) {
      alert('ℹ️ Todos los eventos ya están publicados.');
      return;
    }

    console.log('📢 Iniciando publicación masiva:', {
      eventosSinPublicar: count,
      totalEventos: schedule.length,
      competitionId
    });

    // Abrir modal de confirmación
    setUnpublishedCount(count);
    setShowPublishAllConfirm(true);
  };

  const confirmPublishAll = () => {
    try {
      const updatedSchedule = schedule.map(s => ({ ...s, is_published: true }));

      console.log('✅ Publicando todos los eventos:', {
        eventosAntes: schedule.filter(s => !s.is_published).length,
        eventosDespues: updatedSchedule.filter(s => !s.is_published).length,
        totalPublicados: unpublishedCount
      });

      // Guardar en localStorage
      const scheduleKey = `fei_schedule_${competitionId}`;
      localStorage.setItem(scheduleKey, JSON.stringify(updatedSchedule));
      console.log('💾 Guardado en localStorage:', scheduleKey);

      // Verificar que se guardó correctamente
      const verificacion = JSON.parse(localStorage.getItem(scheduleKey) || '[]');
      console.log('✔️ Verificación localStorage:', {
        totalEventos: verificacion.length,
        publicados: verificacion.filter(s => s.is_published).length
      });

      setSchedule(updatedSchedule);
      alert(`✅ ${unpublishedCount} evento(s) publicado(s) exitosamente!`);
      console.log('🎉 Publicación masiva completada');
    } catch (error) {
      console.error('❌ Error publicando eventos:', error);
      alert('❌ Error al publicar eventos. Por favor intenta de nuevo.');
    } finally {
      // Cerrar modal
      setShowPublishAllConfirm(false);
      setUnpublishedCount(0);
    }
  };

  const cancelPublishAll = () => {
    console.log('❌ Publicación masiva cancelada por el usuario');
    setShowPublishAllConfirm(false);
    setUnpublishedCount(0);
  };

  const handleGeneratePDF = () => {
    if (schedule.length === 0) {
      alert('⚠️ No hay eventos para generar PDF');
      return;
    }

    // Generar contenido para PDF (simulado con texto)
    let content = `PROGRAMACIÓN DE LA COMPETENCIA\n`;
    content += `${competition.name}\n`;
    content += `${competition.discipline} • ${competition.location}\n`;
    content += `${competition.startDate} - ${competition.endDate}\n`;
    content += `\n${'='.repeat(80)}\n\n`;

    // Agrupar por fecha
    const eventsByDate = {};
    schedule.forEach(event => {
      const date = formatDate(event.start_time);
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push(event);
    });

    // Construir contenido
    Object.keys(eventsByDate).forEach(date => {
      content += `\n📅 ${date}\n`;
      content += `${'-'.repeat(80)}\n\n`;

      eventsByDate[date].forEach(event => {
        content += `${formatTime(event.start_time)} - ${formatTime(event.end_time)}\n`;
        content += `${getScheduleTypeIcon(event.schedule_type)} ${event.title}\n`;
        content += `   Tipo: ${getScheduleTypeDisplay(event.schedule_type)}\n`;
        content += `   Ubicación: ${event.location}\n`;
        if (event.category) {
          content += `   Categoría: ${event.category}\n`;
        }
        content += `   ${event.description}\n`;
        content += `   Estado: ${getStatusText(event)}\n\n`;
      });
    });

    // Crear archivo de texto (simulando PDF)
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `programacion_${competition.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ Programación generada y descargada!');
  };

  const handleExportSchedule = () => {
    if (schedule.length === 0) {
      alert('⚠️ No hay eventos para exportar');
      return;
    }

    // Crear CSV
    let csv = 'Fecha,Hora Inicio,Hora Fin,Título,Tipo,Categoría,Ubicación,Descripción,Estado\n';

    schedule.forEach(event => {
      const date = formatDate(event.start_time);
      const startTime = formatTime(event.start_time);
      const endTime = formatTime(event.end_time);

      csv += `"${date}",`;
      csv += `"${startTime}","${endTime}",`;
      csv += `"${event.title}",`;
      csv += `"${getScheduleTypeDisplay(event.schedule_type)}",`;
      csv += `"${event.category || 'N/A'}",`;
      csv += `"${event.location}",`;
      csv += `"${event.description}",`;
      csv += `"${getStatusText(event)}"\n`;
    });

    // Descargar CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `programacion_${competition.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ Programación exportada a CSV!');
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
                📅 Programación de la Competencia
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

          {/* Competition Info - Redesigned */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden shadow-xl rounded-xl mb-8">
            <div className="px-6 py-8 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {competition.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
                    <span className="flex items-center">
                      🏆 {competition.discipline}
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="flex items-center">
                      📍 {competition.location}
                    </span>
                  </div>
                  <div className="mt-3 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
                    <div className="text-white/90 text-xs font-medium mb-1">
                      📅 Fechas de la Competencia
                    </div>
                    <div className="text-white font-bold text-sm">
                      {new Date(competition.startDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {' → '}
                      {new Date(competition.endDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-white text-blue-600 shadow-lg">
                    {competition.status === 'in_progress' ? '🔴 En Progreso' :
                     competition.status === 'draft' ? '📝 Borrador' :
                     competition.status === 'open_registration' ? '📝 Inscripción Abierta' :
                     competition.status === 'completed' ? '✅ Completada' : competition.status}
                  </span>
                  <div className="text-white/80 text-xs">
                    Programación de Eventos
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Redesigned */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Total Eventos
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {schedule.length}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">📅</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-green-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Publicados
                    </dt>
                    <dd className="text-3xl font-bold text-green-600">
                      {schedule.filter(s => s.is_published).length}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">✅</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-purple-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Pruebas
                    </dt>
                    <dd className="text-3xl font-bold text-purple-600">
                      {schedule.filter(s => s.schedule_type === 'category_start').length}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">🏆</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-orange-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Borradores
                    </dt>
                    <dd className="text-3xl font-bold text-orange-600">
                      {schedule.filter(s => !s.is_published).length}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">📝</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Timeline - Redesigned */}
          <div className="bg-white shadow-xl overflow-hidden rounded-xl border border-gray-200">
            <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    🗓️ Programación de Eventos
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Cronograma completo ordenado por fecha y hora
                  </p>
                </div>
                {schedule.length > 0 && (
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{schedule.length}</span>
                    <p className="text-xs text-gray-500">eventos</p>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando programación...</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {schedule.map((event, index) => (
                  <li key={event.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="text-2xl">
                              {getScheduleTypeIcon(event.schedule_type)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {event.title}
                              </div>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event)}`}>
                                {getStatusText(event)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {getScheduleTypeDisplay(event.schedule_type)}
                            </div>
                            <div className="text-sm text-gray-500">
                              📍 {event.location}
                            </div>
                            {event.category && (
                              <div className="text-sm text-gray-500">
                                🏆 {event.category}
                              </div>
                            )}
                            <div className="text-sm text-gray-600 mt-1">
                              {event.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-3">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(event.start_time)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!event.is_published && (
                              <button
                                onClick={(e) => handlePublishSchedule(e, event.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow"
                                title="Publicar evento para participantes"
                              >
                                <span className="text-sm">📢</span>
                                <span>Publicar</span>
                              </button>
                            )}
                            {event.schedule_type === 'category_start' && event.is_published && (
                              <button
                                onClick={(e) => handleStartEvent(e, event.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow"
                                title="Iniciar prueba"
                              >
                                <span className="text-sm">🚀</span>
                                <span>Iniciar</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => handleEditSchedule(e, event.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow"
                              title="Editar evento"
                            >
                              <span className="text-sm">✏️</span>
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteSchedule(e, event.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow"
                              title="Eliminar evento"
                            >
                              <span className="text-sm">🗑️</span>
                              <span>Eliminar</span>
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
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 shadow-sm border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Acciones Rápidas</h3>
                <p className="text-sm text-gray-600">Gestiona la programación y exporta información</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm transform hover:scale-105"
                  title="Programar nuevo evento"
                >
                  <span className="text-lg">➕</span>
                  <span>Programar Evento</span>
                </button>
                <button
                  onClick={handlePublishAll}
                  disabled={schedule.filter(s => !s.is_published).length === 0}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title={schedule.filter(s => !s.is_published).length === 0 ? 'Todos los eventos están publicados' : 'Publicar todos los eventos en borrador'}
                >
                  <span className="text-lg">📢</span>
                  <span>Publicar Todo</span>
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={schedule.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title={schedule.length === 0 ? 'No hay eventos para generar PDF' : 'Generar programación en formato PDF'}
                >
                  <span className="text-lg">📄</span>
                  <span>Generar PDF</span>
                </button>
                <button
                  onClick={handleExportSchedule}
                  disabled={schedule.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title={schedule.length === 0 ? 'No hay eventos para exportar' : 'Exportar programación a CSV'}
                >
                  <span className="text-lg">📥</span>
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal de Crear Evento */}
          <CreateScheduleModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateSchedule}
            competitionStartDate={competition?.startDate}
            competitionEndDate={competition?.endDate}
            competitionName={competition?.name}
          />

          {/* Modal de Editar Evento */}
          <CreateScheduleModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingEventId(null);
            }}
            onSubmit={handleUpdateSchedule}
            initialData={schedule.find(s => s.id === editingEventId)}
            isEditMode={true}
            competitionStartDate={competition?.startDate}
            competitionEndDate={competition?.endDate}
            competitionName={competition?.name}
          />

          {/* Modal de Confirmación de Eliminación */}
          {showDeleteConfirm && eventToDelete && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative mx-auto p-8 border w-full max-w-md shadow-2xl rounded-lg bg-white">
                <div className="text-center">
                  {/* Icono de advertencia */}
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                    <span className="text-4xl">⚠️</span>
                  </div>

                  {/* Título */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    ¿Eliminar evento?
                  </h3>

                  {/* Mensaje */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">
                      ¿Estás seguro de que deseas eliminar el evento:
                    </p>
                    <p className="text-base font-semibold text-gray-900 mb-2">
                      "{eventToDelete.title}"
                    </p>
                    <p className="text-sm text-red-600 font-medium">
                      Esta acción no se puede deshacer.
                    </p>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><span className="font-semibold">Tipo:</span> {getScheduleTypeDisplay(eventToDelete.schedule_type)}</p>
                      <p><span className="font-semibold">Fecha:</span> {formatDate(eventToDelete.start_time)}</p>
                      <p><span className="font-semibold">Hora:</span> {formatTime(eventToDelete.start_time)} - {formatTime(eventToDelete.end_time)}</p>
                      <p><span className="font-semibold">Estado:</span> {eventToDelete.is_published ? 'Publicado' : 'Borrador'}</p>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3">
                    <button
                      onClick={cancelDelete}
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 border-2 border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmación de Publicar Todo */}
          {showPublishAllConfirm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
              <div className="relative mx-auto p-8 border w-full max-w-md shadow-2xl rounded-lg bg-white">
                <div className="text-center">
                  {/* Icono de publicación */}
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <span className="text-4xl">📢</span>
                  </div>

                  {/* Título */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    ¿Publicar todos los eventos?
                  </h3>

                  {/* Mensaje */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">
                      Estás a punto de publicar:
                    </p>
                    <p className="text-3xl font-bold text-green-600 mb-2">
                      {unpublishedCount}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      {unpublishedCount === 1 ? 'evento en borrador' : 'eventos en borrador'}
                    </p>
                    <p className="text-sm text-green-700 font-medium bg-green-50 rounded-lg p-3">
                      Los participantes podrán ver estos eventos en la programación pública.
                    </p>
                  </div>

                  {/* Lista de eventos que se publicarán */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left max-h-40 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Eventos a publicar:</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      {schedule.filter(s => !s.is_published).map((event, index) => (
                        <div key={event.id} className="flex items-start gap-2 py-1 border-b border-gray-200 last:border-0">
                          <span className="text-gray-400">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{event.title}</p>
                            <p className="text-gray-500">{formatDate(event.start_time)} • {formatTime(event.start_time)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3">
                    <button
                      onClick={cancelPublishAll}
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmPublishAll}
                      className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-600 border-2 border-green-600 rounded-lg hover:bg-green-700 hover:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Sí, publicar todo
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

export default CompetitionSchedulePage;