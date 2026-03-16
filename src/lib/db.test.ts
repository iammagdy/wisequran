import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkStorageQuota } from './db';

describe('checkStorageQuota', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      ...global.navigator,
      storage: {
        estimate: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('handles error when navigator.storage.estimate throws', async () => {
    vi.mocked(navigator.storage.estimate).mockRejectedValue(new Error('Storage error'));

    const result = await checkStorageQuota();

    expect(result.usage).toBe(0);
    expect(result.quota).toBe(0);
    expect(result.available).toBe(0);
    expect(result.percentUsed).toBe(0);
    expect(result.hasEnoughSpace(100)).toBe(true);
  });

  it('calculates quota properly when estimate succeeds', async () => {
    vi.mocked(navigator.storage.estimate).mockResolvedValue({
      usage: 50,
      quota: 100,
    });

    const result = await checkStorageQuota();

    expect(result.usage).toBe(50);
    expect(result.quota).toBe(100);
    expect(result.available).toBe(50);
    expect(result.percentUsed).toBe(50);
    expect(result.hasEnoughSpace(40)).toBe(true); // 50 > 40 * 1.1 (44)
    expect(result.hasEnoughSpace(46)).toBe(false); // 50 < 46 * 1.1 (50.6)
  });

  it('handles undefined estimate.usage or estimate.quota', async () => {
    vi.mocked(navigator.storage.estimate).mockResolvedValue({});

    const result = await checkStorageQuota();

    expect(result.usage).toBe(0);
    expect(result.quota).toBe(0);
    expect(result.available).toBe(0);
    expect(result.percentUsed).toBe(0);
    expect(result.hasEnoughSpace(100)).toBe(false); // 0 > 100 * 1.1 -> false
  });

  it('handles undefined navigator.storage', async () => {
    vi.stubGlobal('navigator', {
      ...global.navigator,
      storage: undefined,
    });

    const result = await checkStorageQuota();

    expect(result.usage).toBe(0);
    expect(result.quota).toBe(0);
    expect(result.available).toBe(0);
    expect(result.percentUsed).toBe(0);
    expect(result.hasEnoughSpace(100)).toBe(true);
  });
});
