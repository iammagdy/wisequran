# PRD

## Original Problem Statement
المستخدم لديه تطبيق قرآن كريم PWA، وكان يعدّل عليه ثم ظهرت مشاكل:
1) الـ layout داخل صفحة قراءة القرآن غير ثابت ويعمل shift يمين/شمال.
2) quran listening tab لا يعمل على Android ولا iOS مع أنه كان يعمل سابقًا.
3) قائمة/صفحة التسميع تكرر الكلام بعد أول جملة وليست دقيقة، والمطلوب أن تسمع الآية مرة واحدة وتطابقها بدون تكرار.

## Architecture Decisions
- الحفاظ على نفس stack الحالي: React + TypeScript + Vite + Tailwind + hooks محلية للتخزين.
- علاج مشكلة ثبات الواجهة من داخل صفحة القراءة نفسها بدل تغيير shell كامل التطبيق.
- إصلاح تشغيل الصوت من الجذر داخل AudioPlayerContext لأن العطل ظهر بعد تغييرات على src/play في المتصفحات المحمولة.
- تحسين Web Speech flow داخل useSpeechRecognition بدل إعادة بناء صفحة التسميع بالكامل.
- معالجة تحذير React من المصدر الحقيقي عبر جعل local-storage sync غير متزامن لتفادي setState أثناء render.

## What Has Been Implemented
- تثبيت هيدر صفحة القراءة عبر grid ثابت، وتقليل احتمالات تغير المحاذاة مع تغير أرقام الصفحات والأزرار.
- تحسين MushafPageView لتقليل الانزياح الأفقي أثناء التنقل بين صفحات المصحف.
- إصلاح مسار تشغيل الاستماع عبر إعادة audio.load() قبل play وبعد retry على تغيير src، مع preload للصوت.
- تحسين useSpeechRecognition لتقليل تكرار النص عبر overlap merge، وإزالة ضم interim transcript بشكل يسبب duplication، وعدم تعطيل iOS إذا كانت Web Speech API متاحة فعلاً.
- رفع مهلة الصمت إلى 3.2s ورفع حد التغطية لتحسين دقة تقييم الآية وتقليل التقييم المبكر.
- إزالة تحذير React runtime المرتبط بـ AchievementUnlockNotification عبر جعل local-storage sync event غير متزامن.
- إضافة data-testid للعناصر الحرجة التي تم تعديلها في صفحة القراءة، صفحة التسميع، وتبويب الاستماع.
- تحديث نص واجهة التسميع ليطابق مهلة الصمت الفعلية.

## Prioritized Backlog
### P0
- اختبار فعلي على iPhone/iPad وAndroid Chrome لتأكيد إصلاح listening tab على أجهزة حقيقية.
- اختبار فعلي بالمايكروفون على /hifz/test للتأكد أن التكرار بعد أول جملة انتهى في الأجهزة الحقيقية.

### P1
- تقسيم SurahReaderPage إلى مكونات أصغر لتقليل التعقيد الجانبي وتحسين الصيانة.
- تحسين fallback الخاص بالخطوط العربية لتقليل أي layout shift مرتبط بتحميل الخطوط على الشبكات البطيئة.

### P2
- إضافة اختبارات UI آلية أوسع لمسارات القراءة/الاستماع/التسميع.
- تحسين chunk splitting لتقليل تحذيرات حجم الحزم في build.

## Next Tasks
- تنفيذ device QA حقيقي على Android وiOS.
- إذا ظهر أي تكرار متبقٍ في التسميع، تسجيل transcript خام من أول آية ومراجعته لضبط thresholds أو restart flow بشكل أدق.
