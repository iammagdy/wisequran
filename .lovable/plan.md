

## الوضع الحالي

الإصلاحات من الخطة السابقة **مطبّقة بالفعل** في الكود:
- `mode: "cors"` موجود في `downloadSurahAudio`
- التحقق من الحد الأدنى (1KB) موجود
- Fallback إلى `arrayBuffer()` موجود
- التحقق بعد الحفظ في IndexedDB موجود في كل من `SurahBottomBar` و `SettingsPage`

## المشكلة الحقيقية المتبقية

سيرفرات `mp3quran.net` (مثل `server10.mp3quran.net`, `server12.mp3quran.net`, إلخ) **لا ترسل CORS headers**. هذا يعني أن `fetch(url, { mode: "cors" })` سيفشل دائماً لهذه السيرفرات. هذا يؤثر على أغلب القراء (العجمي، المعيقلي، ياسر الدوسري، القطامي، اللحيدان، أيوب، إدريس أبكر، وكل قارئ له `mp3quranId`).

## الحل المقترح

### استخدام CORS Proxy كـ fallback

عندما يفشل الـ fetch المباشر بسبب CORS، نستخدم proxy عام كمحاولة ثانية:

1. **تعديل `src/lib/quran-audio.ts`**: في `downloadSurahAudio`، إذا فشل `fetch(url, {mode:"cors"})` بخطأ CORS/network:
   - المحاولة الثانية: `fetch` بدون `mode: "cors"` (default)
   - المحاولة الثالثة: استخدام proxy مثل `https://api.allorigins.win/raw?url=` أو `https://corsproxy.io/?`
   
2. **بديل أفضل**: استخدام `cdn.islamic.network` كـ fallback لكل القراء المتوفرين عليه (بدل mp3quran.net) لأنه يدعم CORS. القراء الذين ليس لهم edition على islamic.network فقط يُجرّب لهم proxy.

3. **تعديل `getReciterAudioUrl`** في `src/lib/reciters.ts`: إضافة دالة تُرجع قائمة URLs بديلة (primary + fallback) بدلاً من URL واحد.

### التفاصيل التقنية

**`src/lib/reciters.ts`**:
- إضافة دالة `getReciterAudioUrls()` تُرجع مصفوفة URLs مرتبة حسب الأولوية

**`src/lib/quran-audio.ts`**:
- تعديل `downloadSurahAudio` لتجربة كل URL بالترتيب مع catch
- إزالة `mode: "cors"` الصريح والاعتماد على default mode أولاً
- إضافة proxy fallback كخيار أخير

### الملفات المتأثرة
- `src/lib/quran-audio.ts` — retry logic مع URLs بديلة
- `src/lib/reciters.ts` — دالة fallback URLs

