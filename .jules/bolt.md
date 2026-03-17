## 2024-05-18 - O(1) Indexing for Static Arrays
**Learning:** Sequentially ordered static arrays like `SURAH_META` can be accessed in O(1) time via direct index mapping (`array[id - 1]`) instead of O(N) linear searches using `Array.find()`.
**Action:** Always check if a static array lookup by ID can be mapped directly to its index to improve performance, especially for frequently accessed or large datasets.## 2026-03-17 - O(1) Map Lookups for API Data
**Learning:** While static bundled arrays can be optimized with O(1) direct index mapping `array[id - 1]`, API-fetched arrays like `ayahs` and `translationAyahs` should be optimized with `new Map()` to prevent brittle logic if API data is missing or unsorted. Additionally, building a full `Map` is slower than `.find()` for single, one-off lookups.
**Action:** Use `useMemo` to build a `Map` for repeated O(1) lookups inside React render loops. Retain `.find()` for single lookups to save Map allocation overhead.
