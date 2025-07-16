import { apiClient } from './client';
import type {
  RankingSnapshot,
  RankingEntry,
  RankingCalculation,
  LiveRankingUpdate,
  RankingConfiguration,
  RankingProgress,
  RankingStats,
  RankingDisplay,
  RankingComparison,
  RankingExportOptions,
  RankingFilters,
  RankingSearchParams,
  RankingMetrics
} from '@/types/rankings';

class RankingsAPI {
  private readonly basePath = '/rankings/api';

  // Obtener rankings
  async getRankings(filters: RankingFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`${this.basePath}/rankings/?${params}`);
    return response.data as { results: RankingSnapshot[] };
  }

  // Obtener ranking específico
  async getRanking(id: string) {
    const response = await apiClient.get(`${this.basePath}/rankings/${id}/`);
    return response.data as RankingSnapshot;
  }

  // Obtener ranking en tiempo real
  async getLiveRanking(params: RankingSearchParams) {
    const response = await apiClient.get(`${this.basePath}/live-ranking/`, {
      params: {
        competition_id: params.competition_id,
        category_id: params.category_id
      }
    });
    return response.data as RankingSnapshot;
  }

  // Forzar recálculo de ranking
  async calculateRanking(competitionId: string, categoryId: string) {
    const response = await apiClient.post(`${this.basePath}/calculate-ranking/`, {
      competition_id: competitionId,
      category_id: categoryId
    });
    return response.data as RankingSnapshot;
  }

  // Obtener progreso de competencia
  async getRankingProgress(competitionId: string, categoryId: string) {
    const response = await apiClient.get(`${this.basePath}/ranking-progress/`, {
      params: {
        competition_id: competitionId,
        category_id: categoryId
      }
    });
    return response.data as RankingProgress;
  }

  // Obtener historial de rankings
  async getRankingHistory(competitionId: string, categoryId: string, limit = 10) {
    const response = await apiClient.get(`${this.basePath}/ranking-history/`, {
      params: {
        competition_id: competitionId,
        category_id: categoryId,
        limit
      }
    });
    return response.data as RankingSnapshot[];
  }

  // Obtener entradas de ranking
  async getRankingEntries(snapshotId: string) {
    const response = await apiClient.get(`${this.basePath}/entries/`, {
      params: { snapshot_id: snapshotId }
    });
    return response.data as { results: RankingEntry[] };
  }

  // Obtener detalles de entrada específica
  async getRankingEntryDetails(entryId: string) {
    const response = await apiClient.get(`${this.basePath}/entries/${entryId}/details/`);
    return response.data as RankingEntry & {
      position_history: Array<{
        timestamp: string;
        position: number;
        score: number;
        percentage: number;
      }>;
      judge_breakdown: Array<{
        judge_id: string;
        judge_name: string;
        score: number;
        percentage: number;
      }>;
    };
  }

  // Obtener cálculos de ranking
  async getRankingCalculations(filters: { competition_id?: string; category_id?: string } = {}) {
    const response = await apiClient.get(`${this.basePath}/calculations/`, {
      params: filters
    });
    return response.data as { results: RankingCalculation[] };
  }

  // Obtener estadísticas de cálculos
  async getCalculationStats() {
    const response = await apiClient.get(`${this.basePath}/calculation-stats/`);
    return response.data as RankingMetrics;
  }

  // Obtener actualizaciones en tiempo real
  async getLiveUpdates(filters: { competition_id?: string; category_id?: string } = {}) {
    const response = await apiClient.get(`${this.basePath}/updates/`, {
      params: filters
    });
    return response.data as { results: LiveRankingUpdate[] };
  }

  // Enviar actualizaciones pendientes
  async broadcastPendingUpdates() {
    const response = await apiClient.post(`${this.basePath}/broadcast-pending/`);
    return response.data as { message: string };
  }

  // Configuración de rankings
  async getRankingConfigurations() {
    const response = await apiClient.get(`${this.basePath}/configurations/`);
    return response.data as { results: RankingConfiguration[] };
  }

  // Obtener configuración específica
  async getRankingConfiguration(id: string) {
    const response = await apiClient.get(`${this.basePath}/configurations/${id}/`);
    return response.data as RankingConfiguration;
  }

  // Crear configuración
  async createRankingConfiguration(config: Partial<RankingConfiguration>) {
    const response = await apiClient.post(`${this.basePath}/configurations/`, config);
    return response.data as RankingConfiguration;
  }

  // Actualizar configuración
  async updateRankingConfiguration(id: string, config: Partial<RankingConfiguration>) {
    const response = await apiClient.patch(`${this.basePath}/configurations/${id}/`, config);
    return response.data as RankingConfiguration;
  }

  // Eliminar configuración
  async deleteRankingConfiguration(id: string) {
    await apiClient.delete(`${this.basePath}/configurations/${id}/`);
  }

  // Probar cálculo con configuración
  async testCalculation(configId: string) {
    const response = await apiClient.post(`${this.basePath}/configurations/${configId}/test_calculation/`);
    return response.data as {
      message: string;
      snapshot: RankingSnapshot;
    };
  }

  // Limpiar cache
  async resetCache(configId: string) {
    const response = await apiClient.post(`${this.basePath}/configurations/${configId}/reset_cache/`);
    return response.data as { message: string };
  }

  // Obtener configuración por defecto
  async getDefaultConfiguration() {
    const response = await apiClient.get(`${this.basePath}/default-config/`);
    return response.data as Partial<RankingConfiguration>;
  }

  // Exportar ranking
  async exportRanking(snapshotId: string, options: RankingExportOptions) {
    const response = await apiClient.post(`${this.basePath}/rankings/${snapshotId}/export/`, options, {
      responseType: 'blob'
    });
    return response.data as Blob;
  }

  // Comparar rankings
  async compareRankings(participantId: string, competitionId: string, categoryId: string) {
    const response = await apiClient.get(`${this.basePath}/rankings/compare/`, {
      params: {
        participant_id: participantId,
        competition_id: competitionId,
        category_id: categoryId
      }
    });
    return response.data as RankingComparison;
  }

  // Obtener estadísticas de ranking
  async getRankingStats(competitionId: string, categoryId: string) {
    const response = await apiClient.get(`${this.basePath}/rankings/stats/`, {
      params: {
        competition_id: competitionId,
        category_id: categoryId
      }
    });
    return response.data as RankingStats;
  }

  // Obtener ranking para display público
  async getRankingDisplay(competitionId: string, categoryId: string) {
    const response = await apiClient.get(`${this.basePath}/rankings/display/`, {
      params: {
        competition_id: competitionId,
        category_id: categoryId
      }
    });
    return response.data as RankingDisplay;
  }

  // Obtener múltiples rankings para dashboard
  async getDashboardRankings(competitionIds: string[]) {
    const response = await apiClient.post(`${this.basePath}/rankings/dashboard/`, {
      competition_ids: competitionIds
    });
    return response.data as Array<{
      competition_id: string;
      competition_name: string;
      categories: Array<{
        category_id: string;
        category_name: string;
        ranking: RankingSnapshot;
      }>;
    }>;
  }

  // Suscribirse a notificaciones de ranking
  async subscribeToNotifications(competitionId: string, categoryId: string) {
    const response = await apiClient.post(`${this.basePath}/rankings/subscribe/`, {
      competition_id: competitionId,
      category_id: categoryId
    });
    return response.data as { subscription_id: string };
  }

  // Cancelar suscripción
  async unsubscribeFromNotifications(subscriptionId: string) {
    await apiClient.delete(`${this.basePath}/rankings/subscribe/${subscriptionId}/`);
  }

  // Obtener notificaciones
  async getNotifications(limit = 20) {
    const response = await apiClient.get(`${this.basePath}/rankings/notifications/`, {
      params: { limit }
    });
    return response.data as { results: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      timestamp: string;
      read: boolean;
      data?: any;
    }> };
  }

  // Marcar notificación como leída
  async markNotificationAsRead(notificationId: string) {
    await apiClient.patch(`${this.basePath}/rankings/notifications/${notificationId}/`, {
      read: true
    });
  }

  // Obtener métricas del sistema
  async getSystemMetrics() {
    const response = await apiClient.get(`${this.basePath}/system/metrics/`);
    return response.data as {
      active_competitions: number;
      total_participants: number;
      calculations_today: number;
      average_calculation_time: number;
      websocket_connections: number;
      cache_hit_rate: number;
      error_rate: number;
    };
  }

  // Obtener estado del sistema
  async getSystemHealth() {
    const response = await apiClient.get(`${this.basePath}/system/health/`);
    return response.data as {
      status: 'healthy' | 'warning' | 'error';
      services: {
        database: 'up' | 'down';
        redis: 'up' | 'down';
        websockets: 'up' | 'down';
      };
      last_check: string;
    };
  }

  // Obtener logs del sistema
  async getSystemLogs(level: 'debug' | 'info' | 'warning' | 'error' = 'info', limit = 100) {
    const response = await apiClient.get(`${this.basePath}/system/logs/`, {
      params: { level, limit }
    });
    return response.data as { results: Array<{
      timestamp: string;
      level: string;
      message: string;
      module: string;
      details?: any;
    }> };
  }

  // Limpiar cache del sistema
  async clearSystemCache() {
    const response = await apiClient.post(`${this.basePath}/system/clear-cache/`);
    return response.data as { message: string };
  }

  // Optimizar base de datos
  async optimizeDatabase() {
    const response = await apiClient.post(`${this.basePath}/system/optimize-db/`);
    return response.data as { message: string };
  }

  // Backup de datos
  async backupData(competitionId?: string) {
    const response = await apiClient.post(`${this.basePath}/system/backup/`, {
      competition_id: competitionId
    }, {
      responseType: 'blob'
    });
    return response.data as Blob;
  }

  // Restaurar datos
  async restoreData(backupFile: File) {
    const formData = new FormData();
    formData.append('backup_file', backupFile);
    
    const response = await apiClient.post(`${this.basePath}/system/restore/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data as { message: string };
  }

  // Validar integridad de datos
  async validateDataIntegrity(competitionId: string, categoryId: string) {
    const response = await apiClient.post(`${this.basePath}/system/validate/`, {
      competition_id: competitionId,
      category_id: categoryId
    });
    return response.data as {
      valid: boolean;
      errors: string[];
      warnings: string[];
      recommendations: string[];
    };
  }

  // Reparar datos inconsistentes
  async repairData(competitionId: string, categoryId: string) {
    const response = await apiClient.post(`${this.basePath}/system/repair/`, {
      competition_id: competitionId,
      category_id: categoryId
    });
    return response.data as {
      repaired: boolean;
      changes_made: string[];
      warnings: string[];
    };
  }

  // Obtener ranking histórico por fecha
  async getHistoricalRanking(competitionId: string, categoryId: string, date: string) {
    const response = await apiClient.get(`${this.basePath}/rankings/historical/`, {
      params: {
        competition_id: competitionId,
        category_id: categoryId,
        date
      }
    });
    return response.data as RankingSnapshot;
  }

  // Obtener tendencias de ranking
  async getRankingTrends(competitionId: string, categoryId: string, days = 7) {
    const response = await apiClient.get(`${this.basePath}/rankings/trends/`, {
      params: {
        competition_id: competitionId,
        category_id: categoryId,
        days
      }
    });
    return response.data as Array<{
      date: string;
      total_participants: number;
      completed_evaluations: number;
      average_score: number;
      top_score: number;
      calculation_count: number;
    }>;
  }

  // Obtener predicciones de ranking
  async getRankingPredictions(competitionId: string, categoryId: string) {
    const response = await apiClient.get(`${this.basePath}/rankings/predictions/`, {
      params: {
        competition_id: competitionId,
        category_id: categoryId
      }
    });
    return response.data as Array<{
      participant_id: string;
      participant_name: string;
      horse_name: string;
      predicted_position: number;
      confidence: number;
      factors: string[];
    }>;
  }

  // Obtener análisis de rendimiento
  async getPerformanceAnalysis(participantId: string) {
    const response = await apiClient.get(`${this.basePath}/participants/${participantId}/analysis/`);
    return response.data as {
      participant_id: string;
      participant_name: string;
      horse_name: string;
      competitions: Array<{
        competition_name: string;
        category_name: string;
        final_position: number;
        final_score: number;
        final_percentage: number;
        improvement_trend: 'improving' | 'stable' | 'declining';
      }>;
      overall_stats: {
        total_competitions: number;
        average_position: number;
        average_score: number;
        best_position: number;
        best_score: number;
        consistency_rating: number;
      };
      recommendations: string[];
    };
  }

  // Obtener comparación entre participantes
  async compareParticipants(participantIds: string[], competitionId: string, categoryId: string) {
    const response = await apiClient.post(`${this.basePath}/participants/compare/`, {
      participant_ids: participantIds,
      competition_id: competitionId,
      category_id: categoryId
    });
    return response.data as Array<{
      participant_id: string;
      participant_name: string;
      horse_name: string;
      current_position: number;
      current_score: number;
      current_percentage: number;
      strengths: string[];
      weaknesses: string[];
      vs_average: {
        position_diff: number;
        score_diff: number;
        percentage_diff: number;
      };
    }>;
  }
}

// Instancia singleton
export const rankingsAPI = new RankingsAPI();
export default rankingsAPI;