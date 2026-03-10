import { saveAudio, getAudio } from "./db";
import { getReciterAudioUrls } from "./reciters";

const MIN_AUDIO_SIZE = 1024; // 1KB minimum — anything smaller is invalid

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
    // Return first URL from the list (primary)
    const urls = await getReciterAudioUrls(reciterId, surahNumber);
    return { url: urls[0], cached: false };
  }

  return null;
}

/**
 * Attempt to fetch audio from a single URL, with streaming progress if possible.
 * Returns ArrayBuffer on success, throws on failure.
 */
async function fetchAudioFromUrl(
  url: string,
  onProgress?: (pct: number) => void
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentLength = Number(res.headers.get("Content-Length") || 0);
  const reader = res.body?.getReader();

  if (reader && contentLength > 0) {
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress?.(Math.round((received / contentLength) * 100));
    }

    const merged = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged.buffer;
  } else {
    // Fallback: no streaming or unknown length
    if (reader) {
      reader.cancel();
      const res2 = await fetch(url);
      if (!res2.ok) throw new Error(`HTTP ${res2.status} on retry`);
      const buf = await res2.arrayBuffer();
      onProgress?.(100);
      return buf;
    } else {
      const buf = await res.arrayBuffer();
      onProgress?.(100);
      return buf;
    }
  }
}

/**
 * Download surah audio trying multiple URLs (primary, fallback, CORS proxy).
 * Throws on failure — callers should catch and show error.
 * Returns the size in bytes of the downloaded audio.
 */
export async function downloadSurahAudio(
  reciterId: string,
  surahNumber: number,
  onProgress?: (pct: number) => void
): Promise<number> {
  const urls = await getReciterAudioUrls(reciterId, surahNumber);

  let lastError: Error | null = null;

  for (let i = 0; i < urls.length; i++) {
    try {
      console.log(`[audio-dl] trying source ${i + 1}/${urls.length}: ${urls[i].substring(0, 80)}...`);
      const buf = await fetchAudioFromUrl(urls[i], onProgress);

      // Validate minimum size
      if (buf.byteLength < MIN_AUDIO_SIZE) {
        console.warn(`[audio-dl] source ${i + 1} returned too-small file (${buf.byteLength} bytes), skipping`);
        continue;
      }

      // Save to IndexedDB
      await saveAudio(reciterId, surahNumber, buf);

      // Verify the save
      const verified = await getAudio(reciterId, surahNumber);
      if (!verified || verified.data.byteLength < MIN_AUDIO_SIZE) {
        throw new Error("فشل التحقق من حفظ الصوت في التخزين المحلي");
      }

      onProgress?.(100);
      return buf.byteLength;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`[audio-dl] source ${i + 1} failed:`, lastError.message);
      // Reset progress for next attempt
      onProgress?.(0);
    }
  }

  throw new Error(`فشل تحميل الصوت من جميع المصادر: ${lastError?.message ?? "خطأ غير معروف"}`);
}

/** Format bytes to a human-readable Arabic string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
