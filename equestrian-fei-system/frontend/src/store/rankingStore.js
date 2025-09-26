import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import rankingService from '../services/rankingService';

const useRankingStore = create(devtools((set, get) => ({
  // State
  liveRankings: [],
  currentRanking: null,
  rankingEntries: [],
  teamRankings: [],
  competitionOverview: null,
  participantHistory: {},
  rankingStats: null,

  // Loading states
  rankingsLoading: false,
  entriesLoading: false,
  teamsLoading: false,
  statsLoading: false,

  // Error states
  rankingsError: null,
  entriesError: null,
  teamsError: null,
  statsError: null,

  // WebSocket connections
  wsConnections: new Map(),

  // Real-time polling
  pollingIntervals: new Map(),

  // Filters and settings
  filters: {
    competitionId: null,
    categoryId: null,
    status: 'active',
    isPublic: true,
  },

  settings: {
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    soundEnabled: true,
    showAnimations: true,
  },

  // Actions

  // Live Rankings Actions
  loadLiveRankings: async (competitionId, categoryId = null) => {
    set({ rankingsLoading: true, rankingsError: null });

    try {
      const rankings = await rankingService.getLiveRankings(competitionId, categoryId);

      set({
        liveRankings: rankings,
        rankingsLoading: false,
        filters: { ...get().filters, competitionId, categoryId }
      });

      return rankings;
    } catch (error) {
      set({
        rankingsError: error.message || 'Error loading rankings',
        rankingsLoading: false
      });
      throw error;
    }
  },

  loadLiveRanking: async (rankingId) => {
    set({ rankingsLoading: true, rankingsError: null });

    try {
      const ranking = await rankingService.getLiveRanking(rankingId);

      set({
        currentRanking: ranking,
        rankingsLoading: false
      });

      return ranking;
    } catch (error) {
      set({
        rankingsError: error.message || 'Error loading ranking',
        rankingsLoading: false
      });
      throw error;
    }
  },

  loadRankingEntries: async (rankingId, params = {}) => {
    set({ entriesLoading: true, entriesError: null });

    try {
      const entries = await rankingService.getRankingEntries(rankingId, params);

      set({
        rankingEntries: entries,
        entriesLoading: false
      });

      return entries;
    } catch (error) {
      set({
        entriesError: error.message || 'Error loading entries',
        entriesLoading: false
      });
      throw error;
    }
  },

  forceUpdateRanking: async (rankingId) => {
    try {
      const result = await rankingService.forceUpdateRanking(rankingId);

      // Refresh current ranking if it matches
      const { currentRanking } = get();
      if (currentRanking && currentRanking.id === rankingId) {
        await get().loadLiveRanking(rankingId);
      }

      // Refresh rankings list
      const { filters } = get();
      if (filters.competitionId) {
        await get().loadLiveRankings(filters.competitionId, filters.categoryId);
      }

      return result;
    } catch (error) {
      throw error;
    }
  },

  bulkUpdateRankings: async (competitionId, options = {}) => {
    set({ rankingsLoading: true });

    try {
      const result = await rankingService.bulkUpdateRankings({
        competition_id: competitionId,
        ...options
      });

      // Refresh rankings
      await get().loadLiveRankings(competitionId);

      return result;
    } catch (error) {
      set({ rankingsLoading: false });
      throw error;
    }
  },

  // Team Rankings Actions
  loadTeamRankings: async (competitionId) => {
    set({ teamsLoading: true, teamsError: null });

    try {
      const teams = await rankingService.getTeamRankings(competitionId);

      set({
        teamRankings: teams,
        teamsLoading: false
      });

      return teams;
    } catch (error) {
      set({
        teamsError: error.message || 'Error loading team rankings',
        teamsLoading: false
      });
      throw error;
    }
  },

  updateAllTeams: async (competitionId) => {
    set({ teamsLoading: true });

    try {
      const result = await rankingService.updateAllTeams(competitionId);

      // Refresh team rankings
      await get().loadTeamRankings(competitionId);

      return result;
    } catch (error) {
      set({ teamsLoading: false });
      throw error;
    }
  },

  // Statistics Actions
  loadCompetitionOverview: async (competitionId) => {
    set({ statsLoading: true, statsError: null });

    try {
      const overview = await rankingService.getCompetitionOverview(competitionId);

      set({
        competitionOverview: overview,
        statsLoading: false
      });

      return overview;
    } catch (error) {
      set({
        statsError: error.message || 'Error loading overview',
        statsLoading: false
      });
      throw error;
    }
  },

  loadParticipantHistory: async (participantId) => {
    try {
      const history = await rankingService.getParticipantHistory(participantId);

      set({
        participantHistory: {
          ...get().participantHistory,
          [participantId]: history
        }
      });

      return history;
    } catch (error) {
      throw error;
    }
  },

  loadRankingStats: async () => {
    set({ statsLoading: true, statsError: null });

    try {
      const stats = await rankingService.getGeneralStats();

      set({
        rankingStats: stats,
        statsLoading: false
      });

      return stats;
    } catch (error) {
      set({
        statsError: error.message || 'Error loading stats',
        statsLoading: false
      });
      throw error;
    }
  },

  // WebSocket Actions
  connectToRankingUpdates: (rankingId) => {
    const { wsConnections } = get();

    // Close existing connection if any
    if (wsConnections.has(rankingId)) {
      wsConnections.get(rankingId).close();
    }

    const ws = rankingService.connectToRankingUpdates(
      rankingId,
      (data) => {
        // Handle ranking update
        get().handleRankingUpdate(data);

        // Play sound if enabled
        if (get().settings.soundEnabled) {
          get().playUpdateSound();
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
        // Try to reconnect after delay
        setTimeout(() => {
          get().connectToRankingUpdates(rankingId);
        }, 5000);
      }
    );

    wsConnections.set(rankingId, ws);
    set({ wsConnections });
  },

  disconnectFromRankingUpdates: (rankingId) => {
    const { wsConnections } = get();

    if (wsConnections.has(rankingId)) {
      wsConnections.get(rankingId).close();
      wsConnections.delete(rankingId);
      set({ wsConnections });
    }
  },

  disconnectAllWebSockets: () => {
    const { wsConnections } = get();

    wsConnections.forEach((ws) => {
      ws.close();
    });

    wsConnections.clear();
    set({ wsConnections });
  },

  handleRankingUpdate: (updateData) => {
    const { currentRanking, liveRankings } = get();

    // Update current ranking if it matches
    if (currentRanking && currentRanking.id === updateData.ranking_id) {
      set({
        currentRanking: {
          ...currentRanking,
          last_updated: updateData.last_updated,
          total_participants: updateData.total_participants
        }
      });
    }

    // Update in rankings list
    const updatedRankings = liveRankings.map(ranking => {
      if (ranking.id === updateData.ranking_id) {
        return {
          ...ranking,
          last_updated: updateData.last_updated,
          total_participants: updateData.total_participants
        };
      }
      return ranking;
    });

    set({ liveRankings: updatedRankings });
  },

  // Polling Actions
  startPolling: (rankingId, interval = null) => {
    const { pollingIntervals, settings } = get();

    // Stop existing polling
    get().stopPolling(rankingId);

    const pollInterval = rankingService.startPolling(
      rankingId,
      interval || settings.refreshInterval,
      (ranking) => {
        set({ currentRanking: ranking });
      },
      (error) => {
        console.error('Polling error:', error);
      }
    );

    pollingIntervals.set(rankingId, pollInterval);
    set({ pollingIntervals });
  },

  stopPolling: (rankingId) => {
    const { pollingIntervals } = get();

    if (pollingIntervals.has(rankingId)) {
      rankingService.stopPolling(pollingIntervals.get(rankingId));
      pollingIntervals.delete(rankingId);
      set({ pollingIntervals });
    }
  },

  stopAllPolling: () => {
    const { pollingIntervals } = get();

    pollingIntervals.forEach((interval) => {
      rankingService.stopPolling(interval);
    });

    pollingIntervals.clear();
    set({ pollingIntervals });
  },

  // Utility Actions
  playUpdateSound: () => {
    // Create audio context for update sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play update sound:', error);
    }
  },

  exportRanking: async (rankingId, format = 'pdf', options = {}) => {
    try {
      return await rankingService.exportRanking(rankingId, format, options);
    } catch (error) {
      throw error;
    }
  },

  // Settings Actions
  updateSettings: (newSettings) => {
    set({
      settings: {
        ...get().settings,
        ...newSettings
      }
    });
  },

  updateFilters: (newFilters) => {
    set({
      filters: {
        ...get().filters,
        ...newFilters
      }
    });
  },

  // Reset Actions
  resetRankings: () => {
    set({
      liveRankings: [],
      currentRanking: null,
      rankingEntries: [],
      rankingsError: null,
      entriesError: null
    });
  },

  resetTeams: () => {
    set({
      teamRankings: [],
      teamsError: null
    });
  },

  resetStats: () => {
    set({
      competitionOverview: null,
      participantHistory: {},
      rankingStats: null,
      statsError: null
    });
  },

  resetAll: () => {
    // Disconnect all connections
    get().disconnectAllWebSockets();
    get().stopAllPolling();

    // Reset state
    set({
      liveRankings: [],
      currentRanking: null,
      rankingEntries: [],
      teamRankings: [],
      competitionOverview: null,
      participantHistory: {},
      rankingStats: null,
      rankingsLoading: false,
      entriesLoading: false,
      teamsLoading: false,
      statsLoading: false,
      rankingsError: null,
      entriesError: null,
      teamsError: null,
      statsError: null,
      wsConnections: new Map(),
      pollingIntervals: new Map(),
    });
  },

  // Selectors (computed values)
  getActiveRankings: () => {
    return get().liveRankings.filter(ranking => ranking.status === 'active');
  },

  getPublicRankings: () => {
    return get().liveRankings.filter(ranking => ranking.is_public);
  },

  getRankingByCompetition: (competitionId) => {
    return get().liveRankings.filter(ranking => ranking.competition === competitionId);
  },

  getRankingByCategory: (categoryId) => {
    return get().liveRankings.filter(ranking => ranking.category === categoryId);
  },

  getTopParticipants: (rankingId, count = 5) => {
    const { rankingEntries } = get();
    return rankingEntries
      .filter(entry => entry.ranking === rankingId)
      .slice(0, count);
  },

}), {
  name: 'ranking-store'
}));

export default useRankingStore;