## 2024-05-17 - Missing ARIA Labels on Close/Navigation Buttons
**Learning:** Found several components (`ChangelogModal`, `RecitationScoreCard`, `AchievementsSheet`, `SurahRangeSelector`) that contain icon-only buttons (like 'X' to close, or '+' / '-' for range selection) which completely lack `aria-label` attributes. This makes them inaccessible to screen readers.
**Action:** When adding or modifying icon-only buttons in this design system, *always* include an `aria-label` attribute. If the app supports multiple languages (like Arabic/English), ensure the label is translated or bilingual.
