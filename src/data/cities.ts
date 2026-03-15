export interface City {
  name: string;
  nameAr: string;
  country: string;
  countryAr: string;
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  { name: "Makkah", nameAr: "مكة المكرمة", country: "Saudi Arabia", countryAr: "السعودية", lat: 21.3891, lng: 39.8579 },
  { name: "Madinah", nameAr: "المدينة المنورة", country: "Saudi Arabia", countryAr: "السعودية", lat: 24.4672, lng: 39.6024 },
  { name: "Riyadh", nameAr: "الرياض", country: "Saudi Arabia", countryAr: "السعودية", lat: 24.6877, lng: 46.7219 },
  { name: "Jeddah", nameAr: "جدة", country: "Saudi Arabia", countryAr: "السعودية", lat: 21.4858, lng: 39.1925 },
  { name: "Dammam", nameAr: "الدمام", country: "Saudi Arabia", countryAr: "السعودية", lat: 26.3927, lng: 49.9777 },
  { name: "Khobar", nameAr: "الخبر", country: "Saudi Arabia", countryAr: "السعودية", lat: 26.2794, lng: 50.2083 },
  { name: "Taif", nameAr: "الطائف", country: "Saudi Arabia", countryAr: "السعودية", lat: 21.2785, lng: 40.4175 },
  { name: "Abha", nameAr: "أبها", country: "Saudi Arabia", countryAr: "السعودية", lat: 18.2465, lng: 42.5117 },
  { name: "Tabuk", nameAr: "تبوك", country: "Saudi Arabia", countryAr: "السعودية", lat: 28.3998, lng: 36.5716 },
  { name: "Cairo", nameAr: "القاهرة", country: "Egypt", countryAr: "مصر", lat: 30.0444, lng: 31.2357 },
  { name: "Alexandria", nameAr: "الإسكندرية", country: "Egypt", countryAr: "مصر", lat: 31.2001, lng: 29.9187 },
  { name: "Giza", nameAr: "الجيزة", country: "Egypt", countryAr: "مصر", lat: 30.0131, lng: 31.2089 },
  { name: "Luxor", nameAr: "الأقصر", country: "Egypt", countryAr: "مصر", lat: 25.6872, lng: 32.6396 },
  { name: "Aswan", nameAr: "أسوان", country: "Egypt", countryAr: "مصر", lat: 24.0889, lng: 32.8998 },
  { name: "Dubai", nameAr: "دبي", country: "UAE", countryAr: "الإمارات", lat: 25.2048, lng: 55.2708 },
  { name: "Abu Dhabi", nameAr: "أبوظبي", country: "UAE", countryAr: "الإمارات", lat: 24.4539, lng: 54.3773 },
  { name: "Sharjah", nameAr: "الشارقة", country: "UAE", countryAr: "الإمارات", lat: 25.3463, lng: 55.4209 },
  { name: "Ajman", nameAr: "عجمان", country: "UAE", countryAr: "الإمارات", lat: 25.4052, lng: 55.5136 },
  { name: "Amman", nameAr: "عمّان", country: "Jordan", countryAr: "الأردن", lat: 31.9539, lng: 35.9106 },
  { name: "Zarqa", nameAr: "الزرقاء", country: "Jordan", countryAr: "الأردن", lat: 32.0727, lng: 36.0879 },
  { name: "Irbid", nameAr: "إربد", country: "Jordan", countryAr: "الأردن", lat: 32.5556, lng: 35.8500 },
  { name: "Kuwait City", nameAr: "مدينة الكويت", country: "Kuwait", countryAr: "الكويت", lat: 29.3759, lng: 47.9774 },
  { name: "Hawalli", nameAr: "حولي", country: "Kuwait", countryAr: "الكويت", lat: 29.3328, lng: 48.0293 },
  { name: "Manama", nameAr: "المنامة", country: "Bahrain", countryAr: "البحرين", lat: 26.2154, lng: 50.5832 },
  { name: "Muscat", nameAr: "مسقط", country: "Oman", countryAr: "عُمان", lat: 23.5880, lng: 58.3829 },
  { name: "Salalah", nameAr: "صلالة", country: "Oman", countryAr: "عُمان", lat: 17.0151, lng: 54.0924 },
  { name: "Doha", nameAr: "الدوحة", country: "Qatar", countryAr: "قطر", lat: 25.2854, lng: 51.5310 },
  { name: "Al Wakrah", nameAr: "الوكرة", country: "Qatar", countryAr: "قطر", lat: 25.1696, lng: 51.6029 },
  { name: "Sana'a", nameAr: "صنعاء", country: "Yemen", countryAr: "اليمن", lat: 15.3694, lng: 44.1910 },
  { name: "Aden", nameAr: "عدن", country: "Yemen", countryAr: "اليمن", lat: 12.7797, lng: 45.0095 },
  { name: "Baghdad", nameAr: "بغداد", country: "Iraq", countryAr: "العراق", lat: 33.3152, lng: 44.3661 },
  { name: "Basra", nameAr: "البصرة", country: "Iraq", countryAr: "العراق", lat: 30.5085, lng: 47.7836 },
  { name: "Mosul", nameAr: "الموصل", country: "Iraq", countryAr: "العراق", lat: 36.3350, lng: 43.1189 },
  { name: "Erbil", nameAr: "أربيل", country: "Iraq", countryAr: "العراق", lat: 36.1912, lng: 44.0090 },
  { name: "Damascus", nameAr: "دمشق", country: "Syria", countryAr: "سوريا", lat: 33.5138, lng: 36.2765 },
  { name: "Aleppo", nameAr: "حلب", country: "Syria", countryAr: "سوريا", lat: 36.2021, lng: 37.1343 },
  { name: "Homs", nameAr: "حمص", country: "Syria", countryAr: "سوريا", lat: 34.7324, lng: 36.7137 },
  { name: "Beirut", nameAr: "بيروت", country: "Lebanon", countryAr: "لبنان", lat: 33.8938, lng: 35.5018 },
  { name: "Tripoli (LB)", nameAr: "طرابلس (لبنان)", country: "Lebanon", countryAr: "لبنان", lat: 34.4367, lng: 35.8497 },
  { name: "Tunis", nameAr: "تونس", country: "Tunisia", countryAr: "تونس", lat: 36.8065, lng: 10.1815 },
  { name: "Sfax", nameAr: "صفاقس", country: "Tunisia", countryAr: "تونس", lat: 34.7406, lng: 10.7603 },
  { name: "Sousse", nameAr: "سوسة", country: "Tunisia", countryAr: "تونس", lat: 35.8256, lng: 10.6369 },
  { name: "Algiers", nameAr: "الجزائر", country: "Algeria", countryAr: "الجزائر", lat: 36.7372, lng: 3.0863 },
  { name: "Oran", nameAr: "وهران", country: "Algeria", countryAr: "الجزائر", lat: 35.6969, lng: -0.6331 },
  { name: "Constantine", nameAr: "قسنطينة", country: "Algeria", countryAr: "الجزائر", lat: 36.3650, lng: 6.6147 },
  { name: "Casablanca", nameAr: "الدار البيضاء", country: "Morocco", countryAr: "المغرب", lat: 33.5731, lng: -7.5898 },
  { name: "Rabat", nameAr: "الرباط", country: "Morocco", countryAr: "المغرب", lat: 34.0133, lng: -6.8326 },
  { name: "Marrakesh", nameAr: "مراكش", country: "Morocco", countryAr: "المغرب", lat: 31.6295, lng: -7.9811 },
  { name: "Fes", nameAr: "فاس", country: "Morocco", countryAr: "المغرب", lat: 34.0181, lng: -5.0078 },
  { name: "Tangier", nameAr: "طنجة", country: "Morocco", countryAr: "المغرب", lat: 35.7595, lng: -5.8340 },
  { name: "Tripoli (LY)", nameAr: "طرابلس (ليبيا)", country: "Libya", countryAr: "ليبيا", lat: 32.9011, lng: 13.1803 },
  { name: "Benghazi", nameAr: "بنغازي", country: "Libya", countryAr: "ليبيا", lat: 32.1195, lng: 20.0855 },
  { name: "Khartoum", nameAr: "الخرطوم", country: "Sudan", countryAr: "السودان", lat: 15.5007, lng: 32.5599 },
  { name: "Omdurman", nameAr: "أم درمان", country: "Sudan", countryAr: "السودان", lat: 15.6445, lng: 32.4777 },
  { name: "Nouakchott", nameAr: "نواكشوط", country: "Mauritania", countryAr: "موريتانيا", lat: 18.0858, lng: -15.9785 },
  { name: "Mogadishu", nameAr: "مقديشو", country: "Somalia", countryAr: "الصومال", lat: 2.0469, lng: 45.3182 },
  { name: "Djibouti City", nameAr: "مدينة جيبوتي", country: "Djibouti", countryAr: "جيبوتي", lat: 11.5886, lng: 43.1450 },
  { name: "Istanbul", nameAr: "إسطنبول", country: "Turkey", countryAr: "تركيا", lat: 41.0082, lng: 28.9784 },
  { name: "Ankara", nameAr: "أنقرة", country: "Turkey", countryAr: "تركيا", lat: 39.9334, lng: 32.8597 },
  { name: "Izmir", nameAr: "إزمير", country: "Turkey", countryAr: "تركيا", lat: 38.4192, lng: 27.1287 },
  { name: "Tehran", nameAr: "طهران", country: "Iran", countryAr: "إيران", lat: 35.6892, lng: 51.3890 },
  { name: "Mashhad", nameAr: "مشهد", country: "Iran", countryAr: "إيران", lat: 36.2972, lng: 59.6057 },
  { name: "Karachi", nameAr: "كراتشي", country: "Pakistan", countryAr: "باكستان", lat: 24.8607, lng: 67.0011 },
  { name: "Lahore", nameAr: "لاهور", country: "Pakistan", countryAr: "باكستان", lat: 31.5204, lng: 74.3587 },
  { name: "Islamabad", nameAr: "إسلام آباد", country: "Pakistan", countryAr: "باكستان", lat: 33.6844, lng: 73.0479 },
  { name: "Peshawar", nameAr: "بيشاور", country: "Pakistan", countryAr: "باكستان", lat: 34.0151, lng: 71.5249 },
  { name: "Dhaka", nameAr: "داكا", country: "Bangladesh", countryAr: "بنغلاديش", lat: 23.8103, lng: 90.4125 },
  { name: "Chittagong", nameAr: "شيتاغونغ", country: "Bangladesh", countryAr: "بنغلاديش", lat: 22.3569, lng: 91.7832 },
  { name: "Kuala Lumpur", nameAr: "كوالالمبور", country: "Malaysia", countryAr: "ماليزيا", lat: 3.1390, lng: 101.6869 },
  { name: "Jakarta", nameAr: "جاكرتا", country: "Indonesia", countryAr: "إندونيسيا", lat: -6.2088, lng: 106.8456 },
  { name: "Surabaya", nameAr: "سورابايا", country: "Indonesia", countryAr: "إندونيسيا", lat: -7.2504, lng: 112.7688 },
  { name: "Kabul", nameAr: "كابول", country: "Afghanistan", countryAr: "أفغانستان", lat: 34.5553, lng: 69.2075 },
  { name: "London", nameAr: "لندن", country: "UK", countryAr: "المملكة المتحدة", lat: 51.5074, lng: -0.1278 },
  { name: "Birmingham", nameAr: "برمنغهام", country: "UK", countryAr: "المملكة المتحدة", lat: 52.4862, lng: -1.8904 },
  { name: "Manchester", nameAr: "مانشستر", country: "UK", countryAr: "المملكة المتحدة", lat: 53.4808, lng: -2.2426 },
  { name: "Paris", nameAr: "باريس", country: "France", countryAr: "فرنسا", lat: 48.8566, lng: 2.3522 },
  { name: "Lyon", nameAr: "ليون", country: "France", countryAr: "فرنسا", lat: 45.7640, lng: 4.8357 },
  { name: "Marseille", nameAr: "مرسيليا", country: "France", countryAr: "فرنسا", lat: 43.2965, lng: 5.3698 },
  { name: "Berlin", nameAr: "برلين", country: "Germany", countryAr: "ألمانيا", lat: 52.5200, lng: 13.4050 },
  { name: "Hamburg", nameAr: "هامبورغ", country: "Germany", countryAr: "ألمانيا", lat: 53.5753, lng: 10.0153 },
  { name: "Cologne", nameAr: "كولونيا", country: "Germany", countryAr: "ألمانيا", lat: 50.9333, lng: 6.9500 },
  { name: "New York", nameAr: "نيويورك", country: "USA", countryAr: "الولايات المتحدة", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles", nameAr: "لوس أنجلوس", country: "USA", countryAr: "الولايات المتحدة", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", nameAr: "شيكاغو", country: "USA", countryAr: "الولايات المتحدة", lat: 41.8781, lng: -87.6298 },
  { name: "Houston", nameAr: "هيوستن", country: "USA", countryAr: "الولايات المتحدة", lat: 29.7604, lng: -95.3698 },
  { name: "Dearborn", nameAr: "ديربورن", country: "USA", countryAr: "الولايات المتحدة", lat: 42.3223, lng: -83.1763 },
  { name: "Toronto", nameAr: "تورنتو", country: "Canada", countryAr: "كندا", lat: 43.6532, lng: -79.3832 },
  { name: "Montreal", nameAr: "مونتريال", country: "Canada", countryAr: "كندا", lat: 45.5017, lng: -73.5673 },
  { name: "Sydney", nameAr: "سيدني", country: "Australia", countryAr: "أستراليا", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", nameAr: "ملبورن", country: "Australia", countryAr: "أستراليا", lat: -37.8136, lng: 144.9631 },
  { name: "Senegal Dakar", nameAr: "داكار", country: "Senegal", countryAr: "السنغال", lat: 14.7167, lng: -17.4677 },
  { name: "Lagos", nameAr: "لاغوس", country: "Nigeria", countryAr: "نيجيريا", lat: 6.5244, lng: 3.3792 },
  { name: "Kano", nameAr: "كانو", country: "Nigeria", countryAr: "نيجيريا", lat: 12.0022, lng: 8.5920 },
  { name: "Nairobi", nameAr: "نيروبي", country: "Kenya", countryAr: "كينيا", lat: -1.2921, lng: 36.8219 },
  { name: "Addis Ababa", nameAr: "أديس أبابا", country: "Ethiopia", countryAr: "إثيوبيا", lat: 9.0320, lng: 38.7469 },
];

export function searchCities(query: string): City[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.countryAr.includes(q)
  ).slice(0, 10);
}
