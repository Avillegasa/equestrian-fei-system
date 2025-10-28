import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import competitionService from '../services/competitionService';

const JudgeCompetitionsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [competitions, setCompetitions] = useState([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [disciplineFilter, setDisciplineFilter] = useState('all');

  useEffect(() => {
    loadAssignedCompetitions();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [competitions, searchTerm, statusFilter, disciplineFilter]);

  const loadAssignedCompetitions = async () => {
    setLoading(true);
    setError('');

    try {
      // Intentar cargar desde API
      const assigned = await competitionService.getMyAssignedCompetitions();
      setCompetitions(assigned);
    } catch (err) {
      console.error('Error loading assigned competitions:', err);

      // Fallback a localStorage
      try {
        const allCompetitions = JSON.parse(localStorage.getItem('fei_competitions') || '[]');

        // Filtrar competencias donde el usuario está asignado como juez
        const assignedCompetitions = allCompetitions.filter(comp => {
          const staffKey = `fei_staff_${comp.id}`;
          const staff = JSON.parse(localStorage.getItem(staffKey) || '[]');
          return staff.some(s => s.user?.id === user?.id && s.role === 'judge');
        });

        // Enriquecer con datos de participantes y staff
        const enriched = assignedCompetitions.map(comp => {
          const staffKey = `fei_staff_${comp.id}`;
          const staff = JSON.parse(localStorage.getItem(staffKey) || '[]');
          const staffAssignment = staff.find(s => s.user?.id === user?.id);

          const participantsKey = `fei_participants_${comp.id}`;
          const participants = JSON.parse(localStorage.getItem(participantsKey) || '[]');

          return {
            ...comp,
            staff_assignment: staffAssignment,
            participants: participants,
            participant_count: participants.length
          };
        });

        setCompetitions(enriched);
      } catch (localErr) {
        console.error('Error loading from localStorage:', localErr);
        setError('No se pudieron cargar las competencias asignadas');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...competitions];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(comp =>
        comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.discipline?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(comp => {
        if (statusFilter === 'pending') {
          return !comp.staff_assignment?.is_confirmed;
        } else if (statusFilter === 'confirmed') {
          return comp.staff_assignment?.is_confirmed;
        } else if (statusFilter === 'in_progress') {
          return comp.status === 'in_progress';
        } else if (statusFilter === 'completed') {
          return comp.status === 'completed';
        }
        return true;
      });
    }

    // Filtro de disciplina
    if (disciplineFilter !== 'all') {
      filtered = filtered.filter(comp =>
        comp.discipline?.toLowerCase().includes(disciplineFilter.toLowerCase())
      );
    }

    setFilteredCompetitions(filtered);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getStatusBadge = (competition) => {
    if (!competition.staff_assignment?.is_confirmed) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
          ⏳ Pendiente de Confirmación
        </span>
      );
    }

    switch (competition.status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
            🔴 En Progreso
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            ✅ Completada
          </span>
        );
      case 'open_registration':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            📝 Inscripción Abierta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
            ✅ Confirmada
          </span>
        );
    }
  };

  const getDisciplineIcon = (discipline) => {
    const icons = {
      'show jumping': '🏇',
      'dressage': '🎭',
      'eventing': '🏆',
      'endurance': '⚡',
      'vaulting': '🤸',
      'driving': '🐎'
    };
    return icons[discipline?.toLowerCase()] || '🏆';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando competencias asignadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* LEFT SIDE */}
            <div className="flex items-center space-x-4">
              <Link
                to="/judge"
                className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors duration-200 bg-orange-50 px-3 py-2 rounded-lg font-medium"
              >
                <span>←</span>
                <span>Dashboard</span>
              </Link>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">⚖️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mis Competencias</h1>
                  <p className="text-sm text-gray-600">Asignaciones de Calificación</p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600">Juez FEI</p>
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-orange-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Total Asignaciones
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {competitions.length}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">🏆</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-yellow-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Pendientes
                    </dt>
                    <dd className="text-3xl font-bold text-yellow-600">
                      {competitions.filter(c => !c.staff_assignment?.is_confirmed).length}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">⏳</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-green-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Confirmadas
                    </dt>
                    <dd className="text-3xl font-bold text-green-600">
                      {competitions.filter(c => c.staff_assignment?.is_confirmed).length}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">✅</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border-t-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">
                      Participantes
                    </dt>
                    <dd className="text-3xl font-bold text-blue-600">
                      {competitions.reduce((sum, c) => sum + (c.participant_count || 0), 0)}
                    </dd>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl">👥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Buscar
                </label>
                <input
                  type="text"
                  placeholder="Nombre, ubicación o disciplina..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes de confirmación</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="in_progress">En progreso</option>
                  <option value="completed">Completadas</option>
                </select>
              </div>

              {/* Discipline Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏇 Disciplina
                </label>
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">Todas las disciplinas</option>
                  <option value="show jumping">Show Jumping</option>
                  <option value="dressage">Dressage</option>
                  <option value="eventing">Eventing</option>
                  <option value="endurance">Endurance</option>
                  <option value="vaulting">Vaulting</option>
                  <option value="driving">Driving</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Competitions Grid */}
          {filteredCompetitions.length === 0 ? (
            <div className="bg-white shadow-lg rounded-xl p-12 text-center">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No se encontraron competencias
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || disciplineFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no tienes competencias asignadas'}
              </p>
              {(searchTerm || statusFilter !== 'all' || disciplineFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDisciplineFilter('all');
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompetitions.map((competition) => (
                <div
                  key={competition.id}
                  className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">
                          {competition.name}
                        </h3>
                        <div className="flex items-center text-white/90 text-sm">
                          <span className="mr-2">{getDisciplineIcon(competition.discipline)}</span>
                          <span>{competition.discipline || 'Disciplina no especificada'}</span>
                        </div>
                      </div>
                      <div className="text-3xl">
                        {getDisciplineIcon(competition.discipline)}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Location & Dates */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📍</span>
                        <span>{competition.location || competition.venue_city + ', ' + competition.venue_country}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📅</span>
                        <span>
                          {formatDate(competition.start_date || competition.startDate)} - {formatDate(competition.end_date || competition.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">👥</span>
                        <span>{competition.participant_count || 0} participantes</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      {getStatusBadge(competition)}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {competition.staff_assignment?.is_confirmed && (
                        <>
                          <button
                            onClick={() => navigate(`/judge/scoring/${competition.id}`)}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            <span>📝</span>
                            <span>Calificar Participantes</span>
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => navigate(`/rankings/${competition.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                            >
                              <span>🏅</span>
                              <span>Rankings</span>
                            </button>

                            <button
                              onClick={() => navigate(`/admin/competitions/${competition.id}/schedule`)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
                            >
                              <span>📋</span>
                              <span>Programa</span>
                            </button>
                          </div>
                        </>
                      )}

                      {!competition.staff_assignment?.is_confirmed && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800 text-center">
                            ⚠️ Debes confirmar tu asignación desde el dashboard para calificar
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JudgeCompetitionsPage;
