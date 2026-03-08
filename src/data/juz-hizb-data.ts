export interface JuzEntry {
  juzNumber: number;
  name: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export interface HizbEntry {
  hizbNumber: number;
  name: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

const juzNames = [
  "الجزء الأول", "الجزء الثاني", "الجزء الثالث", "الجزء الرابع", "الجزء الخامس",
  "الجزء السادس", "الجزء السابع", "الجزء الثامن", "الجزء التاسع", "الجزء العاشر",
  "الجزء الحادي عشر", "الجزء الثاني عشر", "الجزء الثالث عشر", "الجزء الرابع عشر", "الجزء الخامس عشر",
  "الجزء السادس عشر", "الجزء السابع عشر", "الجزء الثامن عشر", "الجزء التاسع عشر", "الجزء العشرون",
  "الجزء الحادي والعشرون", "الجزء الثاني والعشرون", "الجزء الثالث والعشرون", "الجزء الرابع والعشرون", "الجزء الخامس والعشرون",
  "الجزء السادس والعشرون", "الجزء السابع والعشرون", "الجزء الثامن والعشرون", "الجزء التاسع والعشرون", "الجزء الثلاثون",
];

export const juzData: JuzEntry[] = [
  { juzNumber: 1, name: juzNames[0], startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141 },
  { juzNumber: 2, name: juzNames[1], startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252 },
  { juzNumber: 3, name: juzNames[2], startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92 },
  { juzNumber: 4, name: juzNames[3], startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23 },
  { juzNumber: 5, name: juzNames[4], startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147 },
  { juzNumber: 6, name: juzNames[5], startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81 },
  { juzNumber: 7, name: juzNames[6], startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110 },
  { juzNumber: 8, name: juzNames[7], startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87 },
  { juzNumber: 9, name: juzNames[8], startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40 },
  { juzNumber: 10, name: juzNames[9], startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92 },
  { juzNumber: 11, name: juzNames[10], startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5 },
  { juzNumber: 12, name: juzNames[11], startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52 },
  { juzNumber: 13, name: juzNames[12], startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52 },
  { juzNumber: 14, name: juzNames[13], startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128 },
  { juzNumber: 15, name: juzNames[14], startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74 },
  { juzNumber: 16, name: juzNames[15], startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135 },
  { juzNumber: 17, name: juzNames[16], startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78 },
  { juzNumber: 18, name: juzNames[17], startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20 },
  { juzNumber: 19, name: juzNames[18], startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55 },
  { juzNumber: 20, name: juzNames[19], startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45 },
  { juzNumber: 21, name: juzNames[20], startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30 },
  { juzNumber: 22, name: juzNames[21], startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27 },
  { juzNumber: 23, name: juzNames[22], startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31 },
  { juzNumber: 24, name: juzNames[23], startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46 },
  { juzNumber: 25, name: juzNames[24], startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37 },
  { juzNumber: 26, name: juzNames[25], startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30 },
  { juzNumber: 27, name: juzNames[26], startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29 },
  { juzNumber: 28, name: juzNames[27], startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12 },
  { juzNumber: 29, name: juzNames[28], startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50 },
  { juzNumber: 30, name: juzNames[29], startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6 },
];

export const hizbData: HizbEntry[] = [
  { hizbNumber: 1, name: "الحزب ١", startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 74 },
  { hizbNumber: 2, name: "الحزب ٢", startSurah: 2, startAyah: 75, endSurah: 2, endAyah: 141 },
  { hizbNumber: 3, name: "الحزب ٣", startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 202 },
  { hizbNumber: 4, name: "الحزب ٤", startSurah: 2, startAyah: 203, endSurah: 2, endAyah: 252 },
  { hizbNumber: 5, name: "الحزب ٥", startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 14 },
  { hizbNumber: 6, name: "الحزب ٦", startSurah: 3, startAyah: 15, endSurah: 3, endAyah: 92 },
  { hizbNumber: 7, name: "الحزب ٧", startSurah: 3, startAyah: 93, endSurah: 3, endAyah: 170 },
  { hizbNumber: 8, name: "الحزب ٨", startSurah: 3, startAyah: 171, endSurah: 4, endAyah: 23 },
  { hizbNumber: 9, name: "الحزب ٩", startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 87 },
  { hizbNumber: 10, name: "الحزب ١٠", startSurah: 4, startAyah: 88, endSurah: 4, endAyah: 147 },
  { hizbNumber: 11, name: "الحزب ١١", startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 26 },
  { hizbNumber: 12, name: "الحزب ١٢", startSurah: 5, startAyah: 27, endSurah: 5, endAyah: 81 },
  { hizbNumber: 13, name: "الحزب ١٣", startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 35 },
  { hizbNumber: 14, name: "الحزب ١٤", startSurah: 6, startAyah: 36, endSurah: 6, endAyah: 110 },
  { hizbNumber: 15, name: "الحزب ١٥", startSurah: 6, startAyah: 111, endSurah: 6, endAyah: 165 },
  { hizbNumber: 16, name: "الحزب ١٦", startSurah: 7, startAyah: 1, endSurah: 7, endAyah: 87 },
  { hizbNumber: 17, name: "الحزب ١٧", startSurah: 7, startAyah: 88, endSurah: 7, endAyah: 170 },
  { hizbNumber: 18, name: "الحزب ١٨", startSurah: 7, startAyah: 171, endSurah: 8, endAyah: 40 },
  { hizbNumber: 19, name: "الحزب ١٩", startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 33 },
  { hizbNumber: 20, name: "الحزب ٢٠", startSurah: 9, startAyah: 34, endSurah: 9, endAyah: 92 },
  { hizbNumber: 21, name: "الحزب ٢١", startSurah: 9, startAyah: 93, endSurah: 10, endAyah: 25 },
  { hizbNumber: 22, name: "الحزب ٢٢", startSurah: 10, startAyah: 26, endSurah: 11, endAyah: 5 },
  { hizbNumber: 23, name: "الحزب ٢٣", startSurah: 11, startAyah: 6, endSurah: 11, endAyah: 83 },
  { hizbNumber: 24, name: "الحزب ٢٤", startSurah: 11, startAyah: 84, endSurah: 12, endAyah: 52 },
  { hizbNumber: 25, name: "الحزب ٢٥", startSurah: 12, startAyah: 53, endSurah: 13, endAyah: 18 },
  { hizbNumber: 26, name: "الحزب ٢٦", startSurah: 13, startAyah: 19, endSurah: 14, endAyah: 52 },
  { hizbNumber: 27, name: "الحزب ٢٧", startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 50 },
  { hizbNumber: 28, name: "الحزب ٢٨", startSurah: 16, startAyah: 51, endSurah: 16, endAyah: 128 },
  { hizbNumber: 29, name: "الحزب ٢٩", startSurah: 17, startAyah: 1, endSurah: 17, endAyah: 98 },
  { hizbNumber: 30, name: "الحزب ٣٠", startSurah: 17, startAyah: 99, endSurah: 18, endAyah: 74 },
  { hizbNumber: 31, name: "الحزب ٣١", startSurah: 18, startAyah: 75, endSurah: 19, endAyah: 98 },
  { hizbNumber: 32, name: "الحزب ٣٢", startSurah: 20, startAyah: 1, endSurah: 20, endAyah: 135 },
  { hizbNumber: 33, name: "الحزب ٣٣", startSurah: 21, startAyah: 1, endSurah: 21, endAyah: 112 },
  { hizbNumber: 34, name: "الحزب ٣٤", startSurah: 22, startAyah: 1, endSurah: 22, endAyah: 78 },
  { hizbNumber: 35, name: "الحزب ٣٥", startSurah: 23, startAyah: 1, endSurah: 24, endAyah: 20 },
  { hizbNumber: 36, name: "الحزب ٣٦", startSurah: 24, startAyah: 21, endSurah: 25, endAyah: 20 },
  { hizbNumber: 37, name: "الحزب ٣٧", startSurah: 25, startAyah: 21, endSurah: 26, endAyah: 110 },
  { hizbNumber: 38, name: "الحزب ٣٨", startSurah: 26, startAyah: 111, endSurah: 27, endAyah: 55 },
  { hizbNumber: 39, name: "الحزب ٣٩", startSurah: 27, startAyah: 56, endSurah: 28, endAyah: 50 },
  { hizbNumber: 40, name: "الحزب ٤٠", startSurah: 28, startAyah: 51, endSurah: 29, endAyah: 45 },
  { hizbNumber: 41, name: "الحزب ٤١", startSurah: 29, startAyah: 46, endSurah: 31, endAyah: 21 },
  { hizbNumber: 42, name: "الحزب ٤٢", startSurah: 31, startAyah: 22, endSurah: 33, endAyah: 30 },
  { hizbNumber: 43, name: "الحزب ٤٣", startSurah: 33, startAyah: 31, endSurah: 34, endAyah: 23 },
  { hizbNumber: 44, name: "الحزب ٤٤", startSurah: 34, startAyah: 24, endSurah: 36, endAyah: 27 },
  { hizbNumber: 45, name: "الحزب ٤٥", startSurah: 36, startAyah: 28, endSurah: 37, endAyah: 144 },
  { hizbNumber: 46, name: "الحزب ٤٦", startSurah: 37, startAyah: 145, endSurah: 39, endAyah: 31 },
  { hizbNumber: 47, name: "الحزب ٤٧", startSurah: 39, startAyah: 32, endSurah: 40, endAyah: 40 },
  { hizbNumber: 48, name: "الحزب ٤٨", startSurah: 40, startAyah: 41, endSurah: 41, endAyah: 46 },
  { hizbNumber: 49, name: "الحزب ٤٩", startSurah: 41, startAyah: 47, endSurah: 43, endAyah: 23 },
  { hizbNumber: 50, name: "الحزب ٥٠", startSurah: 43, startAyah: 24, endSurah: 45, endAyah: 37 },
  { hizbNumber: 51, name: "الحزب ٥١", startSurah: 46, startAyah: 1, endSurah: 48, endAyah: 17 },
  { hizbNumber: 52, name: "الحزب ٥٢", startSurah: 48, startAyah: 18, endSurah: 51, endAyah: 30 },
  { hizbNumber: 53, name: "الحزب ٥٣", startSurah: 51, startAyah: 31, endSurah: 54, endAyah: 55 },
  { hizbNumber: 54, name: "الحزب ٥٤", startSurah: 55, startAyah: 1, endSurah: 57, endAyah: 29 },
  { hizbNumber: 55, name: "الحزب ٥٥", startSurah: 58, startAyah: 1, endSurah: 61, endAyah: 14 },
  { hizbNumber: 56, name: "الحزب ٥٦", startSurah: 62, startAyah: 1, endSurah: 66, endAyah: 12 },
  { hizbNumber: 57, name: "الحزب ٥٧", startSurah: 67, startAyah: 1, endSurah: 71, endAyah: 28 },
  { hizbNumber: 58, name: "الحزب ٥٨", startSurah: 72, startAyah: 1, endSurah: 77, endAyah: 50 },
  { hizbNumber: 59, name: "الحزب ٥٩", startSurah: 78, startAyah: 1, endSurah: 86, endAyah: 17 },
  { hizbNumber: 60, name: "الحزب ٦٠", startSurah: 87, startAyah: 1, endSurah: 114, endAyah: 6 },
];
