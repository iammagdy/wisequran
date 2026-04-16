import { describe, it, expect } from "vitest";
import { getTimezoneOffset, calculatePrayerTimes } from "./prayer-times";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

describe("getTimezoneOffset", () => {
  it("takes the target date, so summer and winter dates each get their own offset", () => {
    const summer = new Date("2025-07-01T12:00:00Z");
    const winter = new Date("2025-01-01T12:00:00Z");
    expect(getTimezoneOffset(summer)).toBe(-(summer.getTimezoneOffset() / 60));
    expect(getTimezoneOffset(winter)).toBe(-(winter.getTimezoneOffset() / 60));
  });
});

describe("calculatePrayerTimes DST awareness", () => {
  const LAT = 30.0444;
  const LNG = 31.2357;

  it("returns valid HH:MM strings regardless of season", () => {
    for (const iso of ["2025-01-15T12:00:00Z", "2025-07-15T12:00:00Z"]) {
      const t = calculatePrayerTimes(new Date(iso), { latitude: LAT, longitude: LNG });
      for (const k of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
        expect(t[k]).toMatch(/^\d{2}:\d{2}$/);
      }
    }
  });

  it("produces consistent times across consecutive days that do not cross DST (same tz)", () => {
    const day1 = calculatePrayerTimes(new Date("2025-07-10T12:00:00Z"), {
      latitude: LAT, longitude: LNG, timezone: 2,
    });
    const day2 = calculatePrayerTimes(new Date("2025-07-11T12:00:00Z"), {
      latitude: LAT, longitude: LNG, timezone: 2,
    });
    expect(Math.abs(toMinutes(day1.dhuhr) - toMinutes(day2.dhuhr))).toBeLessThanOrEqual(2);
  });

  it("shifts dhuhr by ~60 minutes when the passed timezone changes by 1 hour (simulates DST transition)", () => {
    const stTz = calculatePrayerTimes(new Date("2025-03-30T12:00:00Z"), {
      latitude: 51.5074, longitude: -0.1278, timezone: 0,
    });
    const dstTz = calculatePrayerTimes(new Date("2025-03-30T12:00:00Z"), {
      latitude: 51.5074, longitude: -0.1278, timezone: 1,
    });
    const diff = toMinutes(dstTz.dhuhr) - toMinutes(stTz.dhuhr);
    expect(Math.abs(diff - 60)).toBeLessThanOrEqual(2);
  });

  it("uses the date's own offset (regression: previously used today's offset for any date)", () => {
    const sameDate = new Date("2025-07-10T12:00:00Z");
    const explicit = calculatePrayerTimes(sameDate, {
      latitude: LAT, longitude: LNG, timezone: getTimezoneOffset(sameDate),
    });
    const implicit = calculatePrayerTimes(sameDate, { latitude: LAT, longitude: LNG });
    expect(implicit.fajr).toBe(explicit.fajr);
    expect(implicit.dhuhr).toBe(explicit.dhuhr);
    expect(implicit.asr).toBe(explicit.asr);
    expect(implicit.maghrib).toBe(explicit.maghrib);
    expect(implicit.isha).toBe(explicit.isha);
  });
});
