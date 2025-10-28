import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ParticipantService {
  constructor() {
    // Solo usar localStorage como fallback offline, controlado por variable de entorno
    this.useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true' || false;
  }

  // ============================================================================
  // ELIMINADO: initLocalStorage() que inicializaba array vacío
  // ELIMINADO: generateId() para fake IDs - backend genera IDs reales
  //
  // AHORA: El sistema usa SIEMPRE la API del backend como fuente principal.
  // localStorage solo se usa como fallback offline real.
  // ============================================================================

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
      console.log('🌐 Cargando aplicaciones desde API...');
      const response = await axios.get(`${API_BASE_URL}/applications/`);
      console.log('✅ Aplicaciones cargadas desde API');
      return response.data.map(app => this.normalizeApplication(app));
    } catch (error) {
      console.error('❌ Error al obtener aplicaciones desde backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado o sin conexión
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        console.log('⚠️ Usando localStorage como fallback offline');
        return apps.map(app => this.normalizeApplication(app));
      }

      throw error;
    }
  }

  /**
   * Obtener aplicaciones de un rider específico
   */
  async getMyApplications(riderId) {
    try {
      console.log('🌐 Cargando mis aplicaciones desde API...');
      const response = await axios.get(`${API_BASE_URL}/applications/my-applications/`);
      console.log('✅ Mis aplicaciones cargadas desde API');
      return response.data.map(app => this.normalizeApplication(app));
    } catch (error) {
      console.error('❌ Error al obtener mis aplicaciones desde backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado o sin conexión
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        const myApps = apps.filter(app => app.rider_id === riderId || app.riderId === riderId);
        console.log('⚠️ Usando localStorage como fallback offline');
        return myApps.map(app => this.normalizeApplication(app));
      }

      throw error;
    }
  }

  /**
   * Obtener aplicaciones de una competencia específica
   */
  async getApplicationsByCompetition(competitionId) {
    try {
      console.log(`🌐 Cargando aplicaciones de competencia ${competitionId} desde API...`);
      const response = await axios.get(`${API_BASE_URL}/applications/?competition=${competitionId}`);
      console.log('✅ Aplicaciones de competencia cargadas desde API');
      return response.data.map(app => this.normalizeApplication(app));
    } catch (error) {
      console.error('❌ Error al obtener aplicaciones de competencia desde backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado o sin conexión
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        const compApps = apps.filter(app =>
          (app.competition_id || app.competitionId) == competitionId
        );
        console.log('⚠️ Usando localStorage como fallback offline');
        return compApps.map(app => this.normalizeApplication(app));
      }

      throw error;
    }
  }

  /**
   * Aplicar a una competencia
   */
  async applyToCompetition(competitionId, riderData) {
    try {
      console.log(`🌐 Aplicando a competencia ${competitionId} en API...`);
      const response = await axios.post(`${API_BASE_URL}/applications/`, {
        competition_id: competitionId
      });
      console.log('✅ Aplicación creada en API:', response.data);
      return this.normalizeApplication(response.data);
    } catch (error) {
      console.error('❌ Error al aplicar a competencia en backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado o sin conexión
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

        // Generar ID temporal para offline
        const newApp = {
          id: 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
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

        console.log('⚠️ Aplicación creada en localStorage como fallback offline:', newApp);
        return this.normalizeApplication(newApp);
      }

      throw error;
    }
  }

  /**
   * Aprobar una aplicación
   */
  async approveApplication(applicationId, reviewerName) {
    try {
      console.log(`🌐 Aprobando aplicación ${applicationId} en API...`);
      const response = await axios.post(`${API_BASE_URL}/applications/${applicationId}/approve/`);
      console.log('✅ Aplicación aprobada en API');
      return this.normalizeApplication(response.data);
    } catch (error) {
      console.error('❌ Error al aprobar aplicación en backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado o sin conexión
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
        console.log('⚠️ Aplicación aprobada en localStorage como fallback offline:', apps[index]);
        return this.normalizeApplication(apps[index]);
      }

      throw error;
    }
  }

  /**
   * Rechazar una aplicación
   */
  async rejectApplication(applicationId, reviewerName, reason) {
    try {
      console.log(`🌐 Rechazando aplicación ${applicationId} en API...`);
      const response = await axios.post(`${API_BASE_URL}/applications/${applicationId}/reject/`, {
        reason
      });
      console.log('✅ Aplicación rechazada en API');
      return this.normalizeApplication(response.data);
    } catch (error) {
      console.error('❌ Error al rechazar aplicación en backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado o sin conexión
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
        console.log('⚠️ Aplicación rechazada en localStorage como fallback offline:', apps[index]);
        return this.normalizeApplication(apps[index]);
      }

      throw error;
    }
  }

  /**
   * Cancelar una aplicación (solo el rider puede hacerlo)
   */
  async cancelApplication(applicationId) {
    try {
      console.log(`🌐 Cancelando aplicación ${applicationId} en API...`);
      await axios.delete(`${API_BASE_URL}/applications/${applicationId}/`);
      console.log('✅ Aplicación cancelada en API');
      return true;
    } catch (error) {
      console.error('❌ Error al cancelar aplicación en backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado o sin conexión
      if (this.useLocalStorage || !navigator.onLine) {
        const apps = JSON.parse(localStorage.getItem('fei_applications') || '[]');
        const filtered = apps.filter(app => app.id !== applicationId);
        localStorage.setItem('fei_applications', JSON.stringify(filtered));
        console.log('⚠️ Aplicación cancelada en localStorage como fallback offline');
        return true;
      }

      throw error;
    }
  }
}

const participantService = new ParticipantService();
export default participantService;
