

## المشكلة
عند الضغط لتشغيل الصوت، يظهر toast خطأ "تعذر تشغيل الصوت/المعاينة" ثم يعمل الصوت بعدها. السبب: المتصفح يمنع تشغيل الصوت إذا حصلت عمليات async (fetch API) بين ضغطة المستخدم وأمر `audio.play()`. هذا يُفقد "سياق إيماءة المستخدم" (user gesture context).

**في `AudioPlayerContext.tsx`**: الضغط على Play → `fetchChapterRecitation` (async) → `resolveAudioSource` (async) → `new Audio(url)` → `audio.play()` ← يفشل لأن gesture context ضاع. ثم يظهر error toast من listener. لكن الصوت يبدأ فعلاً بعد retry أو بعد أن يكتمل التحميل.

**في `SettingsPage.tsx`**: نفس المشكلة — `getReciterAudioUrl` (async) ثم `new Audio` ثم `canplay` → `play()`.

## الحل

### 1. `AudioPlayerContext.tsx` — إنشاء Audio فوراً عند الضغط
- إنشاء `new Audio()` فوراً داخل `play()` قبل أي async
- فتح قفل iOS/Safari بـ `audio.play().catch(() => {})` فوراً (silent unlock)
- بعد الـ async، تعيين `audio.src = url` وتشغيله
- عدم إظهار toast خطأ عند فشل الـ unlock الأولي

### 2. `SettingsPage.tsx` — نفس النمط للمعاينة
- إنشاء `new Audio()` فوراً عند الضغط
- Silent unlock ثم await `getReciterAudioUrl`
- تعيين src بعد الحصول على URL

### الملفات المتأثرة
- `src/contexts/AudioPlayerContext.tsx` — تعديل دالة `play` و `tryPlay`
- `src/pages/SettingsPage.tsx` — تعديل `togglePreview`

