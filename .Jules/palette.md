## 2026-03-16 - Added ARIA labels to icon-only buttons
**Learning:** Found several icon-only buttons in the Quran reading and listening components that lacked ARIA labels, which is a common accessibility anti-pattern. Because this is a bilingual app, it's crucial to use the `language` context to provide translated ARIA labels (Arabic/English) rather than hardcoding them in one language.
**Action:** Always check icon-only buttons for missing `aria-label` attributes and use the `language` variable to provide localized labels when implementing accessibility fixes.
