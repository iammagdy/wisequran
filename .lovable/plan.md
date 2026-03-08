

# Add Search to Tafsir Tab

## What
Add a search input at the top of the التفسير tab so users can search within the tafsir text and jump to matching ayahs. Matching text will be highlighted.

## Changes

### Edit: `src/pages/SurahReaderPage.tsx`
- Add `tafsirSearch` state (string)
- Add a search input (RTL, with Search icon) at the top of the tafsir tab content, below the header — styled like the existing search in QuranPage
- Filter `tafsirAyahs` to only show ayahs whose tafsir text includes the search string (when non-empty)
- Show a "no results" message if the filter returns empty
- Clear search when switching tabs or surahs
- Keep the same calm styling, RTL layout, placeholder: `"ابحث في التفسير..."`

No new files or dependencies needed.

