

# Plan: UI Polish for Surah Reader & Settings

## Surah Reader Page (`src/pages/SurahReaderPage.tsx`)

### Header Redesign
- Centered surah name with a decorative ornamental divider below (a thin line with a small diamond/dot in the center using CSS/Tailwind pseudo-elements)
- Show surah metadata (ayah count, revelation type) under the English name
- Slightly larger, more elegant Arabic title using `font-arabic text-xl`

### Unified Audio + Timer Toolbar
- Merge audio and timer into a single soft card when either is visible, instead of two separate cards
- Card uses `bg-card/80 backdrop-blur-sm border border-border/50` for a frosted-glass feel
- Inside the card, use a subtle separator between audio and timer sections
- Add a thin `border-l-2 border-primary/30` left accent on the card for an Islamic-inspired touch

### Audio Player Polish (`src/components/quran/SurahAudioPlayer.tsx`)
- Redesign as a compact "recitation bar": play button on left, progress bar fills middle, time on right — all in one clean row
- Play button: circular with `bg-primary/10` instead of solid fill for a softer look, solid fill on hover/active
- Progress bar: use a styled range input with a thinner track and smaller thumb
- Download button: small pill-shaped badge style instead of plain text link

### Timer Polish (`src/components/quran/ReadingTimer.tsx`)
- Preset buttons: pill-shaped with `rounded-full` and slightly more padding
- Active countdown: show time in a slightly larger `font-arabic` with a thin progress bar underneath
- More compact overall to sit nicely inside the shared toolbar card

### Ayah Cards
- Increase `leading-[2.2]` for better Quran text readability on mobile
- Add a very subtle top border accent `border-t-2 border-primary/5` on each card
- Bookmark icon always slightly visible (opacity-30 instead of 0) for discoverability
- Ayah number badge: use a rotated square (diamond shape) via `rotate-45` with inner counter-rotation for an Islamic geometric feel

### Bismillah
- Center with decorative horizontal lines on each side (flex with `<hr>` on both sides of the text)

## Settings Page (`src/pages/SettingsPage.tsx`)

### Structure with Section Headers
- Group into clearly titled sections with section header labels above each card group:
  - **المظهر والقراءة** (Appearance & Reading): Theme toggle + Font size — combine into one card with a divider
  - **الهدف اليومي** (Daily Goal): Keep as separate card with `Target` icon
  - **التحميلات** (Downloads): Two sub-cards — Quran text + Audio — each with icon, title, description line, and action buttons
  - **حول التطبيق** (About): App name, version, subtle branding

### Section Header Style
- Each section gets a small label: `text-xs font-semibold text-muted-foreground uppercase tracking-wide` with a subtle line/divider after it

### Download Cards Polish
- Each download card gets: icon + title row, a short description ("تحميل نصوص السور للقراءة بدون إنترنت"), count badge, then action buttons
- Buttons: use `rounded-lg` with proper gap, slightly smaller text
- Collapsible list: cleaner rows with alternating subtle backgrounds, proper RTL alignment

### Theme + Font Combined Card
- Top half: dark mode toggle with icon + label + switch
- Divider: `<Separator />`
- Bottom half: font size slider with preview

## Shared Polish (applied across both pages)

### New Tailwind Utilities in `src/index.css`
- `.card-accent` — a reusable class for `border-l-2 border-primary/20 rtl:border-l-0 rtl:border-r-2` to add subtle Islamic accent borders
- `.section-title` — for settings section headers

### Color Usage
- Cards: `bg-card` (existing)
- Toolbar/floating panels: `bg-card/80 backdrop-blur-sm`
- Accent touches: `primary/10` backgrounds, `primary/20` borders — no loud colors
- All existing CSS variables remain unchanged

## Files Modified
- `src/pages/SurahReaderPage.tsx` — header, toolbar, ayah cards
- `src/pages/SettingsPage.tsx` — section grouping, card hierarchy
- `src/components/quran/SurahAudioPlayer.tsx` — compact recitation bar
- `src/components/quran/ReadingTimer.tsx` — pill presets, compact layout
- `src/index.css` — 2-3 utility classes

## No Logic Changes
All modifications are purely layout, spacing, and styling. No changes to storage, routing, hooks, or data flow.

