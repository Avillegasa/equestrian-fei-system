// 📝 Tipos TypeScript para el Sistema FEI
// Archivo: frontend/lib/types.ts

// ===== TIPOS BASE =====
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ===== TIPOS DE USUARIO =====
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  country?: string;
  role: 'admin' | 'judge' | 'organizer' | 'participant' | 'viewer';
  is_verified: boolean;
  is_active: boolean;
  has_judge_profile: boolean;
  has_organizer_profile: boolean;
  date_joined: string;
  last_login?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// ===== TIPOS DE COMPETENCIA =====
export interface Competition {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  status: 'draft' | 'open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
  organizer: User;
  created_at: string;
  updated_at: string;
  participants_count: number;
  judges_assigned: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  level: string;
  min_age?: number;
  max_age?: number;
}

export interface CompetitionCategory {
  id: number;
  competition: Competition;
  category: Category;
  entry_fee?: string;
  max_participants?: number;
  registration_deadline?: string;
}

// ===== TIPOS DE PARTICIPANTES =====
export interface Horse {
  id: number;
  name: string;
  breed?: string;
  birth_year?: number;
  gender: 'stallion' | 'mare' | 'gelding';
  color?: string;
  fei_id?: string;
  passport_number?: string;
  owner?: string;
}

export interface Rider {
  id: number;
  user: User;
  fei_id?: string;
  birth_date?: string;
  nationality?: string;
  experience_level: string;
  club?: string;
  trainer?: string;
}

export interface Registration {
  id: number;
  competition_category: CompetitionCategory;
  rider: Rider;
  horse: Horse;
  status: 'pending' | 'confirmed' | 'cancelled';
  start_number?: number;
  registered_at: string;
  confirmed_at?: string;
  entry_fee_paid: boolean;
  outstanding_balance: string;
  payment_reference?: string;
  payment_date?: string;
  special_requirements?: string;
  notes?: string;
}

// ===== TIPOS DE CALIFICACIÓN =====
export interface EvaluationParameter {
  id: number;
  category: Category;
  exercise_number: number;
  exercise_name: string;
  description: string;
  coefficient: number;
  max_score: string;
  min_score?: string;
  is_collective_mark: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface JudgePosition {
  id: number;
  competition: Competition;
  judge: User;
  position: string; // 'C', 'H', 'E', 'B', 'F', etc.
  role: 'chief' | 'member' | 'reserve';
  order?: number;
  fee?: string;
  travel_allowance?: string;
  accommodation_provided?: boolean;
  confirmed: boolean;
  confirmation_date?: string;
  notes?: string;
}

export interface ScoreEntry {
  id: number;
  participant: Registration;
  judge_position: JudgePosition;
  evaluation_parameter: EvaluationParameter;
  score: string; // Decimal as string
  weighted_score: string;
  justification?: string;
  is_extreme_score: boolean;
  scored_at: string;
  updated_at: string;
  scored_by: User;
  scored_by_name: string;
  is_reviewed: boolean;
  reviewed_at?: string;
  reviewed_by?: User;
  reason?: string;
}

export interface JudgeEvaluation {
  id: number;
  judge_position: JudgePosition;
  participant: Registration;
  status: 'pending' | 'in_progress' | 'completed' | 'reviewed';
  started_at?: string;
  completed_at?: string;
  reviewed_at?: string;
  total_score?: string;
  percentage?: string;
  notes?: string;
  is_final: boolean;
}

// ===== TIPOS DE RANKING =====
export interface RankingEntry {
  id: number;
  position: number;
  participant: Registration;
  score: string;
  percentage: string;
  is_tied: boolean;
  tie_break_info?: {
    resolved: boolean;
    method: string;
    criteria_used?: string;
    tied_participants?: number;
  };
  judge_scores: {
    judge_position: JudgePosition;
    total_score: string;
    percentage: string;
    individual_scores: {
      parameter: EvaluationParameter;
      score: string;
      weighted_score: string;
    }[];
  }[];
  metadata: {
    start_number?: number;
    registration_status: string;
    anomalies?: any[];
    last_score_update?: string;
  };
}

export interface RankingSnapshot {
  id: number;
  competition: Competition;
  category?: Category;
  timestamp: string;
  total_participants: number;
  calculation_method: string;
  metadata: {
    engine_version: string;
    tie_resolution_applied: boolean;
    anomalies_detected: boolean;
  };
  entries: RankingEntry[];
}

export interface LiveRankingUpdate {
  rankings: RankingEntry[];
  changes: {
    position_changes: {
      registration_id: number;
      rider_name: string;
      previous_position: number;
      current_position: number;
      position_change: number;
      direction: 'up' | 'down';
    }[];
    new_entries: number[];
    removed_entries: number[];
    score_changes: {
      registration_id: number;
      rider_name: string;
      previous_score: number;
      current_score: number;
      score_change: number;
    }[];
  };
  is_live_update: boolean;
  previous_update?: string;
  change_summary: {
    positions_changed: number;
    new_entries: number;
    significant_changes: number;
  };
}

// ===== TIPOS DE ESTADÍSTICAS =====
export interface CompetitionStatistics {
  total_participants: number;
  completed_evaluations: number;
  pending_evaluations: number;
  progress_percentage: number;
  judges_progress: {
    judge: User;
    position: string;
    total_evaluations: number;
    completed_evaluations: number;
    completion_percentage: number;
  }[];
  recent_updates: {
    participant: Registration;
    judge: User;
    timestamp: string;
    action: string;
  }[];
  avg_evaluation_time?: number;
  estimated_completion?: string;
}

export interface RankingStatistics {
  competition_id: number;
  category_id?: number;
  total_participants: number;
  score_statistics: {
    average_score: number;
    minimum_score: number;
    maximum_score: number;
    score_range: number;
    standard_deviation: number;
  };
  performance_distribution: {
    excellent_80_plus: number;
    good_70_79: number;
    satisfactory_60_69: number;
    needs_improvement_below_60: number;
    percentages: {
      excellent: number;
      good: number;
      satisfactory: number;
      needs_improvement: number;
    };
  };
  ranking_metadata: {
    tied_positions: number;
    average_judges_per_participant: number;
    calculation_timestamp: string;
    engine_version: string;
  };
}

// ===== TIPOS DE VALIDACIÓN =====
export interface ScoreValidation {
  is_complete: boolean;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  missing_parameters?: string[];
  invalid_scores?: {
    parameter: string;
    score: string;
    error: string;
  }[];
  weighted_score?: string;
  is_extreme?: boolean;
}

export interface BulkScoreUpdate {
  participant_id: number;
  judge_position_id: number;
  evaluation_parameter_id: number;
  score: number;
  justification?: string;
  reason?: string;
}

// ===== TIPOS DE REPORTES =====
export interface CompetitionReport {
  competition: Competition;
  categories: Category[];
  participants: Registration[];
  judges: JudgePosition[];
  statistics: CompetitionStatistics;
  rankings: RankingEntry[];
  generated_at: string;
  generated_by: User;
}

export interface FEIReport {
  competition: Competition;
  category: Category;
  rankings: RankingEntry[];
  judge_signatures: {
    judge: User;
    position: string;
    signed_at?: string;
  }[];
  technical_delegate?: User;
  report_metadata: {
    fei_standards_version: string;
    calculation_method: string;
    report_format: string;
  };
  generated_at: string;
}

export interface AuditLog {
  id: number;
  user: User;
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout';
  resource_type: string;
  resource_id?: number;
  description: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  metadata?: any;
}

// ===== TIPOS DE FORMULARIOS =====
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  country?: string;
}

export interface PasswordChangeData {
  old_password: string;
  new_password: string;
}

export interface CompetitionFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  status?: string;
}

export interface HorseFormData {
  name: string;
  breed?: string;
  birth_year?: number;
  gender: 'stallion' | 'mare' | 'gelding';
  color?: string;
  fei_id?: string;
  passport_number?: string;
  owner?: string;
}

export interface RiderFormData {
  user_id: number;
  fei_id?: string;
  birth_date?: string;
  nationality?: string;
  experience_level: string;
  club?: string;
  trainer?: string;
}

export interface RegistrationFormData {
  competition_category_id: number;
  rider_id: number;
  horse_id: number;
  special_requirements?: string;
  notes?: string;
}

export interface ScoreFormData {
  participant_id: number;
  judge_position_id: number;
  evaluation_parameter_id: number;
  score: number;
  justification?: string;
}

export interface JudgeAssignmentData {
  judge_id: number;
  position: string;
  role: 'chief' | 'member' | 'reserve';
  fee?: string;
  travel_allowance?: string;
  accommodation_provided?: boolean;
}

// ===== TIPOS DE FILTROS Y PARÁMETROS =====
export interface CompetitionFilters {
  page?: number;
  search?: string;
  status?: string;
  upcoming?: boolean;
  organizer_id?: number;
  location?: string;
}

export interface UserFilters {
  page?: number;
  search?: string;
  role?: string;
  is_verified?: boolean;
  is_active?: boolean;
  country?: string;
}

export interface RegistrationFilters {
  competition_id?: number;
  rider_id?: number;
  horse_id?: number;
  status?: string;
  category_id?: number;
}

export interface ScoreFilters {
  participant_id?: number;
  judge_id?: number;
  competition_id?: number;
  category_id?: number;
  evaluation_parameter_id?: number;
}

export interface RankingFilters {
  competition_id: number;
  category_id?: number;
  live?: boolean;
  limit?: number;
}

// ===== TIPOS DE RESPUESTAS ESPECÍFICAS =====
export interface LoginResponse extends ApiResponse<AuthResponse> {}
export interface CompetitionsResponse extends ApiResponse<PaginatedResponse<Competition>> {}
export interface UsersResponse extends ApiResponse<PaginatedResponse<User>> {}
export interface RankingsResponse extends ApiResponse<RankingEntry[]> {}
export interface StatisticsResponse extends ApiResponse<RankingStatistics> {}

// ===== TIPOS UTILITARIOS =====
export type UserRole = User['role'];
export type CompetitionStatus = Competition['status'];
export type RegistrationStatus = Registration['status'];
export type JudgeRole = JudgePosition['role'];
export type HorseGender = Horse['gender'];
export type AuditAction = AuditLog['action'];

// ===== CONSTANTES DE TIPOS =====
export const USER_ROLES: UserRole[] = ['admin', 'judge', 'organizer', 'participant', 'viewer'];
export const COMPETITION_STATUSES: CompetitionStatus[] = ['draft', 'open', 'registration_closed', 'in_progress', 'completed', 'cancelled'];
export const REGISTRATION_STATUSES: RegistrationStatus[] = ['pending', 'confirmed', 'cancelled'];
export const JUDGE_ROLES: JudgeRole[] = ['chief', 'member', 'reserve'];
export const HORSE_GENDERS: HorseGender[] = ['stallion', 'mare', 'gelding'];

// ===== GUARDS DE TIPOS =====
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj.id === 'number' && typeof obj.email === 'string';
};

export const isCompetition = (obj: any): obj is Competition => {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string';
};

export const isApiResponse = <T>(obj: any): obj is ApiResponse<T> => {
  return obj && typeof obj.success === 'boolean';
};

export const isPaginatedResponse = <T>(obj: any): obj is PaginatedResponse<T> => {
  return obj && typeof obj.count === 'number' && Array.isArray(obj.results);
};