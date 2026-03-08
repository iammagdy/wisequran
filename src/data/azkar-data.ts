export interface Dhikr {
  id: string;
  text: string;
  translation: string;
  count: number;
}

export interface AzkarCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  items: Dhikr[];
}

export const azkarData: AzkarCategory[] = [
  {
    id: "morning",
    name: "Morning Azkar",
    nameAr: "أذكار الصباح",
    icon: "🌅",
    items: [
      { id: "m1", text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", translation: "We have entered a new day and with it all dominion belongs to Allah. Praise is to Allah. None has the right to be worshipped but Allah alone, with no partner.", count: 1 },
      { id: "m2", text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ", translation: "O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and to You is the resurrection.", count: 1 },
      { id: "m3", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", translation: "Glory is to Allah and praise is to Him.", count: 100 },
      { id: "m4", text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", translation: "None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He is Able to do all things.", count: 10 },
      { id: "m5", text: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", translation: "I seek the forgiveness of Allah and repent to Him.", count: 100 },
    ],
  },
  {
    id: "evening",
    name: "Evening Azkar",
    nameAr: "أذكار المساء",
    icon: "🌙",
    items: [
      { id: "e1", text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", translation: "We have entered the evening and with it all dominion belongs to Allah.", count: 1 },
      { id: "e2", text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ", translation: "O Allah, by You we enter the evening, by You we enter the morning, by You we live, by You we die, and to You is the final return.", count: 1 },
      { id: "e3", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", translation: "Glory is to Allah and praise is to Him.", count: 100 },
      { id: "e4", text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.", count: 3 },
    ],
  },
  {
    id: "after-prayer",
    name: "After Prayer",
    nameAr: "أذكار بعد الصلاة",
    icon: "🕌",
    items: [
      { id: "p1", text: "أَسْتَغْفِرُ اللَّهَ", translation: "I seek Allah's forgiveness.", count: 3 },
      { id: "p2", text: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", translation: "O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of Majesty and Honor.", count: 1 },
      { id: "p3", text: "سُبْحَانَ اللَّهِ", translation: "Glory is to Allah.", count: 33 },
      { id: "p4", text: "الْحَمْدُ لِلَّهِ", translation: "Praise is to Allah.", count: 33 },
      { id: "p5", text: "اللَّهُ أَكْبَرُ", translation: "Allah is the Greatest.", count: 33 },
    ],
  },
  {
    id: "sleep",
    name: "Before Sleep",
    nameAr: "أذكار النوم",
    icon: "😴",
    items: [
      { id: "s1", text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", translation: "In Your name, O Allah, I die and I live.", count: 1 },
      { id: "s2", text: "سُبْحَانَ اللَّهِ", translation: "Glory is to Allah.", count: 33 },
      { id: "s3", text: "الْحَمْدُ لِلَّهِ", translation: "Praise is to Allah.", count: 33 },
      { id: "s4", text: "اللَّهُ أَكْبَرُ", translation: "Allah is the Greatest.", count: 34 },
    ],
  },
  {
    id: "waking",
    name: "Waking Up",
    nameAr: "أذكار الاستيقاظ",
    icon: "☀️",
    items: [
      { id: "w1", text: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", translation: "All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.", count: 1 },
    ],
  },
  {
    id: "general",
    name: "General",
    nameAr: "أذكار عامة",
    icon: "📿",
    items: [
      { id: "g1", text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", translation: "There is no power and no strength except with Allah.", count: 10 },
      { id: "g2", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", translation: "Glory is to Allah and praise is to Him, Glory is to Allah the Almighty.", count: 10 },
      { id: "g3", text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", translation: "O Allah, send blessings and peace upon our Prophet Muhammad.", count: 10 },
    ],
  },
];
