

## المشكلة
دالة المعاينة في صفحة الإعدادات تستخدم مسارين مختلفين حسب `hasAyahAudio`:
- `true` → `getReciterAyahAudioUrl` → `cdn.islamic.network` (قد لا يحتوي على بعض القراء مثل ماهر المعيقلي)
- `false` → `getReciterAudioUrl` → يحمّل سورة كاملة (30+ MB) مما يسبب timeout أو بطء شديد

**النتيجة:** فشل المعاينة لمعظم القراء.

## الحل
تعديل `togglePreview` في `src/pages/SettingsPage.tsx`:

### 1. توحيد منطق المعاينة
بدلاً من التفريق بين `hasAyahAudio`، نستخدم أولوية ذكية:
- إذا كان القارئ لديه `hasAyahAudio` **و** يملك folder حقيقي على cdn.islamic.network (ليس `ar.alafasy` كـ fallback) → استخدام ayah audio
- وإلا → استخدام `getReciterAudioUrl` (الذي يتحقق من CUSTOM_CDN أولاً)

### 2. إضافة timeout للمعاينة
إضافة timeout بـ 10 ثوانٍ لتجنب انتظار لا نهائي عند تحميل ملفات كبيرة.

### 3. تحسين تجربة المعاينة للسور الكاملة
استخدام `audio.preload = "auto"` مع بدء التشغيل فوراً (streaming) بدلاً من انتظار `canplay` الكامل.

### الملفات المتأثرة
- `src/pages/SettingsPage.tsx` — تعديل دالة `togglePreview` فقط

