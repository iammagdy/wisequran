

## المشكلة
دالة `downloadSurahAudio` بها عدة مشاكل:

1. **CORS / Fetch يفشل**: عند تحميل الصوت من `mp3quran.net` أو `cdn.islamic.network`، الـ `fetch()` قد يفشل بسبب CORS أو redirect — فيظهر خطأ "فشل تحميل الصوت"
2. **Content-Length = 0**: بعض السيرفرات لا ترجع `Content-Length`، فالـ progress لا يتحدث والمستخدم لا يعرف الحالة
3. **إشعار نجاح كاذب**: `downloadSurahAudio` تنجح (لا يُرمى error) لكن الملف فعلياً فارغ أو تالف — يظهر "تم تحميل الصوت" بدون التحقق
4. **Opaque responses**: استخدام `fetch` مع CDN خارجي قد يرجع `opaque response` بـ `status: 0` — والكود يفحص `res.ok` فقط

## الحل

### 1. إصلاح `downloadSurahAudio` في `src/lib/quran-audio.ts`
- إضافة `mode: "cors"` للـ fetch
- إضافة validation: التحقق أن البيانات المحملة أكبر من حد أدنى (مثلاً 1KB) قبل الحفظ
- إذا فشل الـ streaming reader، استخدام `arrayBuffer()` كـ fallback
- إضافة التحقق من البيانات بعد الحفظ في IndexedDB (قراءة وتأكيد)

### 2. إصلاح `handleDownload` في `SurahBottomBar.tsx`
- بعد التحميل، التحقق فعلياً من وجود الملف في IndexedDB قبل إظهار toast النجاح
- إظهار حجم الملف المحمل في الإشعار

### 3. إصلاح تحميل الصوت في `SettingsPage.tsx`
- نفس التحقق بعد التحميل في دالة `downloadSingleAudio`

### الملفات المتأثرة
- `src/lib/quran-audio.ts` — إضافة validation وfallback أقوى
- `src/components/quran/SurahBottomBar.tsx` — التحقق بعد التحميل
- `src/pages/SettingsPage.tsx` — نفس التحقق

