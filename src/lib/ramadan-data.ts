export interface RamadanChecklistItem {
  id: string;
  labelAr: string;
  labelEn: string;
  emoji: string;
}

export const DAILY_CHECKLIST: RamadanChecklistItem[] = [
  { id: "quran-juz",   labelAr: "قراءة الجزء اليومي",      labelEn: "Read the daily Juz",        emoji: "📖" },
  { id: "taraweeh",    labelAr: "صلاة التراويح",            labelEn: "Taraweeh prayer",            emoji: "🕌" },
  { id: "qiyam",       labelAr: "قيام الليل",               labelEn: "Qiyam al-Layl",              emoji: "🌙" },
  { id: "sadaqah",     labelAr: "صدقة",                     labelEn: "Give charity",               emoji: "💝" },
  { id: "iftar-dua",   labelAr: "دعاء الإفطار",             labelEn: "Iftar supplication",         emoji: "🤲" },
  { id: "feed-fasting",labelAr: "إطعام صائم",               labelEn: "Feed a fasting person",      emoji: "🍽️" },
  { id: "dhikr",       labelAr: "أذكار الصباح والمساء",     labelEn: "Morning & evening dhikr",    emoji: "📿" },
  { id: "istighfar",   labelAr: "الاستغفار ١٠٠ مرة",        labelEn: "Istighfar 100 times",        emoji: "🙏" },
];

export interface RamadanActivity {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  emoji: string;
  category: "dua" | "dhikr" | "fadail" | "tip";
}

export const RAMADAN_ACTIVITIES: RamadanActivity[] = [
  {
    titleAr: "دعاء الإفطار",
    titleEn: "Iftar Supplication",
    descriptionAr: "ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله",
    descriptionEn: "Thirst is gone, the veins are refreshed, and the reward is confirmed — if Allah wills",
    emoji: "🤲",
    category: "dua",
  },
  {
    titleAr: "دعاء ليلة القدر",
    titleEn: "Laylat al-Qadr Dua",
    descriptionAr: "اللهم إنك عفو تحب العفو فاعف عني",
    descriptionEn: "O Allah, You are Pardoning and love pardon, so pardon me",
    emoji: "✨",
    category: "dua",
  },
  {
    titleAr: "فضل الصيام",
    titleEn: "Virtue of Fasting",
    descriptionAr: "من صام رمضان إيماناً واحتساباً غُفر له ما تقدم من ذنبه",
    descriptionEn: "Whoever fasts Ramadan with faith and seeking reward shall have his past sins forgiven",
    emoji: "🌟",
    category: "fadail",
  },
  {
    titleAr: "فضل القيام",
    titleEn: "Virtue of Night Prayer",
    descriptionAr: "من قام رمضان إيماناً واحتساباً غُفر له ما تقدم من ذنبه",
    descriptionEn: "Whoever prays during Ramadan with faith and seeking reward shall have his past sins forgiven",
    emoji: "🕌",
    category: "fadail",
  },
  {
    titleAr: "أذكار الصيام",
    titleEn: "Fasting Dhikr",
    descriptionAr: "إذا شتمه أحد أو قاتله فليقل: إني صائم",
    descriptionEn: "If someone insults or argues with him, let him say: I am fasting",
    emoji: "📿",
    category: "dhikr",
  },
  {
    titleAr: "العشر الأواخر",
    titleEn: "Last Ten Nights",
    descriptionAr: "كان النبي ﷺ إذا دخل العشر الأواخر أحيا الليل وأيقظ أهله وشدّ المئزر",
    descriptionEn: "When the last ten nights began, the Prophet ﷺ would stay up all night, wake his family and strive in worship",
    emoji: "🌙",
    category: "fadail",
  },
  {
    titleAr: "تعجيل الفطور",
    titleEn: "Hasten the Iftar",
    descriptionAr: "لا يزال الناس بخير ما عجّلوا الفطر",
    descriptionEn: "People will remain upon goodness as long as they hasten the breaking of the fast",
    emoji: "🍽️",
    category: "tip",
  },
  {
    titleAr: "السحور بركة",
    titleEn: "Suhoor is Blessed",
    descriptionAr: "تسحّروا فإنّ في السحور بركة",
    descriptionEn: "Eat suhoor, for indeed there is blessing in suhoor",
    emoji: "🌅",
    category: "tip",
  },
];

export interface DailyDua {
  day: number;
  text: string;
  source: string;
}

export const DAILY_DUAS: DailyDua[] = [
  { day: 1, text: "اللهم اجعل صيامي فيه صيام الصائمين وقيامي فيه قيام القائمين", source: "دعاء" },
  { day: 2, text: "اللهم قرّبني فيه إلى مرضاتك وجنّبني فيه من سخطك ونقماتك", source: "دعاء" },
  { day: 3, text: "اللهم ارزقني فيه الذهن والتنبيه وباعدني فيه من السفاهة والتمويه", source: "دعاء" },
  { day: 4, text: "اللهم قوّني فيه على إقامة أمرك وأذقني فيه حلاوة ذكرك", source: "دعاء" },
  { day: 5, text: "اللهم اجعلني فيه من المستغفرين واجعلني فيه من عبادك الصالحين", source: "دعاء" },
  { day: 6, text: "اللهم لا تخذلني فيه لتعرّض معصيتك وارزقني فيه رضاك", source: "دعاء" },
  { day: 7, text: "اللهم أعنّي فيه على صيامه وقيامه وجنّبني فيه من هفواته وآثامه", source: "دعاء" },
  { day: 8, text: "اللهم ارزقني فيه رحمة الأيتام وإطعام الطعام وإفشاء السلام", source: "دعاء" },
  { day: 9, text: "اللهم اجعل لي فيه نصيباً من رحمتك الواسعة واهدني فيه بأدلتك الساطعة", source: "دعاء" },
  { day: 10, text: "اللهم اجعلني فيه من المتوكلين عليك واجعلني فيه من الفائزين لديك", source: "دعاء" },
  { day: 11, text: "اللهم حبّب إليّ فيه الإحسان وكرّه إليّ فيه الفسوق والعصيان", source: "دعاء" },
  { day: 12, text: "اللهم زيّني فيه بالستر والعفاف واسترني فيه بلباس القنوع والكفاف", source: "دعاء" },
  { day: 13, text: "اللهم طهّرني فيه من الدنس والأقذار وصبّرني فيه على كائنات الأقدار", source: "دعاء" },
  { day: 14, text: "اللهم لا تؤاخذني فيه بالعثرات واقلني فيه من الخطايا والهفوات", source: "دعاء" },
  { day: 15, text: "اللهم ارزقني فيه طاعة الخاشعين واشرح فيه صدري بإنابة المخبتين", source: "دعاء" },
  { day: 16, text: "اللهم وفّقني فيه لموافقة الأبرار وجنّبني فيه مرافقة الأشرار", source: "دعاء" },
  { day: 17, text: "اللهم اهدني فيه لصالح الأعمال واقض لي فيه الحوائج والآمال", source: "دعاء" },
  { day: 18, text: "اللهم نبّهني فيه لبركات أسحاره ونوّر فيه قلبي بضياء أنواره", source: "دعاء" },
  { day: 19, text: "اللهم وفّر فيه حظّي من بركاته وسهّل سبيلي إلى خيراته", source: "دعاء" },
  { day: 20, text: "اللهم افتح لي فيه أبواب الجنان وأغلق عني فيه أبواب النيران", source: "دعاء" },
  { day: 21, text: "اللهم اجعل لي فيه إلى مرضاتك دليلاً ولا تجعل للشيطان فيه عليّ سبيلاً", source: "دعاء" },
  { day: 22, text: "اللهم ارزقني فيه سعة الرزق وجنّبني فيه من المكر والحسد", source: "دعاء" },
  { day: 23, text: "اللهم اغسلني فيه من الذنوب وطهّرني فيه من العيوب", source: "دعاء" },
  { day: 24, text: "اللهم إني أسألك فيه ما يرضيك وأعوذ بك مما يؤذيك", source: "دعاء" },
  { day: 25, text: "اللهم اجعلني فيه محبّاً لأوليائك ومعادياً لأعدائك مستنّاً بسنة خاتم أنبيائك", source: "دعاء" },
  { day: 26, text: "اللهم اجعل سعيي فيه مشكوراً وذنبي فيه مغفوراً وعملي فيه مقبولاً", source: "دعاء" },
  { day: 27, text: "اللهم إنك عفوّ تحب العفو فاعف عني — اللهم ارزقني فيه فضل ليلة القدر", source: "حديث" },
  { day: 28, text: "اللهم وفّر حظّي فيه من النوافل وأكرمني فيه بإحضار المسائل", source: "دعاء" },
  { day: 29, text: "اللهم غشّني فيه بالرحمة وارزقني فيه التوفيق والعصمة", source: "دعاء" },
  { day: 30, text: "اللهم اجعل صيامي فيه بالشكر والقبول واختم لي بالمغفرة يا ذا الجلال والإكرام", source: "دعاء" },
];
