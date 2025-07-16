import { apiClient } from './client';
import {
  EvaluationParameter,
  JudgeEvaluation,
  ScoreEntry,
  ScoringFormData,
  JudgeScorecard,
  CompetitionRanking,
  ScoreValidation,
  AnomalyDetection,
  ScoringSession
} from '@/types/scoring';

// API endpoints para el sistema de calificación FEI
export const scoringApi = {
  // Parámetros de evaluación
  parameters: {
    list: async (): Promise<EvaluationParameter[]> => {
      const response = await apiClient.get('/api/scoring/parameters/');
      return response.data.results || response.data;
    },

    get: async (id: number): Promise<EvaluationParameter> => {
      const response = await apiClient.get(`/api/scoring/parameters/${id}/`);
      return response.data;
    },

    create: async (data: Partial<EvaluationParameter>): Promise<EvaluationParameter> => {
      const response = await apiClient.post('/api/scoring/parameters/', data);
      return response.data;
    },

    update: async (id: number, data: Partial<EvaluationParameter>): Promise<EvaluationParameter> => {
      const response = await apiClient.patch(`/api/scoring/parameters/${id}/`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/api/scoring/parameters/${id}/`);
    },

    // Parámetros activos para una disciplina específica
    getByDiscipline: async (disciplineId: number): Promise<EvaluationParameter[]> => {
      const response = await apiClient.get(`/api/scoring/parameters/?discipline=${disciplineId}&is_active=true`);
      return response.data.results || response.data;
    }
  },

  // Entradas de puntuación individuales
  scores: {
    list: async (filters?: Record<string, any>): Promise<ScoreEntry[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
      }
      const response = await apiClient.get(`/api/scoring/scores/?${params}`);
      return response.data.results || response.data;
    },

    get: async (id: number): Promise<ScoreEntry> => {
      const response = await apiClient.get(`/api/scoring/scores/${id}/`);
      return response.data;
    },

    create: async (data: Partial<ScoreEntry>): Promise<ScoreEntry> => {
      const response = await apiClient.post('/api/scoring/scores/', data);
      return response.data;
    },

    update: async (id: number, data: Partial<ScoreEntry>): Promise<ScoreEntry> => {
      const response = await apiClient.patch(`/api/scoring/scores/${id}/`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/api/scoring/scores/${id}/`);
    },

    // Actualización masiva de puntuaciones
    bulkUpdate: async (scores: Array<{ id: number; score: string; justification?: string }>): Promise<ScoreEntry[]> => {
      const response = await apiClient.post('/api/scoring/scores/bulk-update/', { scores });
      return response.data;
    },

    // Validar puntuación antes de guardar
    validate: async (parameterId: number, score: string): Promise<ScoreValidation> => {
      const response = await apiClient.post('/api/scoring/scores/validate/', {
        parameter_id: parameterId,
        score
      });
      return response.data;
    }
  },

  // Evaluaciones de jueces
  evaluations: {
    list: async (filters?: Record<string, any>): Promise<JudgeEvaluation[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
      }
      const response = await apiClient.get(`/api/scoring/evaluations/?${params}`);
      return response.data.results || response.data;
    },

    get: async (id: number): Promise<JudgeEvaluation> => {
      const response = await apiClient.get(`/api/scoring/evaluations/${id}/`);
      return response.data;
    },

    create: async (data: ScoringFormData): Promise<JudgeEvaluation> => {
      const response = await apiClient.post('/api/scoring/evaluations/', data);
      return response.data;
    },

    update: async (id: number, data: Partial<JudgeEvaluation>): Promise<JudgeEvaluation> => {
      const response = await apiClient.patch(`/api/scoring/evaluations/${id}/`, data);
      return response.data;
    },

    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/api/scoring/evaluations/${id}/`);
    },

    // Obtener tarjeta de puntuación para un juez
    getScorecard: async (competitionId: number, categoryId?: number, riderId?: number): Promise<JudgeScorecard> => {
      const params = new URLSearchParams({ competition_id: String(competitionId) });
      if (categoryId) params.append('category_id', String(categoryId));
      if (riderId) params.append('rider_id', String(riderId));
      
      const response = await apiClient.get(`/api/scoring/scores/judge-scorecard/?${params}`);
      return response.data;
    },

    // Enviar evaluación final
    submit: async (evaluationId: number): Promise<JudgeEvaluation> => {
      const response = await apiClient.post(`/api/scoring/evaluations/${evaluationId}/submit/`);
      return response.data;
    },

    // Obtener evaluaciones del juez actual
    getMyEvaluations: async (filters?: Record<string, any>): Promise<JudgeEvaluation[]> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
      }
      const response = await apiClient.get(`/api/scoring/evaluations/my/?${params}`);
      return response.data.results || response.data;
    },

    // Progreso de evaluación de competencia
    getCompetitionProgress: async (competitionId: number): Promise<{
      total_participants: number;
      completed_evaluations: number;
      pending_evaluations: number;
      judges_progress: Array<{
        judge_id: number;
        judge_name: string;
        completed: number;
        pending: number;
      }>;
    }> => {
      const response = await apiClient.get(`/api/scoring/evaluations/competition-progress/?competition_id=${competitionId}`);
      return response.data;
    }
  },

  // Rankings y resultados
  rankings: {
    getCompetitionRanking: async (competitionId: number, categoryId?: number): Promise<CompetitionRanking> => {
      const params = new URLSearchParams({ competition_id: String(competitionId) });
      if (categoryId) params.append('category_id', String(categoryId));
      
      const response = await apiClient.get(`/api/scoring/rankings/?${params}`);
      return response.data;
    },

    getLiveRankings: async (competitionId: number, categoryId?: number): Promise<CompetitionRanking> => {
      const params = new URLSearchParams({ competition_id: String(competitionId) });
      if (categoryId) params.append('category_id', String(categoryId));
      
      const response = await apiClient.get(`/api/scoring/rankings/live/?${params}`);
      return response.data;
    },

    getParticipantDetail: async (competitionId: number, riderId: number, horseId: number): Promise<{
      rider: any;
      horse: any;
      evaluations: JudgeEvaluation[];
      average_score: string;
      current_rank: number;
      score_breakdown: Array<{
        parameter_name: string;
        average_score: string;
        scores_by_judge: Array<{
          judge_name: string;
          score: string;
        }>;
      }>;
    }> => {
      const params = new URLSearchParams({
        competition_id: String(competitionId),
        rider_id: String(riderId),
        horse_id: String(horseId)
      });
      
      const response = await apiClient.get(`/api/scoring/rankings/participant-detail/?${params}`);
      return response.data;
    },

    // Detección de anomalías
    detectAnomalies: async (competitionId: number): Promise<AnomalyDetection[]> => {
      const response = await apiClient.get(`/api/scoring/rankings/anomaly-detection/?competition_id=${competitionId}`);
      return response.data;
    }
  },

  // Sesiones de calificación (para tracking en tiempo real)
  sessions: {
    start: async (competitionId: number, categoryId?: number): Promise<ScoringSession> => {
      const response = await apiClient.post('/api/scoring/sessions/start/', {
        competition_id: competitionId,
        category_id: categoryId
      });
      return response.data;
    },

    update: async (sessionId: string): Promise<ScoringSession> => {
      const response = await apiClient.patch(`/api/scoring/sessions/${sessionId}/`, {
        last_activity: new Date().toISOString()
      });
      return response.data;
    },

    end: async (sessionId: string): Promise<void> => {
      await apiClient.post(`/api/scoring/sessions/${sessionId}/end/`);
    },

    getActive: async (): Promise<ScoringSession[]> => {
      const response = await apiClient.get('/api/scoring/sessions/active/');
      return response.data.results || response.data;
    }
  },

  // Utilidades y validaciones
  utils: {
    // Validar incrementos de puntuación FEI
    validateScore: (score: string): { isValid: boolean; error?: string } => {
      const numScore = parseFloat(score);
      
      if (isNaN(numScore)) {
        return { isValid: false, error: 'Puntuación debe ser un número válido' };
      }
      
      if (numScore < 0 || numScore > 10) {
        return { isValid: false, error: 'Puntuación debe estar entre 0 y 10' };
      }
      
      // Verificar incrementos de 0.5
      if ((numScore * 2) % 1 !== 0) {
        return { isValid: false, error: 'Puntuación debe ser en incrementos de 0.5' };
      }
      
      return { isValid: true };
    },

    // Calcular porcentaje
    calculatePercentage: (score: string, maxScore: number = 10): string => {
      const numScore = parseFloat(score);
      if (isNaN(numScore)) return '0.00';
      return ((numScore / maxScore) * 100).toFixed(2);
    },

    // Formatear puntuación para display
    formatScore: (score: string): string => {
      const numScore = parseFloat(score);
      if (isNaN(numScore)) return '0.0';
      return numScore.toFixed(1);
    }
  }
};