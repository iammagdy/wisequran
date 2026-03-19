## 2024-05-18 - O(1) Indexing for Static Arrays
**Learning:** Sequentially ordered static arrays like `SURAH_META` can be accessed in O(1) time via direct index mapping (`array[id - 1]`) instead of O(N) linear searches using `Array.find()`.
**Action:** Always check if a static array lookup by ID can be mapped directly to its index to improve performance, especially for frequently accessed or large datasets.

## 2026-03-19 - O(1) Indexing for Static Arrays
**Learning:** Sequentially ordered static arrays like SURAH_META can be accessed in O(1) time via direct index mapping (array[id - 1]) instead of O(N) linear searches using Array.find().
**Action:** Implemented O(1) direct index lookups in QuranPage and SurahReaderPage, optimizing component render times by eliminating repeated O(N) linear array searches.