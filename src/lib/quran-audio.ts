import { saveAudio, getAudio, deleteAudio, checkStorageQuota, getAllAudioEntries, audioByteLength, audioToBlob } from "./db";
import { getReciterAudioUrls, getReciterAudioUrl } from "./reciters";
import { logger } from "./logger";

const MIN_AUDIO_SIZE = 10_240; // 10KB minimum
const MAGIC_PROBE_SIZE = 50;

/**
 * Validate that a buffer contains actual MP3/audio data by checking magic bytes.
 */
export function isValidAudioFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) return true;
  if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return true;
  const textStart = new TextDecoder().decode(bytes.slice(0, MAGIC_PROBE_SIZE)).trim().toLowerCase();
  if (textStart.startsWith("<!doctype") || textStart.startsWith("<html") || textStart.startsWith("<head")) return false;
  return true;
}

/**
 * Blob-aware variant of {@link isValidAudioFile}. Slices only the first
 * 50 bytes off the Blob (cheap — does not materialize the whole payload
 * in RAM) and runs the magic-byte check on those.
 */
export async function isValidAudioBlob(blob: Blob): Promise<boolean> {
  if (blob.size < 4) return false;
  const head = await blob.slice(0, MAGIC_PROBE_SIZE).arrayBuffer();
  return isValidAudioFile(head);
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
    // `cached.data` is a Blob since v8 of the IDB schema, but legacy
    // ArrayBuffer rows are normalized by `audioToBlob` (no copy).
    const blob = audioToBlob(cached.data);
    return { url: URL.createObjectURL(blob), cached: true };
  }

  if (navigator.onLine) {
    const url = await getReciterAudioUrl(reciterId, surahNumber);
    return { url, cached: false };
  }

  return null;
}

/**
 * Fetch audio from a URL and return a `Blob`.
 *
 * The streaming path appends each network chunk into a growing `Blob`
 * (`new Blob([prev, chunk])`). Modern browsers implement that
 * composition lazily — they keep a reference to the previous Blob's
 * bytes rather than copying them — so peak JS-heap RAM during the
 * download stays in the single-digit-MB range even for ~80 MB
 * recitations like Al-Baqarah. Without this, the previous
 * `Uint8Array[]` + final merge would briefly hold ~2× the file size
 * in heap.
 *
 * Progress is reported when `Content-Length` is present.
 */
export async function fetchAudioFromUrl(
  url: string,
  onProgress?: (pct: number) => void,
  externalSignal?: AbortSignal,
): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort);

  try {
    const res = await fetch(url, { signal: controller.signal, mode: "cors" });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("Content-Type") || "audio/mpeg";
    if (contentType.includes("text/html")) {
      throw new Error("Server returned HTML instead of audio");
    }
    const blobType = contentType.startsWith("audio/") ? contentType : "audio/mpeg";

    const contentLength = Number(res.headers.get("Content-Length") || 0);
    const reader = res.body?.getReader();

    // Streaming path with progress.
    if (reader && contentLength > 0) {
      let blob = new Blob([], { type: blobType });
      let received = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Compose lazily — browser keeps refs, no byte copy.
          blob = new Blob([blob, value], { type: blobType });
          received += value.length;
          onProgress?.(Math.round((received / contentLength) * 100));
        }
      } catch (err) {
        // On cancel/abort, release the in-flight reader so the
        // underlying connection can shut down cleanly.
        try { await reader.cancel(); } catch { /* ignore */ }
        throw err;
      }
      return blob;
    }

    // Fallback: no Content-Length / no streaming reader available.
    // `res.blob()` is just as memory-friendly as the streaming path
    // and still avoids a second buffer allocation.
    const blob = await res.blob();
    onProgress?.(100);
    return blob.type ? blob : new Blob([blob], { type: blobType });
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  } finally {
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Download surah audio trying multiple URLs with comprehensive verification.
 * Returns the size in bytes of the downloaded audio.
 */
export async function downloadSurahAudio(
  reciterId: string,
  surahNumber: number,
  onProgress?: (pct: number) => void
): Promise<number> {
  const storageCheck = await checkStorageQuota();

  if (storageCheck.percentUsed > 95) {
    throw new Error("مساحة التخزين ممتلئة تقريباً. يرجى حذف بعض البيانات أولاً");
  }

  const urls = await getReciterAudioUrls(reciterId, surahNumber);
  let lastError: Error | null = null;

  for (let i = 0; i < urls.length; i++) {
    try {
      logger.debug(`[audio-dl] trying source ${i + 1}/${urls.length}: ${urls[i].substring(0, 80)}...`);
      const blob = await fetchAudioFromUrl(urls[i], onProgress);
      const blobSize = blob.size;

      if (blobSize < MIN_AUDIO_SIZE) {
        logger.warn(`[audio-dl] source ${i + 1} too small (${blobSize}B), skipping`);
        continue;
      }

      // Validate magic bytes against the head of the Blob — only the
      // first 50 bytes are read into RAM, so this is cheap regardless
      // of total file size.
      if (!(await isValidAudioBlob(blob))) {
        logger.warn(`[audio-dl] source ${i + 1} not valid audio (${blobSize}B), skipping`);
        continue;
      }

      if (!storageCheck.hasEnoughSpace(blobSize)) {
        throw new Error("مساحة التخزين غير كافية لحفظ هذا الملف");
      }

      try {
        await saveAudio(reciterId, surahNumber, blob);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'QuotaExceededError') {
          throw new Error("تم تجاوز حد التخزين المسموح. يرجى حذف بعض الملفات");
        }
        throw e;
      }

      const verified = await getAudio(reciterId, surahNumber);
      const verifiedSize = audioByteLength(verified?.data);
      if (!verified || verifiedSize < MIN_AUDIO_SIZE) {
        await deleteAudio(reciterId, surahNumber);
        throw new Error("فشل التحقق من حفظ الصوت في التخزين المحلي");
      }

      const verifiedBlob = audioToBlob(verified.data);
      if (!(await isValidAudioBlob(verifiedBlob))) {
        await deleteAudio(reciterId, surahNumber);
        throw new Error("الملف المحفوظ تالف أو غير صالح");
      }

      if (verifiedBlob.size < MIN_AUDIO_SIZE) {
        await deleteAudio(reciterId, surahNumber);
        throw new Error("فشل إنشاء ملف صوتي قابل للتشغيل");
      }

      onProgress?.(100);
      logger.debug(`[audio-dl] ✓ verified and saved surah ${surahNumber} (${formatBytes(blobSize)})`);
      return blobSize;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      logger.warn(`[audio-dl] source ${i + 1} failed:`, lastError.message);
      onProgress?.(0);

      await deleteAudio(reciterId, surahNumber).catch(() => {});
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

    // Pull the response straight into a Blob — `res.blob()` streams
    // and stays off the JS heap, so even Al-Baqarah-sized recitations
    // don't spike memory during background auto-caching.
    const blob = await res.blob();
    if (blob.size < MIN_AUDIO_SIZE) return;
    if (!(await isValidAudioBlob(blob))) return;

    await saveAudio(reciterId, surahNumber, blob);
    logger.debug(`[auto-cache] cached surah ${surahNumber} (${formatBytes(blob.size)})`);
  } catch {
    // Silent fail — caching is best-effort
  }
}

/**
 * Verify all downloaded audio files and repair/remove corrupted ones.
 * Returns a report of the verification process.
 */
export async function verifyAndRepairDownloads(
  reciterId: string,
  onProgress?: (current: number, total: number, surahNumber: number) => void
): Promise<{
  valid: number[];
  corrupted: number[];
  repaired: number[];
}> {
  const allAudio = await getAllAudioEntries();
  const reciterAudio = allAudio.filter((a) => a.reciterId === reciterId);

  const valid: number[] = [];
  const corrupted: number[] = [];

  for (let i = 0; i < reciterAudio.length; i++) {
    const audio = reciterAudio[i];
    onProgress?.(i + 1, reciterAudio.length, audio.surahNumber);

    try {
      const size = audioByteLength(audio.data);
      if (size < MIN_AUDIO_SIZE) {
        logger.warn(`[verify] surah ${audio.surahNumber}: too small (${size}B)`);
        corrupted.push(audio.surahNumber);
        await deleteAudio(reciterId, audio.surahNumber);
        continue;
      }

      const blob = audioToBlob(audio.data);
      if (!(await isValidAudioBlob(blob))) {
        logger.warn(`[verify] surah ${audio.surahNumber}: invalid audio format`);
        corrupted.push(audio.surahNumber);
        await deleteAudio(reciterId, audio.surahNumber);
        continue;
      }

      if (blob.size < MIN_AUDIO_SIZE) {
        logger.warn(`[verify] surah ${audio.surahNumber}: blob creation failed`);
        corrupted.push(audio.surahNumber);
        await deleteAudio(reciterId, audio.surahNumber);
        continue;
      }

      const url = URL.createObjectURL(blob);
      URL.revokeObjectURL(url);

      valid.push(audio.surahNumber);
      logger.debug(`[verify] surah ${audio.surahNumber}: ✓ valid (${formatBytes(size)})`);
    } catch (e) {
      console.error(`[verify] surah ${audio.surahNumber}: error during verification`, e);
      corrupted.push(audio.surahNumber);
      await deleteAudio(reciterId, audio.surahNumber).catch(() => {});
    }
  }

  return {
    valid,
    corrupted,
    repaired: [],
  };
}

/** Format bytes to a human-readable Arabic string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
