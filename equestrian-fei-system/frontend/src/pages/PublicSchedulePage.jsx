import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PublicSchedulePage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('all');

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    if (!competitionId) return;

    setLoading(true);

    // Cargar competencia
    const competitionsData = JSON.parse(localStorage.getItem('fei_competitions') || '[]');
    const comp = competitionsData.find(c => c.id == competitionId);

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

    // Cargar solo eventos PUBLICADOS
    const scheduleKey = `fei_schedule_${competitionId}`;
    const storedSchedule = JSON.parse(localStorage.getItem(scheduleKey) || '[]');
    const publishedSchedule = storedSchedule.filter(event => event.is_published);

    setSchedule(publishedSchedule);
    setLoading(false);
  }, [competitionId]);

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

  const formatTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatDateShort = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now > endTime) {
      return { text: 'Completado', color: 'bg-gray-100 text-gray-700' };
    } else if (now >= startTime && now <= endTime) {
      return { text: 'En Progreso', color: 'bg-green-100 text-green-700' };
    } else {
      return { text: 'Próximo', color: 'bg-blue-100 text-blue-700' };
    }
  };

  // Agrupar eventos por fecha
  const groupEventsByDate = () => {
    const groups = {};
    schedule.forEach(event => {
      const date = formatDateShort(event.start_time);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    return groups;
  };

  const eventsByDate = groupEventsByDate();
  const dates = Object.keys(eventsByDate);

  // Filtrar por día seleccionado
  const filteredSchedule = selectedDay === 'all'
    ? schedule
    : eventsByDate[selectedDay] || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                to={user?.role === 'admin' ? '/admin' : user?.role === 'organizer' ? '/organizer' : '/judge'}
                className="text-blue-600 hover:text-blue-500 mr-4 font-medium"
              >
                ← Volver
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📅 Programación Oficial
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.first_name || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Competition Info */}
        {competition && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{competition.name}</h2>
              <p className="text-lg text-gray-600">
                {competition.discipline} • {competition.location}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {competition.startDate} - {competition.endDate}
              </p>
            </div>
          </div>
        )}

        {/* Filtros por día */}
        {dates.length > 1 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Filtrar por día:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDay('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedDay === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos los días
              </button>
              {dates.map(date => (
                <button
                  key={date}
                  onClick={() => setSelectedDay(date)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedDay === date
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {date}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Timeline */}
        {filteredSchedule.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No hay eventos publicados
            </h3>
            <p className="text-gray-600">
              La programación se publicará próximamente. Por favor revisa más tarde.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSchedule.map((event, index) => {
              const status = getEventStatus(event);
              const isFirstOfDay = index === 0 ||
                formatDateShort(event.start_time) !== formatDateShort(filteredSchedule[index - 1].start_time);

              return (
                <div key={event.id}>
                  {/* Mostrar fecha si es el primer evento del día */}
                  {isFirstOfDay && selectedDay === 'all' && (
                    <div className="flex items-center my-6">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="flex-shrink mx-4 text-gray-600 font-semibold">
                        📅 {formatDate(event.start_time)}
                      </span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>
                  )}

                  {/* Evento */}
                  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-100">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Icono y hora */}
                          <div className="flex-shrink-0 text-center">
                            <div className="text-4xl mb-2">
                              {getScheduleTypeIcon(event.schedule_type)}
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
                              <div className="text-sm font-bold text-gray-900">
                                {formatTime(event.start_time)}
                              </div>
                              <div className="text-xs text-gray-500">-</div>
                              <div className="text-sm font-bold text-gray-900">
                                {formatTime(event.end_time)}
                              </div>
                            </div>
                          </div>

                          {/* Información del evento */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {event.title}
                              </h3>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.text}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-3">
                              {event.description}
                            </p>

                            <div className="flex flex-wrap gap-3 text-sm">
                              <div className="flex items-center text-gray-700">
                                <span className="font-medium mr-1">Tipo:</span>
                                {getScheduleTypeDisplay(event.schedule_type)}
                              </div>

                              <div className="flex items-center text-gray-700">
                                <span className="mr-1">📍</span>
                                <span className="font-medium mr-1">Ubicación:</span>
                                {event.location}
                              </div>

                              {event.category && (
                                <div className="flex items-center text-gray-700">
                                  <span className="mr-1">🏆</span>
                                  <span className="font-medium mr-1">Categoría:</span>
                                  {event.category}
                                </div>
                              )}

                              {event.discipline && (
                                <div className="flex items-center text-gray-700">
                                  <span className="mr-1">🎯</span>
                                  <span className="font-medium mr-1">Disciplina:</span>
                                  {event.discipline}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Información Importante</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• La programación puede sufrir cambios. Consulta regularmente para actualizaciones.</li>
                <li>• Los participantes deben presentarse 30 minutos antes de su prueba.</li>
                <li>• El reconocimiento de pistas es obligatorio para todas las categorías.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicSchedulePage;
