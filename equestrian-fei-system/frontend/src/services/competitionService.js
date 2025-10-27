import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class CompetitionService {
  constructor() {
    this.useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true' || false;
    this.initLocalStorage();
  }

  initLocalStorage() {
    if (!localStorage.getItem('fei_competitions')) {
      localStorage.setItem('fei_competitions', JSON.stringify([
        {
          id: 1,
          name: 'FEI Dressage Madrid 2024',
          short_name: 'FDM2024',
          description: 'Competencia oficial de dressage',
          competition_type: 'international',
          start_date: '2025-10-03T09:00:00',
          end_date: '2025-10-06T18:00:00',
          registration_start: '2024-12-01T00:00:00',
          registration_end: '2025-09-25T23:59:59',
          discipline: 'dressage',
          venue_name: 'Club Hípico Madrid',
          venue_city: 'Madrid',
          venue_country: 'España',
          max_participants: 50,
          entry_fee: 150.00,
          status: 'open_registration',
          participants: 0,
          created_at: '2024-11-01T10:00:00Z'
        }
      ]));
    }

    // Mensaje de debug para verificar inicialización
    const comps = JSON.parse(localStorage.getItem('fei_competitions') || '[]');
    console.log('🔧 localStorage inicializado con', comps.length, 'competencias');

    if (!localStorage.getItem('fei_categories')) {
      localStorage.setItem('fei_categories', JSON.stringify([
        {
          id: 1,
          name: 'Juvenil 1.20m',
          code: 'JUV120',
          category_type: 'height',
          level: 'intermediate',
          min_height_cm: 115,
          max_height_cm: 125,
          max_participants: 50,
          entry_fee: 75.00,
          is_active: true
        },
        {
          id: 2,
          name: 'Senior 1.40m',
          code: 'SEN140',
          category_type: 'height',
          level: 'advanced',
          min_height_cm: 135,
          max_height_cm: 145,
          max_participants: 40,
          entry_fee: 150.00,
          is_active: true
        }
      ]));
    }
  }

  async makeRequest(method, url, data = null) {
    // SIEMPRE usar localStorage en desarrollo para evitar conflictos con backend incompleto
    const isDevelopment = import.meta.env.MODE === 'development' ||
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';

    if (this.useLocalStorage || isDevelopment) {
      console.log('💾 Usando localStorage (modo desarrollo)');
      return this.handleLocalStorageRequest(method, url, data);
    }

    try {
      const response = await axios({ method, url, data });

      // Verificar si el backend retornó rutas en lugar de datos
      if (response.data && typeof response.data === 'object' && response.data.competitions) {
        console.warn('⚠️ Backend retornó rutas API, usando localStorage en su lugar');
        return this.handleLocalStorageRequest(method, url, data);
      }

      return response.data;
    } catch (error) {
      // Fallback a localStorage si el backend falla
      console.warn('Backend no disponible, usando localStorage:', error.message);
      return this.handleLocalStorageRequest(method, url, data);
    }
  }

  handleLocalStorageRequest(method, url, data) {
    const urlParts = url.replace(API_BASE_URL, '').split('/').filter(p => p);
    const resource = urlParts[0];
    const id = urlParts[1];

    switch (resource) {
      case 'competitions':
        return this.handleCompetitionsRequest(method, id, data);
      case 'categories':
        return this.handleCategoriesRequest(method, id, data);
      default:
        return { results: [], message: 'Recurso no encontrado en localStorage' };
    }
  }

  // Normalizar datos de competencia para compatibilidad con frontend
  normalizeCompetitionData(competition) {
    if (!competition) return null;

    return {
      ...competition,
      // Añadir campos derivados para compatibilidad con CompetitionsPage
      location: competition.location || `${competition.venue_city}, ${competition.venue_country}`,
      organizer: competition.organizer || competition.venue_name || 'N/A',
      participants: competition.participants || 0,
      maxParticipants: competition.max_participants || competition.maxParticipants || 0,
      startDate: competition.start_date ? new Date(competition.start_date).toLocaleDateString() : 'N/A',
      endDate: competition.end_date ? new Date(competition.end_date).toLocaleDateString() : 'N/A',
      // Mantener los campos originales también
      start_date: competition.start_date,
      end_date: competition.end_date,
    };
  }

  handleCompetitionsRequest(method, id, data) {
    const competitions = JSON.parse(localStorage.getItem('fei_competitions') || '[]');

    switch (method) {
      case 'get':
        if (id) {
          const comp = competitions.find(c => c.id == id) || null;
          return this.normalizeCompetitionData(comp);
        }
        // Normalizar todas las competencias
        console.log('📂 Competencias en localStorage (raw):', competitions.length);
        const normalizedCompetitions = competitions.map(c => this.normalizeCompetitionData(c));
        console.log('🔄 Competencias normalizadas:', normalizedCompetitions.length);
        console.log('📋 Datos normalizados:', normalizedCompetitions);
        return { results: normalizedCompetitions };

      case 'post':
        // Generar ID seguro incluso con array vacío
        const maxId = competitions.length > 0
          ? Math.max(...competitions.map(c => c.id || 0))
          : 0;

        const newCompetition = {
          ...data,
          id: maxId + 1,
          created_at: new Date().toISOString(),
          status: 'open_registration', // Cambiado de 'draft' a 'open_registration'
          participants: 0, // Inicializar contadores
        };

        console.log('📝 Creando nueva competencia:', newCompetition);
        competitions.push(newCompetition);
        localStorage.setItem('fei_competitions', JSON.stringify(competitions));
        console.log('✅ Competencia guardada en localStorage');
        console.log('📊 Total competencias en localStorage:', competitions.length);
        return this.normalizeCompetitionData(newCompetition);

      case 'put':
        const index = competitions.findIndex(c => c.id == id);
        if (index !== -1) {
          // Mantener datos originales importantes y actualizar con nuevos datos
          const updatedCompetition = {
            ...competitions[index],
            ...data,
            id: competitions[index].id, // Asegurar que el ID no cambie
            created_at: competitions[index].created_at, // Mantener fecha de creación
            // Normalizar campos para compatibilidad
            shortName: data.short_name || data.shortName || competitions[index].shortName,
            competitionType: data.competition_type || data.competitionType || competitions[index].competitionType,
            startDate: data.start_date || data.startDate || competitions[index].startDate,
            endDate: data.end_date || data.endDate || competitions[index].endDate,
            registrationStart: data.registration_start || data.registrationStart || competitions[index].registrationStart,
            registrationEnd: data.registration_end || data.registrationEnd || competitions[index].registrationEnd,
            venueName: data.venue_name || data.venueName || competitions[index].venueName,
            venueCity: data.venue_city || data.venueCity || competitions[index].venueCity,
            venueCountry: data.venue_country || data.venueCountry || competitions[index].venueCountry,
            maxParticipants: data.max_participants || data.maxParticipants || competitions[index].maxParticipants,
            entryFee: data.entry_fee || data.entryFee || competitions[index].entryFee,
            // Actualizar location basado en la nueva ciudad/país
            location: `${data.venue_city || data.venueCity || competitions[index].venueCity}, ${data.venue_country || data.venueCountry || competitions[index].venueCountry}`
          };

          competitions[index] = updatedCompetition;
          localStorage.setItem('fei_competitions', JSON.stringify(competitions));
          console.log('✅ Competencia actualizada en localStorage:', updatedCompetition);
          return this.normalizeCompetitionData(updatedCompetition);
        }
        throw new Error('Competencia no encontrada');

      case 'delete':
        console.log('🗑️ DELETE case - ID a eliminar:', id);
        console.log('🗑️ Competencias antes de filtrar:', competitions.length);
        const filteredCompetitions = competitions.filter(c => {
          console.log(`🔍 Comparando: c.id (${c.id}, tipo: ${typeof c.id}) != id (${id}, tipo: ${typeof id})`);
          return c.id != id;
        });
        console.log('🗑️ Competencias después de filtrar:', filteredCompetitions.length);
        localStorage.setItem('fei_competitions', JSON.stringify(filteredCompetitions));
        console.log('✅ Competencia eliminada de localStorage');
        return { success: true };

      default:
        throw new Error('Método no soportado');
    }
  }

  handleCategoriesRequest(method, id, data) {
    const categories = JSON.parse(localStorage.getItem('fei_categories') || '[]');

    switch (method) {
      case 'get':
        if (id) {
          return categories.find(c => c.id == id) || null;
        }
        return { results: categories };

      case 'post':
        const newCategory = {
          ...data,
          id: Math.max(...categories.map(c => c.id), 0) + 1,
          is_active: true,
          // Convertir valores numéricos
          entry_fee: parseFloat(data.entry_fee || 0),
          max_participants: parseInt(data.max_participants || 0),
          min_age: data.min_age ? parseInt(data.min_age) : null,
          max_age: data.max_age ? parseInt(data.max_age) : null,
          min_height_cm: data.min_height_cm ? parseInt(data.min_height_cm) : null,
          max_height_cm: data.max_height_cm ? parseInt(data.max_height_cm) : null
        };
        console.log('📝 Creando nueva categoría:', newCategory);
        categories.push(newCategory);
        localStorage.setItem('fei_categories', JSON.stringify(categories));
        console.log('✅ Categoría guardada en localStorage');
        return newCategory;

      case 'put':
        const index = categories.findIndex(c => c.id == id);
        if (index !== -1) {
          const updatedCategory = {
            ...categories[index],
            ...data,
            // Convertir valores numéricos
            entry_fee: parseFloat(data.entry_fee || categories[index].entry_fee || 0),
            max_participants: parseInt(data.max_participants || categories[index].max_participants || 0),
            min_age: data.min_age ? parseInt(data.min_age) : categories[index].min_age,
            max_age: data.max_age ? parseInt(data.max_age) : categories[index].max_age,
            min_height_cm: data.min_height_cm ? parseInt(data.min_height_cm) : categories[index].min_height_cm,
            max_height_cm: data.max_height_cm ? parseInt(data.max_height_cm) : categories[index].max_height_cm
          };
          categories[index] = updatedCategory;
          localStorage.setItem('fei_categories', JSON.stringify(categories));
          console.log('✅ Categoría actualizada en localStorage');
          return updatedCategory;
        }
        throw new Error('Categoría no encontrada');

      case 'delete':
        const filteredCategories = categories.filter(c => c.id != id);
        localStorage.setItem('fei_categories', JSON.stringify(filteredCategories));
        return { success: true };

      default:
        throw new Error('Método no soportado');
    }
  }
  // =============== DISCIPLINAS ===============
  async getDisciplines() {
    return this.makeRequest('get', `${API_BASE_URL}/disciplines/`);
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
    return this.makeRequest('get', `${API_BASE_URL}/categories/`);
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

  async createCategory(categoryData) {
    return this.makeRequest('post', `${API_BASE_URL}/categories/`, categoryData);
  }

  async updateCategory(id, categoryData) {
    return this.makeRequest('put', `${API_BASE_URL}/categories/${id}`, categoryData);
  }

  async deleteCategory(id) {
    return this.makeRequest('delete', `${API_BASE_URL}/categories/${id}`);
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
    return this.makeRequest('get', `${API_BASE_URL}/competitions/`);
  }

  async getCompetitionById(id) {
    return this.makeRequest('get', `${API_BASE_URL}/competitions/${id}/`);
  }

  async createCompetition(competitionData) {
    return this.makeRequest('post', `${API_BASE_URL}/competitions/`, competitionData);
  }

  async updateCompetition(id, competitionData) {
    console.log('🔧 updateCompetition llamado con ID:', id);
    console.log('🔧 URL:', `${API_BASE_URL}/competitions/${id}/`);
    console.log('🔧 Datos:', competitionData);
    return this.makeRequest('put', `${API_BASE_URL}/competitions/${id}/`, competitionData);
  }

  async deleteCompetition(id) {
    console.log('🔧 deleteCompetition llamado con ID:', id);
    console.log('🔧 URL:', `${API_BASE_URL}/competitions/${id}/`);
    const result = await this.makeRequest('delete', `${API_BASE_URL}/competitions/${id}/`);
    console.log('🔧 Resultado de makeRequest DELETE:', result);
    return result;
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

  async getMyAssignedCompetitions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/my_assigned/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo competencias asignadas:', error);
      // Si el endpoint no está disponible, retornar array vacío
      if (error.response && error.response.status === 404) {
        console.warn('Endpoint my_assigned no disponible');
        return [];
      }
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
      console.warn('Backend no disponible, usando localStorage para participantes');

      // Si hay un parámetro de competencia, cargar participantes de esa competencia
      if (params.competition) {
        const participantsKey = `fei_participants_${params.competition}`;
        const participants = JSON.parse(localStorage.getItem(participantsKey) || '[]');
        console.log(`📂 Participantes en localStorage para competencia ${params.competition}:`, participants.length);
        return { results: participants };
      }

      // Si no hay filtro de competencia, retornar array vacío
      return { results: [] };
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
      console.warn('Backend no disponible, usando localStorage para participantes');

      const competitionId = participantData.competition;
      const participantsKey = `fei_participants_${competitionId}`;
      const participants = JSON.parse(localStorage.getItem(participantsKey) || '[]');

      const maxId = participants.length > 0 ? Math.max(...participants.map(p => p.id || 0)) : 0;

      const newParticipant = {
        ...participantData,
        id: maxId + 1,
        registration_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      participants.push(newParticipant);
      localStorage.setItem(participantsKey, JSON.stringify(participants));

      console.log('✅ Participante guardado en localStorage:', newParticipant);
      return newParticipant;
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
      console.warn('Backend no disponible, usando localStorage para eliminar participante');

      // Buscar el participante en todas las competencias almacenadas
      const allKeys = Object.keys(localStorage);
      const participantKeys = allKeys.filter(key => key.startsWith('fei_participants_'));

      for (const key of participantKeys) {
        const participants = JSON.parse(localStorage.getItem(key) || '[]');
        const participantIndex = participants.findIndex(p => p.id == id);

        if (participantIndex !== -1) {
          participants.splice(participantIndex, 1);
          localStorage.setItem(key, JSON.stringify(participants));
          console.log(`✅ Participante ${id} eliminado de ${key}`);
          return { success: true };
        }
      }

      throw new Error('Participante no encontrado');
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

    // Validar sede - acepta venue_id O venue_name
    if (!data.venue_id && !data.venue_name) {
      errors.venue = 'La sede es requerida';
    }

    // Validar disciplina - acepta discipline_ids O discipline
    if (!data.discipline_ids && !data.discipline) {
      errors.discipline = 'La disciplina es requerida';
    }

    // Las categorías son opcionales en localStorage, requeridas solo para backend
    // if (!data.category_ids || data.category_ids.length === 0) {
    //   errors.category_ids = 'Debe seleccionar al menos una categoría';
    // }

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