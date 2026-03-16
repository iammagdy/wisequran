## 2025-03-16 - [Optimize Surah Filtering in QuranPage]
**Learning:** Filtering a static list inside a React component's render body causes O(N) recalculations on every render.
**Action:** Wrap such array filter operations in `useMemo` using the list and search term as dependencies to avoid recalculating unnecessarily.
