

# Add Search Text Highlighting

## What
Highlight the matched search term in both:
1. **QuranPage** — ayah search results (line 202)
2. **SurahReaderPage** — tafsir search results (line 361)

## Approach
Create a shared `HighlightText` component that splits text around the search query and wraps matches in a `<mark>` with a highlight style (e.g. `bg-primary/20 text-primary rounded-sm px-0.5`).

## Changes

### New: `src/components/HighlightText.tsx`
- Props: `text: string`, `highlight: string`
- Splits `text` by the `highlight` string, renders matches inside `<mark>` with styling
- If `highlight` is empty, renders text as-is

### Edit: `src/pages/QuranPage.tsx` (line 202)
- Replace `{r.text}` with `<HighlightText text={r.text} highlight={search.trim()} />`

### Edit: `src/pages/SurahReaderPage.tsx` (line 361)
- Replace `{t.text}` with `<HighlightText text={t.text} highlight={tafsirSearch.trim()} />`

