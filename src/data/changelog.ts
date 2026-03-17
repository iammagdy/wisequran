export const APP_VERSION = "2.8.3";

export interface ChangelogCategory {
  features?: string[];
  improvements?: string[];
  fixes?: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  ar: ChangelogCategory;
  en: ChangelogCategory;
}

export const changelog: ChangelogEntry[] = [
  {
    version: "2.8.3",
    date: "2026-03-17",
    ar: {
      fixes: [
        "إصلاح تعليق تحميل الصوت (Infinite Loading) على متصفح Safari لجهاز iPhone",
        "تحسين إعادة استخدام مشغل الصوت ومعالجة الأخطاء لتجربة أكثر سلاسة على iOS",
        "إصلاح مشكلة فقدان مكتبة Supabase عند بناء التطبيق لضمان استقرار التشغيل",
      ],
    },
    en: {
      fixes: [
        "Fixed infinite loading/deadlock of audio playback on iOS Safari",
        "Improved audio element reuse and error handling for a smoother experience on iPhone",
        "Fixed missing @supabase/supabase-js dependency during the build process",
      ],
    },
  },
  {
    version: "2.8.2",
    date: "2026-03-17",
    ar: {
      improvements: [
        "تحسين الاستجابة على مستويات التكبير المختلفة — النص والأيقونات والأزرار تتكيف تلقائياً",
        "شريط التنقل السفلي يتناسب مع جميع أحجام الشاشات والتكبير — لا تختفي الأيقونات",
        "شريط التشغيل العالمي (audio bar) محسّن لسهولة الاستخدام على شاشات صغيرة وكبيرة",
        "مناطق اللمس ديناميكية تضمن بقاءها فوق ٤٤ بكسل حتى عند تكبير الواجهة",
        "السماح بالتكبير حتى ٥ مرات — يمكنك تكبير أي جزء من التطبيق حسب احتياجك",
      ],
    },
    en: {
      improvements: [
        "Improved responsiveness across different zoom levels — text, icons, and buttons scale automatically",
        "Bottom navigation adapts to all screen sizes and zoom levels — icons never disappear",
        "Global audio bar optimized for both small and large screens with proper spacing",
        "Dynamic touch targets ensure they stay above 44px even when UI is enlarged",
        "User zoom now supported up to 5x — you can magnify any part of the app as needed",
      ],
    },
  },
  {
    version: "2.8.1",
    date: "2026-03-17",
    ar: {
      fixes: [
        "إصلاح تسجيل الدخول والتسجيل على النطاقات المخصصة — يعمل بشكل موثوق على أي نطاق",
        "إضافة معالجة قوية لروابط التحقق من البريد الإلكتروني من النطاقات المخصصة",
        "تحسين رسائل الأخطاء لتوضيح السبب الفعلي للفشل",
      ],
      improvements: [
        "التحقق من الجلسة بعد تسجيل الدخول لضمان استقرار أفضل",
        "سجلات تفصيلية للمطورين في وضع التطوير لتتبع مشاكل المصادقة",
        "معالجة أفضل للأخطاء المتعلقة بالشبكة والرموز",
      ],
    },
    en: {
      fixes: [
        "Fixed sign-in and sign-up on custom domains — now works reliably on any domain",
        "Added robust handling for email verification links from custom domains",
        "Better error messages that clarify the actual reason for authentication failures",
      ],
      improvements: [
        "Session validation after login ensures more stable authentication",
        "Detailed developer logs in development mode to track auth issues",
        "Improved handling of network errors and token-related issues",
      ],
    },
  },
  {
    version: "2.8.0",
    date: "2026-03-16",
    ar: {
      improvements: [
        "تحسين دقة التقييم في اختبار التلاوة — تقييم أكثر عدلاً وموثوقية",
        "انتظار الصمت قبل التقييم — يُعطيك وقتاً لإنهاء الآية بشكل طبيعي",
        "إخفاء نص الآية قبل التلاوة — تلقي من الذاكرة بدون مساعدة",
      ],
      fixes: [
        "إصلاح فقدان الكلمات الأخيرة أثناء التلاوة",
        "تحسين استقرار نظام التعرف على الصوت عند انتهاء الجلسة",
      ],
    },
    en: {
      improvements: [
        "Better recitation scoring accuracy — fairer and more reliable evaluation",
        "Wait for silence before scoring — gives you time to finish verses naturally",
        "Verse text is hidden before recitation — truly recite from memory",
      ],
      fixes: [
        "Fixed issue where the last words were sometimes lost during recitation",
        "Improved speech recognition stability when a session ends",
      ],
    },
  },
  {
    version: "2.7.0",
    date: "2026-03-16",
    ar: {
      improvements: [
        "إزالة بانر تسجيل الدخول المزعج — يمكنك تسجيل الدخول من الإعدادات في أي وقت",
        "إصلاح تسجيل الدخول على النطاقات المخصصة — يعمل الآن بشكل صحيح خارج Bolt Preview",
        "تحسين إعدادات PWA لضمان تثبيت أفضل وتحديثات أكثر موثوقية",
      ],
    },
    en: {
      improvements: [
        "Removed the sign-in banner — you can now sign in from Settings whenever you want",
        "Fixed authentication on custom domains — no longer limited to Bolt Preview",
        "Improved PWA configuration for better installation and more reliable updates",
      ],
    },
  },
  {
    version: "2.6.0",
    date: "2026-03-16",
    ar: {
      features: [
        "وضع النوم — استمع للقرآن قبل النوم مع مؤقت ذكي وتلاشٍ تدريجي للصوت",
        "أصوات الطبيعة: مطر وأمواج وغابة تُعزف بجانب القرآن أثناء النوم",
        "واجهة ليلية ساحرة مع قمر متحرك ونجوم تتلألأ وعداد دائري",
        "٣ قراء جدد بأصوات هادئة: سعد الغامدي، ناصر القطامي، خالد القحطاني",
        "بحث في آيات السورة مع تمييز النتائج والتنقل بينها",
        "واجهة قبلة ثلاثية الأبعاد بنمط AR مع سهم توجيه متحرك",
      ],
      improvements: [
        "حفظ إحصائيات جلسات وضع النوم لمتابعة عاداتك",
      ],
      fixes: [
        "تنظيف قائمة الأذان: الإبقاء على أفضل ٣ أصوات فقط",
        "معاينة الأذان: مؤشر تحميل واضح وتحديد وقت انتهاء مع رسائل خطأ أوضح",
      ],
    },
    en: {
      features: [
        "Sleep Mode — listen to Quran before bed with a smart timer and gradual fade-out",
        "Nature sounds: rain, ocean waves, and forest play alongside the Quran while you sleep",
        "Beautiful night-themed UI with an animated moon, twinkling stars, and circular countdown",
        "3 new calm reciters: Saad Al-Ghamdi, Nasser Al-Qatami, Khalid Al-Qahtani",
        "Search inside any surah with highlighted results and previous/next navigation",
        "Redesigned 3D Qibla with professional AR-style overlay and animated directional arrow",
      ],
      improvements: [
        "Sleep Mode session stats are now saved so you can track your listening habits",
      ],
      fixes: [
        "Adhan list cleaned up — only the top 3 voices kept (Makkah, Madinah, Afasy)",
        "Adhan preview now shows a loading indicator, timeout handling, and clearer errors",
      ],
    },
  },
  {
    version: "2.5.0",
    date: "2026-03-16",
    ar: {
      fixes: [
        "إصلاح تداخل شعارات التثبيت والحفظ في أسفل الشاشة",
        "إصلاح نظام التسجيل والدخول للعمل بدون تأكيد البريد الإلكتروني",
      ],
      improvements: [
        "رسائل أخطاء أوضح في نظام المصادقة مع سجلات تفصيلية للمطورين",
        "التحقق من الجلسة بعد التسجيل لضمان الدخول التلقائي",
        "استقرار وموثوقية أفضل عند إنشاء حسابات جديدة",
      ],
    },
    en: {
      fixes: [
        "Fixed UI overlap between the install banner and save progress banner",
        "Fixed sign-up and sign-in to work without email confirmation",
      ],
      improvements: [
        "Clearer authentication error messages with detailed developer logs",
        "Session validation after signup ensures automatic login always works",
        "More reliable and stable account creation process",
      ],
    },
  },
  {
    version: "2.4.0",
    date: "2026-03-15",
    ar: {
      fixes: [
        "إصلاح حلقة لا نهائية في نظام الإنجازات كانت تُبطئ التطبيق",
        "إصلاح حلقة لا نهائية في تذكير القراءة اليومي كانت تستنزف البطارية",
      ],
      improvements: [
        "استقرار أفضل للتطبيق عند استخدام الإنجازات والتذكيرات معاً",
      ],
    },
    en: {
      fixes: [
        "Fixed an infinite loop in the Achievements system that was slowing the app down",
        "Fixed an infinite loop in the daily reading reminder that was draining battery",
      ],
      improvements: [
        "Much better overall stability when using Achievements and Reminders",
      ],
    },
  },
  {
    version: "2.3.0",
    date: "2026-03-14",
    ar: {
      features: [
        "تبويب «ترجمة» مستقل في صفحة قراءة السورة",
        "دعم أكثر من ١٢ ترجمة: Sahih International، يوسف علي، بكثال، وأخرى",
      ],
      fixes: [
        "إصلاح تجاوز الحد في صفحة التسبيح على الشاشات الصغيرة",
        "إصلاح اقتطاع النص في بطاقة متابعة القراءة وشريط تشغيل السورة",
        "إصلاح شبكة إحصائيات الحفظ لتناسب الشاشات الضيقة (٣٢٠ بكسل)",
      ],
      improvements: [
        "مناطق اللمس في جميع الأزرار محسّنة لتصل إلى ٤٤ بكسل كحد أدنى",
      ],
    },
    en: {
      features: [
        "Dedicated Translation tab in the Surah reader",
        "Support for 12+ translations: Sahih International, Yusuf Ali, Pickthall, and more",
      ],
      fixes: [
        "Fixed Tasbeeh page overflowing on small screens",
        "Fixed text truncation in the Continue Reading card and Surah bottom bar",
        "Fixed Hifz stats grid for narrow screens (320px)",
      ],
      improvements: [
        "All tap targets improved to meet the 44px minimum across the app",
      ],
    },
  },
  {
    version: "2.2.0",
    date: "2026-03-12",
    ar: {
      fixes: [
        "إصلاح ظهور زر الإغلاق مكرراً في شاشة التشغيل والإنجازات وسجل التحديثات",
        "إضافة زر إغلاق دائم في وضع التركيز حتى لا يختفي عن المستخدم",
      ],
      improvements: [
        "شاشة التشغيل الكاملة تظهر الآن بحركة انتقال سلسة من الأسفل",
        "زر إغلاق رسالة التثبيت أكبر وأسهل للضغط",
      ],
    },
    en: {
      fixes: [
        "Fixed a duplicate close button appearing in Now Playing, Achievements, and Changelog",
        "Added a persistent close button in Focus Mode so it never hides from the user",
      ],
      improvements: [
        "The Now Playing full screen now slides up with a smooth, natural animation",
        "Install banner close button is larger and much easier to tap",
      ],
    },
  },
  {
    version: "2.1.0",
    date: "2026-03-12",
    ar: {
      improvements: [
        "طلب إذن الموقع فقط عند استخدام أداة القبلة، لا عند فتح التطبيق",
        "رسالة واضحة عند التحقق من التحديثات",
        "أيقونات وخطوط أكبر في شريط التنقل السفلي",
      ],
    },
    en: {
      improvements: [
        "Location permission is only requested when you open the Qibla tool",
        "Clear message shown when checking for updates",
        "Larger, more readable icons and labels in the bottom navigation bar",
      ],
    },
  },
  {
    version: "2.0.0",
    date: "2026-03-12",
    ar: {
      features: [
        "شاشة تشغيل كاملة مع اسم السورة والقارئ وأزرار تحكم",
        "عرض الآيات أثناء التلاوة مع تمييز الآية الحالية",
      ],
      improvements: [
        "تحميل التلاوات أكثر موثوقية مع تأكيد قبل إظهار رسالة النجاح",
        "زر للتحقق من التلاوات المحمّلة وإصلاح الملفات غير المكتملة",
        "تحسين تثبيت التطبيق على أجهزة أندرويد",
      ],
    },
    en: {
      features: [
        "New Now Playing screen with surah name, reciter info, and playback controls",
        "Verse-by-verse display during recitation with the current verse highlighted",
      ],
      improvements: [
        "Audio downloads are more reliable — success is confirmed before notifying you",
        "New button to verify downloaded recitations and repair incomplete files",
        "Better app installation experience on Android devices",
      ],
    },
  },
  {
    version: "1.5.0",
    date: "2026-03-10",
    ar: {
      features: [
        "نظام تحديث تلقائي ذكي للتطبيق",
        "زر مشاركة التطبيق مع الأصدقاء",
        "عرض رقم الإصدار وسجل التحديثات",
      ],
      improvements: [
        "التحقق اليدوي من التحديثات في أي وقت",
        "بطاقة المطوّر بتصميم رمضاني",
      ],
    },
    en: {
      features: [
        "Smart automatic app update system",
        "Share the app with friends directly from Settings",
        "Version number display and full changelog viewer",
      ],
      improvements: [
        "Manual update check available anytime in Settings",
        "Developer card with a Ramadan-inspired design",
      ],
    },
  },
  {
    version: "1.0.0",
    date: "2026-03-01",
    ar: {
      features: [
        "الإصدار الأول — القرآن الكريم مع البحث والعلامات المرجعية",
        "الأذكار والأدعية مع عدّاد التكرار",
        "مواقيت الصلاة واتجاه القبلة",
        "الوضع الليلي والتحكم بحجم الخط",
        "تحميل القرآن والتلاوات للاستخدام بدون إنترنت",
      ],
    },
    en: {
      features: [
        "First release — Quran reading with search and bookmarks",
        "Azkar and Duas with repetition counter",
        "Prayer times and Qibla direction",
        "Dark mode and font size controls",
        "Offline Quran text and audio downloads",
      ],
    },
  },
];
