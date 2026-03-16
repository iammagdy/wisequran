import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDailyAyahReference, getDailyAyahCacheKey } from "./daily-ayah";

describe("daily-ayah", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getDailyAyahReference", () => {
    it("should return a valid ayah reference for a given date", () => {
      const date = new Date(2024, 0, 1); // Jan 1, 2024
      const ref = getDailyAyahReference(date);

      expect(ref).toBeDefined();
      expect(ref.surah).toBeTypeOf("number");
      expect(ref.ayah).toBeTypeOf("number");
    });

    it("should return consistent results for the same date", () => {
      const date1 = new Date(2024, 5, 15);
      const date2 = new Date(2024, 5, 15);

      expect(getDailyAyahReference(date1)).toEqual(getDailyAyahReference(date2));
    });

    it("should return different results for consecutive days", () => {
      const date1 = new Date(2024, 5, 15);
      const date2 = new Date(2024, 5, 16);

      expect(getDailyAyahReference(date1)).not.toEqual(getDailyAyahReference(date2));
    });

    it("should handle leap years correctly", () => {
      const leapDay = new Date(2024, 1, 29); // Feb 29, 2024
      const nextDay = new Date(2024, 2, 1); // Mar 1, 2024

      expect(getDailyAyahReference(leapDay)).toBeDefined();
      expect(getDailyAyahReference(nextDay)).toBeDefined();
      expect(getDailyAyahReference(leapDay)).not.toEqual(getDailyAyahReference(nextDay));
    });

    it("should handle beginning and end of year", () => {
      const startOfYear = new Date(2024, 0, 1); // Jan 1, 2024
      const endOfYear = new Date(2024, 11, 31); // Dec 31, 2024

      expect(getDailyAyahReference(startOfYear)).toBeDefined();
      expect(getDailyAyahReference(endOfYear)).toBeDefined();
      expect(getDailyAyahReference(startOfYear)).not.toEqual(getDailyAyahReference(endOfYear));
    });

    it("should use current date if no date is provided", () => {
      const mockDate = new Date(2024, 3, 10);
      vi.setSystemTime(mockDate);

      expect(getDailyAyahReference()).toEqual(getDailyAyahReference(mockDate));
    });
  });

  describe("getDailyAyahCacheKey", () => {
    it("should generate a consistent cache key for a given date", () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      const key = getDailyAyahCacheKey(date);

      // Note: getMonth is 0-indexed, so June is 5
      expect(key).toBe("wise-daily-ayah-2024-5-15");
    });

    it("should use current date if no date is provided", () => {
      const mockDate = new Date(2024, 3, 10); // April 10, 2024
      vi.setSystemTime(mockDate);

      expect(getDailyAyahCacheKey()).toBe("wise-daily-ayah-2024-3-10");
    });
  });
});
