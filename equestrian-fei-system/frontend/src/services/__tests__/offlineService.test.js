/**
 * Tests para el servicio offline
 */

import { offlineService } from '../offlineService';

// Mock IndexedDB
const mockIDB = {
  open: jest.fn(),
  transaction: jest.fn(),
  objectStore: jest.fn(),
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn()
};

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true
  },
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('OfflineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  describe('Device ID Generation', () => {
    it('should generate a unique device ID', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const deviceId = offlineService.generateDeviceId();

      expect(deviceId).toMatch(/^device_\d+_[a-z0-9]+$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('fei_device_id', deviceId);
    });

    it('should reuse existing device ID', () => {
      const existingId = 'device_123_abc';
      localStorageMock.getItem.mockReturnValue(existingId);

      const deviceId = offlineService.generateDeviceId();

      expect(deviceId).toBe(existingId);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Connectivity Detection', () => {
    it('should detect online status', () => {
      navigator.onLine = true;
      offlineService.isOnline = true;

      expect(offlineService.isConnected()).toBe(true);
    });

    it('should detect offline status', () => {
      navigator.onLine = false;
      offlineService.isOnline = false;

      expect(offlineService.isConnected()).toBe(false);
    });
  });

  describe('Offline Actions', () => {
    beforeEach(() => {
      // Mock successful database operations
      offlineService.db = {
        add: jest.fn().mockResolvedValue({ id: 1 }),
        put: jest.fn().mockResolvedValue(true),
        getAll: jest.fn().mockResolvedValue([]),
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            add: jest.fn().mockResolvedValue({ id: 1 }),
            put: jest.fn().mockResolvedValue(true),
            get: jest.fn().mockResolvedValue(null)
          })
        })
      };
    });

    it('should save offline action', async () => {
      const action = {
        type: 'score_update',
        data: { score: 8.5 },
        priority: 'high'
      };

      const result = await offlineService.saveOfflineAction(action);

      expect(result).toMatchObject({
        type: 'score_update',
        data: { score: 8.5 },
        priority: 'high',
        status: 'pending',
        retryCount: 0
      });
      expect(result.timestamp).toBeDefined();
      expect(result.deviceId).toBeDefined();
    });

    it('should save offline score', async () => {
      const scoreData = {
        evaluationId: 'eval_123',
        parameterId: 'param_456',
        score: 8.5,
        justification: 'Good performance'
      };

      const result = await offlineService.saveOfflineScore(scoreData);

      expect(result).toMatchObject({
        evaluationId: 'eval_123',
        parameterId: 'param_456',
        score: 8.5,
        justification: 'Good performance',
        isSynced: false
      });
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(() => {
      const mockScores = [
        {
          id: 'score_1',
          evaluationId: 'eval_123',
          score: 8.5,
          isSynced: false,
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: 'score_2',
          evaluationId: 'eval_456',
          score: 9.0,
          isSynced: true,
          timestamp: '2024-01-01T11:00:00Z'
        }
      ];

      offlineService.db = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue(mockScores),
            index: jest.fn().mockReturnValue({
              getAll: jest.fn().mockResolvedValue(
                mockScores.filter(s => s.evaluationId === 'eval_123')
              )
            })
          })
        })
      };
    });

    it('should get all offline scores', async () => {
      const scores = await offlineService.getOfflineScores();

      expect(scores).toHaveLength(2);
      expect(scores[0].evaluationId).toBe('eval_123');
      expect(scores[1].evaluationId).toBe('eval_456');
    });

    it('should get scores for specific evaluation', async () => {
      const scores = await offlineService.getOfflineScores('eval_123');

      expect(scores).toHaveLength(1);
      expect(scores[0].evaluationId).toBe('eval_123');
    });
  });

  describe('Offline Statistics', () => {
    beforeEach(() => {
      const mockActions = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'pending' },
        { id: 3, status: 'synced' }
      ];

      const mockScores = [
        { id: 'score_1', isSynced: false },
        { id: 'score_2', isSynced: false },
        { id: 'score_3', isSynced: true }
      ];

      offlineService.getPendingActions = jest.fn().mockResolvedValue(
        mockActions.filter(a => a.status === 'pending')
      );
      offlineService.getOfflineScores = jest.fn().mockResolvedValue(mockScores);
    });

    it('should calculate offline statistics', async () => {
      const stats = await offlineService.getOfflineStats();

      expect(stats).toMatchObject({
        pendingActions: 2,
        unsyncedScores: 2,
        totalOfflineData: 4,
        isOnline: true
      });
      expect(stats.deviceId).toBeDefined();
    });
  });

  describe('Data Export and Import', () => {
    beforeEach(() => {
      const mockData = {
        actions: [{ id: 1, type: 'score_update' }],
        scores: [{ id: 'score_1', score: 8.5 }],
        competitions: [{ id: 'comp_1', name: 'Test Competition' }],
        participants: [{ id: 'part_1', name: 'Test Participant' }]
      };

      offlineService.db = {
        getAll: jest.fn()
          .mockResolvedValueOnce(mockData.actions)
          .mockResolvedValueOnce(mockData.scores)
          .mockResolvedValueOnce(mockData.competitions)
          .mockResolvedValueOnce(mockData.participants),
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            put: jest.fn().mockResolvedValue(true)
          }),
          done: Promise.resolve()
        })
      };
    });

    it('should export offline data', async () => {
      const exportData = await offlineService.exportOfflineData();

      expect(exportData).toMatchObject({
        deviceId: expect.any(String),
        exportDate: expect.any(String),
        data: {
          actions: expect.any(Array),
          scores: expect.any(Array),
          competitions: expect.any(Array),
          participants: expect.any(Array)
        }
      });
    });

    it('should import offline data', async () => {
      const importData = {
        deviceId: 'test_device',
        exportDate: '2024-01-01T12:00:00Z',
        data: {
          actions: [{ id: 1, type: 'score_update' }],
          scores: [{ id: 'score_1', score: 8.5 }],
          competitions: [],
          participants: []
        }
      };

      await expect(offlineService.importOfflineData(importData)).resolves.not.toThrow();
    });

    it('should reject invalid import data', async () => {
      const invalidData = {
        deviceId: 'test_device'
        // Missing data property
      };

      await expect(offlineService.importOfflineData(invalidData))
        .rejects.toThrow('Datos de backup inválidos');
    });
  });

  describe('Synchronization Marking', () => {
    beforeEach(() => {
      offlineService.db = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              id: 1,
              status: 'pending'
            }),
            put: jest.fn().mockResolvedValue(true)
          })
        })
      };
    });

    it('should mark action as synced', async () => {
      await offlineService.markActionAsSynced(1);

      const transaction = offlineService.db.transaction();
      const store = transaction.objectStore();

      expect(store.get).toHaveBeenCalledWith(1);
      expect(store.put).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'synced',
          syncedAt: expect.any(String)
        })
      );
    });

    it('should mark score as synced', async () => {
      offlineService.db.transaction().objectStore().get.mockResolvedValue({
        id: 'score_1',
        isSynced: false
      });

      await offlineService.markScoreAsSynced('score_1');

      const transaction = offlineService.db.transaction();
      const store = transaction.objectStore();

      expect(store.put).toHaveBeenCalledWith(
        expect.objectContaining({
          isSynced: true,
          syncedAt: expect.any(String)
        })
      );
    });
  });

  describe('Data Cleanup', () => {
    beforeEach(() => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 días atrás

      const mockActions = [
        {
          id: 1,
          status: 'synced',
          timestamp: oldDate.toISOString()
        },
        {
          id: 2,
          status: 'pending',
          timestamp: oldDate.toISOString()
        },
        {
          id: 3,
          status: 'synced',
          timestamp: new Date().toISOString()
        }
      ];

      offlineService.db = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            index: jest.fn().mockReturnValue({
              getAll: jest.fn().mockResolvedValue(mockActions)
            }),
            delete: jest.fn().mockResolvedValue(true)
          })
        })
      };
    });

    it('should cleanup old synced data', async () => {
      await offlineService.cleanupOldData(30);

      const transaction = offlineService.db.transaction();
      const store = transaction.objectStore();

      // Solo debería eliminar acciones sincronizadas antiguas
      expect(store.delete).toHaveBeenCalledWith(1);
      expect(store.delete).not.toHaveBeenCalledWith(2); // Pendiente, no eliminar
      expect(store.delete).not.toHaveBeenCalledWith(3); // Reciente, no eliminar
    });
  });

  describe('Error Handling', () => {
    it('should handle database initialization errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock failed database initialization
      const originalIDB = global.indexedDB;
      global.indexedDB = {
        open: jest.fn().mockImplementation(() => {
          throw new Error('DB Error');
        })
      };

      try {
        await offlineService.initializeDatabase();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error inicializando base de datos offline:',
          expect.any(Error)
        );
      } finally {
        global.indexedDB = originalIDB;
        consoleSpy.mockRestore();
      }
    });

    it('should handle save action errors gracefully', async () => {
      offlineService.db = {
        add: jest.fn().mockRejectedValue(new Error('Storage full'))
      };

      const action = { type: 'test', data: {} };

      await expect(offlineService.saveOfflineAction(action))
        .rejects.toThrow('Storage full');
    });

    it('should return empty arrays on database errors', async () => {
      offlineService.db = {
        transaction: jest.fn().mockImplementation(() => {
          throw new Error('DB Error');
        })
      };

      const scores = await offlineService.getOfflineScores();
      expect(scores).toEqual([]);
    });
  });
});