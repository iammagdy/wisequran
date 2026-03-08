import { getReciterById } from "./reciters";

export interface AyahTimestamp {
  /** e.g. "1:3" = surah 1, ayah 3 */
  verseKey: string;
  /** ayah number in surah */
  numberInSurah: number;
  /** start time in milliseconds */
  from: number;
  /** end time in milliseconds */
  to: number;
}

export interface QFChapterRecitation {
  audioUrl: string;
  timestamps: AyahTimestamp[];
}

// In-memory cache: "reciterId-surahNumber" -> data
const cache = new Map<string, QFChapterRecitation>();

function cacheKey(reciterId: string, surahNumber: number) {
  return `${reciterId}-${surahNumber}`;
}

/**
 * Fetch chapter recitation data (audio URL + per-ayah timestamps) from
 * the Quran Foundation API. Returns null if the reciter has no qfApiId.
 */
export async function fetchChapterRecitation(
  reciterId: string,
  surahNumber: number
): Promise<QFChapterRecitation | null> {
  const reciter = getReciterById(reciterId);
  if (!reciter.qfApiId) return null;

  const key = cacheKey(reciterId, surahNumber);
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `https://api.quran.com/api/v4/chapter_recitations/${reciter.qfApiId}/${surahNumber}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  const recitation = json.audio_file;
  if (!recitation) return null;

  // Parse timestamps from the verse_timings array
  const timings: { verse_key: string; timestamp_from: number; timestamp_to: number }[] =
    recitation.verse_timings || [];

  const timestamps: AyahTimestamp[] = timings.map((t) => {
    const parts = t.verse_key.split(":");
    return {
      verseKey: t.verse_key,
      numberInSurah: Number(parts[1]),
      from: t.timestamp_from,
      to: t.timestamp_to,
    };
  });

  const result: QFChapterRecitation = {
    audioUrl: recitation.audio_url.startsWith("http")
      ? recitation.audio_url
      : `https://download.quranicaudio.com/${recitation.audio_url}`,
    timestamps,
  };

  cache.set(key, result);
  return result;
}

/**
 * Binary search to find which ayah is currently playing based on time in ms.
 * Returns the numberInSurah, or null if not found.
 */
export function findCurrentAyahByTime(
  timestamps: AyahTimestamp[],
  currentTimeMs: number
): number | null {
  if (timestamps.length === 0) return null;

  // Simple linear scan is fine for ≤286 items and runs ~60 times/sec
  for (const t of timestamps) {
    if (currentTimeMs >= t.from && currentTimeMs < t.to) {
      return t.numberInSurah;
    }
  }

  // If past the last timestamp's start, it's the last ayah
  const last = timestamps[timestamps.length - 1];
  if (currentTimeMs >= last.from) return last.numberInSurah;

  return null;
}
