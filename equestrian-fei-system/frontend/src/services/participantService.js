import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ParticipantService {
  constructor() {
    this.useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true' || false;
    this.initLocalStorage();
  }

  initLocalStorage() {
    // Inicializar applications (inscripciones de riders)
    if (!localStorage.getItem('fei_applications')) {
      localStorage.setItem('fei_applications', JSON.stringify([]));
    }

    console.log('🔧 participantService localStorage inicializado');
  }

  /**
   * Generar ID único para aplicaciones
   */
  generateId() {
    return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Normalizar datos de snake_case a camelCase
   */
  normalizeApplication(app) {
    return {
      id: app.id,
      competitionId: app.competition_id || app.competitionId,
      competitionName: app.competition_name || app.competitionName,
      riderId: app.rider_id || app.riderId,
      riderName: app.rider_name || app.riderName,
      riderEmail: app.rider_email || app.riderEmail,
      status: app.status || 'pending',
      appliedAt: app.applied_at || app.appliedAt,
      reviewedBy: app.reviewed_by || app.reviewedBy,
      reviewedAt: app.reviewed_at || app.reviewedAt,
      rejectionReason: app.rejection_reason || app.rejectionReason
    };
  }

  /**
   * Convertir datos de camelCase a snake_case
   */
  denormalizeApplication(app) {
    return {
      id: app.id,
      competition_id: app.competitionId,
      competition_name: app.competitionName,
      rider_id: app.riderId,
      rider_name: app.riderName,
      rider_email: app.riderEmail,
      status: app.status,
      applied_at: app.appliedAt,
      reviewed_by: app.reviewedBy,
      reviewed_at: app.reviewedAt,
      rejection_reason: app.rejectionReason
    };
  }

  /**
   * Obtener todas las aplicaciones del sistema
   */
  async getAllApplications() {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        return apps.map(app => this.normalizeApplication(app));
      }

      // En producción, llamar al backend
      const response = await axios.get(`${API_BASE_URL}/applications/`);
      return response.data.map(app => this.normalizeApplication(app));
    } catch (error) {
      console.error('Error al obtener aplicaciones:', error);
      // Fallback a localStorage si falla el API
      const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
      return apps.map(app => this.normalizeApplication(app));
    }
  }

  /**
   * Obtener aplicaciones de un rider específico
   */
  async getMyApplications(riderId) {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        const myApps = apps.filter(app => app.rider_id === riderId || app.riderId === riderId);
        return myApps.map(app => this.normalizeApplication(app));
      }

      // En producción, llamar al backend
      const response = await axios.get(`${API_BASE_URL}/applications/my-applications/`);
      return response.data.map(app => this.normalizeApplication(app));
    } catch (error) {
      console.error('Error al obtener mis aplicaciones:', error);
      // Fallback a localStorage si falla el API
      const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
      const myApps = apps.filter(app => app.rider_id === riderId || app.riderId === riderId);
      return myApps.map(app => this.normalizeApplication(app));
    }
  }

  /**
   * Obtener aplicaciones de una competencia específica
   */
  async getApplicationsByCompetition(competitionId) {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        const compApps = apps.filter(app =>
          (app.competition_id || app.competitionId) == competitionId
        );
        return compApps.map(app => this.normalizeApplication(app));
      }

      // En producción, llamar al backend
      const response = await axios.get(`${API_BASE_URL}/applications/?competition=${competitionId}`);
      return response.data.map(app => this.normalizeApplication(app));
    } catch (error) {
      console.error('Error al obtener aplicaciones de competencia:', error);
      // Fallback a localStorage
      const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
      const compApps = apps.filter(app =>
        (app.competition_id || app.competitionId) == competitionId
      );
      return compApps.map(app => this.normalizeApplication(app));
    }
  }

  /**
   * Aplicar a una competencia
   */
  async applyToCompetition(competitionId, riderData) {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');

        // Verificar si ya aplicó a esta competencia
        const existingApp = apps.find(app =>
          (app.competition_id || app.competitionId) == competitionId &&
          (app.rider_id || app.riderId) === riderData.id
        );

        if (existingApp) {
          throw new Error('Ya has aplicado a esta competencia');
        }

        // Obtener nombre de la competencia
        const competitions = JSON.parse(localStorage.getItem('fei_competitions') || '[]');
        const competition = competitions.find(c => c.id == competitionId);

        const newApp = {
          id: this.generateId(),
          competition_id: competitionId,
          competition_name: competition?.name || 'Competencia',
          rider_id: riderData.id,
          rider_name: riderData.full_name || riderData.username,
          rider_email: riderData.email,
          status: 'pending',
          applied_at: new Date().toISOString(),
          reviewed_by: null,
          reviewed_at: null,
          rejection_reason: null
        };

        apps.push(newApp);
        localStorage.setItem('fei_applications', JSON.stringify(apps));

        console.log('✅ Aplicación creada:', newApp);
        return this.normalizeApplication(newApp);
      }

      // En producción, llamar al backend
      const response = await axios.post(`${API_BASE_URL}/applications/`, {
        competition_id: competitionId
      });
      return this.normalizeApplication(response.data);
    } catch (error) {
      console.error('Error al aplicar a competencia:', error);
      throw error;
    }
  }

  /**
   * Aprobar una aplicación
   */
  async approveApplication(applicationId, reviewerName) {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        const index = apps.findIndex(app => app.id === applicationId);

        if (index === -1) {
          throw new Error('Aplicación no encontrada');
        }

        apps[index] = {
          ...apps[index],
          status: 'approved',
          reviewed_by: reviewerName,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null
        };

        localStorage.setItem('fei_applications', JSON.stringify(apps));
        console.log('✅ Aplicación aprobada:', apps[index]);
        return this.normalizeApplication(apps[index]);
      }

      // En producción, llamar al backend
      const response = await axios.post(`${API_BASE_URL}/applications/${applicationId}/approve/`);
      return this.normalizeApplication(response.data);
    } catch (error) {
      console.error('Error al aprobar aplicación:', error);
      throw error;
    }
  }

  /**
   * Rechazar una aplicación
   */
  async rejectApplication(applicationId, reviewerName, reason) {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        const index = apps.findIndex(app => app.id === applicationId);

        if (index === -1) {
          throw new Error('Aplicación no encontrada');
        }

        apps[index] = {
          ...apps[index],
          status: 'rejected',
          reviewed_by: reviewerName,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        };

        localStorage.setItem('fei_applications', JSON.stringify(apps));
        console.log('❌ Aplicación rechazada:', apps[index]);
        return this.normalizeApplication(apps[index]);
      }

      // En producción, llamar al backend
      const response = await axios.post(`${API_BASE_URL}/applications/${applicationId}/reject/`, {
        reason
      });
      return this.normalizeApplication(response.data);
    } catch (error) {
      console.error('Error al rechazar aplicación:', error);
      throw error;
    }
  }

  /**
   * Cancelar una aplicación (solo el rider puede hacerlo)
   */
  async cancelApplication(applicationId) {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        const filtered = apps.filter(app => app.id !== applicationId);
        localStorage.setItem('fei_applications', JSON.stringify(filtered));
        console.log('🗑️ Aplicación cancelada');
        return true;
      }

      // En producción, llamar al backend
      await axios.delete(`${API_BASE_URL}/applications/${applicationId}/`);
      return true;
    } catch (error) {
      console.error('Error al cancelar aplicación:', error);
      throw error;
    }
  }
}

const participantService = new ParticipantService();
export default participantService;
