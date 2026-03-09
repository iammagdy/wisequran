

## المشكلة
معظم روابط الصوت للقراء معطلة لسببين:
1. `cdn.islamic.network/quran/audio-surah/` يعطي **AccessDenied** لمعظم القراء
2. روابط `mp3quran.net` المحفوظة تحتوي على مسارات خاطئة (مجلد `/Rewayat-Hafs-A-n-Assem/` غير موجود)

**القراء الذين يعملون حالياً:** فقط الـ 7 الذين لديهم `qfApiId` (يستخدمون quran.com API): العفاسي، الحصري، المنشاوي، عبد الباسط، السديس، الشريم، الرفاعي.

**القراء المعطلون:** أحمد العجمي، إسلام صبحي، ياسر الدوسري، ماهر المعيقلي، خالد الجليل، بندر بليلة، ناصر القطامي، عبدالله الجهني، فارس عباد، العوسي، اللحيدان، عبدالله الموسى، النفيس، محمد أيوب، إدريس أبكر.

## الحل
تحديث `src/lib/reciters.ts` بثلاث خطوات:

### 1. إصلاح روابط `CUSTOM_CDN_RECITERS`
استبدال الروابط المعطلة بروابط مؤكدة العمل من مصادر مختلفة:

| القارئ | المصدر القديم (معطل) | المصدر الجديد (يعمل) |
|--------|---------------------|---------------------|
| mahermuaiqly | mp3quran + Rewayat subfolder | `server12.mp3quran.net/maher/` |
| yasser | mp3quran + Rewayat subfolder | `server11.mp3quran.net/yasser/` |
| ajamy (جديد) | لم يكن موجوداً | `server10.mp3quran.net/ajm/` |
| qtm | mp3quran + Rewayat subfolder | `server6.mp3quran.net/qtm/` |
| lhdan | mp3quran + Rewayat subfolder | `server8.mp3quran.net/lhdan/` |
| ayyub | mp3quran + Rewayat subfolder | `server8.mp3quran.net/ayyub/` |
| abkr | mp3quran + Rewayat subfolder | `server6.mp3quran.net/abkr/` |
| baleela | mp3quran bndrlh | `download.quranicaudio.com/quran/bandar_baleela/` |
| juhany | mp3quran jhn | `download.quranicaudio.com/quran/abdullaah_3awwaad_al-juhaynee/` |
| faresabbad | mp3quran frs_a | `download.quranicaudio.com/quran/fares/` |

### 2. إضافة دعم ديناميكي لـ mp3quran.net API
للقراء الذين لا نملك لهم رابطاً ثابتاً يعمل (إسلام صبحي، خالد الجليل، العوسي، عبدالله الموسى، النفيس):
- إضافة حقل `mp3quranId` لكل قارئ
- عند التشغيل، جلب رابط السيرفر الصحيح ديناميكياً من `mp3quran.net/api/v3/reciters?reciter={id}`
- تخزين النتيجة مؤقتاً (cache) لتجنب الطلبات المتكررة

### 3. تعديل `getReciterAudioUrl` في `reciters.ts`
- جعل الدالة `async`
- إضافة fallback ديناميكي عبر mp3quran API
- تحديث `quran-audio.ts` و `AudioPlayerContext.tsx` لدعم الـ async

### الملفات المتأثرة
- `src/lib/reciters.ts` — إصلاح الروابط + إضافة mp3quranId + دالة ديناميكية
- `src/lib/quran-audio.ts` — تحديث لاستخدام الدالة async
- `src/contexts/AudioPlayerContext.tsx` — تحديث بسيط لاستخدام الدالة المحدثة

