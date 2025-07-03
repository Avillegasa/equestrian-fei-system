// Tipos para el sistema de rankings en tiempo real

export interface RankingEntry {
  id: string;
  participant: {
    id: string;
    rider: {
      name: string;
    };
    horse: {
      name: string;
    };
  };
  participant_name: string;
  horse_name: string;
  position: number;
  previous_position?: number;
  position_change: number;
  position_change_indicator: 'up' | 'down' | 'stable';
  total_score: number;
  percentage_score: number;
  judge_scores: Record<string, {
    judge_name: string;
    score: number;
    percentage: number;
  }>;
  evaluations_completed: number;
  evaluations_total: number;
  is_tied: boolean;
  tied_with: string[];
}

export interface RankingSnapshot {
  id: string;
  competition: string;
  category: string;
  competition_name: string;
  category_name: string;
  timestamp: string;
  total_participants: number;
  completed_evaluations: number;
  progress_percentage: number;
  is_current: boolean;
  is_final: boolean;
  entries: RankingEntry[];
  last_updated?: string;
  auto_refresh?: number;
}

export interface RankingCalculation {
  id: string;
  competition: string;
  category: string;
  competition_name: string;
  category_name: string;
  triggered_by?: string;
  triggered_by_name?: string;
  calculation_start: string;
  calculation_end?: string;
  duration_ms?: number;
  success: boolean;
  error_message?: string;
  participants_processed: number;
  evaluations_processed: number;
  position_changes: PositionChange[];
}

export interface PositionChange {
  participant_id: string;
  participant_name: string;
  horse_name: string;
  old_position: number;
  new_position: number;
  change: number; // Positivo = subió, negativo = bajó
}

export interface LiveRankingUpdate {
  id: string;
  competition: string;
  category: string;
  competition_name: string;
  category_name: string;
  timestamp: string;
  update_type: 'POSITION_CHANGE' | 'SCORE_UPDATE' | 'NEW_PARTICIPANT' | 'EVALUATION_COMPLETE';
  affected_participants: string[];
  change_data: {
    position_changes?: PositionChange[];
    [key: string]: any;
  };
  broadcasted: boolean;
  broadcast_timestamp?: string;
}

export interface RankingConfiguration {
  id: string;
  competition: string;
  category: string;
  competition_name: string;
  category_name: string;
  auto_calculate: boolean;
  calculation_interval: number;
  tie_break_method: 'PERCENTAGE' | 'COLLECTIVE_MARKS' | 'TECHNICAL_SCORE';
  broadcast_enabled: boolean;
  broadcast_interval: number;
  show_percentages: boolean;
  show_judge_breakdown: boolean;
  show_position_changes: boolean;
}

export interface RankingProgress {
  competition_id: string;
  category_id: string;
  total_participants: number;
  fully_evaluated: number;
  partially_evaluated: number;
  not_evaluated: number;
  progress_percentage: number;
  judge_progress: JudgeProgress[];
  last_updated: string;
}

export interface JudgeProgress {
  judge_name: string;
  completed: number;
  total: number;
}

export interface RankingStats {
  total_participants: number;
  completed_evaluations: number;
  pending_evaluations: number;
  progress_percentage: number;
  judge_progress: JudgeProgress[];
  recent_updates: {
    timestamp: string;
    type: string;
    description: string;
  }[];
  avg_evaluation_time: number;
  estimated_completion: string;
}

export interface RankingDisplay {
  id: string;
  timestamp: string;
  competition_info: {
    name: string;
    category: string;
    date: string;
    location: string;
  };
  progress_percentage: number;
  is_final: boolean;
  entries: {
    position: number;
    rider_name: string;
    horse_name: string;
    score: number;
    percentage: number;
    position_change: number;
    is_tied: boolean;
  }[];
}

// Tipos para WebSocket
export interface WebSocketMessage {
  type: 'initial_ranking' | 'current_ranking' | 'ranking_update' | 'position_change' | 
        'progress_update' | 'score_update' | 'error' | 'subscription_confirmed' |
        'progress_data' | 'active_rooms' | 'success';
  data?: any;
  message?: string;
  subscriptions?: string[];
  rooms?: ActiveRoom[];
}

export interface ActiveRoom {
  room_name: string;
  competition_name: string;
  category_name: string;
  participants: number;
  progress: number;
}

export interface WebSocketSubscription {
  competition_id: string;
  category_id: string;
  subscription_types: string[];
}

// Tipos para filtros y búsqueda
export interface RankingFilters {
  competition_id?: string;
  category_id?: string;
  is_current?: boolean;
  is_final?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface RankingSearchParams {
  competition_id: string;
  category_id: string;
  limit?: number;
}

// Tipos para exportación
export interface RankingExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  include_details: boolean;
  include_judge_breakdown: boolean;
  include_history: boolean;
  top_n?: number;
  category_filter?: string;
}

// Tipos para comparación
export interface RankingComparison {
  participant_id: string;
  participant_name: string;
  horse_name: string;
  positions: {
    timestamp: string;
    position: number;
    score: number;
    percentage: number;
  }[];
  trend: 'improving' | 'declining' | 'stable';
  total_change: number;
  best_position: number;
  worst_position: number;
}

// Tipos para dashboards
export interface RankingDashboardData {
  current_ranking: RankingSnapshot;
  progress: RankingProgress;
  recent_updates: LiveRankingUpdate[];
  statistics: RankingStats;
  active_competitions: {
    id: string;
    name: string;
    categories: {
      id: string;
      name: string;
      progress: number;
    }[];
  }[];
}

// Tipos para configuración de display
export interface DisplayConfiguration {
  refresh_interval: number;
  show_animations: boolean;
  show_position_changes: boolean;
  show_percentages: boolean;
  show_judge_breakdown: boolean;
  top_n_display: number;
  theme: 'light' | 'dark';
  font_size: 'small' | 'medium' | 'large';
}

// Tipos para eventos en tiempo real
export interface RankingEvent {
  type: 'position_change' | 'score_update' | 'new_evaluation' | 'calculation_complete';
  timestamp: string;
  data: {
    participant_id?: string;
    participant_name?: string;
    old_position?: number;
    new_position?: number;
    score?: number;
    percentage?: number;
    judge_name?: string;
    evaluation_id?: string;
  };
}

// Tipos para notificaciones
export interface RankingNotification {
  id: string;
  type: 'position_change' | 'calculation_error' | 'evaluation_complete' | 'competition_finished';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

// Tipos para animaciones
export interface PositionChangeAnimation {
  participant_id: string;
  from_position: number;
  to_position: number;
  duration: number;
  delay: number;
}

// Tipos para métricas
export interface RankingMetrics {
  total_calculations: number;
  successful_calculations: number;
  failed_calculations: number;
  average_duration_ms: number;
  recent_errors: {
    error_message: string;
    calculation_start: string;
  }[];
}

// Tipos para configuración del sistema
export interface SystemConfiguration {
  max_participants_per_category: number;
  calculation_timeout_ms: number;
  broadcast_batch_size: number;
  cache_duration_seconds: number;
  websocket_heartbeat_interval: number;
  max_position_history: number;
}