

# Add Ayah Picker Dropdown in Tafsir Tab

## What
Add a dropdown select menu in the Tafsir tab (next to the search input) so users can quickly jump to any ayah's tafsir without scrolling through all of them.

## Changes

### Edit: `src/pages/SurahReaderPage.tsx`

**In the full surah tafsir section (around line 298-314):**

- Add a `<Select>` component (from `@/components/ui/select`) between the header and the search input
- The select shows all ayah numbers (١, ٢, ٣, ...) using Arabic numerals with label like "الآية ١"
- Default value: empty / placeholder "انتقل إلى آية..."
- On selection: set `focusedAyah` to the chosen ayah number, showing its individual tafsir view
- Place the select and search input side by side in a flex row so they share the same line

**Layout:**
```
[تفسير السورة header + edition name]
[  آية dropdown  |  search input  ]
[tafsir cards...]
```

**Imports to add:** `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from `@/components/ui/select`

No new files needed. Single file edit.

