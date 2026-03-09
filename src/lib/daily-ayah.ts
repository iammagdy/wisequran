// Curated list of impactful ayahs for daily display
const NOTABLE_AYAHS = [
  { surah: 2, ayah: 255 },   // Ayat al-Kursi
  { surah: 2, ayah: 286 },   // Last ayah of Baqarah
  { surah: 3, ayah: 139 },   // Do not weaken
  { surah: 3, ayah: 173 },   // Hasbunallah
  { surah: 6, ayah: 162 },   // My prayer and sacrifice
  { surah: 7, ayah: 156 },   // Mercy encompasses all
  { surah: 9, ayah: 51 },    // Nothing will befall us
  { surah: 10, ayah: 62 },   // No fear nor grief
  { surah: 12, ayah: 86 },   // I complain to Allah
  { surah: 13, ayah: 28 },   // Hearts find rest
  { surah: 14, ayah: 7 },    // If you are grateful
  { surah: 16, ayah: 97 },   // Good life
  { surah: 17, ayah: 82 },   // Quran is healing
  { surah: 18, ayah: 10 },   // Companions of the cave
  { surah: 20, ayah: 114 },  // Increase me in knowledge
  { surah: 21, ayah: 87 },   // La ilaha illa anta
  { surah: 23, ayah: 115 },  // Created without purpose?
  { surah: 24, ayah: 35 },   // Light upon light
  { surah: 25, ayah: 63 },   // Servants of the Merciful
  { surah: 28, ayah: 24 },   // Musa's dua
  { surah: 29, ayah: 69 },   // Those who strive
  { surah: 33, ayah: 41 },   // Remember Allah much
  { surah: 39, ayah: 53 },   // Do not despair
  { surah: 40, ayah: 60 },   // Call upon Me
  { surah: 41, ayah: 30 },   // Angels descend
  { surah: 42, ayah: 19 },   // Allah is gentle
  { surah: 48, ayah: 4 },    // Tranquility
  { surah: 49, ayah: 13 },   // Made you nations
  { surah: 55, ayah: 13 },   // Which favors will you deny
  { surah: 57, ayah: 4 },    // Allah is with you
  { surah: 59, ayah: 22 },   // Allah names
  { surah: 64, ayah: 11 },   // No disaster strikes
  { surah: 65, ayah: 2 },    // Who fears Allah
  { surah: 65, ayah: 3 },    // Allah is sufficient
  { surah: 67, ayah: 2 },    // Created death and life
  { surah: 73, ayah: 8 },    // Devote yourself
  { surah: 74, ayah: 56 },   // He is worthy of fear
  { surah: 87, ayah: 14 },   // Successful is who purifies
  { surah: 93, ayah: 5 },    // Your Lord will give you
  { surah: 94, ayah: 5 },    // With hardship comes ease
  { surah: 94, ayah: 6 },    // With hardship comes ease (2)
  { surah: 103, ayah: 1 },   // By time
  { surah: 112, ayah: 1 },   // Say He is Allah One
  { surah: 113, ayah: 1 },   // Al-Falaq
  { surah: 114, ayah: 1 },   // An-Nas
];

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export interface DailyAyahRef {
  surah: number;
  ayah: number;
}

export function getDailyAyahReference(date: Date = new Date()): DailyAyahRef {
  const dayOfYear = getDayOfYear(date);
  const year = date.getFullYear();
  const seed = (year * 1000 + dayOfYear) % NOTABLE_AYAHS.length;
  return NOTABLE_AYAHS[seed];
}

export function getDailyAyahCacheKey(date: Date = new Date()): string {
  return `wise-daily-ayah-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
