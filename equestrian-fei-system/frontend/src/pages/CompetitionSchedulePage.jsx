import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import CreateScheduleModal from '../components/CreateScheduleModal';

const CompetitionSchedulePage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        status: 'in_progress'
      });

      setSchedule([
        {
          id: 1,
          title: 'Reconocimiento de Pistas',
          description: 'Reconocimiento oficial del recorrido para categoría Juvenil 1.20m',
          schedule_type: 'special_event',
          start_time: '2025-10-03T08:00:00',
          end_time: '2025-10-03T08:30:00',
          discipline: 'Show Jumping',
          category: 'Juvenil 1.20m',
          location: 'Arena Principal',
          is_published: true
        },
        {
          id: 2,
          title: 'Prueba Juvenil 1.20m - Ronda Clasificatoria',
          description: 'Primera ronda clasificatoria para la categoría Juvenil 1.20m',
          schedule_type: 'category_start',
          start_time: '2025-10-03T09:00:00',
          end_time: '2025-10-03T12:00:00',
          discipline: 'Show Jumping',
          category: 'Juvenil 1.20m',
          location: 'Arena Principal',
          is_published: true
        },
        {
          id: 3,
          title: 'Descanso - Almuerzo',
          description: 'Pausa para almuerzo y descanso de participantes',
          schedule_type: 'lunch',
          start_time: '2025-10-03T12:00:00',
          end_time: '2025-10-03T13:30:00',
          discipline: null,
          category: null,
          location: 'Área de Restauración',
          is_published: true
        },
        {
          id: 4,
          title: 'Prueba Senior 1.40m - Ronda Clasificatoria',
          description: 'Primera ronda clasificatoria para la categoría Senior 1.40m',
          schedule_type: 'category_start',
          start_time: '2025-10-03T13:30:00',
          end_time: '2025-10-03T17:00:00',
          discipline: 'Show Jumping',
          category: 'Senior 1.40m',
          location: 'Arena Principal',
          is_published: true
        },
        {
          id: 5,
          title: 'Premiación Día 1',
          description: 'Ceremonia de premiación de las categorías del primer día',
          schedule_type: 'awards',
          start_time: '2025-10-03T17:30:00',
          end_time: '2025-10-03T18:00:00',
          discipline: null,
          category: null,
          location: 'Arena Principal',
          is_published: false
        }
      ]);
      setLoading(false);
    }, 500);
  }, [competitionId]);

  const handleCreateSchedule = (scheduleData) => {
    // Generar un ID temporal para el nuevo evento
    const newSchedule = {
      id: schedule.length + 1,
      title: scheduleData.title,
      description: scheduleData.description,
      schedule_type: scheduleData.schedule_type,
      start_time: scheduleData.start_time,
      end_time: scheduleData.end_time,
      discipline: scheduleData.discipline || null,
      category: scheduleData.category || null,
      location: scheduleData.location,
      is_published: false
    };

    // Agregar el nuevo evento al estado
    setSchedule(prev => [...prev, newSchedule].sort((a, b) =>
      new Date(a.start_time) - new Date(b.start_time)
    ));

    // Mostrar mensaje de éxito
    alert('✅ Evento programado exitosamente!');
  };

  const handlePublishSchedule = (scheduleId) => {
    setSchedule(prev =>
      prev.map(s =>
        s.id === scheduleId ? { ...s, is_published: true } : s
      )
    );
    alert('✅ Evento publicado!');
  };

  const handleStartEvent = (scheduleId) => {
    // Simular inicio de evento
    alert('🚀 Evento iniciado! Los participantes pueden proceder.');
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      setSchedule(prev => prev.filter(s => s.id !== scheduleId));
      alert('✅ Evento eliminado!');
    }
  };

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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {competition.status === 'in_progress' ? 'En Progreso' : competition.status}
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
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Eventos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {schedule.length}
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
                    <span className="text-2xl">📢</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Publicados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {schedule.filter(s => s.is_published).length}
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
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pruebas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {schedule.filter(s => s.schedule_type === 'category_start').length}
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
                        Borradores
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {schedule.filter(s => !s.is_published).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Timeline */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Programación de Eventos
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Cronograma completo de la competencia
              </p>
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
                        <div className="flex flex-col items-end space-y-2">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(event.start_time)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {!event.is_published && (
                              <button
                                onClick={() => handlePublishSchedule(event.id)}
                                className="text-green-600 hover:text-green-500 text-sm font-medium"
                              >
                                Publicar
                              </button>
                            )}
                            {event.schedule_type === 'category_start' && event.is_published && (
                              <button
                                onClick={() => handleStartEvent(event.id)}
                                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                              >
                                Iniciar
                              </button>
                            )}
                            <button className="text-yellow-600 hover:text-yellow-500 text-sm font-medium">
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(event.id)}
                              className="text-red-600 hover:text-red-500 text-sm font-medium"
                            >
                              Eliminar
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
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Programar Evento
            </button>
            <div className="flex space-x-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Publicar Todo
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Generar PDF
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Exportar
              </button>
            </div>
          </div>

          {/* Modal de Crear Evento */}
          <CreateScheduleModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateSchedule}
          />
        </div>
      </main>
    </div>
  );
};

export default CompetitionSchedulePage;