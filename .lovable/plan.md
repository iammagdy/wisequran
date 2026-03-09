

# نظام مراجعة الحفظ بالتكرار المتباعد (Spaced Repetition)

## Overview
Add a spaced repetition review system to the Hifz tracker that schedules memorized surahs for review at increasing intervals, shows today's review queue, and tracks review history.

## How It Works

### Algorithm
- When a surah is marked "memorized", it enters the review queue with interval = 1 day
- After each successful review, the interval doubles: 1 → 2 → 4 → 8 → 16 → 32 → 64 days
- If the user marks a review as "needs work", interval resets to 1 day
- Each surah stores: `lastReviewed` (date), `interval` (days), `nextReview` (date), `level` (0-6)

### Data Structure
```ts
interface HifzReviewItem {
  surahNumber: number;
  lastReviewed: string; // YYYY-MM-DD
  nextReview: string;   // YYYY-MM-DD
  interval: number;     // days
  level: number;        // 0-6 (review strength)
  totalReviews: number;
}
```

## Implementation

### New Hook: `src/hooks/useHifzReview.ts`
- Stores review data in localStorage (`wise-hifz-review`)
- `getTodayQueue()`: returns surahs where `nextReview <= today`
- `markReviewed(surahNumber, quality: 'good' | 'hard')`: updates interval and schedules next review
- `addToReview(surahNumber)`: initializes a surah in the review system
- `removeFromReview(surahNumber)`: removes surah from review queue
- Auto-syncs with `useHifz` — when status changes to "memorized", auto-add to review

### Modify: `src/pages/HifzPage.tsx`
- Add a "المراجعة اليوم" (Today's Review) section at the top showing due surahs
- Each review card shows: surah name, days since last review, strength level (colored dots)
- Two action buttons per card: "✓ أتقنتها" (Good) and "⟳ تحتاج مراجعة" (Hard)
- After reviewing, card animates out with congratulatory feedback
- Show review stats: total reviewed today, streak of daily reviews, next review upcoming
- Empty state: "لا توجد مراجعات اليوم — أحسنت! 🎉"

### Visual Design
- Review strength shown as colored bar: red (level 0-1) → yellow (2-3) → green (4-6)
- Due/overdue reviews highlighted with a subtle red border
- Completed reviews show a checkmark animation

## Files to Create
- `src/hooks/useHifzReview.ts` — Spaced repetition logic and state

## Files to Modify
- `src/pages/HifzPage.tsx` — Add review queue section and review interaction UI
- `src/hooks/useHifz.ts` — Trigger review system when surah status changes to "memorized"

