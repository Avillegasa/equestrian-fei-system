import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import competitionService from '../services/competitionService';

const useCompetitionStore = create(
  devtools((set, get) => ({
    // =============== ESTADO INICIAL ===============
    competitions: [],
    currentCompetition: null,
    disciplines: [],
    categories: [],
    venues: [],
    horses: [],
    participants: [],
    
    // Estados de carga
    loading: false,
    disciplinesLoading: false,
    categoriesLoading: false,
    venuesLoading: false,
    horsesLoading: false,
    participantsLoading: false,
    
    // Estados de error
    error: null,
    validationErrors: {},

    // Filtros y búsqueda
    filters: {
      status: '',
      competition_type: '',
      organizer: '',
      search: ''
    },

    // =============== ACCIONES GENERALES ===============
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null, validationErrors: {} }),
    
    setFilters: (filters) => set(state => ({
      filters: { ...state.filters, ...filters }
    })),

    clearFilters: () => set({
      filters: {
        status: '',
        competition_type: '',
        organizer: '',
        search: ''
      }
    }),

    // =============== DISCIPLINAS ===============
    loadDisciplines: async () => {
      set({ disciplinesLoading: true, error: null });
      try {
        const data = await competitionService.getDisciplines();
        set({ 
          disciplines: data.results || data,
          disciplinesLoading: false 
        });
      } catch (error) {
        console.error('Error cargando disciplinas:', error);
        set({ 
          error: error.response?.data?.detail || 'Error cargando disciplinas',
          disciplinesLoading: false 
        });
      }
    },

    // =============== CATEGORÍAS ===============
    loadCategories: async () => {
      set({ categoriesLoading: true, error: null });
      try {
        const data = await competitionService.getCategories();

        // Asegurar que categories siempre sea un array
        let categoriesData = [];
        if (Array.isArray(data)) {
          categoriesData = data;
        } else if (data && Array.isArray(data.results)) {
          categoriesData = data.results;
        } else if (data && data.results) {
          categoriesData = [data.results];
        }

        set({
          categories: categoriesData,
          categoriesLoading: false
        });
      } catch (error) {
        console.error('Error cargando categorías:', error);
        set({
          error: error.response?.data?.detail || 'Error cargando categorías',
          categories: [], // Asegurar que sea array en caso de error
          categoriesLoading: false
        });
      }
    },

    loadCategoriesByType: async () => {
      set({ categoriesLoading: true, error: null });
      try {
        const data = await competitionService.getCategoriesByType();
        set({
          categories: data,
          categoriesLoading: false
        });
      } catch (error) {
        console.error('Error cargando categorías por tipo:', error);
        set({
          error: error.response?.data?.detail || 'Error cargando categorías',
          categoriesLoading: false
        });
      }
    },

    createCategory: async (categoryData) => {
      set({ categoriesLoading: true, error: null, validationErrors: {} });
      try {
        const newCategory = await competitionService.createCategory(categoryData);
        set(state => ({
          categories: [newCategory, ...state.categories],
          categoriesLoading: false
        }));
        return { success: true, data: newCategory };
      } catch (error) {
        console.error('Error creando categoría:', error);
        const errorData = error.response?.data || {};
        set({
          error: errorData.detail || errorData.message || 'Error creando categoría',
          validationErrors: errorData,
          categoriesLoading: false
        });
        return { success: false, error: errorData };
      }
    },

    updateCategory: async (id, categoryData) => {
      set({ categoriesLoading: true, error: null, validationErrors: {} });
      try {
        const updatedCategory = await competitionService.updateCategory(id, categoryData);
        set(state => ({
          categories: state.categories.map(cat =>
            cat.id === id ? updatedCategory : cat
          ),
          categoriesLoading: false
        }));
        return { success: true, data: updatedCategory };
      } catch (error) {
        console.error('Error actualizando categoría:', error);
        const errorData = error.response?.data || {};
        set({
          error: errorData.detail || 'Error actualizando categoría',
          validationErrors: errorData,
          categoriesLoading: false
        });
        return { success: false, error: errorData };
      }
    },

    deleteCategory: async (id) => {
      set({ categoriesLoading: true, error: null });
      try {
        await competitionService.deleteCategory(id);
        set(state => ({
          categories: state.categories.filter(cat => cat.id !== id),
          categoriesLoading: false
        }));
        return { success: true };
      } catch (error) {
        console.error('Error eliminando categoría:', error);
        set({
          error: error.response?.data?.detail || 'Error eliminando categoría',
          categoriesLoading: false
        });
        return { success: false, error: error.response?.data };
      }
    },

    // =============== SEDES ===============
    loadVenues: async () => {
      set({ venuesLoading: true, error: null });
      try {
        const data = await competitionService.getVenues();
        set({ 
          venues: data.results || data,
          venuesLoading: false 
        });
      } catch (error) {
        console.error('Error cargando sedes:', error);
        set({ 
          error: error.response?.data?.detail || 'Error cargando sedes',
          venuesLoading: false 
        });
      }
    },

    createVenue: async (venueData) => {
      set({ loading: true, error: null, validationErrors: {} });
      try {
        const newVenue = await competitionService.createVenue(venueData);
        set(state => ({
          venues: [...state.venues, newVenue],
          loading: false
        }));
        return { success: true, data: newVenue };
      } catch (error) {
        console.error('Error creando sede:', error);
        const errorData = error.response?.data || {};
        set({ 
          error: errorData.detail || 'Error creando sede',
          validationErrors: errorData,
          loading: false 
        });
        return { success: false, error: errorData };
      }
    },

    updateVenue: async (id, venueData) => {
      set({ loading: true, error: null, validationErrors: {} });
      try {
        const updatedVenue = await competitionService.updateVenue(id, venueData);
        set(state => ({
          venues: state.venues.map(venue => 
            venue.id === id ? updatedVenue : venue
          ),
          loading: false
        }));
        return { success: true, data: updatedVenue };
      } catch (error) {
        console.error('Error actualizando sede:', error);
        const errorData = error.response?.data || {};
        set({ 
          error: errorData.detail || 'Error actualizando sede',
          validationErrors: errorData,
          loading: false 
        });
        return { success: false, error: errorData };
      }
    },

    // =============== COMPETENCIAS ===============
    loadCompetitions: async (params = {}) => {
      set({ loading: true, error: null });
      try {
        const filters = get().filters;
        const mergedParams = { ...filters, ...params };

        // Filtrar parámetros vacíos
        const cleanParams = Object.fromEntries(
          Object.entries(mergedParams).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        );

        console.log('🔍 Cargando competencias desde servicio...');
        const data = await competitionService.getCompetitions(cleanParams);
        console.log('📦 Datos recibidos del servicio:', data);

        // Asegurar que competitions siempre sea un array
        let competitionsData = [];
        if (Array.isArray(data)) {
          competitionsData = data;
        } else if (data && Array.isArray(data.results)) {
          competitionsData = data.results;
        } else if (data && data.results) {
          competitionsData = [data.results];
        }

        console.log('✅ Competencias procesadas para store:', competitionsData.length, 'items');
        console.log('📋 Competencias:', competitionsData);

        set({
          competitions: competitionsData,
          loading: false
        });
      } catch (error) {
        console.error('Error cargando competencias:', error);
        set({
          error: error.response?.data?.detail || 'Error cargando competencias',
          competitions: [], // Asegurar que sea array en caso de error
          loading: false
        });
      }
    },

    loadCompetitionById: async (id) => {
      set({ loading: true, error: null });
      try {
        const competition = await competitionService.getCompetitionById(id);
        set({ 
          currentCompetition: competition,
          loading: false 
        });
        return competition;
      } catch (error) {
        console.error('Error cargando competencia:', error);
        set({ 
          error: error.response?.data?.detail || 'Error cargando competencia',
          loading: false 
        });
        return null;
      }
    },

    createCompetition: async (competitionData) => {
      set({ loading: true, error: null, validationErrors: {} });
      try {
        // Validar datos antes de enviar
        const validation = competitionService.validateCompetitionData(competitionData);
        if (!validation.isValid) {
          set({ 
            validationErrors: validation.errors,
            loading: false 
          });
          return { success: false, errors: validation.errors };
        }

        const newCompetition = await competitionService.createCompetition(competitionData);
        set(state => ({
          competitions: [newCompetition, ...state.competitions],
          currentCompetition: newCompetition,
          loading: false
        }));
        return { success: true, data: newCompetition };
      } catch (error) {
        console.error('Error creando competencia:', error);
        const errorData = error.response?.data || {};
        set({ 
          error: errorData.detail || errorData.message || 'Error creando competencia',
          validationErrors: errorData,
          loading: false 
        });
        return { success: false, error: errorData };
      }
    },

    updateCompetition: async (id, competitionData) => {
      set({ loading: true, error: null, validationErrors: {} });
      try {
        const updatedCompetition = await competitionService.updateCompetition(id, competitionData);
        set(state => ({
          competitions: state.competitions.map(comp => 
            comp.id === id ? updatedCompetition : comp
          ),
          currentCompetition: updatedCompetition,
          loading: false
        }));
        return { success: true, data: updatedCompetition };
      } catch (error) {
        console.error('Error actualizando competencia:', error);
        const errorData = error.response?.data || {};
        set({ 
          error: errorData.detail || 'Error actualizando competencia',
          validationErrors: errorData,
          loading: false 
        });
        return { success: false, error: errorData };
      }
    },

    deleteCompetition: async (id) => {
      set({ loading: true, error: null });
      try {
        await competitionService.deleteCompetition(id);
        set(state => ({
          competitions: state.competitions.filter(comp => comp.id !== id),
          currentCompetition: state.currentCompetition?.id === id ? null : state.currentCompetition,
          loading: false
        }));
        return { success: true };
      } catch (error) {
        console.error('Error eliminando competencia:', error);
        set({ 
          error: error.response?.data?.detail || 'Error eliminando competencia',
          loading: false 
        });
        return { success: false, error: error.response?.data };
      }
    },

    // =============== ACCIONES ESPECÍFICAS DE COMPETENCIAS ===============
    publishCompetition: async (id) => {
      set({ loading: true, error: null });
      try {
        const result = await competitionService.publishCompetition(id);
        
        // Actualizar el estado de la competencia
        set(state => ({
          competitions: state.competitions.map(comp => 
            comp.id === id ? { ...comp, status: 'published' } : comp
          ),
          currentCompetition: state.currentCompetition?.id === id 
            ? { ...state.currentCompetition, status: 'published' }
            : state.currentCompetition,
          loading: false
        }));
        
        return { success: true, message: result.message };
      } catch (error) {
        console.error('Error publicando competencia:', error);
        set({ 
          error: error.response?.data?.error || 'Error publicando competencia',
          loading: false 
        });
        return { success: false, error: error.response?.data };
      }
    },

    openRegistration: async (id) => {
      set({ loading: true, error: null });
      try {
        const result = await competitionService.openRegistration(id);
        
        set(state => ({
          competitions: state.competitions.map(comp => 
            comp.id === id ? { ...comp, status: 'open_registration' } : comp
          ),
          currentCompetition: state.currentCompetition?.id === id 
            ? { ...state.currentCompetition, status: 'open_registration' }
            : state.currentCompetition,
          loading: false
        }));
        
        return { success: true, message: result.message };
      } catch (error) {
        console.error('Error abriendo inscripciones:', error);
        set({ 
          error: error.response?.data?.error || 'Error abriendo inscripciones',
          loading: false 
        });
        return { success: false, error: error.response?.data };
      }
    },

    closeRegistration: async (id) => {
      set({ loading: true, error: null });
      try {
        const result = await competitionService.closeRegistration(id);
        
        set(state => ({
          competitions: state.competitions.map(comp => 
            comp.id === id ? { ...comp, status: 'registration_closed' } : comp
          ),
          currentCompetition: state.currentCompetition?.id === id 
            ? { ...state.currentCompetition, status: 'registration_closed' }
            : state.currentCompetition,
          loading: false
        }));
        
        return { success: true, message: result.message };
      } catch (error) {
        console.error('Error cerrando inscripciones:', error);
        set({ 
          error: error.response?.data?.error || 'Error cerrando inscripciones',
          loading: false 
        });
        return { success: false, error: error.response?.data };
      }
    },

    // =============== COMPETENCIAS ESPECÍFICAS ===============
    loadMyCompetitions: async () => {
      set({ loading: true, error: null });
      try {
        const data = await competitionService.getMyCompetitions();
        set({ 
          competitions: data,
          loading: false 
        });
      } catch (error) {
        console.error('Error cargando mis competencias:', error);
        set({ 
          error: error.response?.data?.detail || 'Error cargando mis competencias',
          loading: false 
        });
      }
    },

    loadMyAssignedCompetitions: async () => {
      set({ loading: true, error: null });
      try {
        const data = await competitionService.getMyAssignedCompetitions();
        set({
          competitions: Array.isArray(data) ? data : [],
          loading: false
        });
      } catch (error) {
        console.error('Error cargando competencias asignadas:', error);
        set({
          error: error.response?.data?.detail || 'Error cargando competencias asignadas',
          competitions: [],
          loading: false
        });
      }
    },

    loadUpcomingCompetitions: async () => {
      set({ loading: true, error: null });
      try {
        const data = await competitionService.getUpcomingCompetitions();
        set({
          competitions: data,
          loading: false
        });
      } catch (error) {
        console.error('Error cargando competencias próximas:', error);
        set({
          error: error.response?.data?.detail || 'Error cargando competencias próximas',
          loading: false 
        });
      }
    },

    loadCurrentCompetitions: async () => {
      set({ loading: true, error: null });
      try {
        const data = await competitionService.getCurrentCompetitions();
        set({ 
          competitions: data,
          loading: false 
        });
      } catch (error) {
        console.error('Error cargando competencias actuales:', error);
        set({ 
          error: error.response?.data?.detail || 'Error cargando competencias actuales',
          loading: false 
        });
      }
    },

    // =============== CABALLOS ===============
    loadHorses: async () => {
      set({ horsesLoading: true, error: null });
      try {
        const data = await competitionService.getHorses();
        set({ 
          horses: data.results || data,
          horsesLoading: false 
        });
      } catch (error) {
        console.error('Error cargando caballos:', error);
        set({ 
          error: error.response?.data?.detail || 'Error cargando caballos',
          horsesLoading: false 
        });
      }
    },

    loadMyHorses: async () => {
      set({ horsesLoading: true, error: null });
      try {
        const data = await competitionService.getMyHorses();
        set({ 
          horses: data,
          horsesLoading: false 
        });
      } catch (error) {
        console.error('Error cargando mis caballos:', error);
        set({ 
          error: error.response?.data?.detail || 'Error cargando mis caballos',
          horsesLoading: false 
        });
      }
    },

    createHorse: async (horseData) => {
      set({ loading: true, error: null, validationErrors: {} });
      try {
        // Validar datos antes de enviar
        const validation = competitionService.validateHorseData(horseData);
        if (!validation.isValid) {
          set({ 
            validationErrors: validation.errors,
            loading: false 
          });
          return { success: false, errors: validation.errors };
        }

        const newHorse = await competitionService.createHorse(horseData);
        set(state => ({
          horses: [...state.horses, newHorse],
          loading: false
        }));
        return { success: true, data: newHorse };
      } catch (error) {
        console.error('Error creando caballo:', error);
        const errorData = error.response?.data || {};
        set({ 
          error: errorData.detail || 'Error creando caballo',
          validationErrors: errorData,
          loading: false 
        });
        return { success: false, error: errorData };
      }
    },

    updateHorse: async (id, horseData) => {
      set({ loading: true, error: null, validationErrors: {} });
      try {
        const updatedHorse = await competitionService.updateHorse(id, horseData);
        set(state => ({
          horses: state.horses.map(horse => 
            horse.id === id ? updatedHorse : horse
          ),
          loading: false
        }));
        return { success: true, data: updatedHorse };
      } catch (error) {
        console.error('Error actualizando caballo:', error);
        const errorData = error.response?.data || {};
        set({ 
          error: errorData.detail || 'Error actualizando caballo',
          validationErrors: errorData,
          loading: false 
        });
        return { success: false, error: errorData };
      }
    },

    // =============== PARTICIPANTES ===============
    loadParticipants: async (params = {}) => {
      set({ participantsLoading: true, error: null });
      try {
        const data = await competitionService.getParticipants(params);
        set({ 
          participants: data.results || data,
          participantsLoading: false 
        });
      } catch (error) {
        console.error('Error cargando participantes:', error);
        set({ 
          error: error.response?.data?.detail || 'Error cargando participantes',
          participantsLoading: false 
        });
      }
    },

    registerParticipant: async (participantData) => {
      set({ loading: true, error: null, validationErrors: {} });
      try {
        const newParticipant = await competitionService.registerParticipant(participantData);
        set(state => ({
          participants: [...state.participants, newParticipant],
          loading: false
        }));
        return { success: true, data: newParticipant };
      } catch (error) {
        console.error('Error registrando participante:', error);
        const errorData = error.response?.data || {};
        set({ 
          error: errorData.detail || errorData.message || 'Error registrando participante',
          validationErrors: errorData,
          loading: false 
        });
        return { success: false, error: errorData };
      }
    },

    confirmParticipant: async (id) => {
      set({ loading: true, error: null });
      try {
        const result = await competitionService.confirmParticipant(id);
        set(state => ({
          participants: state.participants.map(participant => 
            participant.id === id ? { ...participant, is_confirmed: true } : participant
          ),
          loading: false
        }));
        return { success: true, message: result.message };
      } catch (error) {
        console.error('Error confirmando participante:', error);
        set({ 
          error: error.response?.data?.detail || 'Error confirmando participante',
          loading: false 
        });
        return { success: false, error: error.response?.data };
      }
    },

    // =============== UTILIDADES ===============
    searchCompetitions: async (query) => {
      if (!query.trim()) {
        get().loadCompetitions();
        return;
      }

      set({ loading: true, error: null });
      try {
        const data = await competitionService.searchCompetitions(query);
        set({ 
          competitions: data.results || data,
          loading: false 
        });
      } catch (error) {
        console.error('Error buscando competencias:', error);
        set({ 
          error: error.response?.data?.detail || 'Error en la búsqueda',
          loading: false 
        });
      }
    },

    // =============== MÉTODOS DE RESET ===============
    resetCurrentCompetition: () => set({ currentCompetition: null }),
    resetCompetitions: () => set({ competitions: [] }),
    resetHorses: () => set({ horses: [] }),
    resetParticipants: () => set({ participants: [] }),
    
    resetAll: () => set({
      competitions: [],
      currentCompetition: null,
      disciplines: [],
      categories: [],
      venues: [],
      horses: [],
      participants: [],
      loading: false,
      disciplinesLoading: false,
      categoriesLoading: false,
      venuesLoading: false,
      horsesLoading: false,
      participantsLoading: false,
      error: null,
      validationErrors: {},
      filters: {
        status: '',
        competition_type: '',
        organizer: '',
        search: ''
      }
    })
  }), {
    name: 'competition-store'
  })
);

export default useCompetitionStore;