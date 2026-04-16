import { describe, it, expect } from "vitest";
import { getTimezoneOffset, calculatePrayerTimes } from "./prayer-times";

describe("getTimezoneOffset", () => {
  it("takes the target date so DST-sensitive days produce the right offset", () => {
    const summer = new Date("2025-07-01T12:00:00Z");
    const winter = new Date("2025-01-01T12:00:00Z");
    const summerOffset = getTimezoneOffset(summer);
    const winterOffset = getTimezoneOffset(winter);
    expect(typeof summerOffset).toBe("number");
    expect(typeof winterOffset).toBe("number");
    expect(summerOffset).toBe(-(summer.getTimezoneOffset() / 60));
    expect(winterOffset).toBe(-(winter.getTimezoneOffset() / 60));
  });
});

describe("calculatePrayerTimes DST", () => {
  it("produces stable HH:MM strings for both a summer and winter date", () => {
    const summer = calculatePrayerTimes(new Date("2025-07-01T12:00:00Z"), {
      latitude: 30.0444,
      longitude: 31.2357,
    });
    const winter = calculatePrayerTimes(new Date("2025-01-01T12:00:00Z"), {
      latitude: 30.0444,
      longitude: 31.2357,
    });
    for (const key of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
      expect(summer[key]).toMatch(/^\d{2}:\d{2}$/);
      expect(winter[key]).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});
