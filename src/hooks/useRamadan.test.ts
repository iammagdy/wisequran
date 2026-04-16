import { describe, it, expect, beforeEach } from "vitest";
import { getHijriOffsetDays, setHijriOffsetDays } from "./useRamadan";

describe("Hijri offset helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to 0 when nothing is stored", () => {
    expect(getHijriOffsetDays()).toBe(0);
  });

  it("persists valid offsets within ±2 range", () => {
    setHijriOffsetDays(1);
    expect(getHijriOffsetDays()).toBe(1);
    setHijriOffsetDays(-2);
    expect(getHijriOffsetDays()).toBe(-2);
  });

  it("clamps out-of-range values to ±2", () => {
    setHijriOffsetDays(5);
    expect(getHijriOffsetDays()).toBe(2);
    setHijriOffsetDays(-100);
    expect(getHijriOffsetDays()).toBe(-2);
  });

  it("rounds non-integer inputs", () => {
    setHijriOffsetDays(1.4 as unknown as number);
    expect(getHijriOffsetDays()).toBe(1);
  });

  it("returns 0 when stored value is not a number", () => {
    localStorage.setItem("wise-hijri-offset", "notanumber");
    expect(getHijriOffsetDays()).toBe(0);
  });
});
