import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getDailyAyahCacheKey } from './daily-ayah';

describe('getDailyAyahCacheKey', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate a correct cache key for a specific date (January 1st)', () => {
    const date = new Date(2024, 0, 1); // January 1, 2024
    expect(getDailyAyahCacheKey(date)).toBe('wise-daily-ayah-2024-0-1');
  });

  it('should generate a correct cache key for a specific date (December 31st)', () => {
    const date = new Date(2023, 11, 31); // December 31, 2023
    expect(getDailyAyahCacheKey(date)).toBe('wise-daily-ayah-2023-11-31');
  });

  it('should generate a correct cache key for a leap year date (February 29th)', () => {
    const date = new Date(2024, 1, 29); // February 29, 2024
    expect(getDailyAyahCacheKey(date)).toBe('wise-daily-ayah-2024-1-29');
  });

  it('should default to the current date if no date is provided', () => {
    const mockDate = new Date(2025, 5, 15); // June 15, 2025
    vi.setSystemTime(mockDate);
    expect(getDailyAyahCacheKey()).toBe('wise-daily-ayah-2025-5-15');
  });
});
