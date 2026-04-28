import { describe, it, expect } from "vitest";
import { computeAdjustedTimerSeconds } from "./sleep-mode-player";

describe("computeAdjustedTimerSeconds", () => {
  it("logs an immediate scrub-down as the new remaining (30m -> 8m left = 480s)", () => {
    const totalSecs = 30 * 60;
    const previousRemaining = totalSecs;
    const newRemaining = 8 * 60;
    expect(
      computeAdjustedTimerSeconds(totalSecs, previousRemaining, newRemaining),
    ).toBe(480);
  });

  it("logs a mid-session scrub as elapsed + new remaining (5m elapsed, scrub to 10m left = 900s)", () => {
    const totalSecs = 30 * 60;
    const previousRemaining = totalSecs - 5 * 60;
    const newRemaining = 10 * 60;
    expect(
      computeAdjustedTimerSeconds(totalSecs, previousRemaining, newRemaining),
    ).toBe(900);
  });

  it("logs a scrub-up as elapsed + extended remaining (10m elapsed, scrub to 25m left = 35m)", () => {
    const totalSecs = 30 * 60;
    const previousRemaining = totalSecs - 10 * 60;
    const newRemaining = 25 * 60;
    expect(
      computeAdjustedTimerSeconds(totalSecs, previousRemaining, newRemaining),
    ).toBe(35 * 60);
  });

  it("clamps a scrub past zero remaining to the elapsed amount (15m elapsed, scrub to -1m = 15m)", () => {
    const totalSecs = 30 * 60;
    const previousRemaining = totalSecs - 15 * 60;
    expect(
      computeAdjustedTimerSeconds(totalSecs, previousRemaining, -60),
    ).toBe(15 * 60);
  });

  it("clamps a scrub past full duration to the original total (immediate scrub to 99m on a 30m session = 30m)", () => {
    const totalSecs = 30 * 60;
    expect(
      computeAdjustedTimerSeconds(totalSecs, totalSecs, 99 * 60),
    ).toBe(totalSecs);
  });

  it("does not collapse to the original total when previousRemaining < totalSecs", () => {
    const totalSecs = 30 * 60;
    const previousRemaining = 20 * 60;
    const newRemaining = 5 * 60;
    expect(
      computeAdjustedTimerSeconds(totalSecs, previousRemaining, newRemaining),
    ).not.toBe(totalSecs);
    expect(
      computeAdjustedTimerSeconds(totalSecs, previousRemaining, newRemaining),
    ).toBe(15 * 60);
  });
});
