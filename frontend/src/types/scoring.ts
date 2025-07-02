// Tipos para el sistema de calificación FEI

import { Competition, CompetitionCategory, Rider, Horse } from './competitions';

export interface EvaluationParameter {
  id: number;
  name: string;
  code: string;
  min_score: number;
  max_score: number;
  weight: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScoreEntry {
  id: number;
  parameter: EvaluationParameter;
  parameter_id: number;
  score: string; // Decimal como string
  justification?: string;
  created_at: string;
  updated_at: string;
}

export interface JudgeEvaluation {
  id: number;
  judge: number; // User ID
  judge_name?: string;
  competition: Competition;
  competition_id: number;
  category?: CompetitionCategory;
  category_id?: number;
  rider: Rider;
  rider_id: number;
  horse: Horse;
  horse_id: number;
  scores: ScoreEntry[];
  total_score: string; // Decimal como string
  percentage: string; // Decimal como string
  rank?: number;
  status: 'draft' | 'submitted' | 'final';
  submission_time?: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RankingEntry {
  rank: number;
  rider: Rider;
  horse: Horse;
  total_score: string;
  percentage: string;
  scores_by_judge: {
    judge_id: number;
    judge_name: string;
    score: string;
    percentage: string;
  }[];
  technical_scores?: {
    parameter_name: string;
    score: string;
    weight: number;
  }[];
}

export interface CompetitionRanking {
  competition: Competition;
  category?: CompetitionCategory;
  rankings: RankingEntry[];
  statistics: {
    total_participants: number;
    completed_evaluations: number;
    pending_evaluations: number;
    average_score: string;
    highest_score: string;
    lowest_score: string;
  };
  last_updated: string;
}

export interface ScoringFormData {
  competition_id: number;
  category_id?: number;
  rider_id: number;
  horse_id: number;
  scores: {
    parameter_id: number;
    score: string;
    justification?: string;
  }[];
}

export interface JudgeScorecard {
  evaluation: JudgeEvaluation;
  parameters: EvaluationParameter[];
  can_edit: boolean;
  submission_deadline?: string;
}

export interface ScoringSession {
  session_id: string;
  judge_id: number;
  competition_id: number;
  category_id?: number;
  start_time: string;
  last_activity: string;
  is_active: boolean;
}

export interface AnomalyDetection {
  evaluation_id: number;
  rider_name: string;
  horse_name: string;
  anomalies: {
    type: 'score_outlier' | 'inconsistent_judging' | 'technical_error';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggested_action: string;
  }[];
  confidence_score: number;
}

// Tipos para formularios
export interface ScoreInputProps {
  parameter: EvaluationParameter;
  value: string;
  onChange: (value: string) => void;
  onJustification?: (text: string) => void;
  disabled?: boolean;
  error?: string;
}

export interface ScoringGridProps {
  evaluation: JudgeEvaluation;
  parameters: EvaluationParameter[];
  onScoreChange: (parameterId: number, score: string) => void;
  onJustificationChange: (parameterId: number, text: string) => void;
  readOnly?: boolean;
}

// Constantes
export const SCORE_INCREMENTS = [
  '0.0', '0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5',
  '5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0', '9.5', '10.0'
] as const;

export const EVALUATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  FINAL: 'final'
} as const;

export const ANOMALY_TYPES = {
  SCORE_OUTLIER: 'score_outlier',
  INCONSISTENT_JUDGING: 'inconsistent_judging',
  TECHNICAL_ERROR: 'technical_error'
} as const;

export const ANOMALY_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;