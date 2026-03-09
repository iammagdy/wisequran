

## المشكلة
المعاينة تفشل لأن المنطق الحالي يحاول استخدام `cdn.islamic.network` للقراء مثل أحمد العجمي وماهر المعيقلي (لأن `hasAyahAudio: true` و folder ليس `ar.alafasy`). لكن هذا الـ CDN لا يحتوي على ملفات لهم فيرجع خطأ.

أيضاً عند تشغيل السورة الكاملة من صفحة القارئ، نفس المشكلة تحصل للقراء الذين لديهم `hasAyahAudio: true` لكن ملفاتهم غير موجودة على cdn.islamic.network.

## الحل

### 1. إصلاح المعاينة في `SettingsPage.tsx`
- **دائماً** استخدام `getReciterAudioUrl(r.id, 1)` للمعاينة (سورة الفاتحة صغيرة جداً < 1MB)
- هذا يضمن استخدام `CUSTOM_CDN_RECITERS` أو mp3quran API بدل cdn.islamic.network
- إزالة منطق `hasRealAyahAudio` من المعاينة

### 2. إصلاح تشغيل السور في `AudioPlayerContext.tsx`
- عند فشل مصدر QF API، التأكد من استخدام `resolveAudioSource` الذي يمر عبر `getReciterAudioUrl` (يدعم CUSTOM_CDN)
- إضافة fallback: إذا فشل المصدر الأول، جرب المصدر الثاني

### الملفات المتأثرة
- `src/pages/SettingsPage.tsx` — تبسيط `togglePreview` لاستخدام `getReciterAudioUrl` دائماً
- `src/contexts/AudioPlayerContext.tsx` — التأكد من fallback صحيح عند فشل التشغيل

