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
  textEn: string;
  source: string;
  sourceEn: string;
}

export const DAILY_DUAS: DailyDua[] = [
  { day: 1,  text: "اللهم اجعل صيامي فيه صيام الصائمين وقيامي فيه قيام القائمين", textEn: "O Allah, make my fast in it the fast of those who truly fast, and my night prayers the night prayers of those who truly stand.", source: "دعاء", sourceEn: "Dua" },
  { day: 2,  text: "اللهم قرّبني فيه إلى مرضاتك وجنّبني فيه من سخطك ونقماتك", textEn: "O Allah, bring me closer in it to Your pleasure and keep me away from Your anger and punishment.", source: "دعاء", sourceEn: "Dua" },
  { day: 3,  text: "اللهم ارزقني فيه الذهن والتنبيه وباعدني فيه من السفاهة والتمويه", textEn: "O Allah, grant me in it clarity of mind and awareness, and keep me away from foolishness and deception.", source: "دعاء", sourceEn: "Dua" },
  { day: 4,  text: "اللهم قوّني فيه على إقامة أمرك وأذقني فيه حلاوة ذكرك", textEn: "O Allah, strengthen me in it to carry out Your commands and let me taste the sweetness of Your remembrance.", source: "دعاء", sourceEn: "Dua" },
  { day: 5,  text: "اللهم اجعلني فيه من المستغفرين واجعلني فيه من عبادك الصالحين", textEn: "O Allah, make me of those who seek forgiveness and make me of Your righteous servants.", source: "دعاء", sourceEn: "Dua" },
  { day: 6,  text: "اللهم لا تخذلني فيه لتعرّض معصيتك وارزقني فيه رضاك", textEn: "O Allah, do not abandon me to disobedience and grant me Your pleasure.", source: "دعاء", sourceEn: "Dua" },
  { day: 7,  text: "اللهم أعنّي فيه على صيامه وقيامه وجنّبني فيه من هفواته وآثامه", textEn: "O Allah, help me in it with its fasting and prayers, and protect me from its slips and sins.", source: "دعاء", sourceEn: "Dua" },
  { day: 8,  text: "اللهم ارزقني فيه رحمة الأيتام وإطعام الطعام وإفشاء السلام", textEn: "O Allah, grant me in it compassion for orphans, feeding of the needy, and spreading of peace.", source: "دعاء", sourceEn: "Dua" },
  { day: 9,  text: "اللهم اجعل لي فيه نصيباً من رحمتك الواسعة واهدني فيه بأدلتك الساطعة", textEn: "O Allah, give me a share of Your vast mercy and guide me with Your clear signs.", source: "دعاء", sourceEn: "Dua" },
  { day: 10, text: "اللهم اجعلني فيه من المتوكلين عليك واجعلني فيه من الفائزين لديك", textEn: "O Allah, make me of those who rely upon You and of those who are successful in Your sight.", source: "دعاء", sourceEn: "Dua" },
  { day: 11, text: "اللهم حبّب إليّ فيه الإحسان وكرّه إليّ فيه الفسوق والعصيان", textEn: "O Allah, make me love good deeds and make me dislike wickedness and disobedience.", source: "دعاء", sourceEn: "Dua" },
  { day: 12, text: "اللهم زيّني فيه بالستر والعفاف واسترني فيه بلباس القنوع والكفاف", textEn: "O Allah, adorn me with modesty and chastity and clothe me with the garment of contentment and sufficiency.", source: "دعاء", sourceEn: "Dua" },
  { day: 13, text: "اللهم طهّرني فيه من الدنس والأقذار وصبّرني فيه على كائنات الأقدار", textEn: "O Allah, purify me from filth and impurity and grant me patience over whatever is decreed.", source: "دعاء", sourceEn: "Dua" },
  { day: 14, text: "اللهم لا تؤاخذني فيه بالعثرات واقلني فيه من الخطايا والهفوات", textEn: "O Allah, do not hold me accountable for my stumbles and lift from me my mistakes and slips.", source: "دعاء", sourceEn: "Dua" },
  { day: 15, text: "اللهم ارزقني فيه طاعة الخاشعين واشرح فيه صدري بإنابة المخبتين", textEn: "O Allah, grant me the obedience of the humble and expand my chest with the repentance of the devout.", source: "دعاء", sourceEn: "Dua" },
  { day: 16, text: "اللهم وفّقني فيه لموافقة الأبرار وجنّبني فيه مرافقة الأشرار", textEn: "O Allah, enable me to accompany the righteous and protect me from accompanying the wicked.", source: "دعاء", sourceEn: "Dua" },
  { day: 17, text: "اللهم اهدني فيه لصالح الأعمال واقض لي فيه الحوائج والآمال", textEn: "O Allah, guide me to righteous deeds and fulfill my needs and hopes.", source: "دعاء", sourceEn: "Dua" },
  { day: 18, text: "اللهم نبّهني فيه لبركات أسحاره ونوّر فيه قلبي بضياء أنواره", textEn: "O Allah, awaken me to the blessings of its pre-dawn hours and illuminate my heart with its divine light.", source: "دعاء", sourceEn: "Dua" },
  { day: 19, text: "اللهم وفّر فيه حظّي من بركاته وسهّل سبيلي إلى خيراته", textEn: "O Allah, increase my share of its blessings and ease my path to its goodness.", source: "دعاء", sourceEn: "Dua" },
  { day: 20, text: "اللهم افتح لي فيه أبواب الجنان وأغلق عني فيه أبواب النيران", textEn: "O Allah, open for me the gates of Paradise and close against me the gates of Hellfire.", source: "دعاء", sourceEn: "Dua" },
  { day: 21, text: "اللهم اجعل لي فيه إلى مرضاتك دليلاً ولا تجعل للشيطان فيه عليّ سبيلاً", textEn: "O Allah, make for me a guide to Your pleasure and do not allow Shaytan any path over me.", source: "دعاء", sourceEn: "Dua" },
  { day: 22, text: "اللهم ارزقني فيه سعة الرزق وجنّبني فيه من المكر والحسد", textEn: "O Allah, grant me abundant provision and protect me from treachery and envy.", source: "دعاء", sourceEn: "Dua" },
  { day: 23, text: "اللهم اغسلني فيه من الذنوب وطهّرني فيه من العيوب", textEn: "O Allah, wash me clean of sins and purify me from faults.", source: "دعاء", sourceEn: "Dua" },
  { day: 24, text: "اللهم إني أسألك فيه ما يرضيك وأعوذ بك مما يؤذيك", textEn: "O Allah, I ask You for what pleases You and seek refuge in You from what displeases You.", source: "دعاء", sourceEn: "Dua" },
  { day: 25, text: "اللهم اجعلني فيه محبّاً لأوليائك ومعادياً لأعدائك مستنّاً بسنة خاتم أنبيائك", textEn: "O Allah, make me a lover of Your saints, an opponent of Your enemies, and a follower of the Sunnah of Your final Prophet.", source: "دعاء", sourceEn: "Dua" },
  { day: 26, text: "اللهم اجعل سعيي فيه مشكوراً وذنبي فيه مغفوراً وعملي فيه مقبولاً", textEn: "O Allah, make my efforts appreciated, my sins forgiven, and my deeds accepted.", source: "دعاء", sourceEn: "Dua" },
  { day: 27, text: "اللهم إنك عفوّ تحب العفو فاعف عني — اللهم ارزقني فيه فضل ليلة القدر", textEn: "O Allah, You are Pardoning and love to pardon, so pardon me — O Allah, grant me the blessing of Laylat al-Qadr.", source: "حديث", sourceEn: "Hadith" },
  { day: 28, text: "اللهم وفّر حظّي فيه من النوافل وأكرمني فيه بإحضار المسائل", textEn: "O Allah, increase my share of voluntary acts of worship and honor me with answered prayers.", source: "دعاء", sourceEn: "Dua" },
  { day: 29, text: "اللهم غشّني فيه بالرحمة وارزقني فيه التوفيق والعصمة", textEn: "O Allah, cover me with Your mercy and grant me success and protection.", source: "دعاء", sourceEn: "Dua" },
  { day: 30, text: "اللهم اجعل صيامي فيه بالشكر والقبول واختم لي بالمغفرة يا ذا الجلال والإكرام", textEn: "O Allah, make my fast one of gratitude and acceptance, and seal it for me with forgiveness, O Lord of Majesty and Honor.", source: "دعاء", sourceEn: "Dua" },
];
