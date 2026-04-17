import { downloadSurahAudio, formatBytes } from "./quran-audio";
import { fetchSurahAyahs } from "./quran-api";
import { isOfflineTafsirEdition, loadOfflineTafsirSurah } from "./offline-tafsir";
import { getSurah, getAudio, getTafsir, audioByteLength } from "./db";
import { logger } from "./logger";

/**
 * Phase C "Download for offline" orchestrator.
 *
 * One call to {@link downloadSurahForOffline} fans out to:
 *  - Mushaf text (cached in IDB by `fetchSurahAyahs`).
 *  - Tafsir for the user's selected edition, when it's one of the
 *    bundled offline editions (the API-only editions are paywalled
 *    behind a per-request auth header and aren't cacheable here).
 *  - Audio for the user's selected reciter via the existing streaming
 *    download path so peak heap pressure stays flat on long surahs.
 *
 * Reports a single 0–100 progress number so the caller can show one
 * unified progress bar instead of three. The audio dominates the
 * total so we weight it as ~80% of the bar; text + tafsir are quick
 * and share the remaining 20%.
 *
 * Aborting via `signal` cancels the in-flight audio fetch (text and
 * tafsir requests are themselves quick enough that we let them
 * resolve, but the function will then throw `AbortError` before any
 * post-cleanup runs).
 */
export interface OfflineDownloadResult {
  audioBytes: number;
  textCached: boolean;
  tafsirCached: boolean;
  /** Sum of audio + a coarse estimate of text/tafsir size. */
  totalBytes: number;
}

export async function downloadSurahForOffline(args: {
  surahNumber: number;
  reciterId: string;
  tafsirId: string;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}): Promise<OfflineDownloadResult> {
  const { surahNumber, reciterId, tafsirId, onProgress, signal } = args;

  // Weights chosen to keep the bar perceptually smooth: ~10% for
  // mushaf text, ~10% for tafsir, ~80% for audio.
  const TEXT_WEIGHT = 10;
  const TAFSIR_WEIGHT = 10;
  const AUDIO_WEIGHT = 80;

  let unifiedPct = 0;
  const report = (pct: number) => {
    unifiedPct = Math.max(unifiedPct, Math.min(100, Math.round(pct)));
    onProgress?.(unifiedPct);
  };

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // 1) Mushaf text (cached on success by fetchSurahAyahs).
  let textCached = false;
  try {
    await fetchSurahAyahs(surahNumber, signal);
    textCached = true;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    logger.warn(`[offline-surah] text fetch failed for surah ${surahNumber}:`, err);
  }
  report(TEXT_WEIGHT);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // 2) Tafsir — only the bundled offline editions can be reliably
  // cached without per-request auth. For everything else we silently
  // skip rather than half-warm a cache the user can't read offline.
  let tafsirCached = false;
  if (isOfflineTafsirEdition(tafsirId)) {
    try {
      await loadOfflineTafsirSurah(tafsirId, surahNumber);
      tafsirCached = true;
    } catch (err) {
      logger.warn(`[offline-surah] tafsir fetch failed for ${tafsirId}/${surahNumber}:`, err);
    }
  }
  report(TEXT_WEIGHT + TAFSIR_WEIGHT);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  // 3) Audio — biggest payload by orders of magnitude. The streaming
  // download already saves to IDB incrementally so cancellation cleans
  // up partial rows.
  let audioBytes = 0;
  try {
    audioBytes = await downloadSurahAudio(
      reciterId,
      surahNumber,
      (pct) => report(TEXT_WEIGHT + TAFSIR_WEIGHT + (pct / 100) * AUDIO_WEIGHT),
      signal,
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    // Surface the audio failure to the caller — text/tafsir alone is
    // not what the user asked for. The mushaf and tafsir we just
    // warmed stay cached as a best-effort partial result.
    throw err;
  }

  report(100);

  // Coarse text/tafsir size estimate from the just-cached IDB rows.
  let textBytes = 0;
  let tafsirBytes = 0;
  if (textCached) {
    try {
      const row = await getSurah(surahNumber);
      if (row) textBytes = new Blob([JSON.stringify(row)]).size;
    } catch { /* ignore */ }
  }
  if (tafsirCached) {
    try {
      const row = await getTafsir(tafsirId, surahNumber);
      if (row) tafsirBytes = new Blob([JSON.stringify(row)]).size;
    } catch { /* ignore */ }
  }

  return {
    audioBytes,
    textCached,
    tafsirCached,
    totalBytes: audioBytes + textBytes + tafsirBytes,
  };
}

/**
 * Cheap "is this surah already fully offline for the given
 * reciter / tafsir choice?" check used to render the download
 * button's idle vs done state without spinning up a download.
 */
export async function isSurahFullyOffline(args: {
  surahNumber: number;
  reciterId: string;
  tafsirId: string;
}): Promise<boolean> {
  const { surahNumber, reciterId, tafsirId } = args;
  try {
    const [text, audio, tafsirRow] = await Promise.all([
      getSurah(surahNumber),
      getAudio(reciterId, surahNumber),
      isOfflineTafsirEdition(tafsirId) ? getTafsir(tafsirId, surahNumber) : Promise.resolve(null),
    ]);
    const hasText = !!(text && text.ayahs && text.ayahs.length > 0);
    const hasAudio = !!(audio && audioByteLength(audio.data) > 10_000);
    const hasTafsir = isOfflineTafsirEdition(tafsirId)
      ? !!(tafsirRow && Array.isArray(tafsirRow.ayahs) && tafsirRow.ayahs.length > 0)
      : true; // can't pre-cache API-only tafsirs, so don't gate on them.
    return hasText && hasAudio && hasTafsir;
  } catch {
    return false;
  }
}

export { formatBytes };
