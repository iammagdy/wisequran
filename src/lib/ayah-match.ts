const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g;
const ARABIC_TATWEEL = /\u0640/g;
const EXTRA_WHITESPACE = /\s+/g;

const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g;
const WAW_VARIANTS = /[\u0624]/g;
const YA_VARIANTS = /[\u0626\u0649]/g;
const TA_MARBUTA = /\u0629/g;
const HA = /\u0647/g;

export function normalizeArabic(text: string): string {
  return text
    .replace(ARABIC_DIACRITICS, "")
    .replace(ARABIC_TATWEEL, "")
    .replace(ALEF_VARIANTS, "\u0627")
    .replace(WAW_VARIANTS, "\u0648")
    .replace(YA_VARIANTS, "\u064A")
    .replace(TA_MARBUTA, "\u0647")
    .replace(HA, "\u0647")
    .replace(EXTRA_WHITESPACE, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeArabic(text).split(" ").filter(Boolean);
}

export function scoreAyahMatch(expected: string, spoken: string): number {
  const expectedTokens = tokenize(expected);
  const spokenTokens = tokenize(spoken);

  if (expectedTokens.length === 0) return 100;
  if (spokenTokens.length === 0) return 0;

  let matched = 0;
  const usedSpoken = new Set<number>();

  for (const expToken of expectedTokens) {
    for (let si = 0; si < spokenTokens.length; si++) {
      if (usedSpoken.has(si)) continue;
      if (spokenTokens[si] === expToken) {
        matched++;
        usedSpoken.add(si);
        break;
      }
    }
  }

  return Math.round((matched / expectedTokens.length) * 100);
}

export interface AyahScoreResult {
  ayahScore: number;
  isCorrect: boolean;
}

export function scoreAyah(expectedText: string, spokenText: string): AyahScoreResult {
  const ayahScore = scoreAyahMatch(expectedText, spokenText);
  return {
    ayahScore,
    isCorrect: ayahScore >= 70,
  };
}

export function scoreRangeRecitation(
  ayahs: { text: string; numberInSurah: number }[],
  spokenTranscript: string
): {
  overallScore: number;
  correctAyahs: number;
  perAyah: { numberInSurah: number; score: number; isCorrect: boolean }[];
} {
  if (ayahs.length === 0 || !spokenTranscript.trim()) {
    return { overallScore: 0, correctAyahs: 0, perAyah: [] };
  }

  const normalizedSpoken = normalizeArabic(spokenTranscript);
  const spokenWords = normalizedSpoken.split(" ").filter(Boolean);

  const totalWords = ayahs.reduce((sum, a) => sum + tokenize(a.text).length, 0);
  const wordsPerAyah = totalWords > 0 ? spokenWords.length / ayahs.length : 0;

  const perAyah: { numberInSurah: number; score: number; isCorrect: boolean }[] = [];
  let correctAyahs = 0;
  let wordOffset = 0;

  for (const ayah of ayahs) {
    const ayahWordCount = tokenize(ayah.text).length;
    const estimatedEnd = Math.min(
      wordOffset + Math.ceil(ayahWordCount * 1.5),
      spokenWords.length
    );
    const ayahSpokenSlice = spokenWords.slice(
      Math.max(0, wordOffset - Math.floor(wordsPerAyah * 0.3)),
      estimatedEnd
    ).join(" ");

    const { ayahScore, isCorrect } = scoreAyah(ayah.text, ayahSpokenSlice);
    perAyah.push({ numberInSurah: ayah.numberInSurah, score: ayahScore, isCorrect });
    if (isCorrect) correctAyahs++;
    wordOffset += ayahWordCount;
  }

  const overallScore = Math.round(
    perAyah.reduce((sum, a) => sum + a.score, 0) / perAyah.length
  );

  return { overallScore, correctAyahs, perAyah };
}
