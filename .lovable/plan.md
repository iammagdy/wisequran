

# Fix: Go-to-Page Button Not Working

## Problem
The go-to-page navigation uses `setMushafTargetPage(pageNum)` which sets a state value. The `useEffect` in `MushafPageView` only fires when `targetPage` changes. If the user enters the same page number twice, or if the state doesn't trigger a re-render properly, the carousel won't navigate.

Additionally, there's a subtle bug: `onPageChange` callback receives `pages[idx][0]` which is the page number (first element of the tuple), so `currentPage` updates correctly. But `mushafTargetPage` is never reset after navigation, so subsequent attempts to go to the same page fail.

## Fix

### `src/pages/SurahReaderPage.tsx`
- After setting `mushafTargetPage`, reset it back to `null` on the next tick so the same page can be targeted again. Use a pattern like setting a unique value each time (e.g., wrapping in an object) or resetting after a short delay.
- Simplest approach: use a counter/timestamp alongside the page number to ensure the effect always triggers. Or reset `mushafTargetPage` to `null` after the popover closes.

### `src/components/quran/MushafPageView.tsx`
- After successfully navigating to a target page, call a callback to reset the target (or handle internally by clearing after scrollTo).

### Concrete approach
In `SurahReaderPage.tsx`, change `mushafTargetPage` from `number | null` to `{ page: number; ts: number } | null`. This ensures every "Go" click creates a new object reference, always triggering the useEffect:

```typescript
// SurahReaderPage.tsx
setMushafTargetPage({ page: pageNum, ts: Date.now() });

// MushafPageView props
targetPage prop reads .page from the object
```

Alternatively (simpler): reset `mushafTargetPage` to `null` after a short timeout in `SurahReaderPage`, then set it again. But the object approach is cleaner.

**Simplest fix**: Reset `mushafTargetPage` to null in a `useEffect` after it's consumed, so it can be set again:

In `SurahReaderPage.tsx` line 217-218:
```typescript
setMushafTargetPage(null); // reset first
setTimeout(() => setMushafTargetPage(pageNum), 0); // then set
```

### Files to edit
- `src/pages/SurahReaderPage.tsx` — ensure targetPage always triggers by resetting before setting

