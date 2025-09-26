import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useRankingStore from '../../store/rankingStore';
import rankingService from '../../services/rankingService';

const LiveRankingCard = ({ ranking, competitionId }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const {
    forceUpdateRanking,
    connectToRankingUpdates,
    disconnectFromRankingUpdates,
    settings
  } = useRankingStore();

  useEffect(() => {
    loadQuickView();

    // Connect to real-time updates
    if (settings.autoRefresh) {
      connectToRankingUpdates(ranking.id);
    }

    return () => {
      disconnectFromRankingUpdates(ranking.id);
    };
  }, [ranking.id]);

  const loadQuickView = async () => {
    setLoading(true);
    try {
      const data = await rankingService.getQuickView(ranking.id);
      setEntries(data.top_entries || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading quick view:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceUpdate = async () => {
    try {
      await forceUpdateRanking(ranking.id);
      await loadQuickView();
    } catch (error) {
      console.error('Error updating ranking:', error);
    }
  };

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!expanded) {
      loadFullEntries();
    }
  };

  const loadFullEntries = async () => {
    try {
      const data = await rankingService.getRankingEntries(ranking.id);
      setEntries(data);
    } catch (error) {
      console.error('Error loading full entries:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${position}°`;
    }
  };

  const getPositionChangeIcon = (change) => {
    if (change > 0) return <span className="text-green-500">↗️</span>;
    if (change < 0) return <span className="text-red-500">↘️</span>;
    return <span className="text-gray-400">➡️</span>;
  };

  const formatScore = (score) => {
    return parseFloat(score || 0).toFixed(2);
  };

  const formatLastUpdate = () => {
    if (!ranking.last_updated) return 'Nunca';
    const date = new Date(ranking.last_updated);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {ranking.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ranking.status)}`}>
                  {ranking.status}
                </span>
                {ranking.is_live && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    🔴 En Vivo
                  </span>
                )}
                {ranking.is_public && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    👁️ Público
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleForceUpdate}
              disabled={loading}
              className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 disabled:opacity-50"
              title="Forzar actualización"
            >
              🔄
            </button>

            <Link
              to={`/competitions/${competitionId}/rankings/${ranking.id}`}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Ver Completo
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>👥 {ranking.total_participants || 0} participantes</span>
            <span>📊 Ronda {ranking.round_number || 1}</span>
            <span>⏰ {formatLastUpdate()}</span>
          </div>

          <button
            onClick={handleExpand}
            className="text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Menos' : 'Ver más'}
          </button>
        </div>
      </div>

      {/* Quick Rankings */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl text-gray-300 mb-2">📊</div>
            <p className="text-gray-500">No hay entradas disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice(0, expanded ? entries.length : 5).map((entry, index) => (
              <div
                key={entry.participant_name || index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  entry.position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                } hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-gray-700 min-w-[3rem] text-center">
                    {getPositionIcon(entry.position)}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {entry.participant_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {entry.horse_name}
                    </div>
                  </div>

                  {entry.position_change !== undefined && entry.position_change !== 0 && (
                    <div className="flex items-center space-x-1">
                      {getPositionChangeIcon(entry.position_change)}
                      <span className="text-sm text-gray-600">
                        {Math.abs(entry.position_change)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatScore(entry.current_score)}
                  </div>
                  {entry.is_eliminated && (
                    <div className="text-xs text-red-600 font-medium">
                      Eliminado
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!expanded && entries.length > 5 && (
              <div className="text-center py-2">
                <button
                  onClick={handleExpand}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver {entries.length - 5} más...
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with additional info */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Tipo: {ranking.ranking_type || 'General'}
          </div>
          <div>
            Método: {ranking.calculation_method || 'Acumulativo'}
          </div>
          {ranking.category_name && (
            <div>
              Categoría: {ranking.category_name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveRankingCard;