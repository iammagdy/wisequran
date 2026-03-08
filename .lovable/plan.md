

# Fix Per-Ayah Highlighting — Two Bugs Found

## Testing Results

I tested by playing Surah Al-Fatiha in the browser. Audio plays correctly (gapless, correct duration from QF source), but **no ayah highlighting appears**. I confirmed the root cause by fetching the QF API directly.

## Bugs Found

### Bug 1: Missing query parameter
The current API call:
```
GET /chapter_recitations/7/1
```
Returns NO timestamp data. Must add `?segments=true`:
```
GET /chapter_recitations/7/1?segments=true
```

### Bug 2: Wrong field name
The code reads `recitation.verse_timings` (line 53 of `ayah-timestamps.ts`), but the API returns the field as `timestamps`.

## Fix

**File: `src/lib/ayah-timestamps.ts`**

1. **Line 42**: Change the URL to append `?segments=true`
   ```typescript
   const url = `https://api.quran.com/api/v4/chapter_recitations/${reciter.qfApiId}/${surahNumber}?segments=true`;
   ```

2. **Lines 53-54**: Change `verse_timings` to `timestamps`
   ```typescript
   const timings: { verse_key: string; timestamp_from: number; timestamp_to: number }[] =
       recitation.timestamps || [];
   ```

Two lines changed, highlighting should work immediately after this fix.

