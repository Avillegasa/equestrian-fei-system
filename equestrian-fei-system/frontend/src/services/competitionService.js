import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class CompetitionService {
  // =============== DISCIPLINAS ===============
  async getDisciplines() {
    try {
      const response = await axios.get(`${API_BASE_URL}/disciplines/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo disciplinas:', error);
      throw error;
    }
  }

  async getDisciplineById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/disciplines/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo disciplina:', error);
      throw error;
    }
  }

  // =============== CATEGORÍAS ===============
  async getCategories() {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }

  async getCategoriesByType() {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories/by_type/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categorías por tipo:', error);
      throw error;
    }
  }

  async getCategoryById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      throw error;
    }
  }

  // =============== SEDES ===============
  async getVenues() {
    try {
      const response = await axios.get(`${API_BASE_URL}/venues/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo sedes:', error);
      throw error;
    }
  }

  async getVenuesByCountry() {
    try {
      const response = await axios.get(`${API_BASE_URL}/venues/by_country/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo sedes por país:', error);
      throw error;
    }
  }

  async getVenueById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/venues/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo sede:', error);
      throw error;
    }
  }

  async createVenue(venueData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/venues/`, venueData);
      return response.data;
    } catch (error) {
      console.error('Error creando sede:', error);
      throw error;
    }
  }

  async updateVenue(id, venueData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/venues/${id}/`, venueData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando sede:', error);
      throw error;
    }
  }

  // =============== COMPETENCIAS ===============
  async getCompetitions(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo competencias:', error);
      throw error;
    }
  }

  async getCompetitionById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo competencia:', error);
      throw error;
    }
  }

  async createCompetition(competitionData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/competitions/`, competitionData);
      return response.data;
    } catch (error) {
      console.error('Error creando competencia:', error);
      throw error;
    }
  }

  async updateCompetition(id, competitionData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/competitions/${id}/`, competitionData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando competencia:', error);
      throw error;
    }
  }

  async deleteCompetition(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/competitions/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando competencia:', error);
      throw error;
    }
  }

  // =============== ACCIONES ESPECÍFICAS DE COMPETENCIAS ===============
  async publishCompetition(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/competitions/${id}/publish/`);
      return response.data;
    } catch (error) {
      console.error('Error publicando competencia:', error);
      throw error;
    }
  }

  async openRegistration(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/competitions/${id}/open_registration/`);
      return response.data;
    } catch (error) {
      console.error('Error abriendo inscripciones:', error);
      throw error;
    }
  }

  async closeRegistration(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/competitions/${id}/close_registration/`);
      return response.data;
    } catch (error) {
      console.error('Error cerrando inscripciones:', error);
      throw error;
    }
  }

  async getCompetitionParticipants(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/${id}/participants/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo participantes:', error);
      throw error;
    }
  }

  async getCompetitionStatistics(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/${id}/statistics/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // =============== COMPETENCIAS ESPECÍFICAS ===============
  async getMyCompetitions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/my_competitions/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo mis competencias:', error);
      throw error;
    }
  }

  async getUpcomingCompetitions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/upcoming/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo competencias próximas:', error);
      throw error;
    }
  }

  async getCurrentCompetitions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/current/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo competencias actuales:', error);
      throw error;
    }
  }

  // =============== CABALLOS ===============
  async getHorses() {
    try {
      const response = await axios.get(`${API_BASE_URL}/horses/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo caballos:', error);
      throw error;
    }
  }

  async getMyHorses() {
    try {
      const response = await axios.get(`${API_BASE_URL}/horses/my_horses/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo mis caballos:', error);
      throw error;
    }
  }

  async getAvailableHorses() {
    try {
      const response = await axios.get(`${API_BASE_URL}/horses/available/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo caballos disponibles:', error);
      throw error;
    }
  }

  async getHorseById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/horses/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo caballo:', error);
      throw error;
    }
  }

  async createHorse(horseData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/horses/`, horseData);
      return response.data;
    } catch (error) {
      console.error('Error creando caballo:', error);
      throw error;
    }
  }

  async updateHorse(id, horseData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/horses/${id}/`, horseData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando caballo:', error);
      throw error;
    }
  }

  async deleteHorse(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/horses/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando caballo:', error);
      throw error;
    }
  }

  // =============== PARTICIPANTES ===============
  async getParticipants(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/participants/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo participantes:', error);
      throw error;
    }
  }

  async getParticipantById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/participants/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo participante:', error);
      throw error;
    }
  }

  async registerParticipant(participantData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/participants/`, participantData);
      return response.data;
    } catch (error) {
      console.error('Error registrando participante:', error);
      throw error;
    }
  }

  async updateParticipant(id, participantData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/participants/${id}/`, participantData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando participante:', error);
      throw error;
    }
  }

  async deleteParticipant(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/participants/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando participante:', error);
      throw error;
    }
  }

  async confirmParticipant(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/participants/${id}/confirm/`);
      return response.data;
    } catch (error) {
      console.error('Error confirmando participante:', error);
      throw error;
    }
  }

  async markParticipantPaid(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/participants/${id}/mark_paid/`);
      return response.data;
    } catch (error) {
      console.error('Error marcando participante como pagado:', error);
      throw error;
    }
  }

  // =============== UTILIDADES ===============
  async searchCompetitions(query) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/`, {
        params: { search: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error buscando competencias:', error);
      throw error;
    }
  }

  async getCompetitionsByStatus(status) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/`, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo competencias por estado:', error);
      throw error;
    }
  }

  async getCompetitionsByType(type) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/`, {
        params: { competition_type: type }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo competencias por tipo:', error);
      throw error;
    }
  }

  // =============== VALIDACIONES ===============
  validateCompetitionData(data) {
    const errors = {};

    if (!data.name || !data.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!data.venue_id) {
      errors.venue_id = 'La sede es requerida';
    }

    if (!data.discipline_ids || data.discipline_ids.length === 0) {
      errors.discipline_ids = 'Debe seleccionar al menos una disciplina';
    }

    if (!data.category_ids || data.category_ids.length === 0) {
      errors.category_ids = 'Debe seleccionar al menos una categoría';
    }

    if (!data.start_date) {
      errors.start_date = 'La fecha de inicio es requerida';
    }

    if (!data.end_date) {
      errors.end_date = 'La fecha de fin es requerida';
    }

    if (data.start_date && data.end_date) {
      if (new Date(data.start_date) >= new Date(data.end_date)) {
        errors.end_date = 'La fecha de fin debe ser posterior a la de inicio';
      }
    }

    if (!data.registration_start) {
      errors.registration_start = 'La fecha de inicio de inscripción es requerida';
    }

    if (!data.registration_end) {
      errors.registration_end = 'La fecha de fin de inscripción es requerida';
    }

    if (data.registration_start && data.registration_end) {
      if (new Date(data.registration_start) >= new Date(data.registration_end)) {
        errors.registration_end = 'La fecha de fin de inscripción debe ser posterior a la de inicio';
      }
    }

    if (data.registration_end && data.start_date) {
      if (new Date(data.registration_end) > new Date(data.start_date)) {
        errors.registration_end = 'La inscripción debe cerrar antes del inicio de la competencia';
      }
    }

    if (!data.competition_type) {
      errors.competition_type = 'El tipo de competencia es requerido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  validateHorseData(data) {
    const errors = {};

    if (!data.name || !data.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!data.registration_number || !data.registration_number.trim()) {
      errors.registration_number = 'El número de registro es requerido';
    }

    if (!data.breed || !data.breed.trim()) {
      errors.breed = 'La raza es requerida';
    }

    if (!data.color || !data.color.trim()) {
      errors.color = 'El color es requerido';
    }

    if (!data.gender) {
      errors.gender = 'El sexo es requerido';
    }

    if (!data.birth_date) {
      errors.birth_date = 'La fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(data.birth_date);
      const today = new Date();
      if (birthDate > today) {
        errors.birth_date = 'La fecha de nacimiento no puede ser futura';
      }
    }

    if (!data.height || data.height <= 0) {
      errors.height = 'La altura debe ser un número positivo';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Crear instancia singleton
const competitionService = new CompetitionService();

export default competitionService;