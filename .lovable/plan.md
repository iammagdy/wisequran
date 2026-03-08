

# Add Mushaf Page View Mode

## What
Add a "mushaf" display mode to the surah reader that groups ayahs by their Mushaf page number, showing them as continuous flowing text (inline) per page — mimicking how a real Mushaf looks — instead of separate cards per ayah.

## Approach

### Edit: `src/pages/SurahReaderPage.tsx`

1. **Add a view toggle** next to the existing tabs (النص / التفسير). Add a small icon button (e.g. `Layers` or `BookOpen` icon) in the header area that toggles between `"ayah"` and `"mushaf"` display modes. Store preference in localStorage (`wise-reader-mode`).

2. **Mushaf page view rendering**: When `readerMode === "mushaf"` and `activeTab === "text"`:
   - Group `ayahs` by their `page` field into a `Map<number, Ayah[]>`.
   - Render each page as a distinct section with:
     - A page header showing `صفحة ٣٤٥` centered.
     - All ayahs in that page rendered **inline** as continuous Arabic text, with each ayah number shown as a small inline marker `﴿١٢٣﴾` after the ayah text.
     - A subtle border/card around each page group.
   - Bookmark and tafsir actions accessible via long-press or tap on the ayah number marker.

3. **Keep existing ayah-by-ayah mode** as the default (`readerMode === "ayah"`), unchanged.

4. **Scroll-to-ayah and page tracking** continue to work in both modes since ayah elements will still have `id` and `data-ayah` attributes.

### UI Design
```text
┌─────────────────────────────┐
│  صفحة ٣٤٥                  │
│                             │
│  بسم الله ... ﴿١﴾ الحمد    │
│  لله رب العالمين ﴿٢﴾ الرحمن│
│  الرحيم ﴿٣﴾ مالك يوم الدين│
│  ﴿٤﴾ ...                    │
│                             │
├─────────────────────────────┤
│  صفحة ٣٤٦                  │
│  ...                        │
└─────────────────────────────┘
```

### Files
- **Edit**: `src/pages/SurahReaderPage.tsx` — add reader mode toggle + mushaf page grouping view

