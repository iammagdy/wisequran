import { saveAudio, getAudio } from "./db";
import { getReciterAudioUrls } from "./reciters";

const MIN_AUDIO_SIZE = 10_240; // 10KB minimum — no valid surah audio is smaller

/**
 * Validate that a buffer contains actual MP3/audio data by checking magic bytes.
 * Checks for: ID3 tag (ID3v2), MPEG sync word (0xFF 0xE0+), or fLaC header.
 */
function isValidAudioFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer);
  // ID3v2 tag: starts with "ID3"
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  // MPEG audio frame sync: 0xFF followed by 0xE0+ (11 sync bits)
  if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) return true;
  // OGG container: "OggS"
  if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return true;
  // Check if it looks like HTML (common proxy error response)
  const textStart = new TextDecoder().decode(bytes.slice(0, 50)).trim().toLowerCase();
  if (textStart.startsWith("<!doctype") || textStart.startsWith("<html") || textStart.startsWith("<head")) return false;
  return false;
}

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
  const controller = new AbortController();
  // 60s for initial connection
  let timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentLength = Number(res.headers.get("Content-Length") || 0);
    const reader = res.body?.getReader();

    if (reader) {
      try {
        const chunks: Uint8Array[] = [];
        let received = 0;

        // 30s activity timeout — resets with every chunk
        timeoutId = setTimeout(() => controller.abort(), 30_000);

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            clearTimeout(timeoutId);
            break;
          }
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => controller.abort(), 30_000);

          chunks.push(value);
          received += value.length;

          if (contentLength > 0) {
            onProgress?.(Math.round((received / contentLength) * 100));
          } else {
            // No Content-Length: report negative received bytes (MB) as signal
            onProgress?.(-(received));
          }
        }

        const merged = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        return merged.buffer;
      } catch {
        clearTimeout(timeoutId);
        reader.cancel().catch(() => {});
        // Retry without streaming
        const res2 = await fetch(url);
        if (!res2.ok) throw new Error(`HTTP ${res2.status} on retry`);
        const buf = await res2.arrayBuffer();
        onProgress?.(100);
        return buf;
      }
    } else {
      const buf = await res.arrayBuffer();
      onProgress?.(100);
      return buf;
    }
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
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
