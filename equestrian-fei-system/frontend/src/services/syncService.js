/**
 * Servicio de sincronización con el backend
 * Coordina la sincronización de datos offline con el servidor
 */

import axios from 'axios';

class SyncService {
  constructor() {
    this.baseURL = '/api/sync';
    this.currentSession = null;
  }

  /**
   * Iniciar sesión de sincronización
   */
  async startSyncSession(deviceId) {
    try {
      const response = await axios.post(`${this.baseURL}/sync-sessions/start_session/`, {
        device_id: deviceId
      });

      this.currentSession = response.data;
      console.log('Sesión de sincronización iniciada:', this.currentSession.id);
      return this.currentSession;
    } catch (error) {
      console.error('Error iniciando sesión de sincronización:', error);
      throw error;
    }
  }

  /**
   * Agregar acción a la sesión actual
   */
  async addActionToSession(action) {
    if (!this.currentSession) {
      throw new Error('No hay sesión de sincronización activa');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/sync-sessions/${this.currentSession.id}/add_action/`,
        {
          action_type: action.type,
          content_type: action.contentType,
          object_id: action.objectId,
          data: action.data,
          priority: action.priority || 'normal'
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error agregando acción a la sesión:', error);
      throw error;
    }
  }

  /**
   * Procesar sesión de sincronización
   */
  async processSyncSession(sessionId = null) {
    const id = sessionId || this.currentSession?.id;
    if (!id) {
      throw new Error('No hay sesión para procesar');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/sync-sessions/${id}/process_session/`
      );

      console.log('Sesión procesada:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error procesando sesión:', error);
      throw error;
    }
  }

  /**
   * Sincronizar una acción individual
   */
  async syncAction(action) {
    try {
      // Determinar el endpoint según el tipo de acción
      let endpoint;
      let data;

      switch (action.type) {
        case 'score_update':
          endpoint = '/api/scoring/evaluations/';
          data = this.formatScoreData(action.data);
          break;

        case 'create':
          endpoint = this.getCreateEndpoint(action.model);
          data = action.data;
          break;

        case 'update':
          endpoint = this.getUpdateEndpoint(action.model, action.objectId);
          data = action.data;
          break;

        case 'delete':
          endpoint = this.getDeleteEndpoint(action.model, action.objectId);
          data = null;
          break;

        default:
          throw new Error(`Tipo de acción no soportado: ${action.type}`);
      }

      let response;
      switch (action.type) {
        case 'create':
          response = await axios.post(endpoint, data);
          break;
        case 'update':
        case 'score_update':
          response = await axios.put(endpoint, data);
          break;
        case 'delete':
          response = await axios.delete(endpoint);
          break;
      }

      return {
        success: true,
        data: response.data,
        action: action
      };

    } catch (error) {
      console.error(`Error sincronizando acción ${action.type}:`, error);

      return {
        success: false,
        error: error.response?.data || error.message,
        action: action,
        shouldRetry: this.shouldRetryError(error)
      };
    }
  }

  /**
   * Formatear datos de puntuación para el backend
   */
  formatScoreData(scoreData) {
    return {
      evaluation_id: scoreData.evaluationId,
      scores: scoreData.scores.map(score => ({
        parameter_id: score.parameterId,
        score: score.score,
        coefficient: score.coefficient,
        weighted_score: score.weightedScore,
        justification: score.justification || ''
      })),
      total_score: scoreData.totalScore,
      percentage: scoreData.percentage,
      submission_time: scoreData.submissionTime || new Date().toISOString()
    };
  }

  /**
   * Obtener endpoint para creación según el modelo
   */
  getCreateEndpoint(model) {
    const endpoints = {
      'evaluation': '/api/scoring/evaluations/',
      'score_entry': '/api/scoring/score-entries/',
      'competition': '/api/competitions/',
      'registration': '/api/competitions/registrations/'
    };

    return endpoints[model] || '/api/generic/';
  }

  /**
   * Obtener endpoint para actualización según el modelo
   */
  getUpdateEndpoint(model, objectId) {
    const baseEndpoint = this.getCreateEndpoint(model);
    return `${baseEndpoint}${objectId}/`;
  }

  /**
   * Obtener endpoint para eliminación según el modelo
   */
  getDeleteEndpoint(model, objectId) {
    return this.getUpdateEndpoint(model, objectId);
  }

  /**
   * Determinar si se debe reintentar en caso de error
   */
  shouldRetryError(error) {
    const retryableCodes = [500, 502, 503, 504, 408, 429];
    const status = error.response?.status;

    // Reintentar en errores de servidor o red
    if (!status || retryableCodes.includes(status)) {
      return true;
    }

    // No reintentar en errores de cliente (400, 401, 403, 404)
    return false;
  }

  /**
   * Obtener estado de sincronización del usuario
   */
  async getSyncStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/offline-sync/status/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estado de sincronización:', error);
      throw error;
    }
  }

  /**
   * Obtener sesiones de sincronización del usuario
   */
  async getSyncSessions(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`${this.baseURL}/sync-sessions/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo sesiones:', error);
      throw error;
    }
  }

  /**
   * Obtener conflictos pendientes
   */
  async getPendingConflicts() {
    try {
      const response = await axios.get(`${this.baseURL}/conflicts/?status=pending`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo conflictos:', error);
      throw error;
    }
  }

  /**
   * Resolver conflicto manualmente
   */
  async resolveConflict(conflictId, resolution) {
    try {
      const response = await axios.post(
        `${this.baseURL}/conflicts/${conflictId}/resolve/`,
        {
          strategy: resolution.strategy,
          resolved_data: resolution.resolvedData,
          notes: resolution.notes || ''
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error resolviendo conflicto:', error);
      throw error;
    }
  }

  /**
   * Resolver conflicto automáticamente
   */
  async autoResolveConflict(conflictId, strategy = 'last_write_wins') {
    try {
      const response = await axios.post(
        `${this.baseURL}/conflicts/${conflictId}/auto_resolve/`,
        { strategy }
      );

      return response.data;
    } catch (error) {
      console.error('Error auto-resolviendo conflicto:', error);
      throw error;
    }
  }

  /**
   * Almacenar datos en almacenamiento offline del servidor
   */
  async storeOfflineData(storageData) {
    try {
      const response = await axios.post(`${this.baseURL}/offline-storage/`, storageData);
      return response.data;
    } catch (error) {
      console.error('Error almacenando datos offline:', error);
      throw error;
    }
  }

  /**
   * Crear múltiples entradas de almacenamiento
   */
  async bulkStoreOfflineData(items) {
    try {
      const response = await axios.post(`${this.baseURL}/offline-storage/bulk_create/`, {
        items
      });
      return response.data;
    } catch (error) {
      console.error('Error en almacenamiento masivo:', error);
      throw error;
    }
  }

  /**
   * Marcar elementos como sincronizados
   */
  async markItemsAsSynced(itemIds) {
    try {
      const response = await axios.post(`${this.baseURL}/offline-storage/mark_synced/`, {
        item_ids: itemIds
      });
      return response.data;
    } catch (error) {
      console.error('Error marcando elementos como sincronizados:', error);
      throw error;
    }
  }

  /**
   * Obtener cola de sincronización
   */
  async getSyncQueue(deviceId = null) {
    try {
      const params = deviceId ? `?device_id=${deviceId}` : '';
      const response = await axios.get(`${this.baseURL}/offline-storage/sync_queue/${params}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo cola de sincronización:', error);
      throw error;
    }
  }

  /**
   * Verificar conectividad con el servidor
   */
  async checkConnectivity() {
    try {
      const response = await axios.get(`${this.baseURL}/offline-sync/connectivity/`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      return {
        is_online: false,
        error: error.message
      };
    }
  }

  /**
   * Sincronización completa con progreso
   */
  async fullSync(deviceId, onProgress = null) {
    try {
      // 1. Iniciar sesión
      if (onProgress) onProgress('Iniciando sesión de sincronización...', 10);
      const session = await this.startSyncSession(deviceId);

      // 2. Obtener datos pendientes del almacenamiento local
      if (onProgress) onProgress('Obteniendo datos pendientes...', 20);
      const { offlineService } = await import('./offlineService');
      const pendingActions = await offlineService.getPendingActions();

      if (pendingActions.length === 0) {
        if (onProgress) onProgress('No hay datos para sincronizar', 100);
        return { success: true, syncedCount: 0 };
      }

      // 3. Agregar acciones a la sesión
      if (onProgress) onProgress(`Agregando ${pendingActions.length} acciones...`, 30);

      let addedCount = 0;
      for (const action of pendingActions) {
        try {
          await this.addActionToSession(action);
          addedCount++;

          if (onProgress) {
            const progress = 30 + (addedCount / pendingActions.length) * 40;
            onProgress(`Agregada acción ${addedCount}/${pendingActions.length}`, progress);
          }
        } catch (error) {
          console.error('Error agregando acción:', error);
        }
      }

      // 4. Procesar sesión
      if (onProgress) onProgress('Procesando sincronización...', 80);
      const result = await this.processSyncSession(session.id);

      // 5. Marcar acciones como sincronizadas
      if (onProgress) onProgress('Finalizando sincronización...', 90);

      for (const action of pendingActions) {
        if (result.results.successful > 0) {
          await offlineService.markActionAsSynced(action.id);
        }
      }

      if (onProgress) onProgress('Sincronización completada', 100);

      return {
        success: true,
        sessionId: session.id,
        syncedCount: result.results.successful,
        failedCount: result.results.failed,
        conflictCount: result.results.conflicts,
        details: result
      };

    } catch (error) {
      console.error('Error en sincronización completa:', error);
      if (onProgress) onProgress(`Error: ${error.message}`, 0);
      throw error;
    }
  }
}

// Crear instancia singleton
export const syncService = new SyncService();
export default syncService;