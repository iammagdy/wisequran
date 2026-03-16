import { describe, it, expect } from "vitest";
import { toArabicNumerals } from "./utils";

describe("toArabicNumerals", () => {
  it("converts single digits correctly", () => {
    expect(toArabicNumerals("0")).toBe("٠");
    expect(toArabicNumerals("1")).toBe("١");
    expect(toArabicNumerals("2")).toBe("٢");
    expect(toArabicNumerals("3")).toBe("٣");
    expect(toArabicNumerals("4")).toBe("٤");
    expect(toArabicNumerals("5")).toBe("٥");
    expect(toArabicNumerals("6")).toBe("٦");
    expect(toArabicNumerals("7")).toBe("٧");
    expect(toArabicNumerals("8")).toBe("٨");
    expect(toArabicNumerals("9")).toBe("٩");
  });

  it("converts multiple digits in a string", () => {
    expect(toArabicNumerals("0123456789")).toBe("٠١٢٣٤٥٦٧٨٩");
    expect(toArabicNumerals("9876543210")).toBe("٩٨٧٦٥٤٣٢١٠");
    expect(toArabicNumerals("2024")).toBe("٢٠٢٤");
  });

  it("handles numbers as input", () => {
    expect(toArabicNumerals(0)).toBe("٠");
    expect(toArabicNumerals(123)).toBe("١٢٣");
    expect(toArabicNumerals(2024)).toBe("٢٠٢٤");
  });

  it("preserves non-digit characters", () => {
    expect(toArabicNumerals("Page 1 of 10")).toBe("Page ١ of ١٠");
    expect(toArabicNumerals("Chapter 2, Verse 255")).toBe("Chapter ٢, Verse ٢٥٥");
    expect(toArabicNumerals("Surah Al-Baqarah (2)")).toBe("Surah Al-Baqarah (٢)");
    expect(toArabicNumerals("No digits here")).toBe("No digits here");
  });

  it("handles empty strings", () => {
    expect(toArabicNumerals("")).toBe("");
  });
});
