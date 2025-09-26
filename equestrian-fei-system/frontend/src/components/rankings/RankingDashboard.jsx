import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useRankingStore from '../../store/rankingStore';
import useCompetitionStore from '../../store/competitionStore';
import LiveRankingCard from './LiveRankingCard';
import TeamRankingsCard from './TeamRankingsCard';
import RankingStats from './RankingStats';
import RankingFilters from './RankingFilters';

const RankingDashboard = () => {
  const { competitionId } = useParams();
  const [activeTab, setActiveTab] = useState('live');

  const {
    liveRankings,
    teamRankings,
    competitionOverview,
    rankingsLoading,
    teamsLoading,
    statsLoading,
    loadLiveRankings,
    loadTeamRankings,
    loadCompetitionOverview,
    connectToRankingUpdates,
    disconnectAllWebSockets,
    settings,
    filters,
    updateFilters
  } = useRankingStore();

  const {
    currentCompetition,
    loadCompetition
  } = useCompetitionStore();

  useEffect(() => {
    if (competitionId) {
      loadCompetition(competitionId);
      loadData();
    }

    return () => {
      disconnectAllWebSockets();
    };
  }, [competitionId]);

  const loadData = async () => {
    if (!competitionId) return;

    try {
      // Load rankings data
      await loadLiveRankings(competitionId, filters.categoryId);
      await loadTeamRankings(competitionId);
      await loadCompetitionOverview(competitionId);

      // Connect to real-time updates if enabled
      if (settings.autoRefresh) {
        liveRankings.forEach(ranking => {
          connectToRankingUpdates(ranking.id);
        });
      }
    } catch (error) {
      console.error('Error loading ranking data:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
    if (competitionId) {
      loadLiveRankings(competitionId, newFilters.categoryId);
    }
  };

  const handleRefreshAll = () => {
    loadData();
  };

  const tabs = [
    { id: 'live', name: 'Rankings en Vivo', count: liveRankings.length },
    { id: 'teams', name: 'Equipos', count: teamRankings.length },
    { id: 'stats', name: 'Estadísticas', count: null }
  ];

  if (!currentCompetition && !competitionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">🏆</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Selecciona una Competencia
          </h1>
          <p className="text-gray-500">
            Elige una competencia para ver sus rankings en tiempo real
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Dashboard de Rankings
              </h1>
              {currentCompetition && (
                <div className="ml-4 text-sm text-gray-500">
                  {currentCompetition.name}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefreshAll}
                disabled={rankingsLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
              >
                <span className={rankingsLoading ? 'animate-spin' : ''}>🔄</span>
                <span>Actualizar Todo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Competition Overview */}
        {competitionOverview && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {competitionOverview.total_rankings}
                  </div>
                  <div className="text-sm text-gray-500">Rankings Totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {competitionOverview.active_rankings}
                  </div>
                  <div className="text-sm text-gray-500">Rankings Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {competitionOverview.total_participants}
                  </div>
                  <div className="text-sm text-gray-500">Participantes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {competitionOverview.categories?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Categorías</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <RankingFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            competitionId={competitionId}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.name}</span>
                  {tab.count !== null && (
                    <span className={`${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-900'
                    } inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'live' && (
            <div>
              {rankingsLoading && liveRankings.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : liveRankings.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="text-6xl text-gray-300 mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay rankings disponibles
                  </h3>
                  <p className="text-gray-500">
                    Los rankings aparecerán aquí cuando sean creados y activados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {liveRankings.map((ranking) => (
                    <LiveRankingCard
                      key={ranking.id}
                      ranking={ranking}
                      competitionId={competitionId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div>
              <TeamRankingsCard
                teamRankings={teamRankings}
                loading={teamsLoading}
                competitionId={competitionId}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <RankingStats
                competitionId={competitionId}
                loading={statsLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingDashboard;