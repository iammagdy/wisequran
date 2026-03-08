

# Fix Bismillah Separation, Dark Mode Scrollbar & Audio Sync Note

## Issues Identified

### 1. Bismillah stuck with first ayah
The API returns the Bismillah as part of ayah 1's text for most surahs. The existing code shows a decorative Bismillah divider (lines 333-342 in SurahReaderPage) for surahs other than 1 and 9, but the ayah text itself still contains it — so it appears duplicated and merged with the first ayah content.

**Fix**: Strip the Bismillah prefix from ayah 1's text when rendering (for surahs != 1 and != 9). The Bismillah text from the API is `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ`. We'll filter it out of the displayed text for ayah 1, since we already render a separate styled Bismillah divider above.

Apply this in both:
- `SurahReaderPage.tsx` — ayah-by-ayah view (line 412 where `ayah.text` is rendered)
- `MushafPageView.tsx` — mushaf view (line 139 where `ayah.text` is rendered)

Create a utility function in `src/lib/utils.ts`:
```ts
export function stripBismillah(text: string, surahNumber: number, ayahNumber: number): string {
  if (ayahNumber !== 1 || surahNumber === 1 || surahNumber === 9) return text;
  return text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, "")
             .replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/, "");
}
```

### 2. Dark mode scrollbar is white
The browser default scrollbar remains white in dark mode.

**Fix**: Add scrollbar styling to `src/index.css`:
```css
/* Dark mode scrollbar */
.dark ::-webkit-scrollbar { width: 8px; height: 8px; }
.dark ::-webkit-scrollbar-track { background: hsl(var(--muted)); }
.dark ::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }
.dark ::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
/* Firefox */
.dark * { scrollbar-color: hsl(var(--border)) hsl(var(--muted)); }
```

### 3. Audio highlighting/syncing limitation
The current audio setup plays full-surah MP3 files. These files have no per-ayah timing metadata, so true ayah-by-ayah highlighting during playback is **not possible** with this approach.

**What we can do now**: This is a known limitation. True sync would require either:
- Per-ayah audio files (available from `api.alquran.cloud` as individual ayah audio) — would need a completely different playback architecture (play ayah-by-ayah sequentially, highlight each as it plays)
- Timing metadata files — not publicly available for most reciters

This is a significant architectural change that should be planned separately if desired.

## Files to Edit

| File | Change |
|------|--------|
| `src/lib/utils.ts` | Add `stripBismillah` utility |
| `src/pages/SurahReaderPage.tsx` | Use `stripBismillah` for ayah 1 text |
| `src/components/quran/MushafPageView.tsx` | Use `stripBismillah` for ayah 1 text |
| `src/index.css` | Add dark mode scrollbar styles |

