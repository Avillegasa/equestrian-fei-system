import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScoringStore from '../../store/scoringStore';
import scoringService from '../../services/scoringService';

const JudgeDashboard = () => {
  const {
    scorecards,
    judgeStats,
    scorecardsLoading,
    statsLoading,
    scorecardsError,
    loadMyEvaluations,
    loadJudgeStats,
    clearErrors
  } = useScoringStore();

  const [filters, setFilters] = useState({
    status: '',
    competition: '',
    date_from: '',
    date_to: ''
  });

  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadMyEvaluations();
    loadJudgeStats();
    clearErrors();
  }, []);

  useEffect(() => {
    loadMyEvaluations(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getFilteredScoreCards = () => {
    if (!Array.isArray(scorecards)) return [];
    
    switch (activeTab) {
      case 'pending':
        return scorecards.filter(s => s.status === 'pending');
      case 'in_progress':
        return scorecards.filter(s => s.status === 'in_progress');
      case 'completed':
        return scorecards.filter(s => ['completed', 'validated', 'published'].includes(s.status));
      default:
        return scorecards;
    }
  };

  const getTabCount = (status) => {
    if (!Array.isArray(scorecards)) return 0;
    
    switch (status) {
      case 'pending':
        return scorecards.filter(s => s.status === 'pending').length;
      case 'in_progress':
        return scorecards.filter(s => s.status === 'in_progress').length;
      case 'completed':
        return scorecards.filter(s => ['completed', 'validated', 'published'].includes(s.status)).length;
      default:
        return scorecards.length;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return null;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  if (scorecardsLoading && !scorecards.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredScoreCards = getFilteredScoreCards();

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Juez</h1>
        </div>
        
        {judgeStats && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500">Evaluaciones Totales</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {judgeStats.total_evaluations}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Completadas</div>
                <div className="text-2xl font-semibold text-green-600">
                  {judgeStats.completed_evaluations}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Pendientes</div>
                <div className="text-2xl font-semibold text-yellow-600">
                  {judgeStats.pending_evaluations}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Promedio de Puntuación</div>
                <div className="text-2xl font-semibold text-blue-600">
                  {parseFloat(judgeStats.average_score_given).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completada</option>
                <option value="validated">Validada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Desde
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Hasta
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', competition: '', date_from: '', date_to: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'pending', label: 'Pendientes', icon: '⏳' },
              { key: 'in_progress', label: 'En Progreso', icon: '⚡' },
              { key: 'completed', label: 'Completadas', icon: '✅' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                  {getTabCount(tab.key)}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Lista de evaluaciones */}
        <div className="overflow-hidden">
          {filteredScoreCards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay evaluaciones {activeTab === 'pending' ? 'pendientes' : activeTab === 'in_progress' ? 'en progreso' : 'completadas'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'pending' ? 
                  'Las nuevas asignaciones de evaluación aparecerán aquí.' :
                  'Las evaluaciones aparecerán aquí cuando cambien de estado.'
                }
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredScoreCards.map((scorecard) => (
                <li key={scorecard.id}>
                  <div className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600 truncate">
                              {scorecard.participant_name}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-sm text-gray-500">
                                🐎 {scorecard.horse_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                #{scorecard.participant_number}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scoringService.getStatusColor(scorecard.status)}`}>
                              {scoringService.getStatusText(scorecard.status)}
                            </span>
                            
                            {scorecard.is_disqualified && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Descalificado
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            {scorecard.start_time && (
                              <span>Inicio: {formatDate(scorecard.start_time)}</span>
                            )}
                            {scorecard.finish_time && (
                              <span>Fin: {formatDate(scorecard.finish_time)}</span>
                            )}
                            {scorecard.start_time && scorecard.finish_time && (
                              <span className="text-blue-600">
                                Duración: {formatDuration(scorecard.start_time, scorecard.finish_time)}
                              </span>
                            )}
                          </div>
                          
                          {scorecard.final_score > 0 && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">
                                Puntuación: {scorecard.final_score}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-5 flex-shrink-0">
                        <Link
                          to={`/scoring/evaluation/${scorecard.id}`}
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                            scorecard.status === 'pending'
                              ? 'text-white bg-blue-600 hover:bg-blue-700'
                              : scorecard.status === 'in_progress'
                              ? 'text-white bg-orange-600 hover:bg-orange-700'
                              : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                          }`}
                        >
                          {scorecard.status === 'pending' ? '▶️ Iniciar' :
                           scorecard.status === 'in_progress' ? '✏️ Continuar' :
                           '👁️ Ver'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Error message */}
      {scorecardsError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {scorecardsError}
        </div>
      )}
    </div>
  );
};

export default JudgeDashboard;