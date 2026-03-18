# PRD

## Original Problem Statement
المستخدم لديه تطبيق قرآن كريم PWA وكان يريد إصلاح مشاكل الصوت والتشغيل على الموبايل:
1) استماع القرآن لم يعد يعمل على Android وiPhone.
2) الأذان/التذكيرات الصوتية لم تعد تعمل بشكل موثوق.
3) مطلوب تنفيذ خطة إصلاح شاملة ثم تحديث التطبيق إلى الإصدار 3.2.0 مع تحديث سجل التغييرات.

## Architecture Decisions
- بناء طبقة صوت موحدة `mobileAudioManager` بدل تعدد مسارات `new Audio()` المبعثرة عبر المشروع.
- إضافة bootstrap عام للصوت من أول تفاعل داخل التطبيق لرفع جاهزية التشغيل على Android/iPhone.
- توصيل استماع القرآن، الأذان، التذكيرات، بعض معاينات الإعدادات، وآية اليوم بطبقة الصوت الموحدة.
- تفضيل `serviceWorker.showNotification()` عند توفره عبر helper موحد للتنبيهات مع fallback داخل الصفحة.
- تحسين PWA caching لملفات `/audio/adhan/*.mp3` عبر VitePWA/Workbox.
- تطبيق catch-up logic عند عودة التطبيق للواجهة لتقليل ضياع أحداث الصلاة/التذكير بعد الخلفية.

## What Has Been Implemented
- إنشاء `/app/src/lib/mobile-audio.ts` كمشغل صوت مركزي للقنوات: quran / alarm / preview / ambient.
- إنشاء `/app/src/hooks/useGlobalAudioBootstrap.ts` وربطه في `App.tsx` لتهيئة الصوت بعد أول تفاعل.
- ربط `AudioPlayerContext.tsx` بالمشغل المركزي بدل تهيئة صوت منفصلة لكل تشغيل.
- تحديث `useAdhan.ts` و`usePrayerReminders.ts` لاستخدام المشغل المركزي + تخزين أحداث اليوم + catch-up عند الرجوع من الخلفية.
- تحديث `usePrayerNotifications.ts`, `useAzkarNotifications.ts`, `useReadingReminder.ts`, `IftarCountdown.tsx` لاستخدام helper التنبيهات الموحد.
- تحديث `SettingsPage.tsx` لمعاينات الأذان/التذكير وزر اختبار الأذان/الإشعار، مع إضافة data-testid للأزرار الحرجة.
- تحديث `DailyAyah.tsx` لاستخدام مسار الصوت الموحد.
- تحديث `vite.config.ts` لإدخال mp3 المحلية في precache/runtime cache.
- تحديث النسخة إلى `3.2.0` في `package.json` و`src/data/changelog.ts` و`CHANGELOG.md`.
- البناء النهائي ناجح عبر `yarn build`، مع نجاح فحص واجهات الاستماع والإعدادات في اختبارات الواجهة.

## Prioritized Backlog
### P0
- اختبار فعلي على أجهزة Android Chrome / Samsung Internet / iPhone Safari / iPhone PWA المثبتة للتأكد من السلوك الحقيقي للصوت في foreground والخلفية.
- إضافة شاشة تشخيص صوت داخل الإعدادات تعرض آخر سبب فشل `play()` وحالة audio unlock.

### P1
- فصل `SettingsPage.tsx` إلى أقسام/مكونات أصغر لتقليل مخاطر الارتداد في ميزات الصوت والإشعارات.
- نقل Sleep Mode لاحقًا إلى نفس طبقة الصوت الموحدة لزيادة الاتساق.

### P2
- تحسين code splitting للحزم الكبيرة وتقليل تحذيرات حجم الـ chunks.
- توسيع اختبارات الواجهة الآلية للصوت والإشعارات.

## Next Tasks
- تنفيذ QA فعلي على أجهزة حقيقية.
- إذا ظهر اختلاف على جهاز معين، ربط telemetry خفيف في واجهة الإعدادات لتجميع readyState / visibilityState / NotAllowedError بشكل واضح.
