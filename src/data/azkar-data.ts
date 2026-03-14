export interface Dhikr {
  id: string;
  text: string;
  translation: string;
  count: number;
  source?: string;
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
      { id: "m6", text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ", translation: "O Allah, I ask You for pardon and well-being in this life and the next.", count: 3 },
      { id: "m7", text: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ", translation: "O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. None has the right to be worshipped but You.", count: 3 },
      { id: "m8", text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ", translation: "O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the punishment of the grave. None has the right to be worshipped but You.", count: 3 },
      { id: "m9", text: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", translation: "Allah is sufficient for me. There is none worthy of worship but Him. I have placed my trust in Him, He is Lord of the Majestic Throne.", count: 7 },
      { id: "m10", text: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", translation: "In the Name of Allah, with whose Name nothing can harm on earth or in heaven, and He is the All-Hearing, the All-Knowing.", count: 3 },
      { id: "m11", text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا", translation: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.", count: 3 },
      { id: "m12", text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", translation: "O Ever-Living, O Sustainer, by Your mercy I seek help. Set right all my affairs, and do not leave me to myself even for the blink of an eye.", count: 3 },
      { id: "m13", text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", translation: "O Allah, You are my Lord. There is no god but You. You created me and I am Your servant, and I hold to Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your blessing upon me, and I acknowledge my sin, so forgive me, for none forgives sins but You. (Sayyid al-Istighfar)", count: 1, source: "رواه البخاري" },
      { id: "m14", text: "اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ", translation: "O Allah, I call You to witness, and I call the bearers of Your Throne, Your angels, and all of Your creation to witness that You are Allah, there is no god but You alone, with no partner, and that Muhammad is Your servant and Messenger.", count: 4, source: "رواه أبو داود" },
      { id: "m15", text: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ", translation: "O Allah, whatever blessing I or any of Your creation have received this morning is from You alone. You have no partner. To You belongs all praise and all thanks.", count: 1, source: "رواه أبو داود" },
      { id: "m16", text: "اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ، فَاطِرَ السَّمَوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطَانِ وَشَرَكِهِ", translation: "O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth, Lord and Sovereign of all things, I bear witness that there is no god but You. I seek refuge in You from the evil of my own soul and from the evil and snares of Satan.", count: 1, source: "رواه أبو داود" },
      { id: "m17", text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا", translation: "O Allah, I ask You for beneficial knowledge, pure provision, and accepted deeds.", count: 1, source: "رواه ابن ماجه" },
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
      { id: "e5", text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ", translation: "O Allah, I ask You for pardon and well-being in this life and the next.", count: 3 },
      { id: "e6", text: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ", translation: "O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. None has the right to be worshipped but You.", count: 3 },
      { id: "e7", text: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", translation: "Allah is sufficient for me. There is none worthy of worship but Him. I have placed my trust in Him, He is Lord of the Majestic Throne.", count: 7 },
      { id: "e8", text: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", translation: "In the Name of Allah, with whose Name nothing can harm on earth or in heaven, and He is the All-Hearing, the All-Knowing.", count: 3 },
      { id: "e9", text: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا", translation: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.", count: 3 },
      { id: "e10", text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", translation: "None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He is Able to do all things.", count: 10 },
      { id: "e11", text: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ", translation: "O Allah, whatever blessing I or any of Your creation have received this evening is from You alone. You have no partner. To You belongs all praise and all thanks.", count: 1, source: "رواه أبو داود" },
      { id: "e12", text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", translation: "O Allah, send blessings and peace upon our Prophet Muhammad.", count: 10, source: "رواه الطبراني" },
      { id: "e13", text: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ", translation: "O Allah, I call You to witness, and I call the bearers of Your Throne, Your angels, and all of Your creation to witness that You are Allah, there is no god but You alone, with no partner, and that Muhammad is Your servant and Messenger.", count: 4, source: "رواه أبو داود" },
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
      { id: "p6", text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", translation: "None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He is Able to do all things.", count: 1 },
      { id: "p7", text: "اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ", translation: "O Allah, none can withhold what You have given, and none can give what You have withheld, and the wealth of the wealthy cannot avail him against You.", count: 1 },
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
      { id: "s5", text: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", translation: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.", count: 3 },
      { id: "s6", text: "اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا، وَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ", translation: "O Allah, in Your name I die and live. If You take my soul, have mercy on it, and if You release it, protect it as You protect Your righteous servants.", count: 1 },
      { id: "s7", text: "اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا. اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ", translation: "O Allah, You created my soul and You take it in death. Yours is its death and its life. If You keep it alive, protect it, and if You cause it to die, forgive it. O Allah, I ask You for well-being.", count: 1, source: "رواه مسلم" },
      { id: "s8", text: "اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ", translation: "O Allah, I have submitted my soul to You, entrusted my affairs to You, turned my face to You, and leaned my back on You, out of desire for You and fear of You. There is no refuge and no escape from You except to You. I have believed in Your Book that You revealed and in Your Prophet whom You sent.", count: 1, source: "رواه البخاري ومسلم" },
      { id: "s9", text: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", translation: "Surah Al-Ikhlas — Say: He is Allah, the One, Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent. (Recite also Al-Falaq and An-Nas)", count: 3, source: "رواه البخاري" },
      { id: "s10", text: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ", translation: "Ayat Al-Kursi — Allah, there is no god but He, the Ever-Living, the Sustainer of existence. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on the earth. (Al-Baqarah 2:255)", count: 1, source: "رواه البخاري" },
      { id: "s11", text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ", translation: "In Your name, my Lord, I lay down my side and by You I raise it. If You take my soul, have mercy on it, and if You send it back, protect it as You protect Your righteous servants.", count: 1, source: "رواه البخاري ومسلم" },
    ],
  },
  {
    id: "waking",
    name: "Waking Up",
    nameAr: "أذكار الاستيقاظ",
    icon: "☀️",
    items: [
      { id: "w1", text: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", translation: "All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.", count: 1 },
      { id: "w2", text: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ، اللَّهُمَّ أَسْتَغْفِرُكَ لِذَنْبِي، وَأَسْأَلُكَ رَحْمَتَكَ", translation: "There is none worthy of worship but You, glory be to You. O Allah, I seek Your forgiveness for my sins and ask for Your mercy.", count: 1 },
    ],
  },
  {
    id: "ruqyah",
    name: "Ruqyah",
    nameAr: "الرقية الشرعية",
    icon: "🛡️",
    items: [
      { id: "r1", text: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ", translation: "Ayat Al-Kursi (The Verse of the Throne) — Surah Al-Baqarah 2:255", count: 1 },
      { id: "r2", text: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", translation: "Surah Al-Ikhlas (112) — Say: He is Allah, the One.", count: 3 },
      { id: "r3", text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", translation: "Surah Al-Falaq (113) — Say: I seek refuge in the Lord of daybreak.", count: 3 },
      { id: "r4", text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ", translation: "Surah An-Nas (114) — Say: I seek refuge in the Lord of mankind.", count: 3 },
      { id: "r5", text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ", translation: "I seek refuge in the perfect words of Allah from every devil, every poisonous creature, and every envious evil eye.", count: 3 },
      { id: "r6", text: "بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ", translation: "In the name of Allah I perform ruqyah for you, from everything that harms you, from the evil of every soul or envious eye, may Allah heal you.", count: 3 },
      { id: "r7", text: "اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا", translation: "O Allah, Lord of mankind, remove the harm. Heal, for You are the Healer. There is no healing except Your healing, a healing that leaves no sickness behind.", count: 7 },
    ],
  },
  {
    id: "hasad",
    name: "Evil Eye Protection",
    nameAr: "أدعية الحسد والعين",
    icon: "🧿",
    items: [
      { id: "h1", text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.", count: 3 },
      { id: "h2", text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ", translation: "I seek refuge in the perfect words of Allah from every devil, every poisonous creature, and every envious evil eye.", count: 3 },
      { id: "h3", text: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", translation: "In the Name of Allah, with whose Name nothing can harm on earth or in heaven, and He is the All-Hearing, the All-Knowing.", count: 3 },
      { id: "h4", text: "مَا شَاءَ اللَّهُ لَا قُوَّةَ إِلَّا بِاللَّهِ", translation: "What Allah wills, there is no power except with Allah.", count: 10 },
      { id: "h5", text: "تَبَارَكَ اللَّهُ أَحْسَنُ الْخَالِقِينَ", translation: "Blessed is Allah, the Best of creators.", count: 3 },
    ],
  },
  {
    id: "travel",
    name: "Travel",
    nameAr: "أدعية السفر",
    icon: "✈️",
    items: [
      { id: "t1", text: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ", translation: "Glory be to Him who has subjected this to us, and we could never have it (by our efforts). And verily, to our Lord we indeed are to return.", count: 1 },
      { id: "t2", text: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى", translation: "O Allah, we ask You in this journey of ours for righteousness, piety, and deeds that please You.", count: 1 },
      { id: "t3", text: "اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ", translation: "O Allah, make this journey easy for us and shorten its distance for us.", count: 1 },
      { id: "t4", text: "اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ", translation: "O Allah, You are the Companion on the journey and the Guardian of the family.", count: 1 },
    ],
  },
  {
    id: "mosque",
    name: "Entering/Leaving Mosque",
    nameAr: "دعاء دخول المسجد والخروج",
    icon: "🕋",
    items: [
      { id: "mq1", text: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", translation: "O Allah, open for me the doors of Your mercy. (When entering the mosque)", count: 1 },
      { id: "mq2", text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", translation: "O Allah, I ask You from Your favor. (When leaving the mosque)", count: 1 },
      { id: "mq3", text: "أَعُوذُ بِاللَّهِ الْعَظِيمِ وَبِوَجْهِهِ الْكَرِيمِ وَسُلْطَانِهِ الْقَدِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ", translation: "I seek refuge in Allah the Almighty, in His noble face and His eternal power, from the accursed Satan. (When entering)", count: 1 },
    ],
  },
  {
    id: "food",
    name: "Eating & Drinking",
    nameAr: "أدعية الطعام والشراب",
    icon: "🍽️",
    items: [
      { id: "f1", text: "بِسْمِ اللَّهِ", translation: "In the Name of Allah. (Before eating)", count: 1 },
      { id: "f2", text: "بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ", translation: "In the Name of Allah at its beginning and at its end. (If you forget to say Bismillah at first)", count: 1 },
      { id: "f3", text: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", translation: "Praise is to Allah who fed me this and provided it for me without any power or strength from me. (After eating)", count: 1 },
      { id: "f4", text: "اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ", translation: "O Allah, bless us in it and feed us with something better than it.", count: 1 },
    ],
  },
  {
    id: "distress",
    name: "Distress & Anxiety",
    nameAr: "أدعية الكرب والهم",
    icon: "💚",
    items: [
      { id: "d1", text: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ", translation: "None has the right to be worshipped but Allah, the Mighty, the Forbearing. None has the right to be worshipped but Allah, Lord of the Magnificent Throne. None has the right to be worshipped but Allah, Lord of the heavens, Lord of the earth, and Lord of the Noble Throne.", count: 1 },
      { id: "d2", text: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لَا إِلَهَ إِلَّا أَنْتَ", translation: "O Allah, I hope for Your mercy. Do not leave me to myself even for the blink of an eye. Correct all my affairs for me. There is none worthy of worship except You.", count: 1 },
      { id: "d3", text: "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ", translation: "There is none worthy of worship but You, glory be to You, indeed I was among the wrongdoers. (Dua of Yunus)", count: 40 },
      { id: "d4", text: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ", translation: "O Allah, I seek refuge in You from grief and sadness, from weakness and laziness, from cowardice and miserliness, from being overwhelmed by debt and overpowered by men.", count: 3 },
      { id: "d5", text: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", translation: "Allah is sufficient for us, and He is the best disposer of affairs.", count: 7 },
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
      { id: "g4", text: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ", translation: "Glory is to Allah, praise is to Allah, none has the right to be worshipped but Allah, and Allah is the Greatest.", count: 10 },
      { id: "g5", text: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", translation: "My Lord, forgive me and accept my repentance. You are the Accepter of Repentance, the Most Merciful.", count: 10 },
      { id: "g6", text: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", translation: "O Allah, help me to remember You, to thank You, and to worship You in the best way.", count: 3 },
    ],
  },
];
