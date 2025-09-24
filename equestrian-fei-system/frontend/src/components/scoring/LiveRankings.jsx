import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useScoringStore from '../../store/scoringStore';
import useCompetitionStore from '../../store/competitionStore';
import scoringService from '../../services/scoringService';

const LiveRankings = () => {
  const { competitionId } = useParams();
  const intervalRef = useRef(null);
  
  const {
    liveRankings,
    rankingsLoading,
    rankingsError,
    loadLiveRankings,
    publishRanking,
    recalculateRanking
  } = useScoringStore();
  
  const {
    currentCompetition,
    loadCompetition
  } = useCompetitionStore();

  const [selectedRanking, setSelectedRanking] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (competitionId) {
      loadCompetition(competitionId);
      loadRankingsData();
    }
  }, [competitionId]);

  useEffect(() => {
    if (autoRefresh && competitionId) {
      intervalRef.current = setInterval(() => {
        loadRankingsData();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, competitionId]);

  const loadRankingsData = async () => {
    if (competitionId) {
      await loadLiveRankings(competitionId);
      setLastUpdate(new Date());
    }
  };

  const handleRefresh = () => {
    loadRankingsData();
  };

  const handleRecalculate = async (rankingId) => {
    const result = await recalculateRanking(rankingId);
    if (result.success) {
      loadRankingsData();
    }
  };

  const handlePublish = async (rankingId) => {
    const result = await publishRanking(rankingId);
    if (result.success) {
      loadRankingsData();
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 3:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-900 bg-white border-gray-200';
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return position;
    }
  };

  const formatScore = (score) => {
    return parseFloat(score).toFixed(2);
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Nunca';
    return lastUpdate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (rankingsLoading && !liveRankings.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rankings en Vivo</h1>
              {currentCompetition && (
                <p className="text-sm text-gray-500 mt-1">
                  {currentCompetition.name}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Última actualización: {formatLastUpdate()}
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={rankingsLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Controles */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Actualización automática</span>
              </label>
              
              {autoRefresh && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Cada:</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10s</option>
                    <option value={30}>30s</option>
                    <option value={60}>1min</option>
                    <option value={300}>5min</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {liveRankings.length} ranking(s) disponible(s)
            </div>
          </div>
        </div>
      </div>

      {/* Rankings */}
      {liveRankings.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay rankings publicados
            </h3>
            <p className="text-gray-500">
              Los rankings aparecerán aquí cuando sean publicados por los organizadores.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {liveRankings.map((ranking) => (
            <div key={ranking.id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Header del ranking */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {ranking.discipline_name} - {ranking.category_name}
                    </h2>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>👥 {ranking.total_participants} participantes</span>
                      <span>📊 {ranking.ranking_type}</span>
                      {ranking.is_final && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Final
                        </span>
                      )}
                      {ranking.is_published && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Publicado
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRecalculate(ranking.id)}
                      className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                    >
                      Recalcular
                    </button>
                    
                    {!ranking.is_published && (
                      <button
                        onClick={() => handlePublish(ranking.id)}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Publicar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabla de ranking */}
              {ranking.entries && ranking.entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posición
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Caballo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          País
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puntuación Final
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Técnica
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Artística
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Penalizaciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ranking.entries.map((entry, index) => (
                        <tr
                          key={entry.id}
                          className={`${getPositionColor(entry.position)} hover:bg-opacity-75`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">
                                {getPositionIcon(entry.position)}
                              </span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {entry.position}
                                </div>
                                {entry.is_tied && (
                                  <div className="text-xs text-gray-500">Empate</div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.participant_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              #{entry.participant_number}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.horse_name}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.country || 'N/A'}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatScore(entry.final_score)}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatScore(entry.technical_score || 0)}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatScore(entry.artistic_score || 0)}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                            {formatScore(entry.penalty_points || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-gray-500">No hay entradas en este ranking</p>
                </div>
              )}

              {/* Información de desempates */}
              {ranking.entries?.some(e => e.tie_break_info) && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Información de Desempates
                  </h4>
                  {ranking.entries
                    .filter(e => e.tie_break_info)
                    .map(entry => (
                      <div key={entry.id} className="text-xs text-gray-600">
                        <strong>{entry.participant_name}:</strong> {entry.tie_break_info}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {rankingsError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {rankingsError}
        </div>
      )}
    </div>
  );
};

export default LiveRankings;