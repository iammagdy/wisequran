## 2026-03-16 - Added ARIA labels to icon-only buttons
**Learning:** Found several icon-only buttons in the Quran reading and listening components that lacked ARIA labels, which is a common accessibility anti-pattern. Because this is a bilingual app, it's crucial to use the `language` context to provide translated ARIA labels (Arabic/English) rather than hardcoding them in one language.
**Action:** Always check icon-only buttons for missing `aria-label` attributes and use the `language` variable to provide localized labels when implementing accessibility fixes.

## 2026-03-16 - Added missing bilingual ARIA labels to Modal Close buttons
**Learning:** Common modal and sheet UI patterns in the application frequently implement `X` (close) buttons as icon-only without proper ARIA labeling. Using the `isRTL` or `language` contexts to ensure these are properly localized is essential for screen reader support across both Arabic and English user interfaces. A pattern was identified in standardizing `aria-label={isRTL ? "إغلاق" : "Close"}`.
**Action:** Ensure all newly created or existing modal/sheet close buttons are verified for correct, context-aware `aria-label` attributes.
