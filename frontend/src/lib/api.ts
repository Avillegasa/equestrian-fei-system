// 🔌 Cliente API Centralizado - Sistema FEI (Versión Mejorada)
// Archivo: frontend/lib/api.ts

// ===== IMPORTAR TODOS LOS TIPOS =====
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Competition,
  Category,
  Horse,
  Rider,
  Registration,
  ScoreEntry,
  EvaluationParameter,
  JudgePosition,
  RankingEntry,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  PasswordChangeData,
  CompetitionFormData,
  HorseFormData,
  RiderFormData,
  RegistrationFormData,
  ScoreFormData,
  JudgeAssignmentData,
  CompetitionFilters,
  UserFilters,
  RegistrationFilters,
  ScoreFilters,
  RankingFilters,
  CompetitionStatistics,
  RankingStatistics,
  ScoreValidation,
  LiveRankingUpdate,
} from '../types/api-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ===== GESTIÓN DE TOKENS MEJORADA =====
class TokenManager {
  private static readonly TOKEN_KEY = 'fei_auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'fei_refresh_token';
  private static readonly USER_KEY = 'fei_user';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  static clearAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }
}

// ===== CLIENTE API BASE MEJORADO =====
class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getToken();

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log(`🔌 API Request: ${options.method || 'GET'} ${url}`);
      
      let response = await fetch(url, config);

      // Manejar token expirado con refresh automático mejorado
      if (response.status === 401 && token && !this.isRefreshing) {
        console.log('🔄 Token expirado, intentando refresh...');
        
        const refreshSuccess = await this.handleTokenRefresh();
        
        if (refreshSuccess) {
          // Reintentar request con nuevo token
          const newToken = TokenManager.getToken();
          if (newToken) {
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            };
            response = await fetch(url, config);
          }
        } else {
          TokenManager.clearAll();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          throw new Error('Sesión expirada');
        }
      }

      // Manejar respuestas sin contenido
      if (response.status === 204) {
        return {
          data: undefined,
          success: true,
        };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || data.detail || `HTTP ${response.status}`);
      }

      console.log(`✅ API Response: ${url}`, data);
      
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error(`❌ API Error: ${url}`, error);
      
      return {
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      };
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    // Evitar múltiples refresh simultáneos
    if (this.isRefreshing) {
      if (this.refreshPromise) {
        return this.refreshPromise;
      }
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = null;
      return result;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      return false;
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/users/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        TokenManager.setToken(data.access);
        console.log('✅ Token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
    }

    return false;
  }

  // ===== MÉTODOS HTTP =====
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ===== INSTANCIA GLOBAL =====
const apiClient = new ApiClient();

// ===== SERVICIOS ESPECÍFICOS MEJORADOS =====

// 🔐 AUTENTICACIÓN MEJORADA
export const authAPI = {
  /**
   * Login de usuario
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<AuthResponse>('/users/auth/login/', credentials);
    if (response.success && response.data) {
      TokenManager.setToken(response.data.access);
      TokenManager.setRefreshToken(response.data.refresh);
      TokenManager.setUser(response.data.user);
    }
    return response;
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const refreshToken = TokenManager.getRefreshToken();
    if (refreshToken) {
      await apiClient.post('/users/auth/logout/', { refresh: refreshToken });
    }
    TokenManager.clearAll();
    return { success: true, data: { message: 'Logout exitoso' } };
  },

  /**
   * Registro de nuevo usuario
   */
  register: async (userData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<AuthResponse>('/users/auth/register/', userData);
    if (response.success && response.data) {
      TokenManager.setToken(response.data.access);
      TokenManager.setRefreshToken(response.data.refresh);
      TokenManager.setUser(response.data.user);
    }
    return response;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get<User>('/users/current/');
  },

  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch<User>('/users/profile/', userData);
    if (response.success && response.data) {
      TokenManager.setUser(response.data);
    }
    return response;
  },

  /**
   * Cambiar contraseña
   */
  changePassword: async (passwordData: PasswordChangeData): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/users/auth/password/change/', passwordData);
  },

  // Métodos de conveniencia
  isAuthenticated: (): boolean => TokenManager.isAuthenticated(),
  getStoredUser: (): User | null => TokenManager.getUser(),
};

// 🏆 COMPETENCIAS MEJORADAS
export const competitionsAPI = {
  /**
   * Obtener lista de competencias
   */
  getAll: async (params?: CompetitionFilters): Promise<ApiResponse<PaginatedResponse<Competition>>> => {
    return apiClient.get<PaginatedResponse<Competition>>('/competitions/competitions/', params);
  },

  getPublic: async (params?: {
    upcoming?: boolean;
    search?: string;
  }): Promise<ApiResponse<Competition[]>> => {
    return apiClient.get<Competition[]>('/competitions/public/competitions/', params);
  },

  getById: async (id: number): Promise<ApiResponse<Competition>> => {
    return apiClient.get<Competition>(`/competitions/competitions/${id}/`);
  },

  /**
   * Crear nueva competencia
   */
  create: async (competitionData: CompetitionFormData): Promise<ApiResponse<Competition>> => {
    return apiClient.post<Competition>('/competitions/competitions/', competitionData);
  },

  update: async (id: number, competitionData: Partial<Competition>): Promise<ApiResponse<Competition>> => {
    return apiClient.patch<Competition>(`/competitions/competitions/${id}/`, competitionData);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/competitions/competitions/${id}/`);
  },

  getParticipants: async (id: number): Promise<ApiResponse<Registration[]>> => {
    return apiClient.get<Registration[]>(`/competitions/competitions/${id}/participants/`);
  },

  addParticipant: async (id: number, participantData: {
    rider_id: number;
    horse_id: number;
    category_id: number;
    special_requirements?: string;
  }): Promise<ApiResponse<Registration>> => {
    return apiClient.post<Registration>(`/competitions/competitions/${id}/participants/`, participantData);
  },

  getCategories: async (id: number): Promise<ApiResponse<Category[]>> => {
    return apiClient.get<Category[]>(`/competitions/competitions/${id}/categories/`);
  },

  /**
   * Asignar juez a competencia
   */
  assignJudge: async (competitionId: number, judgeData: JudgeAssignmentData): Promise<ApiResponse<JudgePosition>> => {
    return apiClient.post<JudgePosition>(`/competitions/competitions/${competitionId}/assign_judge/`, judgeData);
  },
};

// 👥 USUARIOS MEJORADOS
export const usersAPI = {
  /**
   * Obtener lista de usuarios
   */
  getAll: async (params?: UserFilters): Promise<ApiResponse<PaginatedResponse<User>>> => {
    return apiClient.get<PaginatedResponse<User>>('/users/', params);
  },

  getById: async (id: number): Promise<ApiResponse<User>> => {
    return apiClient.get<User>(`/users/${id}/`);
  },

  update: async (id: number, userData: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.patch<User>(`/users/${id}/`, userData);
  },

  verifyUser: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post(`/users/${id}/verify/`);
  },

  toggleStatus: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post(`/users/${id}/toggle-status/`);
  },

  getJudges: async (): Promise<ApiResponse<User[]>> => {
    return apiClient.get<User[]>('/users/judges/');
  },

  getJudgesByDiscipline: async (discipline: string): Promise<ApiResponse<User[]>> => {
    return apiClient.get<User[]>(`/users/judges/discipline/${discipline}/`);
  },

  createJudgeProfile: async (judgeData: any): Promise<ApiResponse<any>> => {
    return apiClient.post('/users/judge/profile/create/', judgeData);
  },

  createOrganizerProfile: async (organizerData: any): Promise<ApiResponse<any>> => {
    return apiClient.post('/users/organizer/profile/create/', organizerData);
  },
};

// 🎯 CALIFICACIÓN (SCORING) MEJORADA
export const scoringAPI = {
  getEvaluationParameters: async (categoryId: number): Promise<ApiResponse<EvaluationParameter[]>> => {
    return apiClient.get<EvaluationParameter[]>('/scoring/parameters/', { category_id: categoryId });
  },

  /**
   * Ingresar/actualizar calificación
   */
  submitScore: async (scoreData: ScoreFormData): Promise<ApiResponse<ScoreEntry>> => {
    return apiClient.post<ScoreEntry>('/scoring/entries/', scoreData);
  },

  updateScore: async (scoreId: number, scoreData: {
    score: number;
    justification?: string;
    reason?: string;
  }): Promise<ApiResponse<ScoreEntry>> => {
    return apiClient.patch<ScoreEntry>(`/scoring/entries/${scoreId}/`, scoreData);
  },

  getParticipantScores: async (participantId: number): Promise<ApiResponse<ScoreEntry[]>> => {
    return apiClient.get<ScoreEntry[]>('/scoring/entries/', { participant_id: participantId });
  },

  getJudgeEvaluations: async (competitionId: number, judgeId?: number): Promise<ApiResponse<any[]>> => {
    const params = judgeId ? { competition_id: competitionId, judge_id: judgeId } : { competition_id: competitionId };
    return apiClient.get<any[]>('/scoring/evaluations/', params);
  },

  /**
   * Validar puntuaciones de un participante
   */
  validateScores: async (participantId: number): Promise<ApiResponse<ScoreValidation>> => {
    return apiClient.post('/scoring/entries/validate_scores/', { participant_id: participantId });
  },

  /**
   * Obtener progreso de calificación de una competencia
   */
  getProgress: async (competitionId: number, categoryId?: number): Promise<ApiResponse<CompetitionStatistics>> => {
    const params = categoryId 
      ? { competition_id: competitionId, category_id: categoryId }
      : { competition_id: competitionId };
    return apiClient.get('/scoring/progress/', params);
  },

  // Nuevos métodos para endpoints específicos
  getPublicParameters: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/scoring/public-parameters/');
  },

  testCalculator: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/scoring/public-calculator-test/');
  },
};

// 🏅 RANKINGS MEJORADOS
export const rankingsAPI = {
  getCompetitionRankings: async (competitionId: number, categoryId?: number): Promise<ApiResponse<{
    competition_id: number;
    category_id?: number;
    rankings: RankingEntry[];
    calculated_at: string;
    total_participants: number;
  }>> => {
    const params = categoryId 
      ? { competition_id: competitionId, category_id: categoryId }
      : { competition_id: competitionId };
    return apiClient.get('/rankings/api/rankings/', params);
  },

  /**
   * Obtener rankings en vivo
   */
  getLiveRankings: async (competitionId: number, categoryId?: number): Promise<ApiResponse<LiveRankingUpdate>> => {
    const params = categoryId 
      ? { competition_id: competitionId, category_id: categoryId }
      : { competition_id: competitionId };
    return apiClient.get('/rankings/api/live-ranking/', params);
  },

  calculateRankings: async (competitionId: number, categoryId?: number): Promise<ApiResponse<any>> => {
    return apiClient.post('/rankings/api/calculate-ranking/', {
      competition_id: competitionId,
      category_id: categoryId
    });
  },

  getRankingHistory: async (competitionId: number, categoryId?: number, limit: number = 10): Promise<ApiResponse<any[]>> => {
    return apiClient.get('/rankings/api/ranking-history/', {
      competition_id: competitionId,
      category_id: categoryId,
      limit: limit
    });
  },

  /**
   * Obtener estadísticas de rankings
   */
  getStatistics: async (competitionId: number, categoryId?: number): Promise<ApiResponse<RankingStatistics>> => {
    const params = categoryId 
      ? { competition_id: competitionId, category_id: categoryId }
      : { competition_id: competitionId };
    return apiClient.get('/rankings/api/ranking-stats/', params);
  },

  exportRankings: async (competitionId: number, format: 'pdf' | 'excel' = 'pdf'): Promise<ApiResponse<any>> => {
    return apiClient.get(`/rankings/api/export/`, { 
      competition_id: competitionId, 
      format: format 
    });
  },

  getParticipantHistory: async (participantId: number): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/rankings/api/participants/${participantId}/history/`);
  },
};

// 📊 REPORTES MEJORADOS
export const reportsAPI = {
  getCompetitionReport: async (competitionId: number): Promise<ApiResponse<any>> => {
    return apiClient.get(`/reports/competitions/${competitionId}/`);
  },

  getFEIReport: async (competitionId: number): Promise<ApiResponse<any>> => {
    return apiClient.get(`/reports/competitions/${competitionId}/fei/`);
  },

  getAuditReport: async (competitionId: number): Promise<ApiResponse<any>> => {
    return apiClient.get(`/reports/competitions/${competitionId}/audit/`);
  },

  exportReport: async (competitionId: number, type: 'competition' | 'fei' | 'audit', format: 'pdf' | 'excel' = 'pdf'): Promise<ApiResponse<any>> => {
    return apiClient.get(`/reports/competitions/${competitionId}/${type}/export/`, { format });
  },
};

// 🐎 CABALLOS Y JINETES
export const horsesAPI = {
  getAll: async (params?: { search?: string; page?: number }): Promise<ApiResponse<PaginatedResponse<Horse>>> => {
    return apiClient.get<PaginatedResponse<Horse>>('/competitions/horses/', params);
  },

  /**
   * Crear nuevo caballo
   */
  create: async (horseData: HorseFormData): Promise<ApiResponse<Horse>> => {
    return apiClient.post<Horse>('/competitions/horses/', horseData);
  },

  update: async (id: number, horseData: Partial<Horse>): Promise<ApiResponse<Horse>> => {
    return apiClient.patch<Horse>(`/competitions/horses/${id}/`, horseData);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/competitions/horses/${id}/`);
  },
};

export const ridersAPI = {
  getAll: async (params?: { search?: string; page?: number }): Promise<ApiResponse<PaginatedResponse<Rider>>> => {
    return apiClient.get<PaginatedResponse<Rider>>('/competitions/riders/', params);
  },

  /**
   * Crear nuevo jinete
   */
  create: async (riderData: RiderFormData): Promise<ApiResponse<Rider>> => {
    return apiClient.post<Rider>('/competitions/riders/', riderData);
  },

  update: async (id: number, riderData: Partial<Rider>): Promise<ApiResponse<Rider>> => {
    return apiClient.patch<Rider>(`/competitions/riders/${id}/`, riderData);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/competitions/riders/${id}/`);
  },
};

// ===== EXPORTAR API PRINCIPAL =====
export default apiClient;
export { TokenManager };

// ===== MÉTODOS DE CONVENIENCIA =====
export const api = {
  auth: authAPI,
  competitions: competitionsAPI,
  users: usersAPI,
  scoring: scoringAPI,
  rankings: rankingsAPI,
  reports: reportsAPI,
  horses: horsesAPI,
  riders: ridersAPI,
};

// ===== EXPORTAR SERVICIOS INDIVIDUALES =====
export {
  authAPI,
  competitionsAPI,
  usersAPI,
  scoringAPI,
  rankingsAPI,
  reportsAPI,
  horsesAPI,
  ridersAPI,
};

// ===== RE-EXPORTAR TODOS LOS TIPOS DESDE EL ARCHIVO DE TIPOS =====
export type {
  ApiResponse,
  PaginatedResponse,
  User,
  Competition,
  Category,
  Horse,
  Rider,
  Registration,
  ScoreEntry,
  EvaluationParameter,
  JudgePosition,
  RankingEntry,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  PasswordChangeData,
  CompetitionFormData,
  HorseFormData,
  RiderFormData,
  RegistrationFormData,
  ScoreFormData,
  JudgeAssignmentData,
  CompetitionFilters,
  UserFilters,
  RegistrationFilters,
  ScoreFilters,
  RankingFilters,
  CompetitionStatistics,
  RankingStatistics,
  ScoreValidation,
  LiveRankingUpdate,
} from '../types/api-types';