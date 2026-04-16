import { describe, it, expect } from "vitest";
import { getToday, daysBetween } from "./useHifzStreak";

describe("getToday", () => {
  it("returns a local yyyy-mm-dd string", () => {
    const today = getToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const [y, m, d] = today.split("-").map(Number);
    const now = new Date();
    expect(y).toBe(now.getFullYear());
    expect(m).toBe(now.getMonth() + 1);
    expect(d).toBe(now.getDate());
  });
});

describe("daysBetween", () => {
  it("treats a DST spring-forward day as exactly one day", () => {
    expect(daysBetween("2025-03-08", "2025-03-09")).toBe(1);
  });

  it("treats a DST fall-back day as exactly one day", () => {
    expect(daysBetween("2025-11-01", "2025-11-02")).toBe(1);
  });

  it("computes multi-day spans across DST boundaries", () => {
    expect(daysBetween("2025-03-07", "2025-03-10")).toBe(3);
    expect(daysBetween("2025-10-31", "2025-11-03")).toBe(3);
  });

  it("returns 0 for the same date", () => {
    expect(daysBetween("2025-06-15", "2025-06-15")).toBe(0);
  });
});
