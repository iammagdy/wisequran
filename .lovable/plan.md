

# Go-to-Page Input + Swipe Page Navigation in Mushaf Mode

## Two Features

### 1. Go-to-Page: Jump to a specific Mushaf page by number
- Add a small input field next to the floating page indicator (bottom-left). Tapping the indicator opens a mini dialog/popover with a number input (1-604) and a "Go" button.
- On submit, scroll to the first ayah on that page using `scrollIntoView`.
- If the target page is outside the current surah's range, show a toast message indicating the page isn't in this surah.

### 2. Swipe between pages (Mushaf mode only)
- In Mushaf mode, instead of rendering all pages in a vertical scroll, use `embla-carousel-react` (already installed) to show **one page at a time** with horizontal RTL swiping.
- Each carousel slide = one Mushaf page card (the existing page rendering from `MushafPageView`).
- Add subtle left/right navigation arrows for desktop users.
- The current page indicator updates as the user swipes.
- When entering via a target ayah, auto-navigate to the correct carousel slide.

## Changes

### `src/components/quran/MushafPageView.tsx`
- Refactor to use Embla Carousel: wrap pages in `Carousel` > `CarouselContent` > `CarouselItem` (one per page).
- Each slide contains one page's ayahs rendered as continuous inline text (existing logic).
- Accept a new prop `initialPage` to start on the correct slide.
- Add an `onPageChange` callback that fires the current Mushaf page number when swiping.
- Direction set to RTL so swipe-right = next page (like a real Mushaf).

### `src/pages/SurahReaderPage.tsx`
- Replace the floating page indicator with a tappable badge that opens a small popover with a page number input.
- On submit, if in mushaf mode: navigate carousel to the target page slide. If in ayah mode: scroll to the first ayah on that page.
- Pass `onPageChange` handler to `MushafPageView` to update `currentPage` state.
- Pass `targetPage` (from go-to or from `targetAyah` param) to `MushafPageView`.

### Files
- **Edit**: `src/components/quran/MushafPageView.tsx` — carousel-based single-page swiping
- **Edit**: `src/pages/SurahReaderPage.tsx` — go-to-page popover + pass carousel control props

