import { describe, it, expect } from "vitest";
import { getDayName } from "./utils";

describe("getDayName", () => {
  it("returns correct English day names when language is 'en'", () => {
    expect(getDayName(0, "en")).toBe("Sunday");
    expect(getDayName(1, "en")).toBe("Monday");
    expect(getDayName(2, "en")).toBe("Tuesday");
    expect(getDayName(3, "en")).toBe("Wednesday");
    expect(getDayName(4, "en")).toBe("Thursday");
    expect(getDayName(5, "en")).toBe("Friday");
    expect(getDayName(6, "en")).toBe("Saturday");
  });

  it("returns correct Arabic day names when language is 'ar'", () => {
    expect(getDayName(0, "ar")).toBe("الأحد");
    expect(getDayName(1, "ar")).toBe("الإثنين");
    expect(getDayName(2, "ar")).toBe("الثلاثاء");
    expect(getDayName(3, "ar")).toBe("الأربعاء");
    expect(getDayName(4, "ar")).toBe("الخميس");
    expect(getDayName(5, "ar")).toBe("الجمعة");
    expect(getDayName(6, "ar")).toBe("السبت");
  });

  it("returns correct Arabic day names when language is not 'en'", () => {
    expect(getDayName(0, "fr")).toBe("الأحد");
    expect(getDayName(5, "es")).toBe("الجمعة");
  });

  it("handles out-of-bounds day indices correctly", () => {
    expect(getDayName(-1, "en")).toBe("");
    expect(getDayName(7, "en")).toBe("");
    expect(getDayName(-1, "ar")).toBe("");
    expect(getDayName(7, "ar")).toBe("");
  });
});
