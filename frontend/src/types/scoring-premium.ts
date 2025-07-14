// frontend/src/types/scoring-premium.ts

export interface ParticipantPremium {
  id: number;
  rider_name: string;
  horse_name: string;
  participant_number: string;
  category: string;
  photo_url?: string;
  horse_photo_url?: string;
  nationality?: string;
  club?: string;
  age?: number;
  horse_age?: number;
  horse_breed?: string;
  registration_number?: string;
  rider_license?: string;
  horse_passport?: string;
}

export interface EvaluationParameterPremium {
  id: number;
  name: string;
  description: string;
  coefficient: number;
  max_score: number;
  current_score?: number;
  is_scored: boolean;
  needs_justification?: boolean;
  justification?: string;
  scored_at?: string;
  last_modified?: string;
  validation_status?: 'valid' | 'warning' | 'error';
  validation_message?: string;
}

export interface ScoringSessionPremium {
  id: number;
  competition_id: number;
  competition_name: string;
  category_id: number;
  category_name: string;
  judge_id: number;
  judge_name: string;
  participants: ParticipantPremium[];
  evaluation_parameters: EvaluationParameterPremium[];
  current_participant_index: number;
  session_status: 'active' | 'paused' | 'completed' | 'reviewing';
  started_at: string;
  last_activity: string;
  auto_save_enabled: boolean;
  offline_mode: boolean;
  sync_status: 'synced' | 'pending' | 'error';
}

export interface ScoreEntryPremium {
  id?: number;
  participant_id: number;
  parameter_id: number;
  score: number;
  justification?: string;
  scored_at: string;
  last_modified?: string;
  judge_id: number;
  is_final: boolean;
  revision_count: number;
  weighted_score: number;
  validation_status: 'valid' | 'warning' | 'error';
  validation_messages: string[];
}

export interface ParticipantScorePremium {
  participant: ParticipantPremium;
  scores: ScoreEntryPremium[];
  total_score: number;
  weighted_total: number;
  percentage: number;
  completion_status: number; // 0-100%
  ranking_position?: number;
  is_complete: boolean;
  last_scored_at?: string;
  needs_review: boolean;
}

export interface CompetitionStatsPremium {
  total_participants: number;
  completed_evaluations: number;
  completion_percentage: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  total_parameters: number;
  scored_parameters: number;
  parameters_needing_justification: number;
  estimated_time_remaining: number; // en minutos
}

export interface JudgeProgressPremium {
  judge_id: number;
  judge_name: string;
  assigned_participants: number;
  completed_participants: number;
  current_participant?: ParticipantPremium;
  completion_percentage: number;
  average_time_per_participant: number; // en minutos
  session_duration: number; // en minutos
  scores_requiring_justification: number;
  last_activity: string;
  is_active: boolean;
}

export interface ValidationRulePremium {
  rule_type: 'range' | 'increment' | 'justification' | 'mandatory';
  parameter_id?: number;
  min_value?: number;
  max_value?: number;
  required_increment?: number;
  justification_threshold_low?: number;
  justification_threshold_high?: number;
  error_message: string;
  warning_message?: string;
}

export interface ScoringConfigPremium {
  category_id: number;
  parameters: EvaluationParameterPremium[];
  validation_rules: ValidationRulePremium[];
  auto_save_interval: number; // en segundos
  require_justification_for_extremes: boolean;
  allow_score_modifications: boolean;
  modification_requires_justification: boolean;
  enable_offline_mode: boolean;
  tablet_optimized: boolean;
}

export interface OfflineScoreData {
  session_id: number;
  scores: ScoreEntryPremium[];
  participant_progress: { [key: number]: number }; // participantId -> completion%
  last_sync_attempt?: string;
  sync_errors: string[];
  pending_justifications: { [key: string]: string }; // scoreId -> justification
}

// Hooks y utilidades para el sistema premium
export interface ScoringHookOptions {
  auto_save?: boolean;
  auto_save_interval?: number;
  enable_offline?: boolean;
  validation_mode?: 'strict' | 'lenient';
  real_time_updates?: boolean;
}

export interface ScoreValidationResult {
  is_valid: boolean;
  warnings: string[];
  errors: string[];
  needs_justification: boolean;
  suggested_actions: string[];
}

export interface AnimationConfig {
  score_update_duration: number;
  participant_transition_duration: number;
  parameter_transition_duration: number;
  progress_animation_duration: number;
  enable_haptic_feedback: boolean;
  enable_sound_feedback: boolean;
}

// Eventos del sistema de calificación
export type ScoringEvent = 
  | { type: 'SCORE_UPDATED'; payload: ScoreEntryPremium }
  | { type: 'PARTICIPANT_CHANGED'; payload: { from: number; to: number } }
  | { type: 'PARAMETER_CHANGED'; payload: { from: number; to: number } }
  | { type: 'SESSION_PAUSED'; payload: { reason: string } }
  | { type: 'SESSION_RESUMED'; payload: { duration_paused: number } }
  | { type: 'SYNC_STATUS_CHANGED'; payload: { status: 'synced' | 'pending' | 'error' } }
  | { type: 'VALIDATION_ERROR'; payload: { score_id: number; errors: string[] } }
  | { type: 'JUSTIFICATION_REQUIRED'; payload: { score_id: number; reason: string } };

// Configuración de temas y estilos
export interface ScoringTheme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  background_gradient: string;
  card_shadow: string;
  border_radius: string;
  font_family_primary: string;
  font_family_secondary: string;
  font_family_numeric: string;
}

// Configuración de responsividad
export interface ResponsiveConfig {
  mobile_breakpoint: number;
  tablet_breakpoint: number;
  desktop_breakpoint: number;
  touch_target_size: number;
  font_scale_mobile: number;
  font_scale_tablet: number;
  spacing_scale_mobile: number;
  spacing_scale_tablet: number;
}

// API responses específicas para el sistema premium
export interface ScoringApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
  request_id: string;
  cache_info?: {
    cached: boolean;
    cache_age: number;
    expires_at: string;
  };
}

export interface PaginatedScoringResponse<T> extends ScoringApiResponse<T[]> {
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// WebSocket events para tiempo real
export interface RealTimeEvent {
  event_type: 'score_update' | 'ranking_change' | 'session_update' | 'sync_status';
  competition_id: number;
  category_id?: number;
  participant_id?: number;
  data: any;
  timestamp: string;
  source_judge_id?: number;
}

export interface WebSocketConfig {
  auto_reconnect: boolean;
  reconnect_interval: number;
  max_reconnect_attempts: number;
  heartbeat_interval: number;
  enable_compression: boolean;
  buffer_events_offline: boolean;
}