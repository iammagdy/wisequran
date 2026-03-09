import { saveAudio, getAudio } from "./db";
import { getReciterAudioUrl } from "./reciters";

/**
 * Try to get a playable audio source for a surah.
 * Returns a blob URL (from cache) or the CDN URL, or null if offline & not cached.
 */
export async function resolveAudioSource(
  reciterId: string,
  surahNumber: number
): Promise<{ url: string; cached: boolean } | null> {
  const cached = await getAudio(reciterId, surahNumber);
  if (cached) {
    const blob = new Blob([cached.data], { type: "audio/mpeg" });
    return { url: URL.createObjectURL(blob), cached: true };
  }

  if (navigator.onLine) {
    const url = await getReciterAudioUrl(reciterId, surahNumber);
    return { url, cached: false };
  }

  return null;
}

/**
 * Download surah audio and store in IndexedDB.
 */
export async function downloadSurahAudio(
  reciterId: string,
  surahNumber: number,
  onProgress?: (pct: number) => void
): Promise<void> {
  const url = await getReciterAudioUrl(reciterId, surahNumber);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch audio");

  const reader = res.body?.getReader();
  const contentLength = Number(res.headers.get("Content-Length") || 0);

  if (!reader) {
    const buf = await res.arrayBuffer();
    await saveAudio(reciterId, surahNumber, buf);
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

  await saveAudio(reciterId, surahNumber, buf.buffer);
  onProgress?.(100);
}
