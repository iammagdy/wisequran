export const APP_VERSION = "3.6.0";

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
    version: "3.6.0",
    date: "2026-04-16",
    ar: {
      improvements: [
        "أداة DevKit أصبحت أقوى مع محرر كامل لملاحظات الإصدار — يمكن للمسؤول الآن كتابة وتعديل ومعاينة التحديثات بالعربية والإنجليزية قبل نشرها",
        "لوحة Feature Flags جديدة — تبويب رمضان، وضع الصيانة، رسالة الصيانة، وزر التثبيت قابلون للتفعيل المباشر بدون نشر كود جديد",
        "نسخ احتياطي واستعادة DevKit — تصدير الإعدادات الكاملة (الأعلام + سجل التغييرات + تجاوز الإصدار) كملف JSON لاستعادته على أي جهاز",
        "معاينة ملاحظات الإصدار تدعم الآن التبديل الفوري بين AR وEN داخل المحرر مباشرة",
        "عرض الفرق قبل/بعد عند استيراد نسخة احتياطية — شاهد ما الذي سيتغير بالضبط قبل التأكيد",
      ],
    },
    en: {
      improvements: [
        "DevKit upgraded with a full changelog editor — admins can write, edit, and preview release notes in both Arabic and English before publishing",
        "New Feature Flags panel — Ramadan tab, maintenance mode, maintenance message, and install prompt can all be toggled live without a code deploy",
        "DevKit Backup & Restore — export the full admin config (flags + changelog + version override) as a JSON file and restore it on any device",
        "Changelog preview now supports instant EN/AR language switching directly inside the editor",
        "Before/after diff view when importing a DevKit backup — see exactly what will change before confirming",
      ],
    },
  },
  {
    version: "3.5.0",
    date: "2026-04-16",
    ar: {
      improvements: [
        "تصفّح القرآن والتفسير أصبح أسرع وأسلس — الصفحات الطويلة مثل سورة البقرة تُعرض بدون أي تعثّر",
        "لا تضيع بياناتك عند انقطاع الإنترنت — تُحفظ تلقائياً وتُزامَن بهدوء عند العودة للإنترنت",
        "الانتقال إلى آية بعيدة يُضيء الآية المقصودة بتأثير خفيف حتى تعرف دائماً أين وصلت",
        "مشغّل الصوت أكثر توفيراً للبطارية — أداؤه نفسه، لكنه يستهلك طاقة أقل في الخلفية",
        "اختصارات الشاشة الرئيسية محسّنة مع لقطات شاشة واضحة عند تثبيت التطبيق",
        "نحن نعمل باستمرار على تحسين هذا التطبيق وصيانته — التحديثات والإصلاحات لا تتوقف أبداً",
      ],
    },
    en: {
      improvements: [
        "Browsing the Quran and Tafsir is now much faster — long surahs like Al-Baqarah scroll without any slowdown",
        "Your data is never lost offline — it saves automatically and syncs quietly when your connection returns",
        "Jumping to a faraway ayah now highlights it with a gentle glow so you always know exactly where you are",
        "The audio player is easier on your battery — same smooth experience, less power used in the background",
        "Improved home screen shortcuts and a better install experience with clear screenshots",
        "We are always working on this app, fixing and improving it — updates never stop",
      ],
    },
  },
  {
    version: "3.4.0",
    date: "2026-03-27",
    ar: {
      features: [
        "إضافة وضع الجمعة الكامل مع مركز مخصص يضم سورة الكهف، تذكير الجمعة، عداد الصلاة على النبي ﷺ، وقائمة متابعة",
      ],
      improvements: [
        "توسيع خطة الحفظ لتشمل نظرة أسبوعية للمراجعة مع اقتراح يومي أوضح",
        "ترقية تقارير التسميع بإحصاءات أعمق مثل متوسط الثقة وأفضل/أضعف آية وأكثر الكلمات تعثرًا",
      ],
      fixes: [
        "الحفاظ على عمل تحليلات التسميع حتى بدون إعداد Supabase عبر مسار محلي احتياطي للسجل",
      ],
    },
    en: {
      features: [
        "Added a full Friday Mode hub with Surah Al-Kahf, Friday reminders, a salawat counter, and a guided checklist",
      ],
      improvements: [
        "Expanded Hifz planning with a clearer weekly revision overview and daily recommendation",
        "Upgraded recitation reports with deeper analytics such as average confidence, strongest/weakest ayah, and most difficult words",
      ],
      fixes: [
        "Kept recitation analytics working even without Supabase by adding a safe local history fallback",
      ],
    },
  },
  {
    version: "3.3.1",
    date: "2026-03-27",
    ar: {
      features: [
        "إضافة صفحة تشخيص Safari مع فحوصات سريعة للصوت والمايك والإشعارات وسجل نتائج محفوظ",
        "إضافة مركز بدون إنترنت لتحميل نصوص القرآن وصوت القارئ الحالي وإدارة التخزين بسهولة",
      ],
      improvements: [
        "إضافة بطاقات منفصلة في الصفحة الرئيسية لمتابعة القراءة والاستماع بسرعة",
        "إضافة تخصيصات قراءة جديدة مثل تباعد السطور، لون النص، ووضع التركيز الهادئ",
        "تحسين لوحة الإحصائيات ببطاقة هدف أسبوعي وملخص أساسي لتقدم الحفظ",
      ],
      fixes: [
        "تحسين صفحة التسميع بإضافة مهلة توقف قابلة للتعديل ومسار لإعادة الجزء المتعثر فقط",
      ],
    },
    en: {
      features: [
        "Added a Safari Diagnostics page with quick audio, microphone, and notification checks plus persistent history logs",
        "Added an Offline Center for Quran text and current-reciter audio downloads with simple storage management",
      ],
      improvements: [
        "Added separate home quick-resume cards for reading and listening",
        "Added new reader personalization controls for line spacing, text tone, and a calmer focus preset",
        "Enhanced the Stats dashboard with a weekly goal card and a basic memorization snapshot",
      ],
      fixes: [
        "Improved the recitation page with adjustable pause tolerance and a practice-missed-part flow",
      ],
    },
  },
  {
    version: "3.3.0",
    date: "2026-03-19",
    ar: {
      improvements: [
        "تحسين أداء التحميل الأولي عبر تقسيم الحزم الكبيرة بشكل أذكى لتقليل الضغط على أول فتح للتطبيق",
        "تقليل الحمل داخل صفحة الإعدادات عبر تأجيل تحميل عمليات التخزين الثقيلة حتى الحاجة إليها",
      ],
      fixes: [
        "إزالة تبويب رمضان من التنقل الحالي مع الإبقاء على الصفحة في الكود لإعادة تفعيلها لاحقًا عند الحاجة",
        "تحسين انتقالات التنقل بعد إزالة تبويب رمضان لتبقى الحركة منطقية ومتسقة بين الصفحات",
      ],
    },
    en: {
      improvements: [
        "Improved initial-load performance with smarter bundle splitting to reduce the cost of the first app open",
        "Reduced Settings page overhead by deferring heavy storage/database operations until they are actually needed",
      ],
      fixes: [
        "Removed the Ramadan tab from current navigation while keeping the page code available for future reuse",
        "Adjusted page transition ordering after removing the Ramadan tab so navigation stays consistent",
      ],
    },
  },
  {
    version: "3.2.1",
    date: "2026-03-18",
    ar: {
      fixes: [
        "🔧 إصلاح دعم متصفح Safari على iPhone",
        "🎙️ ميزة التسميع تعمل الآن على iPhone",
        "🔊 إصلاح تشغيل الأذان على iOS Safari",
      ],
    },
    en: {
      fixes: [
        "🔧 Fixed Safari support on iPhone",
        "🎙️ Recitation now works on iPhone",
        "🔊 Fixed Azan playback on iOS Safari",
      ],
    },
  },
  {
    version: "3.2.0",
    date: "2026-03-18",
    ar: {
      features: [
        "إطلاق طبقة صوت موحدة للموبايل تربط استماع القرآن والأذان والتنبيهات ومعاينات الإعدادات في مسار تشغيل واحد",
      ],
      improvements: [
        "تحسين تهيئة الصوت على Android وiPhone عبر تفعيل global audio bootstrap من أول تفاعل داخل التطبيق",
        "تحسين تنبيهات الصلاة والأذكار وورد القراءة لتعمل عبر service worker عند توفره مع fallback تلقائي داخل الصفحة",
        "إدخال ملفات الأذان المحلية ضمن كاش الـPWA لتحسين الاعتمادية والتحميل على الأجهزة المحمولة",
      ],
      fixes: [
        "إصلاح regression في تشغيل استماع القرآن على الموبايل عبر إعادة بناء مسار التشغيل على مشغل مركزي موحد",
        "إصلاح تشغيل الأذان والتذكيرات من مسارات متعددة غير متناسقة كانت تسبب فشلًا على Android وiPhone",
        "إضافة تعويض ذكي عند عودة التطبيق للواجهة لتقليل ضياع الأذان أو التذكير إذا تم تعليق التطبيق مؤقتًا بالخلفية",
      ],
    },
    en: {
      features: [
        "Introduced a unified mobile audio layer connecting Quran listening, Adhan, reminders, and Settings previews through one playback pipeline",
      ],
      improvements: [
        "Improved Android and iPhone audio readiness with a global audio bootstrap on the user's first interaction",
        "Prayer, azkar, and reading reminders now prefer service-worker notifications when available with page fallback",
        "Local Adhan audio files are now included in PWA caching for better reliability on mobile devices",
      ],
      fixes: [
        "Fixed the mobile Quran listening regression by rebuilding playback on top of a centralized audio manager",
        "Fixed fragmented Adhan/reminder playback paths that were causing failures on Android and iPhone",
        "Added catch-up handling when the app returns to the foreground so recent missed prayer events can still surface",
      ],
    },
  },
  {
    version: "3.1.0",
    date: "2026-03-17",
    ar: {
      fixes: [
        "إصلاح فشل تشغيل الصوت على أجهزة iPhone — يعمل الآن بسلاسة على Safari",
        "إصلاح واجهة بوصلة القبلة التي كانت تتحرك بالكامل مع الجيروسكوب — الواجهة ثابتة والإبرة فقط تتحرك",
        "إصلاح فشل تسجيل الدخول على النطاق المخصص مع رسالة خطأ أوضح",
      ],
      improvements: [
        "التحديث التلقائي الفوري عند اكتشاف إصدار جديد بدون تدخل يدوي",
        "تحسين أداء التطبيق: تحميل الصفحات عند الطلب لتقليل وقت التحميل الأولي",
        "تحسين استجابة بوصلة القبلة باستخدام انتقالات CSS خفيفة بدلاً من الرسوم المتحركة الثقيلة",
      ],
    },
    en: {
      fixes: [
        "Fixed audio playback failure on iPhone — now works smoothly on Safari",
        "Fixed Qibla compass UI gyroscoping with device — UI stays stable, only needle rotates",
        "Fixed authentication failure on custom domain with clearer error messaging",
      ],
      improvements: [
        "Automatic instant updates — app updates immediately when a new version is detected",
        "Performance boost: lazy-loaded pages reduce initial load time significantly",
        "Smoother compass animations using lightweight CSS transitions instead of spring physics",
      ],
    },
  },
  {
    version: "3.0.0",
    date: "2026-03-17",
    ar: {
      features: [
        "إصلاح شامل لأحجام العناصر التفاعلية: جميع الأزرار تحقق معايير الوصول WCAG بحد أدنى 44x44px",
        "تحسين تجربة الاستخدام للمستخدمين ذوي الإعاقات الحركية من خلال زيادة أحجام الأهداف اللمسية",
      ],
      improvements: [
        "تم زيادة حجم أزرار التحكم في مشغل الصوت (إيقاف، نسخ، اختيار السرعة)",
        "تحسين أحجام أزرار التنقل والتحكم عبر جميع الصفحات",
        "توسيع المناطق القابلة للنقر للعناصر الصغيرة مع الحفاظ على حجم الرموز البصري",
      ],
      fixes: [
        "إصلاح أزرار صغيرة لا تلبي معايير الوصول في 23+ عنصر تفاعلي",
        "توحيد أحجام الأزرار عبر جميع المكونات لتجربة متسقة",
      ],
    },
    en: {
      features: [
        "Comprehensive accessibility overhaul: all interactive elements now meet WCAG 44x44px minimum touch target size",
        "Improved usability for users with motor impairments through larger, easier-to-tap touch targets",
      ],
      improvements: [
        "Increased audio player control sizes (stop button, copy button, speed selector)",
        "Enhanced touch targets for navigation and control buttons across all pages",
        "Expanded clickable areas for small elements while preserving icon visual size",
      ],
      fixes: [
        "Fixed 23+ undersized interactive elements failing WCAG AAA accessibility requirements",
        "Unified button sizing across components for consistent user experience",
      ],
    },
  },
  {
    version: "2.9.0",
    date: "2026-03-17",
    ar: {
      features: [
        "إعادة تصميم شاملة لاختبار التلاوة: الآيات مخفية وتظهر تدريجياً عند التسميع من الذاكرة",
        "نظام الاستماع الذكي: التقييم التلقائي وبدء الآية التالية بدون تدخل يدوي (تسميع متواصل)",
      ],
      improvements: [
        "تنسيق أرقام الآيات والإحصائيات لتظهر بالأرقام العربية (١٢٣) عند استخدام الواجهة العربية",
        "تحسين رؤية الآيات القادمة بإطارات رمادية مميزة في الوضع الليلي",
        "إضافة زر الرجوع المفقود في صفحات الأذكار والصلوات لتحسين التنقل",
      ],
      fixes: [
        "شريط تحكم ثابت للميكروفون أعلى شريط التنقل لضمان رؤية كاملة لجميع الآيات",
        "إصلاح تداخل شريط الميكروفون مع الآية الأخيرة في صفحة الاختبار",
        "إخفاء شريط الصوت العالمي تلقائياً عند دخول صفحة اختبار التلاوة",
      ],
    },
    en: {
      features: [
        "Major Recitation Test redesign: verses are hidden and reveal smoothly as you recite from memory",
        "Hands-free mode: auto-evaluation on silence and automatic advance to the next verse",
      ],
      improvements: [
        "Localized Arabic numerals throughout the app (Settings, Install Modal, and testing pages)",
        "Improved visibility of upcoming verses with clear gray frames in Dark Mode",
        "Fixed missing back buttons on Azkar and Prayer pages for smoother navigation",
      ],
      fixes: [
        "Stationary Mic Bar boundary positioned above navigation for a clean, non-overlapping layout",
        "Fixed mic bar overlapping the last verse on the recitation test page",
        "Automatically hide the global audio bar when entering the recitation test",
      ],
    },
  },
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
