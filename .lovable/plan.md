

# إضافة اختيار طريقة حساب مواقيت الصلاة من الإعدادات

## الخطة

### `src/pages/SettingsPage.tsx`
- إضافة `useLocalStorage<CalculationMethod>("wise-prayer-method", "egyptian")` 
- إضافة قسم جديد في الإعدادات (بالقرب من إعدادات الإشعارات) يعرض قائمة طرق الحساب المتاحة من `CALCULATION_METHODS`
- عرض الطرق كأزرار radio-style (مثل اختيار القارئ الحالي)
- استيراد `CALCULATION_METHODS, CalculationMethod` من `src/lib/prayer-times.ts`

### `src/pages/PrayerPage.tsx`
- لا تغيير — يقرأ بالفعل من `wise-prayer-method` في localStorage

### الطرق المتاحة (موجودة فعلاً في الكود)
- الهيئة المصرية (egyptian)
- رابطة العالم الإسلامي (mwl)
- أمريكا الشمالية (isna)
- أم القرى (umm_al_qura)
- جامعة كراتشي (karachi)
- طهران (tehran)

