/**
 * Servicio de sincronización offline
 * Maneja almacenamiento local, detección de conectividad y sincronización automática
 */

import { openDB } from 'idb';

class OfflineService {
  constructor() {
    this.dbName = 'FEI_System_Offline';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.deviceId = this.generateDeviceId();

    this.initializeDatabase();
    this.setupConnectionListeners();
  }

  /**
   * Generar ID único de dispositivo
   */
  generateDeviceId() {
    let deviceId = localStorage.getItem('fei_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('fei_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Inicializar base de datos IndexedDB
   */
  async initializeDatabase() {
    try {
      this.db = await openDB(this.dbName, this.dbVersion, {
        upgrade(db) {
          // Store para acciones offline
          if (!db.objectStoreNames.contains('actions')) {
            const actionStore = db.createObjectStore('actions', {
              keyPath: 'id',
              autoIncrement: true
            });
            actionStore.createIndex('timestamp', 'timestamp');
            actionStore.createIndex('type', 'type');
            actionStore.createIndex('status', 'status');
          }

          // Store para datos de calificación
          if (!db.objectStoreNames.contains('scores')) {
            const scoresStore = db.createObjectStore('scores', {
              keyPath: 'id'
            });
            scoresStore.createIndex('evaluationId', 'evaluationId');
            scoresStore.createIndex('timestamp', 'timestamp');
            scoresStore.createIndex('isSynced', 'isSynced');
          }

          // Store para datos de competencias
          if (!db.objectStoreNames.contains('competitions')) {
            const competitionsStore = db.createObjectStore('competitions', {
              keyPath: 'id'
            });
            competitionsStore.createIndex('timestamp', 'timestamp');
          }

          // Store para participantes
          if (!db.objectStoreNames.contains('participants')) {
            const participantsStore = db.createObjectStore('participants', {
              keyPath: 'id'
            });
            participantsStore.createIndex('competitionId', 'competitionId');
          }

          // Store para configuración offline
          if (!db.objectStoreNames.contains('config')) {
            db.createObjectStore('config', {
              keyPath: 'key'
            });
          }
        }
      });

      console.log('Base de datos offline inicializada');
    } catch (error) {
      console.error('Error inicializando base de datos offline:', error);
    }
  }

  /**
   * Configurar listeners de conectividad
   */
  setupConnectionListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Conexión restaurada - iniciando sincronización');
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Conexión perdida - modo offline activado');
    });
  }

  /**
   * Verificar estado de conectividad
   */
  isConnected() {
    return this.isOnline && navigator.onLine;
  }

  /**
   * Guardar acción offline
   */
  async saveOfflineAction(action) {
    if (!this.db) await this.initializeDatabase();

    const actionData = {
      ...action,
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      status: 'pending',
      retryCount: 0
    };

    try {
      await this.db.add('actions', actionData);
      console.log('Acción guardada offline:', actionData);
      return actionData;
    } catch (error) {
      console.error('Error guardando acción offline:', error);
      throw error;
    }
  }

  /**
   * Guardar puntuación offline
   */
  async saveOfflineScore(scoreData) {
    if (!this.db) await this.initializeDatabase();

    const offlineScore = {
      ...scoreData,
      id: scoreData.id || `offline_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      isSynced: false
    };

    try {
      await this.db.put('scores', offlineScore);
      console.log('Puntuación guardada offline:', offlineScore);

      // Agregar a cola de sincronización
      await this.saveOfflineAction({
        type: 'score_update',
        data: offlineScore,
        priority: 'high'
      });

      return offlineScore;
    } catch (error) {
      console.error('Error guardando puntuación offline:', error);
      throw error;
    }
  }

  /**
   * Obtener puntuaciones offline
   */
  async getOfflineScores(evaluationId = null) {
    if (!this.db) await this.initializeDatabase();

    try {
      const tx = this.db.transaction('scores', 'readonly');
      const store = tx.objectStore('scores');

      if (evaluationId) {
        const index = store.index('evaluationId');
        return await index.getAll(evaluationId);
      } else {
        return await store.getAll();
      }
    } catch (error) {
      console.error('Error obteniendo puntuaciones offline:', error);
      return [];
    }
  }

  /**
   * Obtener acciones pendientes de sincronización
   */
  async getPendingActions() {
    if (!this.db) await this.initializeDatabase();

    try {
      const tx = this.db.transaction('actions', 'readonly');
      const store = tx.objectStore('actions');
      const index = store.index('status');

      return await index.getAll('pending');
    } catch (error) {
      console.error('Error obteniendo acciones pendientes:', error);
      return [];
    }
  }

  /**
   * Marcar acción como sincronizada
   */
  async markActionAsSynced(actionId) {
    if (!this.db) await this.initializeDatabase();

    try {
      const tx = this.db.transaction('actions', 'readwrite');
      const store = tx.objectStore('actions');

      const action = await store.get(actionId);
      if (action) {
        action.status = 'synced';
        action.syncedAt = new Date().toISOString();
        await store.put(action);
      }
    } catch (error) {
      console.error('Error marcando acción como sincronizada:', error);
    }
  }

  /**
   * Marcar puntuación como sincronizada
   */
  async markScoreAsSynced(scoreId) {
    if (!this.db) await this.initializeDatabase();

    try {
      const tx = this.db.transaction('scores', 'readwrite');
      const store = tx.objectStore('scores');

      const score = await store.get(scoreId);
      if (score) {
        score.isSynced = true;
        score.syncedAt = new Date().toISOString();
        await store.put(score);
      }
    } catch (error) {
      console.error('Error marcando puntuación como sincronizada:', error);
    }
  }

  /**
   * Sincronizar cuando vuelva la conexión
   */
  async syncWhenOnline() {
    if (!this.isConnected()) {
      console.log('No hay conexión para sincronizar');
      return;
    }

    try {
      console.log('Iniciando sincronización...');

      const pendingActions = await this.getPendingActions();
      console.log(`${pendingActions.length} acciones pendientes de sincronización`);

      // Importar servicio de sincronización
      const { syncService } = await import('./syncService');

      for (const action of pendingActions) {
        try {
          const result = await syncService.syncAction(action);

          if (result.success) {
            await this.markActionAsSynced(action.id);

            // Si es una puntuación, marcarla también como sincronizada
            if (action.type === 'score_update' && action.data.id) {
              await this.markScoreAsSynced(action.data.id);
            }

            console.log(`Acción ${action.id} sincronizada exitosamente`);
          } else {
            // Incrementar contador de reintentos
            action.retryCount = (action.retryCount || 0) + 1;

            if (action.retryCount >= 3) {
              action.status = 'failed';
              console.error(`Acción ${action.id} falló después de 3 reintentos`);
            }

            // Actualizar acción en la base de datos
            const tx = this.db.transaction('actions', 'readwrite');
            await tx.objectStore('actions').put(action);
          }
        } catch (error) {
          console.error(`Error sincronizando acción ${action.id}:`, error);
        }
      }

      console.log('Sincronización completada');
    } catch (error) {
      console.error('Error durante la sincronización:', error);
    }
  }

  /**
   * Limpiar datos antiguos
   */
  async cleanupOldData(daysOld = 30) {
    if (!this.db) await this.initializeDatabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      // Limpiar acciones sincronizadas antiguas
      const tx = this.db.transaction('actions', 'readwrite');
      const store = tx.objectStore('actions');
      const index = store.index('timestamp');

      const oldActions = await index.getAll(IDBKeyRange.upperBound(cutoffDate.toISOString()));

      for (const action of oldActions) {
        if (action.status === 'synced') {
          await store.delete(action.id);
        }
      }

      console.log(`Limpiadas ${oldActions.length} acciones antiguas`);
    } catch (error) {
      console.error('Error limpiando datos antiguos:', error);
    }
  }

  /**
   * Obtener estadísticas offline
   */
  async getOfflineStats() {
    if (!this.db) await this.initializeDatabase();

    try {
      const [pendingActions, allScores] = await Promise.all([
        this.getPendingActions(),
        this.getOfflineScores()
      ]);

      const unsyncedScores = allScores.filter(score => !score.isSynced);

      return {
        pendingActions: pendingActions.length,
        unsyncedScores: unsyncedScores.length,
        totalOfflineData: pendingActions.length + unsyncedScores.length,
        isOnline: this.isConnected(),
        deviceId: this.deviceId,
        lastSyncAttempt: localStorage.getItem('last_sync_attempt')
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas offline:', error);
      return {
        pendingActions: 0,
        unsyncedScores: 0,
        totalOfflineData: 0,
        isOnline: this.isConnected(),
        deviceId: this.deviceId,
        error: error.message
      };
    }
  }

  /**
   * Forzar sincronización manual
   */
  async forceSyncNow() {
    if (!this.isConnected()) {
      throw new Error('No hay conexión a internet');
    }

    localStorage.setItem('last_sync_attempt', new Date().toISOString());
    await this.syncWhenOnline();
  }

  /**
   * Exportar datos offline para backup
   */
  async exportOfflineData() {
    if (!this.db) await this.initializeDatabase();

    try {
      const [actions, scores, competitions, participants] = await Promise.all([
        this.db.getAll('actions'),
        this.db.getAll('scores'),
        this.db.getAll('competitions'),
        this.db.getAll('participants')
      ]);

      return {
        deviceId: this.deviceId,
        exportDate: new Date().toISOString(),
        data: {
          actions,
          scores,
          competitions,
          participants
        }
      };
    } catch (error) {
      console.error('Error exportando datos offline:', error);
      throw error;
    }
  }

  /**
   * Importar datos offline desde backup
   */
  async importOfflineData(backupData) {
    if (!this.db) await this.initializeDatabase();
    if (!backupData.data) throw new Error('Datos de backup inválidos');

    try {
      const tx = this.db.transaction(['actions', 'scores', 'competitions', 'participants'], 'readwrite');

      // Importar cada tipo de datos
      for (const [storeName, items] of Object.entries(backupData.data)) {
        if (Array.isArray(items)) {
          const store = tx.objectStore(storeName);
          for (const item of items) {
            await store.put(item);
          }
        }
      }

      await tx.done;
      console.log('Datos offline importados exitosamente');
    } catch (error) {
      console.error('Error importando datos offline:', error);
      throw error;
    }
  }
}

// Crear instancia singleton
export const offlineService = new OfflineService();
export default offlineService;