import { saveAudio, getAudio } from "./db";
import { getReciterAudioUrl } from "./reciters";

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
    const url = await getReciterAudioUrl(reciterId, surahNumber);
    return { url, cached: false };
  }

  return null;
}

/**
 * Download surah audio and store in IndexedDB.
 * Throws on failure — callers should catch and show error.
 * Returns the size in bytes of the downloaded audio.
 */
export async function downloadSurahAudio(
  reciterId: string,
  surahNumber: number,
  onProgress?: (pct: number) => void
): Promise<number> {
  const url = await getReciterAudioUrl(reciterId, surahNumber);

  let buf: ArrayBuffer;

  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentLength = Number(res.headers.get("Content-Length") || 0);
    const reader = res.body?.getReader();

    if (reader && contentLength > 0) {
      // Stream with progress
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
      buf = merged.buffer;
    } else {
      // Fallback: no streaming or unknown length — use arrayBuffer()
      // If we already consumed the body via getReader(), re-fetch
      if (reader) {
        reader.cancel();
        const res2 = await fetch(url, { mode: "cors" });
        if (!res2.ok) throw new Error(`HTTP ${res2.status} on retry`);
        buf = await res2.arrayBuffer();
      } else {
        buf = await res.arrayBuffer();
      }
      onProgress?.(100);
    }
  } catch (e) {
    // Try no-cors fallback as last resort (will get opaque response)
    // Actually opaque responses give empty body, so just rethrow
    throw new Error(`فشل تحميل الصوت: ${e instanceof Error ? e.message : "خطأ غير معروف"}`);
  }

  // Validate minimum size
  if (buf.byteLength < MIN_AUDIO_SIZE) {
    throw new Error(`الملف المحمّل صغير جداً (${buf.byteLength} bytes) — قد يكون تالفاً`);
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
}

/** Format bytes to a human-readable Arabic string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
