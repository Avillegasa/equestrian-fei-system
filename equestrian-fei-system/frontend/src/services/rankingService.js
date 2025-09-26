import apiClient from './apiClient';

class RankingService {
  constructor() {
    this.baseURL = '/api/rankings';
  }

  // Live Rankings
  async getLiveRankings(competitionId = null, categoryId = null) {
    try {
      const params = new URLSearchParams();
      if (competitionId) params.append('competition', competitionId);
      if (categoryId) params.append('category', categoryId);

      const response = await apiClient.get(`${this.baseURL}/live/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live rankings:', error);
      throw error;
    }
  }

  async getLiveRanking(rankingId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/live/${rankingId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live ranking:', error);
      throw error;
    }
  }

  async getRankingEntries(rankingId, params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await apiClient.get(
        `${this.baseURL}/live/${rankingId}/entries/?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching ranking entries:', error);
      throw error;
    }
  }

  async getQuickView(rankingId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/live/${rankingId}/quick_view/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quick view:', error);
      throw error;
    }
  }

  async forceUpdateRanking(rankingId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/live/${rankingId}/force_update/`);
      return response.data;
    } catch (error) {
      console.error('Error forcing ranking update:', error);
      throw error;
    }
  }

  async createSnapshot(rankingId, data = {}) {
    try {
      const response = await apiClient.post(
        `${this.baseURL}/live/${rankingId}/create_snapshot/`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  async bulkUpdateRankings(data) {
    try {
      const response = await apiClient.post(`${this.baseURL}/live/bulk_update/`, data);
      return response.data;
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  // Ranking Entries
  async getRankingEntry(entryId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/entries/${entryId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ranking entry:', error);
      throw error;
    }
  }

  async getEntryHistory(entryId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/entries/${entryId}/history/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching entry history:', error);
      throw error;
    }
  }

  // Team Rankings
  async getTeamRankings(competitionId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/teams/?competition=${competitionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team rankings:', error);
      throw error;
    }
  }

  async calculateTeamScores(teamId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/teams/${teamId}/calculate_scores/`);
      return response.data;
    } catch (error) {
      console.error('Error calculating team scores:', error);
      throw error;
    }
  }

  async updateAllTeams(competitionId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/teams/update_all_teams/`, {
        competition_id: competitionId
      });
      return response.data;
    } catch (error) {
      console.error('Error updating all teams:', error);
      throw error;
    }
  }

  // Statistics
  async getGeneralStats() {
    try {
      const response = await apiClient.get(`${this.baseURL}/stats/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching general stats:', error);
      throw error;
    }
  }

  async getCompetitionOverview(competitionId) {
    try {
      const response = await apiClient.get(
        `${this.baseURL}/stats/competition_overview/?competition_id=${competitionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching competition overview:', error);
      throw error;
    }
  }

  async getParticipantHistory(participantId) {
    try {
      const response = await apiClient.get(
        `${this.baseURL}/stats/participant_history/?participant_id=${participantId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching participant history:', error);
      throw error;
    }
  }

  // Snapshots
  async getRankingSnapshots(rankingId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/snapshots/?ranking=${rankingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      throw error;
    }
  }

  // Rules
  async getRankingRules(competitionId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/rules/?competition=${competitionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ranking rules:', error);
      throw error;
    }
  }

  async testRule(ruleId) {
    try {
      const response = await apiClient.post(`${this.baseURL}/rules/${ruleId}/test_rule/`);
      return response.data;
    } catch (error) {
      console.error('Error testing rule:', error);
      throw error;
    }
  }

  // WebSocket connection
  connectToRankingUpdates(rankingId, onUpdate, onError = null) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/rankings/${rankingId}/`;

    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ranking_update') {
        onUpdate(data.data);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) {
        onError(error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return websocket;
  }

  // Utility functions
  formatScore(score, decimals = 2) {
    if (score === null || score === undefined) return '0.00';
    return parseFloat(score).toFixed(decimals);
  }

  formatPosition(position, showIcon = true) {
    if (!showIcon) return position;

    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return position;
    }
  }

  getPositionChange(current, previous) {
    if (!previous || previous === current) return { type: 'stable', value: 0 };

    const change = previous - current;
    return {
      type: change > 0 ? 'up' : 'down',
      value: Math.abs(change)
    };
  }

  getPositionTrend(positionChange) {
    if (!positionChange || positionChange === 0) return 'stable';
    return positionChange > 0 ? 'rising' : 'falling';
  }

  calculateConsistency(scores) {
    if (!scores || scores.length <= 1) return 100;

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    if (mean === 0) return 0;

    return Math.max(0, 100 - (standardDeviation / mean * 100));
  }

  // Export functions
  async exportRanking(rankingId, format = 'pdf', options = {}) {
    try {
      const response = await apiClient.post(`${this.baseURL}/live/${rankingId}/export/`, {
        format,
        ...options
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranking_${rankingId}.${format}`;
      link.click();

      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting ranking:', error);
      throw error;
    }
  }

  // Real-time polling
  startPolling(rankingId, interval = 30000, onUpdate, onError) {
    const pollInterval = setInterval(async () => {
      try {
        const ranking = await this.getLiveRanking(rankingId);
        onUpdate(ranking);
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    }, interval);

    return pollInterval;
  }

  stopPolling(pollInterval) {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  }
}

export default new RankingService();