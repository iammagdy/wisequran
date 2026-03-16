const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g;
const ARABIC_TATWEEL = /\u0640/g;
const EXTRA_WHITESPACE = /\s+/g;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
const LAM_ALEF = /[\uFEFB\uFEFC\uFEF7\uFEF8\uFEF5\uFEF6]/g;

export function normalizeArabic(text: string): string {
  return text
    .replace(ZERO_WIDTH, "")
    .replace(LAM_ALEF, "\u0644\u0627")
    .replace(ARABIC_DIACRITICS, "")
    .replace(ARABIC_TATWEEL, "")
    .replace(EXTRA_WHITESPACE, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeArabic(text).split(" ").filter(Boolean);
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }

  return dp[b.length];
}

function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = editDistance(a, b);
  return Math.max(0, 1 - dist / maxLen);
}

export interface WordDiff {
  expected: string;
  spoken: string | null;
  matchScore: number;
}

export function scoreAyahMatch(
  expected: string,
  spoken: string
): { score: number; wordDiffs: WordDiff[] } {
  const expectedTokens = tokenize(expected);
  const spokenTokens = tokenize(spoken);

  if (expectedTokens.length === 0) return { score: 100, wordDiffs: [] };
  if (spokenTokens.length === 0) {
    return {
      score: 0,
      wordDiffs: expectedTokens.map(w => ({ expected: w, spoken: null, matchScore: 0 })),
    };
  }

  const wordDiffs: WordDiff[] = [];
  const usedSpoken = new Set<number>();
  let totalScore = 0;

  for (const expToken of expectedTokens) {
    let bestSim = 0;
    let bestIdx = -1;
    let bestSpokenWord = "";

    for (let si = 0; si < spokenTokens.length; si++) {
      if (usedSpoken.has(si)) continue;
      const sim = wordSimilarity(expToken, spokenTokens[si]);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = si;
        bestSpokenWord = spokenTokens[si];
      }
    }

    const ACCEPT_THRESHOLD = 0.72;

    if (bestIdx !== -1 && bestSim >= ACCEPT_THRESHOLD) {
      totalScore += bestSim;
      usedSpoken.add(bestIdx);
      wordDiffs.push({ expected: expToken, spoken: bestSpokenWord, matchScore: Math.round(bestSim * 100) });
    } else {
      wordDiffs.push({ expected: expToken, spoken: null, matchScore: 0 });
    }
  }

  return {
    score: Math.round((totalScore / expectedTokens.length) * 100),
    wordDiffs,
  };
}

export interface AyahScoreResult {
  ayahScore: number;
  isCorrect: boolean;
  wordDiffs: WordDiff[];
}

export type StrictnessLevel = "lenient" | "normal" | "strict";

const STRICTNESS_THRESHOLD: Record<StrictnessLevel, number> = {
  lenient: 55,
  normal: 72,
  strict: 88,
};

export function scoreAyah(
  expectedText: string,
  spokenText: string,
  strictness: StrictnessLevel = "normal"
): AyahScoreResult {
  const { score, wordDiffs } = scoreAyahMatch(expectedText, spokenText);
  return {
    ayahScore: score,
    isCorrect: score >= STRICTNESS_THRESHOLD[strictness],
    wordDiffs,
  };
}

export interface PerAyahScoreResult {
  numberInSurah: number;
  score: number;
  isCorrect: boolean;
  wordDiffs: WordDiff[];
}

export function scoreRangeRecitation(
  ayahs: { text: string; numberInSurah: number }[],
  spokenTranscript: string,
  strictness: StrictnessLevel = "normal"
): {
  overallScore: number;
  correctAyahs: number;
  perAyah: PerAyahScoreResult[];
} {
  if (ayahs.length === 0 || !spokenTranscript.trim()) {
    return { overallScore: 0, correctAyahs: 0, perAyah: [] };
  }

  const spokenWords = tokenize(spokenTranscript);
  const perAyah: PerAyahScoreResult[] = [];
  let correctAyahs = 0;
  let pointer = 0;

  for (let i = 0; i < ayahs.length; i++) {
    const ayah = ayahs[i];
    const ayahWords = tokenize(ayah.text);
    const ayahWordCount = ayahWords.length;

    if (pointer >= spokenWords.length) {
      const { wordDiffs } = scoreAyahMatch(ayah.text, "");
      perAyah.push({ numberInSurah: ayah.numberInSurah, score: 0, isCorrect: false, wordDiffs });
      continue;
    }

    const windowSize = ayahWordCount;
    const slack = Math.ceil(ayahWordCount * 0.4);

    let bestScore = -1;
    let bestWordDiffs: WordDiff[] = [];
    let bestWindowStart = pointer;

    const searchStart = Math.max(0, pointer - Math.ceil(slack / 2));
    const maxWindowStart = Math.min(spokenWords.length - 1, pointer + slack);

    for (let ws = searchStart; ws <= maxWindowStart; ws++) {
      const we = Math.min(spokenWords.length, ws + windowSize + slack);
      const slice = spokenWords.slice(ws, we).join(" ");
      const { score, wordDiffs } = scoreAyahMatch(ayah.text, slice);
      if (score > bestScore) {
        bestScore = score;
        bestWordDiffs = wordDiffs;
        bestWindowStart = ws;
      }
    }

    const consumed = Math.min(
      spokenWords.length,
      bestWindowStart + windowSize
    );
    pointer = consumed;

    const isCorrect = bestScore >= STRICTNESS_THRESHOLD[strictness];
    if (isCorrect) correctAyahs++;

    perAyah.push({
      numberInSurah: ayah.numberInSurah,
      score: bestScore < 0 ? 0 : bestScore,
      isCorrect,
      wordDiffs: bestWordDiffs,
    });
  }

  const overallScore = perAyah.length > 0
    ? Math.round(perAyah.reduce((sum, a) => sum + a.score, 0) / perAyah.length)
    : 0;

  return { overallScore, correctAyahs, perAyah };
}

export function scoreCurrentAyah(
  ayahText: string,
  spokenWords: string[],
  pointer: number,
  strictness: StrictnessLevel
): { score: number; isCorrect: boolean; wordDiffs: WordDiff[]; wordsConsumed: number } {
  const ayahWords = tokenize(ayahText);
  const ayahWordCount = ayahWords.length;

  const remaining = spokenWords.slice(pointer);
  const windowSize = ayahWordCount + Math.ceil(ayahWordCount * 0.5);
  const slice = remaining.slice(0, windowSize).join(" ");

  const { score, wordDiffs } = scoreAyahMatch(ayahText, slice);
  const isCorrect = score >= STRICTNESS_THRESHOLD[strictness];

  return {
    score,
    isCorrect,
    wordDiffs,
    wordsConsumed: Math.min(remaining.length, ayahWordCount),
  };
}
