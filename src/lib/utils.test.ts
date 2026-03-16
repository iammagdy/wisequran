import { describe, it, expect } from "vitest";
import { stripBismillah } from "./utils";

describe("stripBismillah", () => {
  it("should not strip anything if ayahNumber is not 1", () => {
    const text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ test";
    expect(stripBismillah(text, 2, 2)).toBe(text);
  });

  it("should not strip anything if surahNumber is 1 (Al-Fatihah)", () => {
    const text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    expect(stripBismillah(text, 1, 1)).toBe(text);
  });

  it("should not strip anything if surahNumber is 9 (At-Tawbah)", () => {
    const text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    expect(stripBismillah(text, 9, 1)).toBe(text);
  });

  it("should strip Bismillah with full diacritics for a normal surah's first ayah", () => {
    const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    const actualText = "الٓمٓ";
    const text = `${bismillah} ${actualText}`;
    expect(stripBismillah(text, 2, 1)).toBe(actualText);
  });

  it("should strip Bismillah with another common spelling/diacritics", () => {
    const bismillah = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";
    const actualText = "ذَٰلِكَ";
    const text = `${bismillah} ${actualText}`;
    expect(stripBismillah(text, 2, 1)).toBe(actualText);
  });

  it("should use fallback to strip simple 'بسم الله الرحمن الرحيم' without diacritics", () => {
    const text = "بسم الله الرحمن الرحيم الحمد لله";
    expect(stripBismillah(text, 2, 1)).toBe("الحمد لله");
  });

  it("should use fallback to strip exactly 4 words if 'بسم' and 'الله' are present", () => {
    const text = "بسم الله الرحمن الرحيم قل هو الله احد";
    expect(stripBismillah(text, 112, 1)).toBe("قل هو الله احد");
  });

  it("should not strip if the text doesn't contain Bismillah", () => {
    const text = "وَالضُّحَىٰ";
    expect(stripBismillah(text, 93, 1)).toBe(text);
  });
});
