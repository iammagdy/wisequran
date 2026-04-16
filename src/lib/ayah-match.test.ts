import { describe, it, expect } from "vitest";
import { scoreAyahMatch } from "./ayah-match";

describe("Arabic normalization — Alef variants", () => {
  it("treats أ, إ, آ, ٱ, and ا as the same letter by default", () => {
    const reference = "إن الله مع الصابرين";
    const spoken = "ان الله مع الصابرين";
    const { score } = scoreAyahMatch(reference, spoken);
    expect(score).toBeGreaterThanOrEqual(95);
  });

  it("matches dagger-alef normalized input", () => {
    const reference = "ٱلحمد لله";
    const spoken = "الحمد لله";
    const { score } = scoreAyahMatch(reference, spoken);
    expect(score).toBeGreaterThanOrEqual(95);
  });
});

describe("Arabic normalization — lenient flag", () => {
  it("collapses ى ↔ ي and ة ↔ ه only in lenient mode, and differs from strict", () => {
    const reference = "على الذين هداه";
    const spoken = "علي الذين هداة";

    const strict = scoreAyahMatch(reference, spoken, false).score;
    const lenient = scoreAyahMatch(reference, spoken, true).score;

    expect(lenient).toBeGreaterThan(strict);
    expect(lenient).toBeGreaterThanOrEqual(90);
  });
});
