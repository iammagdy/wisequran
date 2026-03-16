import { describe, it, expect } from "vitest";
import { getArabicDayName } from "../utils";

describe("getArabicDayName", () => {
  it("should return the correct Arabic day name for valid indices (0-6)", () => {
    expect(getArabicDayName(0)).toBe("الأحد");
    expect(getArabicDayName(1)).toBe("الإثنين");
    expect(getArabicDayName(2)).toBe("الثلاثاء");
    expect(getArabicDayName(3)).toBe("الأربعاء");
    expect(getArabicDayName(4)).toBe("الخميس");
    expect(getArabicDayName(5)).toBe("الجمعة");
    expect(getArabicDayName(6)).toBe("السبت");
  });

  it("should return an empty string for out-of-bounds negative indices", () => {
    expect(getArabicDayName(-1)).toBe("");
    expect(getArabicDayName(-10)).toBe("");
  });

  it("should return an empty string for out-of-bounds positive indices (>6)", () => {
    expect(getArabicDayName(7)).toBe("");
    expect(getArabicDayName(10)).toBe("");
  });

  it("should return an empty string for floating point numbers", () => {
    expect(getArabicDayName(1.5)).toBe("");
    expect(getArabicDayName(3.14)).toBe("");
  });

  it("should return an empty string for NaN", () => {
    expect(getArabicDayName(NaN)).toBe("");
  });

  it("should return an empty string for Infinity and -Infinity", () => {
    expect(getArabicDayName(Infinity)).toBe("");
    expect(getArabicDayName(-Infinity)).toBe("");
  });
});
