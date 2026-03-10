import { saveAudio, getAudio } from "./db";
import { getReciterAudioUrls } from "./reciters";

const MIN_AUDIO_SIZE = 10_240; // 10KB minimum

/**
 * Validate that a buffer contains actual MP3/audio data by checking magic bytes.
 */
function isValidAudioFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) return true;
  if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return true;
  const textStart = new TextDecoder().decode(bytes.slice(0, 50)).trim().toLowerCase();
  if (textStart.startsWith("<!doctype") || textStart.startsWith("<html") || textStart.startsWith("<head")) return false;
  return false;
}

/**
 * Try to get a playable audio source for a surah.
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
    const urls = await getReciterAudioUrls(reciterId, surahNumber);
    return { url: urls[0], cached: false };
  }

  return null;
}

/**
 * Fetch audio from a URL. Simple approach: plain fetch + arrayBuffer.
 * Reports progress only if Content-Length is available.
 */
async function fetchAudioFromUrl(
  url: string,
  onProgress?: (pct: number) => void
): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(url, { signal: controller.signal, mode: "cors" });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      throw new Error("Server returned HTML instead of audio");
    }

    const contentLength = Number(res.headers.get("Content-Length") || 0);
    const reader = res.body?.getReader();

    // Try streaming for progress reporting
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
    }

    // Fallback: no streaming, just get the whole buffer
    const buf = await res.arrayBuffer();
    onProgress?.(100);
    return buf;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

/**
 * Download surah audio trying multiple URLs.
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

      if (buf.byteLength < MIN_AUDIO_SIZE) {
        console.warn(`[audio-dl] source ${i + 1} too small (${buf.byteLength}B), skipping`);
        continue;
      }

      if (!isValidAudioFile(buf)) {
        console.warn(`[audio-dl] source ${i + 1} not valid audio (${buf.byteLength}B), skipping`);
        continue;
      }

      await saveAudio(reciterId, surahNumber, buf);

      const verified = await getAudio(reciterId, surahNumber);
      if (!verified || verified.data.byteLength < MIN_AUDIO_SIZE) {
        throw new Error("فشل التحقق من حفظ الصوت في التخزين المحلي");
      }

      onProgress?.(100);
      return buf.byteLength;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`[audio-dl] source ${i + 1} failed:`, lastError.message);
      onProgress?.(0);
    }
  }

  throw new Error(`فشل تحميل الصوت من جميع المصادر: ${lastError?.message ?? "خطأ غير معروف"}`);
}

/**
 * Auto-cache audio after successful playback.
 */
export async function cachePlayingAudio(
  reciterId: string,
  surahNumber: number,
  audioUrl: string
): Promise<void> {
  const existing = await getAudio(reciterId, surahNumber);
  if (existing) return;

  try {
    const res = await fetch(audioUrl, { mode: "cors" });
    if (!res.ok) return;

    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) return;

    const buf = await res.arrayBuffer();
    if (buf.byteLength < MIN_AUDIO_SIZE) return;
    if (!isValidAudioFile(buf)) return;

    await saveAudio(reciterId, surahNumber, buf);
    console.log(`[auto-cache] cached surah ${surahNumber} (${formatBytes(buf.byteLength)})`);
  } catch {
    // Silent fail — caching is best-effort
  }
}

/** Format bytes to a human-readable Arabic string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
