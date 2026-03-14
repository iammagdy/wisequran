import { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export type AppLanguage = "ar" | "en";

interface Translations {
  // Navigation
  nav_quran: string;
  nav_azkar: string;
  nav_prayer: string;
  nav_tasbeeh: string;
  nav_settings: string;
  nav_ramadan: string;

  // Common
  back: string;
  close: string;
  retry: string;
  loading: string;
  search: string;
  save: string;
  reset: string;
  cancel: string;
  confirm: string;
  copied: string;
  share: string;
  today: string;
  ayah: string;
  ayahs: string;
  surah: string;
  page: string;
  minutes_abbr: string;
  ok: string;
  hour: string;
  minute: string;
  second: string;
  days: string;
  day: string;
  overdue: string;
  km: string;
  meters: string;

  // QuranPage
  quran_title: string;
  continue_reading: string;
  search_placeholder: string;
  daily_goal: string;
  surah_list: string;
  juz_list: string;
  bookmarks: string;
  favorites: string;
  history: string;
  reading_history: string;
  statistics: string;
  memorization: string;
  revelation_meccan: string;
  revelation_medinan: string;
  no_bookmarks: string;
  no_favorites: string;
  no_history: string;
  goal_complete: string;

  // SurahReaderPage tabs (aliased for both naming patterns)
  tab_text: string;
  text_tab: string;
  tab_translation: string;
  translation_tab: string;
  tab_tafsir: string;
  tafsir_tab: string;
  focus_mode: string;
  mushaf_view: string;
  ayah_view: string;
  tafsir_of_ayah: string;
  show_full_tafsir: string;
  search_tafsir: string;
  no_tafsir_results: string;
  no_tafsir: string;
  no_translation: string;
  jump_to_ayah: string;
  go_to_page: string;
  go: string;
  page_out_of_range: string;
  invalid_page: string;
  loading_surah: string;
  surah_load_error: string;
  error_loading: string;
  bismillah: string;

  // Translation tab
  translation_header: string;

  // Audio
  now_playing: string;
  playing: string;
  reciter: string;
  of: string;
  download: string;
  downloaded: string;
  audio_unavailable_offline: string;
  audio_disclaimer: string;

  // Azkar
  azkar_title: string;
  azkar_subtitle: string;
  morning_azkar: string;
  evening_azkar: string;
  sleep_azkar: string;
  prayer_azkar: string;
  all_categories: string;
  favorites_only: string;
  azkar_done: string;
  azkar_reset: string;
  times: string;
  no_favorites_azkar: string;
  azkar_search: string;
  azkar_no_results: string;

  // Prayer
  prayer_title: string;
  prayers_title: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  next_prayer: string;
  location_required: string;
  qibla: string;
  prayer_guide: string;
  prayers_completed: string;
  prayer_countdown: string;
  location_detecting: string;
  location_error: string;
  qibla_banner: string;
  qibla_subtitle: string;
  days_streak: string;
  prayers_complete: string;
  complete_prayers: string;

  // Tasbeeh
  tasbeeh_title: string;
  set_target: string;
  target: string;
  total_today: string;
  today_total: string;
  counter_complete: string;
  mashaallah: string;

  // Hifz
  hifz_title: string;
  hifz_subtitle: string;
  memorized: string;
  in_progress: string;
  not_started: string;
  todays_review: string;
  today_review: string;
  no_reviews_today: string;
  review_done_all: string;
  all_reviews_done: string;
  start_hifz: string;
  add_memorized_hint: string;
  mastered: string;
  needs_review: string;
  overdue_days: string;
  strength: string;
  in_review: string;
  due_today: string;
  total_reviews: string;
  avg_streak: string;
  next_review: string;
  mark_memorized: string;
  mark_in_progress: string;
  mark_not_started: string;
  all_surahs: string;
  memorized_surahs: string;
  in_progress_surahs: string;
  filter_all: string;
  no_surahs_in_filter: string;
  weak: string;
  medium: string;
  strong: string;

  // Stats
  stats_title: string;
  total_ayahs: string;
  reading_minutes: string;
  streak_days: string;
  longest_streak: string;
  this_week: string;
  this_month: string;
  weekly_reading: string;
  monthly_calendar: string;
  achievements: string;
  goal_today: string;
  today_goal: string;

  // Settings
  settings_title: string;
  appearance: string;
  theme_light: string;
  theme_dark: string;
  font_size: string;
  ui_scale: string;
  scale_normal: string;
  scale_large: string;
  scale_xlarge: string;
  reciter_section: string;
  tafsir_section: string;
  translation_section: string;
  show_translation: string;
  show_translation_subtitle: string;
  prayer_notifications: string;
  prayer_method: string;
  daily_reading_goal: string;
  downloads: string;
  install_app: string;
  storage: string;
  reset_progress: string;
  ramadan_tab: string;
  about: string;
  version: string;
  changelog: string;
  share_app: string;
  check_updates: string;
  language: string;
  language_arabic: string;
  language_english: string;
  audio_preview: string;

  // Qibla
  qibla_title: string;
  qibla_description: string;
  qibla_direction: string;
  qibla_aligned: string;
  qibla_rotate: string;
  distance_to_kaaba: string;
  compass_accuracy: string;
  accuracy_high: string;
  accuracy_medium: string;
  accuracy_low: string;
  lock_compass: string;
  compass_locked: string;
  unlock_compass: string;
  calibrate: string;
  location_permission: string;
  compass_not_supported: string;
  km_away: string;
  your_location: string;
  location_accuracy: string;
  facing_qibla: string;
  move_device: string;
  calibration_title: string;
  calibration_desc: string;
  allow_compass: string;
  sensor_error: string;

  // Ramadan
  ramadan_title: string;
  ramadan_day: string;
  ramadan_of: string;
  iftar_countdown: string;
  suhoor_countdown: string;
  daily_dua: string;
  ramadan_tips: string;
  daily_checklist: string;
  khatmah_plan: string;
  juz_parts: string;
  today_juz: string;
  complete: string;
  done: string;
  activities_title: string;
  ramadan_error_msg: string;
  error_title: string;
  error_retry: string;

  // Daily Ayah / Wird
  daily_ayah: string;
  daily_wird: string;
  start_khatm_plan: string;
  percent_of_khatm: string;
  restart: string;
  days_plan: string;

  // Reading timer
  reading_time_up: string;

  // Focus mode
  close_focus: string;

  // Achievements
  achievements_title: string;
  achievements_subtitle: string;
  unlocked: string;
  locked: string;
  overall_progress: string;
  new_achievement: string;
  achievement_streak: string;
  achievement_reading: string;
  achievement_hifz: string;
  achievement_goals: string;

  // Changelog
  whats_new: string;
  update_notes: string;
  app_updated: string;
  show_all_changelog: string;
  ok_thanks: string;

  // Install banner
  install_title: string;
  install_description: string;
  install_button: string;
  install_dismiss: string;
  install_subtitle: string;
  install: string;

  // Update notification
  update_available: string;
  update_description: string;
  update_now: string;
  updating: string;
  update: string;

  // Not found
  not_found: string;
  go_home: string;
}

const ar: Translations = {
  nav_quran: "القرآن",
  nav_azkar: "الأذكار",
  nav_prayer: "الصلوات",
  nav_tasbeeh: "التسبيح",
  nav_settings: "الإعدادات",
  nav_ramadan: "رمضان",

  back: "رجوع",
  close: "إغلاق",
  retry: "إعادة المحاولة",
  loading: "جارٍ التحميل...",
  search: "بحث",
  save: "حفظ",
  reset: "إعادة تعيين",
  cancel: "إلغاء",
  confirm: "تأكيد",
  copied: "تم النسخ",
  share: "مشاركة",
  today: "اليوم",
  ayah: "آية",
  ayahs: "آية",
  surah: "سورة",
  page: "صفحة",
  minutes_abbr: "د",
  ok: "حسناً",
  hour: "ساعة",
  minute: "دقيقة",
  second: "ثانية",
  days: "أيام",
  day: "اليوم",
  overdue: "متأخرة",
  km: "كم",
  meters: "متر",

  quran_title: "القرآن الكريم",
  continue_reading: "متابعة القراءة",
  search_placeholder: "بحث بالاسم، الرقم، أو نص الآية...",
  daily_goal: "هدف اليوم",
  surah_list: "السور",
  juz_list: "الأجزاء",
  bookmarks: "العلامات",
  favorites: "المفضلة",
  history: "السجل",
  reading_history: "سجل القراءة",
  statistics: "الإحصائيات",
  memorization: "الحفظ",
  revelation_meccan: "مكية",
  revelation_medinan: "مدنية",
  no_bookmarks: "لا توجد علامات مرجعية",
  no_favorites: "لا توجد سور مفضلة",
  no_history: "لا يوجد سجل قراءة",
  goal_complete: "ما شاء الله! أكملت هدفك اليوم",

  tab_text: "النص",
  text_tab: "النص",
  tab_translation: "ترجمة",
  translation_tab: "ترجمة",
  tab_tafsir: "التفسير",
  tafsir_tab: "التفسير",
  focus_mode: "وضع التركيز",
  mushaf_view: "عرض المصحف",
  ayah_view: "عرض الآيات",
  tafsir_of_ayah: "تفسير الآية",
  show_full_tafsir: "← عرض تفسير السورة بالكامل",
  search_tafsir: "ابحث في التفسير...",
  no_tafsir_results: "لا توجد نتائج لـ",
  no_tafsir: "لا يوجد تفسير متاح",
  no_translation: "لا توجد ترجمة متاحة",
  jump_to_ayah: "انتقل إلى آية...",
  go_to_page: "انتقل إلى صفحة",
  go: "انتقل",
  page_out_of_range: "صفحة خارج نطاق السورة",
  invalid_page: "رقم صفحة غير صالح",
  loading_surah: "جارٍ تحميل السورة...",
  surah_load_error: "تعذر تحميل السورة. تحقق من الاتصال بالإنترنت.",
  error_loading: "تعذر التحميل",
  bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",

  translation_header: "ترجمة معاني القرآن",

  now_playing: "تلاوة جارية",
  playing: "تلاوة جارية",
  reciter: "القارئ",
  of: "من",
  download: "تحميل",
  downloaded: "محمّل",
  audio_unavailable_offline: "صوت غير متاح بدون إنترنت — حمّل الصوت أولاً",
  audio_disclaimer: "قد يتوقف الصوت تلقائياً حسب إعدادات الجهاز والمتصفح",

  azkar_title: "الأذكار والأدعية",
  azkar_subtitle: "أذكار يومية",
  morning_azkar: "أذكار الصباح",
  evening_azkar: "أذكار المساء",
  sleep_azkar: "أذكار النوم",
  prayer_azkar: "أذكار الصلاة",
  all_categories: "الكل",
  favorites_only: "المفضلة",
  azkar_done: "أحسنت! أكملت هذا الذكر",
  azkar_reset: "إعادة",
  times: "مرة",
  no_favorites_azkar: "لا توجد أذكار مفضلة بعد",
  azkar_search: "بحث في الأذكار",
  azkar_no_results: "لا توجد نتائج",

  prayer_title: "مواقيت الصلاة",
  prayers_title: "صلواتي اليوم",
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
  next_prayer: "الصلاة القادمة",
  location_required: "يتطلب تحديد الموقع",
  qibla: "القبلة",
  prayer_guide: "دليل الصلاة",
  prayers_completed: "صلوات مكتملة",
  prayer_countdown: "الوقت المتبقي",
  location_detecting: "جارٍ تحديد الموقع...",
  location_error: "تعذر تحديد الموقع",
  qibla_banner: "اتجاه القبلة 🕋",
  qibla_subtitle: "حدد اتجاه الكعبة المشرفة",
  days_streak: "أيام",
  prayers_complete: "ما شاء الله! 🎉",
  complete_prayers: "أكمل صلواتك",

  tasbeeh_title: "التسبيح",
  set_target: "تحديد العدد المستهدف",
  target: "الهدف",
  total_today: "إجمالي اليوم",
  today_total: "إجمالي اليوم",
  counter_complete: "ما شاء الله!",
  mashaallah: "ما شاء الله! 🎉",

  hifz_title: "متابعة الحفظ",
  hifz_subtitle: "تتبع حفظك للقرآن الكريم",
  memorized: "محفوظة",
  in_progress: "قيد الحفظ",
  not_started: "لم تبدأ",
  todays_review: "المراجعة اليوم",
  today_review: "المراجعة اليوم",
  no_reviews_today: "لا توجد مراجعات اليوم",
  review_done_all: "أحسنت! أكملت جميع المراجعات",
  all_reviews_done: "أحسنت! أكملت جميع المراجعات 🎉",
  start_hifz: "ضع سوراً كمحفوظة لبدء المراجعة",
  add_memorized_hint: "ضع سوراً كمحفوظة لبدء المراجعة",
  mastered: "أتقنتها",
  needs_review: "تحتاج مراجعة",
  overdue_days: "متأخرة",
  strength: "القوة",
  in_review: "في المراجعة",
  due_today: "مستحقة اليوم",
  total_reviews: "إجمالي المراجعات",
  avg_streak: "متوسط السلسلة",
  next_review: "المراجعة القادمة",
  mark_memorized: "محفوظة",
  mark_in_progress: "قيد الحفظ",
  mark_not_started: "لم تبدأ",
  all_surahs: "كل السور",
  memorized_surahs: "المحفوظة",
  in_progress_surahs: "قيد الحفظ",
  filter_all: "الكل",
  no_surahs_in_filter: "لا توجد سور في هذا التصنيف",
  weak: "ضعيف",
  medium: "متوسط",
  strong: "قوي",

  stats_title: "الإحصائيات",
  total_ayahs: "إجمالي الآيات",
  reading_minutes: "دقائق القراءة",
  streak_days: "أيام متواصلة",
  longest_streak: "أطول سلسلة",
  this_week: "هذا الأسبوع",
  this_month: "هذا الشهر",
  weekly_reading: "القراءة الأسبوعية",
  monthly_calendar: "التقويم الشهري",
  achievements: "الإنجازات",
  goal_today: "هدف اليوم",
  today_goal: "هدف اليوم",

  settings_title: "الإعدادات",
  appearance: "المظهر والقراءة",
  theme_light: "فاتح",
  theme_dark: "داكن",
  font_size: "حجم الخط",
  ui_scale: "حجم الواجهة",
  scale_normal: "عادي",
  scale_large: "كبير",
  scale_xlarge: "أكبر",
  reciter_section: "القارئ",
  tafsir_section: "التفسير",
  translation_section: "الترجمة · Translation",
  show_translation: "إظهار الترجمة",
  show_translation_subtitle: "Show Quran translation",
  prayer_notifications: "إشعارات الصلاة",
  prayer_method: "طريقة حساب أوقات الصلاة",
  daily_reading_goal: "هدف القراءة اليومي",
  downloads: "التنزيلات",
  install_app: "تثبيت التطبيق",
  storage: "مساحة التخزين",
  reset_progress: "إعادة تعيين التقدم",
  ramadan_tab: "تبويب رمضان",
  about: "عن التطبيق",
  version: "الإصدار",
  changelog: "سجل التحديثات",
  share_app: "مشاركة التطبيق",
  check_updates: "التحقق من التحديثات",
  language: "اللغة",
  language_arabic: "العربية",
  language_english: "English",
  audio_preview: "معاينة الصوت",

  qibla_title: "اتجاه القبلة",
  qibla_description: "البوصلة نحو الكعبة المشرفة",
  qibla_direction: "اتجاه القبلة",
  qibla_aligned: "في اتجاه القبلة",
  qibla_rotate: "دوّر الجهاز",
  distance_to_kaaba: "المسافة إلى الكعبة",
  compass_accuracy: "دقة البوصلة:",
  accuracy_high: "عالية",
  accuracy_medium: "متوسطة",
  accuracy_low: "منخفضة",
  lock_compass: "تثبيت البوصلة",
  compass_locked: "البوصلة مثبتة",
  unlock_compass: "إلغاء التثبيت",
  calibrate: "معايرة",
  location_permission: "يتطلب إذن الموقع",
  compass_not_supported: "البوصلة غير مدعومة في هذا الجهاز",
  km_away: "كم",
  your_location: "موقعك",
  location_accuracy: "دقة الموقع:",
  facing_qibla: "✓ أنت تواجه القبلة الآن",
  move_device: "حرّك جهازك لتفعيل البوصلة",
  calibration_title: "معايرة البوصلة",
  calibration_desc: "لتحسين دقة البوصلة، حرّك جهازك على شكل رقم ٨ عدة مرات حتى تتحسن الدقة.",
  allow_compass: "يرجى السماح بالوصول إلى البوصلة",
  sensor_error: "تعذر الوصول إلى مستشعر الاتجاه",

  ramadan_title: "رمضان كريم 🌙",
  ramadan_day: "اليوم",
  ramadan_of: "من رمضان",
  iftar_countdown: "الوقت المتبقي للإفطار",
  suhoor_countdown: "الوقت المتبقي للسحور",
  daily_dua: "دعاء اليوم",
  ramadan_tips: "نصائح رمضانية",
  daily_checklist: "ورد اليوم ✅",
  khatmah_plan: "ختمة رمضان 📖",
  juz_parts: "جزء",
  today_juz: "جزء اليوم",
  complete: "إتمام ✓",
  done: "تم",
  activities_title: "فضائل وأدعية 🤲",
  ramadan_error_msg: "لم نتمكن من تحميل بيانات رمضان. يرجى المحاولة مرة أخرى.",
  error_title: "عذراً، حدث خطأ",
  error_retry: "إعادة المحاولة",

  daily_ayah: "آية اليوم",
  daily_wird: "الورد اليومي",
  start_khatm_plan: "ابدأ خطة ختمة",
  percent_of_khatm: "% من الختمة",
  restart: "إعادة البدء",
  days_plan: "يوم",

  reading_time_up: "انتهى وقت القراءة 📖",

  close_focus: "إغلاق وضع التركيز",

  achievements_title: "الإنجازات",
  achievements_subtitle: "تتبع إنجازاتك في القراءة",
  unlocked: "مفتوح",
  locked: "مقفل",
  overall_progress: "التقدم الكلي",
  new_achievement: "🎉 إنجاز جديد!",
  achievement_streak: "المواصلة",
  achievement_reading: "القراءة",
  achievement_hifz: "الحفظ",
  achievement_goals: "الأهداف",

  whats_new: "ما الجديد في الإصدار",
  update_notes: "ملاحظات التحديث",
  app_updated: "تم تحديث التطبيق بنجاح",
  show_all_changelog: "عرض كل سجل التحديثات",
  ok_thanks: "حسناً، شكراً!",

  install_title: "ثبّت التطبيق",
  install_description: "أضف التطبيق إلى شاشتك الرئيسية للوصول السريع",
  install_button: "تثبيت",
  install_dismiss: "لاحقاً",
  install_subtitle: "للوصول السريع بدون متصفح",
  install: "تثبيت",

  update_available: "تحديث جديد متاح",
  update_description: "اضغط للتحديث والحصول على أحدث الميزات",
  update_now: "تحديث الآن",
  updating: "جارٍ التحديث...",
  update: "تحديث",

  not_found: "الصفحة غير موجودة",
  go_home: "العودة للرئيسية",
};

const en: Translations = {
  nav_quran: "Quran",
  nav_azkar: "Azkar",
  nav_prayer: "Prayer",
  nav_tasbeeh: "Tasbeeh",
  nav_settings: "Settings",
  nav_ramadan: "Ramadan",

  back: "Back",
  close: "Close",
  retry: "Try Again",
  loading: "Loading...",
  search: "Search",
  save: "Save",
  reset: "Reset",
  cancel: "Cancel",
  confirm: "Confirm",
  copied: "Copied",
  share: "Share",
  today: "Today",
  ayah: "verse",
  ayahs: "verses",
  surah: "Surah",
  page: "Page",
  minutes_abbr: "min",
  ok: "OK",
  hour: "hr",
  minute: "min",
  second: "sec",
  days: "days",
  day: "Day",
  overdue: "overdue",
  km: "km",
  meters: "m",

  quran_title: "The Noble Quran",
  continue_reading: "Continue Reading",
  search_placeholder: "Search by name, number, or verse text...",
  daily_goal: "Daily Goal",
  surah_list: "Surahs",
  juz_list: "Juz",
  bookmarks: "Bookmarks",
  favorites: "Favorites",
  history: "History",
  reading_history: "Reading History",
  statistics: "Statistics",
  memorization: "Memorization",
  revelation_meccan: "Meccan",
  revelation_medinan: "Medinan",
  no_bookmarks: "No bookmarks yet",
  no_favorites: "No favorite surahs",
  no_history: "No reading history",
  goal_complete: "MashaAllah! You completed your daily goal",

  tab_text: "Text",
  text_tab: "Text",
  tab_translation: "Translation",
  translation_tab: "Translation",
  tab_tafsir: "Tafsir",
  tafsir_tab: "Tafsir",
  focus_mode: "Focus Mode",
  mushaf_view: "Mushaf View",
  ayah_view: "Verse View",
  tafsir_of_ayah: "Tafsir of Verse",
  show_full_tafsir: "← Show full surah tafsir",
  search_tafsir: "Search tafsir...",
  no_tafsir_results: "No results for",
  no_tafsir: "No tafsir available",
  no_translation: "No translation available",
  jump_to_ayah: "Jump to verse...",
  go_to_page: "Go to page",
  go: "Go",
  page_out_of_range: "Page outside surah range",
  invalid_page: "Invalid page number",
  loading_surah: "Loading surah...",
  surah_load_error: "Could not load surah. Check your internet connection.",
  error_loading: "Failed to load",
  bismillah: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",

  translation_header: "Quran Translation",

  now_playing: "Now Playing",
  playing: "Playing",
  reciter: "Reciter",
  of: "of",
  download: "Download",
  downloaded: "Downloaded",
  audio_unavailable_offline: "Audio unavailable offline — download first",
  audio_disclaimer: "Audio may stop automatically depending on device and browser settings",

  azkar_title: "Azkar & Duas",
  azkar_subtitle: "Daily remembrance",
  morning_azkar: "Morning Azkar",
  evening_azkar: "Evening Azkar",
  sleep_azkar: "Sleep Azkar",
  prayer_azkar: "Prayer Azkar",
  all_categories: "All",
  favorites_only: "Favorites",
  azkar_done: "Well done! You completed this dhikr",
  azkar_reset: "Reset",
  times: "times",
  no_favorites_azkar: "No favorite adhkar yet",
  azkar_search: "Search adhkar",
  azkar_no_results: "No results found",

  prayer_title: "Prayer Times",
  prayers_title: "My Prayers Today",
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
  next_prayer: "Next Prayer",
  location_required: "Location Required",
  qibla: "Qibla",
  prayer_guide: "Prayer Guide",
  prayers_completed: "prayers completed",
  prayer_countdown: "Time Remaining",
  location_detecting: "Detecting location...",
  location_error: "Could not detect location",
  qibla_banner: "Qibla Direction 🕋",
  qibla_subtitle: "Find the direction of the Kaaba",
  days_streak: "days",
  prayers_complete: "MashaAllah! 🎉",
  complete_prayers: "Complete your prayers",

  tasbeeh_title: "Dhikr Counter",
  set_target: "Set target",
  target: "Target",
  total_today: "Today's Total",
  today_total: "Today's Total",
  counter_complete: "MashaAllah!",
  mashaallah: "MashaAllah! 🎉",

  hifz_title: "Memorization Tracker",
  hifz_subtitle: "Track your Quran memorization progress",
  memorized: "Memorized",
  in_progress: "In Progress",
  not_started: "Not Started",
  todays_review: "Today's Review",
  today_review: "Today's Review",
  no_reviews_today: "No reviews today",
  review_done_all: "Well done! All reviews completed",
  all_reviews_done: "Well done! All reviews completed 🎉",
  start_hifz: "Mark surahs as memorized to begin review",
  add_memorized_hint: "Mark surahs as memorized to start reviewing",
  mastered: "Mastered",
  needs_review: "Needs Review",
  overdue_days: "overdue",
  strength: "Strength",
  in_review: "In Review",
  due_today: "Due Today",
  total_reviews: "Total Reviews",
  avg_streak: "Avg. Streak",
  next_review: "Next Review",
  mark_memorized: "Memorized",
  mark_in_progress: "In Progress",
  mark_not_started: "Not Started",
  all_surahs: "All Surahs",
  memorized_surahs: "Memorized",
  in_progress_surahs: "In Progress",
  filter_all: "All",
  no_surahs_in_filter: "No surahs in this category",
  weak: "Weak",
  medium: "Medium",
  strong: "Strong",

  stats_title: "Statistics",
  total_ayahs: "Total Verses",
  reading_minutes: "Reading Minutes",
  streak_days: "Day Streak",
  longest_streak: "Longest Streak",
  this_week: "This Week",
  this_month: "This Month",
  weekly_reading: "Weekly Reading",
  monthly_calendar: "Monthly Calendar",
  achievements: "Achievements",
  goal_today: "Today's Goal",
  today_goal: "Today's Goal",

  settings_title: "Settings",
  appearance: "Appearance & Reading",
  theme_light: "Light",
  theme_dark: "Dark",
  font_size: "Font Size",
  ui_scale: "UI Scale",
  scale_normal: "Normal",
  scale_large: "Large",
  scale_xlarge: "Larger",
  reciter_section: "Reciter",
  tafsir_section: "Tafsir",
  translation_section: "Translation",
  show_translation: "Show Translation",
  show_translation_subtitle: "Show Quran translation",
  prayer_notifications: "Prayer Notifications",
  prayer_method: "Prayer Calculation Method",
  daily_reading_goal: "Daily Reading Goal",
  downloads: "Downloads",
  install_app: "Install App",
  storage: "Storage",
  reset_progress: "Reset Progress",
  ramadan_tab: "Ramadan Tab",
  about: "About",
  version: "Version",
  changelog: "Changelog",
  share_app: "Share App",
  check_updates: "Check for Updates",
  language: "Language",
  language_arabic: "العربية",
  language_english: "English",
  audio_preview: "Preview audio",

  qibla_title: "Qibla Direction",
  qibla_description: "Compass towards the Holy Kaaba",
  qibla_direction: "Qibla Direction",
  qibla_aligned: "Facing the Qibla",
  qibla_rotate: "Rotate your device",
  distance_to_kaaba: "Distance to Kaaba",
  compass_accuracy: "Compass accuracy:",
  accuracy_high: "High",
  accuracy_medium: "Medium",
  accuracy_low: "Low",
  lock_compass: "Lock Compass",
  compass_locked: "Compass Locked",
  unlock_compass: "Unlock",
  calibrate: "Calibrate",
  location_permission: "Location permission required",
  compass_not_supported: "Compass not supported on this device",
  km_away: "km",
  your_location: "Your Location",
  location_accuracy: "Location accuracy:",
  facing_qibla: "✓ You are facing the Qibla",
  move_device: "Move your device to activate compass",
  calibration_title: "Compass Calibration",
  calibration_desc: "To improve compass accuracy, move your device in a figure-8 motion several times.",
  allow_compass: "Please allow compass access",
  sensor_error: "Could not access orientation sensor",

  ramadan_title: "Ramadan Kareem 🌙",
  ramadan_day: "Day",
  ramadan_of: "of Ramadan",
  iftar_countdown: "Time until Iftar",
  suhoor_countdown: "Time until Suhoor",
  daily_dua: "Daily Dua",
  ramadan_tips: "Ramadan Tips",
  daily_checklist: "Daily Checklist ✅",
  khatmah_plan: "Ramadan Khatmah 📖",
  juz_parts: "Juz",
  today_juz: "Today's Juz",
  complete: "Complete ✓",
  done: "Done",
  activities_title: "Virtues and Duas 🤲",
  ramadan_error_msg: "Could not load Ramadan data. Please try again.",
  error_title: "An error occurred",
  error_retry: "Retry",

  daily_ayah: "Verse of the Day",
  daily_wird: "Daily Wird",
  start_khatm_plan: "Start a Khatm Plan",
  percent_of_khatm: "% of Khatm",
  restart: "Restart",
  days_plan: "days",

  reading_time_up: "Reading time is up 📖",

  close_focus: "Close Focus Mode",

  achievements_title: "Achievements",
  achievements_subtitle: "Track your reading achievements",
  unlocked: "Unlocked",
  locked: "Locked",
  overall_progress: "Overall Progress",
  new_achievement: "🎉 New Achievement!",
  achievement_streak: "Streak",
  achievement_reading: "Reading",
  achievement_hifz: "Memorization",
  achievement_goals: "Goals",

  whats_new: "What's New in Version",
  update_notes: "Update Notes",
  app_updated: "App updated successfully",
  show_all_changelog: "Show all changelog",
  ok_thanks: "OK, Thanks!",

  install_title: "Install App",
  install_description: "Add to your home screen for quick access",
  install_button: "Install",
  install_dismiss: "Later",
  install_subtitle: "Quick access without browser",
  install: "Install",

  update_available: "New Update Available",
  update_description: "Tap to update and get the latest features",
  update_now: "Update Now",
  updating: "Updating...",
  update: "Update",

  not_found: "Page Not Found",
  go_home: "Go to Home",
};

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: keyof Translations) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<AppLanguage>("wise-language", "ar");
  const isRTL = language === "ar";

  const t = (key: keyof Translations): string => {
    const dict = language === "en" ? en : ar;
    return dict[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
