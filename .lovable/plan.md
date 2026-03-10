

## المشكلة

من الـ console log: `trying source 1/1` — يعني لقارئ العفاسي، `getReciterAudioUrls` تُرجع URL واحد فقط (`cdn.islamic.network`) بدون أي fallback. هذا لأن:

1. العفاسي ليس له `mp3quranId` ولا custom CDN، فـ `getReciterAudioUrl` تُرجع `cdn.islamic.network` مباشرة
2. في `getReciterAudioUrls`، `primaryUrl === cdnFallback` فلا يُضاف fallback
3. الـ CORS proxy لا يُضاف لأن الـ URL لا يحتوي `mp3quran.net`

**النتيجة**: URL واحد يفشل بـ "Failed to fetch" (CORS أو network) = لا بديل.

## الحل

### 1. تعديل `getReciterAudioUrls` في `src/lib/reciters.ts`
- إضافة `download.quranicaudio.com` كمصدر بديل للقراء الذين لهم `folder` معروف
- إضافة CORS proxy لـ **كل** المصادر (ليس فقط mp3quran.net) كملاذ أخير
- ضمان وجود 3+ URLs دائماً لأي قارئ

### 2. تعديل `fetchAudioFromUrl` في `src/lib/quran-audio.ts`
- إزالة `mode: "cors"` إذا موجود (حالياً غير موجود لكن للتأكيد)
- إضافة timeout (مثلاً 30 ثانية) باستخدام `AbortController` لتجنب الانتظار اللانهائي
- إضافة retry بدون streaming إذا فشل الـ reader

### الملفات المتأثرة
- `src/lib/reciters.ts` — إضافة مصادر بديلة + CORS proxy لكل URLs
- `src/lib/quran-audio.ts` — إضافة timeout + تحسين الـ fetch

