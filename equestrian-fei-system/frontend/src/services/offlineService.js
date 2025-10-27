/**
 * Servicio de Almacenamiento Offline con IndexedDB
 * Proporciona almacenamiento robusto para datos de competencias,
 * calificaciones y sincronización inteligente
 */

const DB_NAME = 'FEI_Competition_DB';
const DB_VERSION = 1;

// Nombres de los object stores
const STORES = {
  COMPETITIONS: 'competitions',
  PARTICIPANTS: 'participants',
  SCORES: 'scores',
  JUDGES: 'judges',
  PENDING_SYNC: 'pending_sync',
  SETTINGS: 'settings'
};

/**
 * Inicializar IndexedDB
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Error al abrir IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('✅ IndexedDB inicializado correctamente');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('🔧 Creando/actualizando estructura de IndexedDB...');

      // Store de Competencias
      if (!db.objectStoreNames.contains(STORES.COMPETITIONS)) {
        const competitionsStore = db.createObjectStore(STORES.COMPETITIONS, { keyPath: 'id' });
        competitionsStore.createIndex('status', 'status', { unique: false });
        competitionsStore.createIndex('startDate', 'startDate', { unique: false });
      }

      // Store de Participantes
      if (!db.objectStoreNames.contains(STORES.PARTICIPANTS)) {
        const participantsStore = db.createObjectStore(STORES.PARTICIPANTS, { keyPath: 'id' });
        participantsStore.createIndex('competition_id', 'competition_id', { unique: false });
        participantsStore.createIndex('bib_number', 'bib_number', { unique: false });
      }

      // Store de Calificaciones
      if (!db.objectStoreNames.contains(STORES.SCORES)) {
        const scoresStore = db.createObjectStore(STORES.SCORES, { keyPath: 'id', autoIncrement: true });
        scoresStore.createIndex('participant_id', 'participant_id', { unique: false });
        scoresStore.createIndex('judge_id', 'judge_id', { unique: false });
        scoresStore.createIndex('competition_id', 'competition_id', { unique: false });
        scoresStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Store de Jueces
      if (!db.objectStoreNames.contains(STORES.JUDGES)) {
        const judgesStore = db.createObjectStore(STORES.JUDGES, { keyPath: 'id', autoIncrement: true });
        judgesStore.createIndex('competition_id', 'competition_id', { unique: false });
        judgesStore.createIndex('judge_position', 'judge_position', { unique: false });
      }

      // Store de Sincronización Pendiente
      if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
        const pendingSyncStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
        pendingSyncStore.createIndex('type', 'type', { unique: false });
        pendingSyncStore.createIndex('timestamp', 'timestamp', { unique: false });
        pendingSyncStore.createIndex('synced', 'synced', { unique: false });
      }

      // Store de Configuración
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      console.log('✅ Estructura de IndexedDB creada');
    };
  });
};

/**
 * Obtener conexión a la base de datos
 */
const getDB = async () => {
  try {
    return await initDB();
  } catch (error) {
    console.error('Error obteniendo DB:', error);
    throw error;
  }
};

// ==================== OPERACIONES GENÉRICAS ====================

/**
 * Agregar o actualizar un registro
 */
export const saveData = async (storeName, data) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const request = store.put(data);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`✅ Datos guardados en ${storeName}:`, data.id || 'nuevo registro');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`❌ Error guardando en ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error en saveData:', error);
    throw error;
  }
};

/**
 * Obtener un registro por ID
 */
export const getData = async (storeName, id) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error en getData:', error);
    throw error;
  }
};

/**
 * Obtener todos los registros de un store
 */
export const getAllData = async (storeName) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error en getAllData:', error);
    return [];
  }
};

/**
 * Obtener registros por índice
 */
export const getByIndex = async (storeName, indexName, value) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error en getByIndex:', error);
    return [];
  }
};

/**
 * Eliminar un registro
 */
export const deleteData = async (storeName, id) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`🗑️ Registro eliminado de ${storeName}:`, id);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error en deleteData:', error);
    throw error;
  }
};

/**
 * Limpiar todos los datos de un store
 */
export const clearStore = async (storeName) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`🗑️ Store ${storeName} limpiado`);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error en clearStore:', error);
    throw error;
  }
};

// ==================== OPERACIONES ESPECÍFICAS ====================

/**
 * Guardar competencia offline
 */
export const saveCompetitionOffline = async (competition) => {
  return saveData(STORES.COMPETITIONS, {
    ...competition,
    offline_saved_at: new Date().toISOString()
  });
};

/**
 * Guardar calificación offline (para sincronizar después)
 */
export const saveScoreOffline = async (score) => {
  // Guardar la calificación
  const scoreId = await saveData(STORES.SCORES, {
    ...score,
    offline: true,
    created_at: new Date().toISOString()
  });

  // Agregar a cola de sincronización pendiente
  await saveData(STORES.PENDING_SYNC, {
    type: 'score',
    data: { ...score, id: scoreId },
    timestamp: new Date().toISOString(),
    synced: false
  });

  return scoreId;
};

/**
 * Obtener calificaciones pendientes de sincronización
 */
export const getPendingSyncItems = async () => {
  return getByIndex(STORES.PENDING_SYNC, 'synced', false);
};

/**
 * Marcar item como sincronizado
 */
export const markAsSynced = async (syncItemId) => {
  const item = await getData(STORES.PENDING_SYNC, syncItemId);

  if (item) {
    item.synced = true;
    item.synced_at = new Date().toISOString();
    await saveData(STORES.PENDING_SYNC, item);
  }
};

/**
 * Obtener calificaciones de una competencia
 */
export const getCompetitionScores = async (competitionId) => {
  return getByIndex(STORES.SCORES, 'competition_id', competitionId);
};

/**
 * Obtener participantes de una competencia
 */
export const getCompetitionParticipants = async (competitionId) => {
  return getByIndex(STORES.PARTICIPANTS, 'competition_id', competitionId);
};

/**
 * Obtener jueces de una competencia
 */
export const getCompetitionJudges = async (competitionId) => {
  return getByIndex(STORES.JUDGES, 'competition_id', competitionId);
};

/**
 * Guardar configuración
 */
export const saveSetting = async (key, value) => {
  return saveData(STORES.SETTINGS, { key, value, updated_at: new Date().toISOString() });
};

/**
 * Obtener configuración
 */
export const getSetting = async (key) => {
  const setting = await getData(STORES.SETTINGS, key);
  return setting ? setting.value : null;
};

/**
 * Exportar toda la base de datos (para backup)
 */
export const exportDatabase = async () => {
  try {
    const db = await getDB();
    const data = {};

    for (const storeName of Object.values(STORES)) {
      data[storeName] = await getAllData(storeName);
    }

    return {
      version: DB_VERSION,
      exported_at: new Date().toISOString(),
      data
    };
  } catch (error) {
    console.error('Error exportando database:', error);
    throw error;
  }
};

/**
 * Importar base de datos (desde backup)
 */
export const importDatabase = async (backup) => {
  try {
    if (!backup.data) {
      throw new Error('Formato de backup inválido');
    }

    for (const [storeName, records] of Object.entries(backup.data)) {
      if (Object.values(STORES).includes(storeName)) {
        for (const record of records) {
          await saveData(storeName, record);
        }
      }
    }

    console.log('✅ Database importada correctamente');
    return true;
  } catch (error) {
    console.error('Error importando database:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de almacenamiento
 */
export const getStorageStats = async () => {
  try {
    const stats = {};

    for (const storeName of Object.values(STORES)) {
      const data = await getAllData(storeName);
      stats[storeName] = data.length;
    }

    // Calcular tamaño estimado
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      stats.usage = estimate.usage;
      stats.quota = estimate.quota;
      stats.percentage = ((estimate.usage / estimate.quota) * 100).toFixed(2);
    }

    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {};
  }
};

// Inicializar automáticamente al cargar
initDB().catch(error => {
  console.error('Error inicializando IndexedDB:', error);
});

export default {
  initDB,
  saveData,
  getData,
  getAllData,
  getByIndex,
  deleteData,
  clearStore,
  saveCompetitionOffline,
  saveScoreOffline,
  getPendingSyncItems,
  markAsSynced,
  getCompetitionScores,
  getCompetitionParticipants,
  getCompetitionJudges,
  saveSetting,
  getSetting,
  exportDatabase,
  importDatabase,
  getStorageStats,
  STORES
};
