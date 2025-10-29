import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class CompetitionService {
  constructor() {
    // Solo usar localStorage como fallback offline, NO como primario
    this.useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true' || false;
  }

  // ============================================================================
  // ELIMINADO: initLocalStorage() con 120+ líneas de datos hardcodeados
  //
  // Anteriormente este archivo tenía competencias, categorías y plantillas FEI
  // hardcodeadas que se cargaban automáticamente en localStorage.
  //
  // AHORA: El sistema usa SIEMPRE la API del backend como fuente principal.
  // localStorage solo se usa como fallback offline real.
  // ============================================================================

  async makeRequest(method, url, data = null) {
    // Solo usar localStorage si está explícitamente habilitado por variable de entorno
    // o como fallback cuando el backend no esté disponible
    if (this.useLocalStorage) {
      console.log('💾 Usando localStorage (configurado explícitamente)');
      return this.handleLocalStorageRequest(method, url, data);
    }

    // SIEMPRE intentar el backend primero
    try {
      console.log(`🌐 Llamando al backend: ${method} ${url}`);
      const response = await axios({ method, url, data });

      // Verificar si el backend retornó rutas en lugar de datos
      if (response.data && typeof response.data === 'object' && response.data.competitions) {
        console.warn('⚠️ Backend retornó rutas API en lugar de datos, usando localStorage como fallback');
        return this.handleLocalStorageRequest(method, url, data);
      }

      console.log('✅ Respuesta del backend recibida correctamente');
      return response.data;
    } catch (error) {
      // Fallback a localStorage SOLO si el backend falla (verdadero modo offline)
      console.warn('⚠️ Backend no disponible, usando localStorage como fallback offline:', error.message);
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
      case 'templates':
        return this.handleTemplatesRequest(method, id, data);
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

  handleTemplatesRequest(method, id, data) {
    const templates = JSON.parse(localStorage.getItem('fei_templates') || '[]');

    switch (method) {
      case 'get':
        if (id) {
          return templates.find(t => t.id == id) || null;
        }
        return { results: templates };

      case 'post':
        // Generar ID único para plantilla personalizada
        const maxId = templates.length > 0
          ? Math.max(...templates.filter(t => typeof t.id === 'number').map(t => t.id || 0))
          : 0;

        const newTemplate = {
          ...data,
          id: maxId + 1,
          type: 'custom',
          is_system: false,
          created_at: new Date().toISOString()
        };

        console.log('📝 Creando nueva plantilla:', newTemplate);
        templates.push(newTemplate);
        localStorage.setItem('fei_templates', JSON.stringify(templates));
        console.log('✅ Plantilla guardada en localStorage');
        return newTemplate;

      case 'put':
        const index = templates.findIndex(t => t.id == id);
        if (index !== -1) {
          // No permitir editar plantillas del sistema
          if (templates[index].is_system) {
            throw new Error('No se pueden editar plantillas del sistema');
          }

          const updatedTemplate = {
            ...templates[index],
            ...data,
            id: templates[index].id,
            type: 'custom',
            is_system: false,
            created_at: templates[index].created_at,
            updated_at: new Date().toISOString()
          };

          templates[index] = updatedTemplate;
          localStorage.setItem('fei_templates', JSON.stringify(templates));
          console.log('✅ Plantilla actualizada en localStorage');
          return updatedTemplate;
        }
        throw new Error('Plantilla no encontrada');

      case 'delete':
        const templateToDelete = templates.find(t => t.id == id);
        if (templateToDelete && templateToDelete.is_system) {
          throw new Error('No se pueden eliminar plantillas del sistema');
        }

        const filteredTemplates = templates.filter(t => t.id != id);
        localStorage.setItem('fei_templates', JSON.stringify(filteredTemplates));
        console.log('✅ Plantilla eliminada de localStorage');
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
    return this.makeRequest('get', `${API_BASE_URL}/competitions/categories/`);
  }

  async getCategoriesByType() {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/categories/by_type/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categorías por tipo:', error);
      throw error;
    }
  }

  async getCategoryById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/categories/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      throw error;
    }
  }

  async createCategory(categoryData) {
    return this.makeRequest('post', `${API_BASE_URL}/competitions/categories/`, categoryData);
  }

  async updateCategory(id, categoryData) {
    return this.makeRequest('put', `${API_BASE_URL}/competitions/categories/${id}`, categoryData);
  }

  async deleteCategory(id) {
    return this.makeRequest('delete', `${API_BASE_URL}/competitions/categories/${id}`);
  }

  // =============== PLANTILLAS DE CALIFICACIÓN ===============
  async getTemplates() {
    return this.makeRequest('get', `${API_BASE_URL}/templates/`);
  }

  async getTemplateById(id) {
    return this.makeRequest('get', `${API_BASE_URL}/templates/${id}/`);
  }

  async createTemplate(templateData) {
    return this.makeRequest('post', `${API_BASE_URL}/templates/`, templateData);
  }

  async updateTemplate(id, templateData) {
    return this.makeRequest('put', `${API_BASE_URL}/templates/${id}/`, templateData);
  }

  async deleteTemplate(id) {
    return this.makeRequest('delete', `${API_BASE_URL}/templates/${id}/`);
  }

  async getCompetitionTemplate(competitionId) {
    // Obtener la competencia para ver qué template tiene asignado
    const competition = await this.getCompetitionById(competitionId);
    if (competition && competition.scoring_template_id) {
      return this.getTemplateById(competition.scoring_template_id);
    }

    // Si no tiene template asignado, retornar template por defecto según disciplina
    const templates = await this.getTemplates();
    const allTemplates = templates.results || templates;

    if (competition.discipline === 'dressage') {
      return allTemplates.find(t => t.id === 'futuros_campeones_a');
    } else if (competition.discipline === 'jumping') {
      return allTemplates.find(t => t.id === 'show_jumping_standard');
    }

    // Retornar primera plantilla disponible
    return allTemplates[0] || null;
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
    return this.makeRequest('get', `${API_BASE_URL}/competitions/competitions/`);
  }

  async getCompetitionById(id) {
    return this.makeRequest('get', `${API_BASE_URL}/competitions/competitions/${id}/`);
  }

  async createCompetition(competitionData) {
    return this.makeRequest('post', `${API_BASE_URL}/competitions/competitions/`, competitionData);
  }

  async updateCompetition(id, competitionData) {
    console.log('🔧 updateCompetition llamado con ID:', id);
    console.log('🔧 URL:', `${API_BASE_URL}/competitions/competitions/${id}/`);
    console.log('🔧 Datos:', competitionData);
    return this.makeRequest('put', `${API_BASE_URL}/competitions/competitions/${id}/`, competitionData);
  }

  async deleteCompetition(id) {
    console.log('🔧 deleteCompetition llamado con ID:', id);
    console.log('🔧 URL:', `${API_BASE_URL}/competitions/competitions/${id}/`);
    const result = await this.makeRequest('delete', `${API_BASE_URL}/competitions/competitions/${id}/`);
    console.log('🔧 Resultado de makeRequest DELETE:', result);
    return result;
  }

  // =============== ACCIONES ESPECÍFICAS DE COMPETENCIAS ===============
  async publishCompetition(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/competitions/competitions/${id}/publish/`);
      return response.data;
    } catch (error) {
      console.error('Error publicando competencia:', error);
      throw error;
    }
  }

  async openRegistration(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/competitions/competitions/${id}/open_registration/`);
      return response.data;
    } catch (error) {
      console.error('Error abriendo inscripciones:', error);
      throw error;
    }
  }

  async closeRegistration(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/competitions/competitions/${id}/close_registration/`);
      return response.data;
    } catch (error) {
      console.error('Error cerrando inscripciones:', error);
      throw error;
    }
  }

  async getCompetitionParticipants(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/${id}/participants/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo participantes:', error);
      throw error;
    }
  }

  async getCompetitionStatistics(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/${id}/statistics/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // =============== COMPETENCIAS ESPECÍFICAS ===============
  async getMyCompetitions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/my_competitions/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo mis competencias:', error);
      throw error;
    }
  }

  async getUpcomingCompetitions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/upcoming/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo competencias próximas:', error);
      throw error;
    }
  }

  async getCurrentCompetitions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/current/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo competencias actuales:', error);
      throw error;
    }
  }

  async getMyAssignedCompetitions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/my_assigned/`);
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
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/`, {
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
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/`, {
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
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/`, {
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

  // Obtener competencias asignadas al juez actual
  async getMyAssignedCompetitions() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/my_assigned/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error loading assigned competitions from API:', error);

      // Fallback a localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const allCompetitions = JSON.parse(localStorage.getItem('fei_competitions') || '[]');

      // Filtrar competencias donde el usuario está asignado como juez
      const assignedCompetitions = allCompetitions.filter(comp => {
        const staffKey = `fei_staff_${comp.id}`;
        const staff = JSON.parse(localStorage.getItem(staffKey) || '[]');
        return staff.some(s => s.user?.id === user?.id && (s.role === 'judge' || s.role === 'chief_judge'));
      });

      // Enriquecer con datos de participantes y staff
      return assignedCompetitions.map(comp => {
        const staffKey = `fei_staff_${comp.id}`;
        const staff = JSON.parse(localStorage.getItem(staffKey) || '[]');
        const staffAssignment = staff.find(s => s.user?.id === user?.id);

        const participantsKey = `fei_participants_${comp.id}`;
        const participants = JSON.parse(localStorage.getItem(participantsKey) || '[]');

        return {
          ...comp,
          staff_assignment: staffAssignment,
          participants: participants,
          participant_count: participants.length
        };
      });
    }
  }

  // Obtener participantes de una competencia
  async getCompetitionParticipants(competitionId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/${competitionId}/participants/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error loading participants from API:', error);

      // Fallback a localStorage
      const participantsKey = `fei_participants_${competitionId}`;
      return JSON.parse(localStorage.getItem(participantsKey) || '[]');
    }
  }

  // Confirmar asignación de staff (juez acepta/rechaza asignación)
  async confirmStaffAssignment(staffId, confirmed = true) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/competition-staff/${staffId}/`,
        { is_confirmed: confirmed },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error confirming staff assignment:', error);

      // Fallback a localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const allCompetitions = JSON.parse(localStorage.getItem('fei_competitions') || '[]');

      // Buscar la competencia y actualizar el staff
      for (const comp of allCompetitions) {
        const staffKey = `fei_staff_${comp.id}`;
        const staff = JSON.parse(localStorage.getItem(staffKey) || '[]');

        const staffIndex = staff.findIndex(s => s.id === staffId || (s.user?.id === user?.id && s.role === 'judge'));

        if (staffIndex !== -1) {
          staff[staffIndex].is_confirmed = confirmed;
          localStorage.setItem(staffKey, JSON.stringify(staff));
          return staff[staffIndex];
        }
      }

      throw new Error('Staff assignment not found');
    }
  }

  // Obtener detalles completos de una competencia
  async getCompetitionById(competitionId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/competitions/competitions/${competitionId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error loading competition from API:', error);

      // Fallback a localStorage
      const allCompetitions = JSON.parse(localStorage.getItem('fei_competitions') || '[]');
      const competition = allCompetitions.find(c => c.id == competitionId);

      if (!competition) {
        throw new Error('Competition not found');
      }

      return competition;
    }
  }
}

// Crear instancia singleton
const competitionService = new CompetitionService();

export default competitionService;