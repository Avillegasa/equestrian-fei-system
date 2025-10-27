import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import participantService from '../services/participantService';

const useParticipantStore = create(
  devtools((set, get) => ({
    // Estado inicial
    applications: [],
    applicationsLoading: false,
    applicationsError: null,

    /**
     * Cargar todas las aplicaciones (para admin/organizer)
     */
    loadAllApplications: async () => {
      set({ applicationsLoading: true, applicationsError: null });
      try {
        const applications = await participantService.getAllApplications();
        set({ applications, applicationsLoading: false });
        console.log('✅ Aplicaciones cargadas:', applications.length);
      } catch (error) {
        console.error('❌ Error al cargar aplicaciones:', error);
        set({
          applicationsError: error.message,
          applicationsLoading: false
        });
      }
    },

    /**
     * Cargar aplicaciones del rider actual
     */
    loadMyApplications: async (riderId) => {
      set({ applicationsLoading: true, applicationsError: null });
      try {
        const applications = await participantService.getMyApplications(riderId);
        set({ applications, applicationsLoading: false });
        console.log('✅ Mis aplicaciones cargadas:', applications.length);
      } catch (error) {
        console.error('❌ Error al cargar mis aplicaciones:', error);
        set({
          applicationsError: error.message,
          applicationsLoading: false
        });
      }
    },

    /**
     * Cargar aplicaciones de una competencia específica
     */
    loadApplicationsByCompetition: async (competitionId) => {
      set({ applicationsLoading: true, applicationsError: null });
      try {
        const applications = await participantService.getApplicationsByCompetition(competitionId);
        set({ applications, applicationsLoading: false });
        console.log('✅ Aplicaciones de competencia cargadas:', applications.length);
      } catch (error) {
        console.error('❌ Error al cargar aplicaciones de competencia:', error);
        set({
          applicationsError: error.message,
          applicationsLoading: false
        });
      }
    },

    /**
     * Aplicar a una competencia
     */
    applyToCompetition: async (competitionId, riderData) => {
      set({ applicationsLoading: true, applicationsError: null });
      try {
        const newApplication = await participantService.applyToCompetition(competitionId, riderData);

        // Agregar la nueva aplicación al estado
        const { applications } = get();
        set({
          applications: [...applications, newApplication],
          applicationsLoading: false
        });

        console.log('✅ Aplicación creada:', newApplication);
        return { success: true, application: newApplication };
      } catch (error) {
        console.error('❌ Error al aplicar a competencia:', error);
        set({
          applicationsError: error.message,
          applicationsLoading: false
        });
        return { success: false, error: error.message };
      }
    },

    /**
     * Aprobar una aplicación
     */
    approveApplication: async (applicationId, reviewerName) => {
      try {
        const updatedApp = await participantService.approveApplication(applicationId, reviewerName);

        // Actualizar en el estado
        const { applications } = get();
        const updated = applications.map(app =>
          app.id === applicationId ? updatedApp : app
        );
        set({ applications: updated });

        console.log('✅ Aplicación aprobada:', updatedApp);
        return { success: true, application: updatedApp };
      } catch (error) {
        console.error('❌ Error al aprobar aplicación:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Rechazar una aplicación
     */
    rejectApplication: async (applicationId, reviewerName, reason) => {
      try {
        const updatedApp = await participantService.rejectApplication(applicationId, reviewerName, reason);

        // Actualizar en el estado
        const { applications } = get();
        const updated = applications.map(app =>
          app.id === applicationId ? updatedApp : app
        );
        set({ applications: updated });

        console.log('❌ Aplicación rechazada:', updatedApp);
        return { success: true, application: updatedApp };
      } catch (error) {
        console.error('❌ Error al rechazar aplicación:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Cancelar una aplicación
     */
    cancelApplication: async (applicationId) => {
      try {
        await participantService.cancelApplication(applicationId);

        // Remover del estado
        const { applications } = get();
        const filtered = applications.filter(app => app.id !== applicationId);
        set({ applications: filtered });

        console.log('🗑️ Aplicación cancelada');
        return { success: true };
      } catch (error) {
        console.error('❌ Error al cancelar aplicación:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Verificar si un rider ya aplicó a una competencia
     */
    hasAppliedToCompetition: (riderId, competitionId) => {
      const { applications } = get();
      return applications.some(app =>
        app.riderId === riderId && app.competitionId == competitionId
      );
    },

    /**
     * Obtener status de aplicación para una competencia
     */
    getApplicationStatus: (riderId, competitionId) => {
      const { applications } = get();
      const app = applications.find(app =>
        app.riderId === riderId && app.competitionId == competitionId
      );
      return app?.status || null;
    },

    /**
     * Limpiar errores
     */
    clearError: () => set({ applicationsError: null })
  }), {
    name: 'participant-store'
  })
);

export default useParticipantStore;
