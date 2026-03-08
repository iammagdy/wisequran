

# Per-Ayah Highlighting During Full-Surah Playback

## Approach

Use the **Quran Foundation API** (`api.quran.com/api/v4`) which provides per-ayah timestamp data (`timestamp_from`, `timestamp_to` in milliseconds) tied to their audio files on `download.quranicaudio.com`. We switch the audio source to match, so timestamps are accurate.

**API endpoint**: `GET /chapter_recitations/{reciter_id}/{chapter_number}?segments=true`

Returns `timestamps[]` with `verse_key`, `timestamp_from`, `timestamp_to` for each ayah — exactly what we need to map `currentTime` to the active ayah.

## Reciter ID Mapping

The Quran Foundation API uses numeric IDs. We map our existing reciters:

| Our ID | QF API ID | Name |
|--------|-----------|------|
| alafasy | 7 | Mishari al-Afasy |
| husary | 6 | Mahmoud Khalil Al-Husary |
| minshawi | 9 | Mohamed Siddiq al-Minshawi (Murattal) |
| abdulbasit | 2 | AbdulBaset AbdulSamad (Murattal) |
| sudais | 3 | Abdur-Rahman as-Sudais |
| shuraym | 10 | Sa`ud ash-Shuraym |
| rifai | 5 | Hani ar-Rifai |

Reciters not in the QF API (islamsobhi, yasser, baleela, khalilaljalil, qatami, ajamy, mahermuaiqly) will keep using `mp3quran.net` / `cdn.islamic.network` without highlighting.

## Changes

### 1. `src/lib/reciters.ts`
- Add `qfApiId?: number` field to `Reciter` interface
- Add QF API IDs to reciters that have them
- Add `getReciterQFAudioUrl()` that returns the `download.quranicaudio.com` URL

### 2. New file: `src/lib/ayah-timestamps.ts`
- `fetchAyahTimestamps(reciterId, surahNumber)` → calls QF API, returns `{ verseKey: string, from: number, to: number }[]`
- Cache timestamps in memory (Map) to avoid repeated API calls
- `findCurrentAyah(timestamps, currentTimeMs)` → binary search to find which ayah is playing

### 3. `src/contexts/AudioPlayerContext.tsx`
- When playing a surah with a QF-supported reciter:
  - Use `download.quranicaudio.com` URL (from QF API response `audio_url`) instead of `cdn.islamic.network`
  - Fetch timestamps alongside
  - Store timestamps in a ref
  - In `timeupdate` handler, call `findCurrentAyah()` and update `currentAyahInSurah` in state
- For non-QF reciters: play normally without highlighting (current behavior)

### 4. `src/lib/quran-audio.ts`
- Update `resolveAudioSource` to accept an optional `audioUrl` override (for QF sources)

### 5. UI (no changes needed)
- `MushafPageView` and `SurahReaderPage` already use `playingAyah` / `currentAyahInSurah` for highlighting — it will work automatically once the context updates this value during playback.

## Flow

```text
User taps Play
  → AudioPlayerContext.play()
  → Check if reciter has qfApiId
  → YES: fetch QF API for audio_url + timestamps
       → Play audio from quranicaudio.com
       → On timeupdate: binary search timestamps → update currentAyahInSurah
       → UI highlights active ayah automatically
  → NO: play from cdn.islamic.network/mp3quran.net (no highlighting)
```

