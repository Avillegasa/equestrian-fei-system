import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCompetitionStore from '../../store/competitionStore';

const CompetitionList = ({ showOnlyMine = false, title = "Competencias" }) => {
  const {
    competitions,
    loading,
    error,
    filters,
    loadCompetitions,
    loadMyCompetitions,
    setFilters,
    clearFilters,
    searchCompetitions,
    publishCompetition,
    openRegistration,
    closeRegistration
  } = useCompetitionStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (showOnlyMine) {
      loadMyCompetitions();
    } else {
      loadCompetitions();
    }
  }, [showOnlyMine]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      searchCompetitions(value);
    } else {
      showOnlyMine ? loadMyCompetitions() : loadCompetitions();
    }
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { [filterName]: value };
    setFilters(newFilters);
    
    // Recargar competencias con nuevos filtros
    if (showOnlyMine) {
      loadMyCompetitions();
    } else {
      loadCompetitions();
    }
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchTerm('');
    showOnlyMine ? loadMyCompetitions() : loadCompetitions();
  };

  const handleCompetitionAction = async (competitionId, action) => {
    setActionLoading(prev => ({ ...prev, [competitionId]: action }));
    
    try {
      let result;
      switch (action) {
        case 'publish':
          result = await publishCompetition(competitionId);
          break;
        case 'open_registration':
          result = await openRegistration(competitionId);
          break;
        case 'close_registration':
          result = await closeRegistration(competitionId);
          break;
        default:
          return;
      }

      if (result.success) {
        // Mostrar mensaje de éxito si es necesario
        console.log(result.message);
      }
    } catch (error) {
      console.error('Error ejecutando acción:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [competitionId]: null }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'published': 'bg-blue-100 text-blue-800',
      'open_registration': 'bg-green-100 text-green-800',
      'registration_closed': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'postponed': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'draft': 'Borrador',
      'published': 'Publicada',
      'open_registration': 'Inscripción Abierta',
      'registration_closed': 'Inscripción Cerrada',
      'in_progress': 'En Progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'postponed': 'Pospuesta'
    };
    return statusTexts[status] || status;
  };

  const getAvailableActions = (competition) => {
    const actions = [];
    
    if (competition.status === 'draft') {
      actions.push({
        key: 'publish',
        label: 'Publicar',
        className: 'bg-blue-600 hover:bg-blue-700 text-white'
      });
    }
    
    if (competition.status === 'published' || competition.status === 'registration_closed') {
      actions.push({
        key: 'open_registration',
        label: 'Abrir Inscripción',
        className: 'bg-green-600 hover:bg-green-700 text-white'
      });
    }
    
    if (competition.status === 'open_registration') {
      actions.push({
        key: 'close_registration',
        label: 'Cerrar Inscripción',
        className: 'bg-yellow-600 hover:bg-yellow-700 text-white'
      });
    }
    
    return actions;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de competencias ecuestres {showOnlyMine ? 'organizadas por ti' : 'disponibles'}
          </p>
        </div>
        {showOnlyMine && (
          <div className="mt-4 sm:mt-0">
            <Link
              to="/competitions/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              ➕ Nueva Competencia
            </Link>
          </div>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Nombre, sede, ciudad..."
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicada</option>
              <option value="open_registration">Inscripción Abierta</option>
              <option value="registration_closed">Inscripción Cerrada</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completada</option>
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              value={filters.competition_type}
              onChange={(e) => handleFilterChange('competition_type', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="national">Nacional</option>
              <option value="international">Internacional</option>
              <option value="regional">Regional</option>
              <option value="local">Local</option>
              <option value="championship">Campeonato</option>
              <option value="friendly">Amistoso</option>
            </select>
          </div>

          {/* Botón limpiar filtros */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Lista de competencias */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {competitions.length === 0 ? (
            <li className="p-6 text-center text-gray-500">
              No se encontraron competencias
            </li>
          ) : (
            competitions.map((competition) => (
              <li key={competition.id}>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link
                            to={`/competitions/${competition.id}`}
                            className="text-lg font-medium text-blue-600 hover:text-blue-500"
                          >
                            {competition.name}
                          </Link>
                          {competition.short_name && (
                            <span className="ml-2 text-sm text-gray-500">
                              ({competition.short_name})
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(competition.status)}`}>
                          {getStatusText(competition.status)}
                        </span>
                      </div>
                      
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            📍 {competition.venue_name}, {competition.venue_city}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            📅 {formatDate(competition.start_date)} - {formatDate(competition.end_date)}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            👥 {competition.participant_count || 0} participantes
                            {competition.max_participants && ` / ${competition.max_participants}`}
                          </p>
                        </div>
                      </div>

                      {competition.description && (
                        <p className="mt-2 text-sm text-gray-600">
                          {competition.description.length > 100 
                            ? `${competition.description.substring(0, 100)}...`
                            : competition.description
                          }
                        </p>
                      )}

                      <div className="mt-2 flex items-center text-xs text-gray-400">
                        <span>{competition.competition_type_display}</span>
                        {competition.is_championship && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            🏆 Campeonato
                          </span>
                        )}
                        {competition.is_registration_open && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            📝 Inscripción abierta
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones (solo para organizadores) */}
                  {showOnlyMine && getAvailableActions(competition).length > 0 && (
                    <div className="mt-4 flex space-x-2">
                      {getAvailableActions(competition).map((action) => (
                        <button
                          key={action.key}
                          onClick={() => handleCompetitionAction(competition.id, action.key)}
                          disabled={actionLoading[competition.id] === action.key}
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded ${action.className} disabled:opacity-50`}
                        >
                          {actionLoading[competition.id] === action.key ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-1 border-white mr-1"></div>
                          ) : null}
                          {action.label}
                        </button>
                      ))}
                      <Link
                        to={`/competitions/${competition.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        ✏️ Editar
                      </Link>
                      <Link
                        to={`/competitions/${competition.id}/participants`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        👥 Participantes ({competition.participant_count || 0})
                      </Link>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default CompetitionList;