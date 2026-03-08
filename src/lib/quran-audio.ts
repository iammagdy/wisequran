import { saveAudio, getAudio } from "./db";

const BASE_URL =
  "https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy";

export function getAudioUrl(surahNumber: number): string {
  return `${BASE_URL}/${surahNumber}.mp3`;
}

/**
 * Try to get a playable audio source for a surah.
 * Returns a blob URL (from cache) or the CDN URL, or null if offline & not cached.
 */
export async function resolveAudioSource(
  surahNumber: number
): Promise<{ url: string; cached: boolean } | null> {
  // Check local cache first
  const cached = await getAudio(surahNumber);
  if (cached) {
    const blob = new Blob([cached.data], { type: "audio/mpeg" });
    return { url: URL.createObjectURL(blob), cached: true };
  }

  // Not cached — need internet
  if (navigator.onLine) {
    return { url: getAudioUrl(surahNumber), cached: false };
  }

  return null; // offline and not cached
}

/**
 * Download surah audio and store in IndexedDB.
 */
export async function downloadSurahAudio(
  surahNumber: number,
  onProgress?: (pct: number) => void
): Promise<void> {
  const res = await fetch(getAudioUrl(surahNumber));
  if (!res.ok) throw new Error("Failed to fetch audio");

  const reader = res.body?.getReader();
  const contentLength = Number(res.headers.get("Content-Length") || 0);

  if (!reader) {
    // Fallback: no streaming support
    const buf = await res.arrayBuffer();
    await saveAudio(surahNumber, buf);
    onProgress?.(100);
    return;
  }

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (contentLength > 0) {
      onProgress?.(Math.round((received / contentLength) * 100));
    }
  }

  const buf = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.length;
  }

  await saveAudio(surahNumber, buf.buffer);
  onProgress?.(100);
}
