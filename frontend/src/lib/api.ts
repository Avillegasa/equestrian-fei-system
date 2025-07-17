/**
 * Cliente API Centralizado - Sistema FEI
 * ====================================== 
 * 
 * Cliente API completo que maneja toda la comunicación con el backend Django.
 * Incluye autenticación JWT, refresh automático, manejo de errores, y 
 * servicios para todas las entidades del sistema.
 * 
 * Características:
 * - Refresh automático de tokens
 * - Manejo de errores centralizado  
 * - Tipado TypeScript completo
 * - Interceptors para logging
 * - Compatibilidad SSR (Next.js)
 * 
 * Archivo: frontend/src/lib/api.ts
 * Autor: Sistema FEI - Fase 6.6 Día 8
 * Fecha: 17 Julio 2025
 */

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

// ===== CONFIGURACIÓN =====
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// ===== GESTIÓN DE TOKENS MEJORADA =====
export class TokenManager {
  private static readonly TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly USER_KEY = 'currentUser';

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

// ===== CLIENTE API BASE =====
class ApiClient {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    const refreshToken = TokenManager.getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/users/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      if (data.access) {
        TokenManager.setToken(data.access);
        console.log('🔄 Token refreshed successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      return false;
    }
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

      // Manejar token expirado con refresh automático
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

  // Métodos HTTP
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url);
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

// ===== SERVICIOS ESPECÍFICOS =====

// 🔐 AUTENTICACIÓN
const authAPI = {
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

  changePassword: async (passwordData: PasswordChangeData): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post('/users/auth/password/change/', passwordData);
  },

  isAuthenticated: (): boolean => TokenManager.isAuthenticated(),
  getStoredUser: (): User | null => TokenManager.getUser(),
};

// 🏆 COMPETENCIAS
const competitionsAPI = {
  getAll: async (params?: CompetitionFilters): Promise<ApiResponse<PaginatedResponse<Competition>>> => {
    return apiClient.get<PaginatedResponse<Competition>>('/competitions/', params);
  },

  getById: async (id: number): Promise<ApiResponse<Competition>> => {
    return apiClient.get<Competition>(`/competitions/${id}/`);
  },

  create: async (competitionData: CompetitionFormData): Promise<ApiResponse<Competition>> => {
    return apiClient.post<Competition>('/competitions/', competitionData);
  },

  update: async (id: number, competitionData: Partial<CompetitionFormData>): Promise<ApiResponse<Competition>> => {
    return apiClient.patch<Competition>(`/competitions/${id}/`, competitionData);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/competitions/${id}/`);
  },

  getCategories: async (competitionId: number): Promise<ApiResponse<Category[]>> => {
    return apiClient.get<Category[]>(`/competitions/${competitionId}/categories/`);
  },

  getStatistics: async (id: number): Promise<ApiResponse<CompetitionStatistics>> => {
    return apiClient.get<CompetitionStatistics>(`/competitions/${id}/statistics/`);
  },
};

// 👥 USUARIOS
const usersAPI = {
  getAll: async (params?: UserFilters): Promise<ApiResponse<PaginatedResponse<User>>> => {
    return apiClient.get<PaginatedResponse<User>>('/users/', params);
  },

  getById: async (id: number): Promise<ApiResponse<User>> => {
    return apiClient.get<User>(`/users/${id}/`);
  },

  update: async (id: number, userData: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.patch<User>(`/users/${id}/`, userData);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/users/${id}/`);
  },
};

// 🧮 CALIFICACIÓN
const scoringAPI = {
  getEvaluationParameters: async (categoryId: number): Promise<ApiResponse<EvaluationParameter[]>> => {
    return apiClient.get<EvaluationParameter[]>(`/scoring/categories/${categoryId}/parameters/`);
  },

  submitScore: async (scoreData: ScoreFormData): Promise<ApiResponse<ScoreEntry>> => {
    return apiClient.post<ScoreEntry>('/scoring/scores/', scoreData);
  },

  updateScore: async (scoreId: number, scoreData: Partial<ScoreFormData>): Promise<ApiResponse<ScoreEntry>> => {
    return apiClient.patch<ScoreEntry>(`/scoring/scores/${scoreId}/`, scoreData);
  },

  getScores: async (params?: ScoreFilters): Promise<ApiResponse<PaginatedResponse<ScoreEntry>>> => {
    return apiClient.get<PaginatedResponse<ScoreEntry>>('/scoring/scores/', params);
  },

  validateScore: async (scoreData: ScoreFormData): Promise<ApiResponse<ScoreValidation>> => {
    return apiClient.post<ScoreValidation>('/scoring/validate/', scoreData);
  },
};

// 🏅 RANKINGS
const rankingsAPI = {
  getByCompetition: async (competitionId: number, params?: RankingFilters): Promise<ApiResponse<RankingEntry[]>> => {
    return apiClient.get<RankingEntry[]>(`/rankings/competition/${competitionId}/`, params);
  },

  getByCategory: async (categoryId: number, params?: RankingFilters): Promise<ApiResponse<RankingEntry[]>> => {
    return apiClient.get<RankingEntry[]>(`/rankings/category/${categoryId}/`, params);
  },

  getLive: async (competitionId: number): Promise<ApiResponse<LiveRankingUpdate[]>> => {
    return apiClient.get<LiveRankingUpdate[]>(`/rankings/live/${competitionId}/`);
  },

  getStatistics: async (competitionId: number): Promise<ApiResponse<RankingStatistics>> => {
    return apiClient.get<RankingStatistics>(`/rankings/statistics/${competitionId}/`);
  },
};

// 📊 REPORTES
const reportsAPI = {
  generateCompetitionReport: async (competitionId: number): Promise<ApiResponse<Blob>> => {
    return apiClient.get(`/reports/competition/${competitionId}/pdf/`);
  },

  generateRankingReport: async (categoryId: number): Promise<ApiResponse<Blob>> => {
    return apiClient.get(`/reports/ranking/${categoryId}/pdf/`);
  },
};

// 🐎 CABALLOS
const horsesAPI = {
  getAll: async (params?: { search?: string; page?: number }): Promise<ApiResponse<PaginatedResponse<Horse>>> => {
    return apiClient.get<PaginatedResponse<Horse>>('/competitions/horses/', params);
  },

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

// 🤠 JINETES
const ridersAPI = {
  getAll: async (params?: { search?: string; page?: number }): Promise<ApiResponse<PaginatedResponse<Rider>>> => {
    return apiClient.get<PaginatedResponse<Rider>>('/competitions/riders/', params);
  },

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

// ===== EXPORTACIONES =====
export default apiClient;

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

// ===== SERVICIOS INDIVIDUALES (SIN DUPLICADOS) =====
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


export { apiClient };