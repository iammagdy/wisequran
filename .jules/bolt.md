## 2024-05-18 - O(1) Indexing for Static Arrays
**Learning:** Sequentially ordered static arrays like `SURAH_META` can be accessed in O(1) time via direct index mapping (`array[id - 1]`) instead of O(N) linear searches using `Array.find()`.
**Action:** Always check if a static array lookup by ID can be mapped directly to its index to improve performance, especially for frequently accessed or large datasets.
## 2024-05-18 - O(1) Indexing for Static Arrays and Render Loops
**Learning:** Using `.find()` inside a React `.map()` loop over an array of size N to lookup data from another array of size M results in an O(N*M) operation, severely impacting rendering performance for large lists like Ayahs and Tafsir.
**Action:** Always use `useMemo` to build an O(1) `Map` keyed by ID prior to the loop. For strictly sequential arrays like `ayahs` inside a specific Surah, favor direct O(1) index access (`array[id - 1]`) with a fallback to `find()` to skip map creation entirely.
