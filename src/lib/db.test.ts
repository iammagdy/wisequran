import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('db.ts', () => {
  describe('verifyAudioExists', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('should return false when getting DB throws an error', async () => {
      // Create a specific test context where idb throws
      vi.doMock('idb', () => ({
        openDB: vi.fn().mockRejectedValue(new Error('IndexedDB not supported'))
      }));

      // We need to re-import the module to get the new mock
      const { verifyAudioExists } = await import('./db');

      const result = await verifyAudioExists('reciter-1', 1);

      expect(result).toBe(false);
    });

    it('should return false when DB get throws an error', async () => {
      vi.doMock('idb', () => ({
        openDB: vi.fn().mockResolvedValue({
          get: vi.fn().mockRejectedValue(new Error('DB read error'))
        })
      }));

      const { verifyAudioExists } = await import('./db');

      const result = await verifyAudioExists('reciter-1', 1);

      expect(result).toBe(false);
    });

    it('should return true when audio exists and has data', async () => {
      vi.doMock('idb', () => ({
        openDB: vi.fn().mockResolvedValue({
          get: vi.fn().mockResolvedValue({
            data: new ArrayBuffer(10)
          })
        })
      }));

      const { verifyAudioExists } = await import('./db');

      const result = await verifyAudioExists('reciter-1', 1);

      expect(result).toBe(true);
    });

    it('should return false when audio entry exists but data is empty', async () => {
      vi.doMock('idb', () => ({
        openDB: vi.fn().mockResolvedValue({
          get: vi.fn().mockResolvedValue({
            data: new ArrayBuffer(0)
          })
        })
      }));

      const { verifyAudioExists } = await import('./db');

      const result = await verifyAudioExists('reciter-1', 1);

      expect(result).toBe(false);
    });

    it('should return false when audio entry does not exist', async () => {
      vi.doMock('idb', () => ({
        openDB: vi.fn().mockResolvedValue({
          get: vi.fn().mockResolvedValue(undefined)
        })
      }));

      const { verifyAudioExists } = await import('./db');

      const result = await verifyAudioExists('reciter-1', 1);

      expect(result).toBe(false);
    });
  });
});
