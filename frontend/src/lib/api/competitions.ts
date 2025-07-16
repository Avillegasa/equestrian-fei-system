import { apiClient } from './client';
import type {
  Competition, CompetitionFormData, CompetitionFilters, CompetitionDashboard,
  CompetitionStatistics, PublicCompetition, PublicCompetitionDetail,
  Registration, RegistrationFormData, RegistrationFilters, BulkRegistrationUpdate,
  Category, Discipline, Horse, Rider, CompetitionCategory, JudgeAssignment,
  JudgeAssignmentFormData, StartNumberAssignment, ParticipantSearch,
  ParticipantSearchResults, PaginatedResponse, ApiResponse
} from '@/types/competitions';

// Disciplinas
export const disciplinesApi = {
  async getAll(): Promise<Discipline[]> {
    const response = await apiClient.get('/competitions/disciplines/');
    return response.data;
  },

  async getById(id: number): Promise<Discipline> {
    const response = await apiClient.get(`/competitions/disciplines/${id}/`);
    return response.data;
  },

  async create(data: Partial<Discipline>): Promise<Discipline> {
    const response = await apiClient.post('/competitions/disciplines/', data);
    return response.data;
  },

  async update(id: number, data: Partial<Discipline>): Promise<Discipline> {
    const response = await apiClient.patch(`/competitions/disciplines/${id}/`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/competitions/disciplines/${id}/`);
  }
};

// Categorías
export const categoriesApi = {
  async getAll(filters?: { discipline_id?: number; level?: string }): Promise<Category[]> {
    const params = new URLSearchParams();
    if (filters?.discipline_id) params.append('discipline_id', filters.discipline_id.toString());
    if (filters?.level) params.append('level', filters.level);
    
    const response = await apiClient.get(`/competitions/categories/?${params}`);
    return response.data;
  },

  async getById(id: number): Promise<Category> {
    const response = await apiClient.get(`/competitions/categories/${id}/`);
    return response.data;
  },

  async create(data: Partial<Category>): Promise<Category> {
    const response = await apiClient.post('/competitions/categories/', data);
    return response.data;
  },

  async update(id: number, data: Partial<Category>): Promise<Category> {
    const response = await apiClient.patch(`/competitions/categories/${id}/`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/competitions/categories/${id}/`);
  }
};

// Caballos
export const horsesApi = {
  async getAll(filters?: { owner?: string; country?: string }): Promise<Horse[]> {
    const params = new URLSearchParams();
    if (filters?.owner) params.append('owner', filters.owner);
    if (filters?.country) params.append('country', filters.country);
    
    const response = await apiClient.get(`/competitions/horses/?${params}`);
    return response.data;
  },

  async getById(id: number): Promise<Horse> {
    const response = await apiClient.get(`/competitions/horses/${id}/`);
    return response.data;
  },

  async create(data: Partial<Horse>): Promise<Horse> {
    const response = await apiClient.post('/competitions/horses/', data);
    return response.data;
  },

  async update(id: number, data: Partial<Horse>): Promise<Horse> {
    const response = await apiClient.patch(`/competitions/horses/${id}/`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/competitions/horses/${id}/`);
  },

  async getCompetitions(id: number): Promise<any[]> {
    const response = await apiClient.get(`/competitions/horses/${id}/competitions/`);
    return response.data;
  }
};

// Jinetes
export const ridersApi = {
  async getAll(filters?: { nationality?: string; license_type?: string }): Promise<Rider[]> {
    const params = new URLSearchParams();
    if (filters?.nationality) params.append('nationality', filters.nationality);
    if (filters?.license_type) params.append('license_type', filters.license_type);
    
    const response = await apiClient.get(`/competitions/riders/?${params}`);
    return response.data;
  },

  async getById(id: number): Promise<Rider> {
    const response = await apiClient.get(`/competitions/riders/${id}/`);
    return response.data;
  },

  async create(data: Partial<Rider>): Promise<Rider> {
    const response = await apiClient.post('/competitions/riders/', data);
    return response.data;
  },

  async update(id: number, data: Partial<Rider>): Promise<Rider> {
    const response = await apiClient.patch(`/competitions/riders/${id}/`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/competitions/riders/${id}/`);
  },

  async getCompetitions(id: number): Promise<any[]> {
    const response = await apiClient.get(`/competitions/riders/${id}/competitions/`);
    return response.data;
  }
};

// Competencias
export const competitionsApi = {
  async getAll(filters?: CompetitionFilters): Promise<Competition[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.organizer_id) params.append('organizer_id', filters.organizer_id.toString());
    if (filters?.start_date_from) params.append('start_date_from', filters.start_date_from);
    if (filters?.start_date_to) params.append('start_date_to', filters.start_date_to);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.upcoming) params.append('upcoming', 'true');
    
    const response = await apiClient.get(`/competitions/competitions/?${params}`);
    // ✅ CAMBIO: Extraer el array 'results' de la respuesta paginada
    return response.data.results || [];
  },

  async getById(id: string): Promise<Competition> {
    const response = await apiClient.get(`/competitions/competitions/${id}/`);
    return response.data;
  },

  async create(data: CompetitionFormData): Promise<Competition> {
    const response = await apiClient.post('/competitions/competitions/', data);
    return response.data;
  },

  async update(id: string, data: Partial<CompetitionFormData>): Promise<Competition> {
    const response = await apiClient.patch(`/competitions/competitions/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/competitions/competitions/${id}/`);
  },

  async changeStatus(id: string, status: string): Promise<ApiResponse<{ status: string; message: string }>> {
    const response = await apiClient.post(`/competitions/competitions/${id}/change_status/`, { status });
    return response.data;
  },

  async getStatistics(id: string): Promise<CompetitionStatistics> {
    const response = await apiClient.get(`/competitions/competitions/${id}/statistics/`);
    return response.data;
  },

  async getRegistrations(id: string, filters?: { category_id?: number; status?: string }): Promise<Registration[]> {
    const params = new URLSearchParams();
    if (filters?.category_id) params.append('category_id', filters.category_id.toString());
    if (filters?.status) params.append('status', filters.status);
    
    const response = await apiClient.get(`/competitions/competitions/${id}/registrations/?${params}`);
    return response.data;
  },

  async getDashboard(id: string): Promise<CompetitionDashboard> {
    const response = await apiClient.get(`/competitions/competition/${id}/dashboard/`);
    return response.data;
  }
};

// Categorías de Competencia
export const competitionCategoriesApi = {
  async getAll(competitionId?: string): Promise<CompetitionCategory[]> {
    const params = new URLSearchParams();
    if (competitionId) params.append('competition_id', competitionId);
    
    const response = await apiClient.get(`/competitions/competition-categories/?${params}`);
    return response.data;
  },

  async getById(id: number): Promise<CompetitionCategory> {
    const response = await apiClient.get(`/competitions/competition-categories/${id}/`);
    return response.data;
  },

  async create(data: Partial<CompetitionCategory>): Promise<CompetitionCategory> {
    const response = await apiClient.post('/competitions/competition-categories/', data);
    return response.data;
  },

  async update(id: number, data: Partial<CompetitionCategory>): Promise<CompetitionCategory> {
    const response = await apiClient.patch(`/competitions/competition-categories/${id}/`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/competitions/competition-categories/${id}/`);
  },

  async assignJudges(id: number, judges: JudgeAssignmentFormData[]): Promise<JudgeAssignment[]> {
    const response = await apiClient.post(`/competitions/competition-categories/${id}/assign_judges/`, { judges });
    return response.data;
  },

  async getJudges(id: number): Promise<JudgeAssignment[]> {
    const response = await apiClient.get(`/competitions/competition-categories/${id}/judges/`);
    return response.data;
  }
};

// Inscripciones
export const registrationsApi = {
  async getAll(filters?: RegistrationFilters): Promise<Registration[]> {
    const params = new URLSearchParams();
    if (filters?.competition_id) params.append('competition_id', filters.competition_id);
    if (filters?.rider_id) params.append('rider_id', filters.rider_id.toString());
    if (filters?.horse_id) params.append('horse_id', filters.horse_id.toString());
    if (filters?.status) params.append('status', filters.status);
    
    const response = await apiClient.get(`/competitions/registrations/?${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Registration> {
    const response = await apiClient.get(`/competitions/registrations/${id}/`);
    return response.data;
  },

  async create(data: RegistrationFormData): Promise<Registration> {
    const response = await apiClient.post('/competitions/registrations/', data);
    return response.data;
  },

  async update(id: string, data: Partial<Registration>): Promise<Registration> {
    const response = await apiClient.patch(`/competitions/registrations/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/competitions/registrations/${id}/`);
  },

  async confirm(id: string): Promise<ApiResponse<{ message: string; status: string }>> {
    const response = await apiClient.post(`/competitions/registrations/${id}/confirm/`);
    return response.data;
  },

  async markPaid(id: string, amount: number, paymentReference?: string): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/competitions/registrations/${id}/mark_paid/`, {
      amount,
      payment_reference: paymentReference
    });
    return response.data;
  },

  async bulkUpdate(data: BulkRegistrationUpdate): Promise<ApiResponse<{ message: string; updated_count: number }>> {
    const response = await apiClient.post('/competitions/registrations/bulk_update/', data);
    return response.data;
  },

  async assignStartNumbers(data: StartNumberAssignment): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/competitions/registrations/assign_start_numbers/', data);
    return response.data;
  },

  async quickRegistration(data: RegistrationFormData): Promise<ApiResponse<{ message: string; registration: Registration }>> {
    const response = await apiClient.post('/competitions/quick-registration/', data);
    return response.data;
  }
};

// APIs públicas
export const publicApi = {
  async getCompetitions(filters?: { upcoming?: boolean; search?: string }): Promise<PublicCompetition[]> {
    const params = new URLSearchParams();
    if (filters?.upcoming) params.append('upcoming', 'true');
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiClient.get(`/competitions/public/competitions/?${params}`);
    return response.data;
  },

  async getCompetitionDetail(id: string): Promise<PublicCompetitionDetail> {
    const response = await apiClient.get(`/competitions/public/competitions/${id}/`);
    return response.data;
  }
};

// Utilidades
export const utilsApi = {
  async searchParticipants(search: ParticipantSearch): Promise<ParticipantSearchResults> {
    const params = new URLSearchParams();
    params.append('q', search.q);
    params.append('type', search.type);
    
    const response = await apiClient.get(`/competitions/search/participants/?${params}`);
    return response.data;
  },

  async getJudgeCompetitions(): Promise<any[]> {
    const response = await apiClient.get('/competitions/judge/competitions/');
    return response.data;
  }
};

// Exportación por defecto con todas las APIs
const competitionsApi_default = {
  disciplines: disciplinesApi,
  categories: categoriesApi,
  horses: horsesApi,
  riders: ridersApi,
  competitions: competitionsApi,
  competitionCategories: competitionCategoriesApi,
  registrations: registrationsApi,
  public: publicApi,
  utils: utilsApi
};

export default competitionsApi_default;