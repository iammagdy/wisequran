# Wise Quran — Religious App Audit & Report

_Date: April 16, 2026_

This report covers two things you asked for:

1. **Compass fixes** — what was wrong and what I changed.
2. **An honest review of the app as a religious / Islamic experience**, with prioritized suggestions.

---

## 1. Compass — Issues Found & Fixed

The Qibla compass works, but it had three real bugs that hurt accuracy and feel. All three are now fixed.

### A. The needle "spins the long way around" near North (FIXED)
When the phone heading crossed 0° / 360° (e.g. you turn from 358° to 2°), the underlying value jumped by ~360°, and the CSS rotation animation interpolated the long way — so the needle did a full loop instead of nudging a few degrees. Same bug existed in the 3D AR arrow.

**Fix:** I now track an *unwrapped continuous* rotation value. Each frame I compute the shortest signed delta to the new target and add it to a running accumulator, so the needle always takes the shortest visual path. Both the 2D needle and the 3D AR arrow use this.

### B. Android compass was using the drifting orientation event (FIXED)
The page only listened to the standard `deviceorientation` event. On many Android Chrome builds this event is **relative** (drifts over time, depends on where the page was loaded), not true magnetic heading. Android also exposes `deviceorientationabsolute` which gives true magnetic North.

**Fix:** I now subscribe to `deviceorientationabsolute` first when the browser supports it, and fall back to the regular `deviceorientation` event. iOS already returns true heading via `webkitCompassHeading`, so it is unaffected.

### C. Reverse-geocoded city name was always Arabic, regardless of UI language (FIXED)
The city name shown under the compass was forced to Arabic via `accept-language=ar`, so English users saw Arabic city names.

**Fix:** The Nominatim request now reads the user's chosen language from local storage and falls back to Arabic if missing.

### Compass things that were already good
- iOS permission prompt is handled correctly (`DeviceOrientationEvent.requestPermission`).
- True-North correction with magnetic declination is applied for Android (iOS handles it natively).
- Smoothing factor (0.2) removes most jitter without introducing visible lag.
- Haptic feedback on alignment, lock-heading button, calibration help modal — all good.

### Compass things I deliberately did **not** change (out of scope for "fix issues")
- The magnetic declination grid is a coarse 30°×30° IDW interpolation. For a Qibla app this is fine (errors are well under 1° in inhabited areas), but a full WMM implementation would be more accurate.
- The 2D mode does not auto-switch to 3D AR if the camera permission is denied — but it doesn't need to.

---

## 2. The App as a Religious Experience — Honest Assessment

### What's already strong
You have a remarkably complete Islamic companion. Quickly cataloguing what already exists:

- **Quran reading**: full Mushaf, search, daily ayah, daily wird, focus mode, share-as-image, reading timer, reading history, personalization.
- **Listening**: built-in player, global audio bar, sleep mode with nature sounds, offline audio download per-surah.
- **Prayer**: full prayer times page, city search, prayer history, adhan playback, prayer notifications, Friday mode.
- **Memorization (Hifz)**: dedicated page, streak tracking, microphone-based recitation testing, scoring.
- **Athkar**: dedicated page with completion tracking and notifications.
- **Tasbeeh**: dedicated counter.
- **Qibla**: 2D + 3D AR compass with location.
- **Ramadan**: dedicated mode with daily dua and iftar countdown.
- **Stats**: streaks, weekly chart, achievements.
- **Offline first**: install prompt, offline center, service worker, IndexedDB.
- **Bilingual**: Arabic + English with RTL support.

This is significantly more complete than most "Quran apps" on stores today.

### Where I think the app could grow as a religious experience

I've ranked these by religious / spiritual impact, not by engineering effort.

**High impact**

1. **Tafsir alongside ayat.** Right now you give the Arabic text and (presumably) a translation, but a tap-to-show classical tafsir (Ibn Kathir, As-Saadi, Al-Muyassar) per-ayah is the single biggest gap for serious readers. Even one short tafsir bundled offline would change the app's depth.
2. **Word-by-word translation & root highlighting.** Tap a word, see its meaning and root. Already a standard feature in Quran.com / Tarteel and a huge learning aid for non-Arabic speakers and Arabic learners alike.
3. **Recitation comparison (multiple qaris).** You have audio download, but offering a small choice of well-known qaris (Mishary, Sudais, Al-Husary, Minshawi) and letting the user switch per-surah is what converts a "reader" into a "listener" too.
4. **Bookmarks & personal notes per-ayah.** Daily wird and reading history are great, but explicit ayah bookmarks plus a private notes field per ayah turns the app into a study companion.
5. **Khatma (completion plan) tracker.** A simple "I want to finish the Quran in X days" planner that auto-schedules juz/pages and ticks them off. Pairs perfectly with your existing daily-wird and reading-stats infrastructure.

**Medium impact**

6. **More authentic du'a and athkar collections.** "Hisn al-Muslim" (Fortress of the Muslim) is the gold standard — full categorical du'a (waking, traveling, after prayer, etc.) with sources. If you don't already have it, consider a structured athkar library tagged by category and sahih source.
7. **Hadith of the day / 40 Nawawi / Riyad as-Saliheen.** Even just a daily hadith card on the home screen broadens the app from "Quran" to "Sunnah" — most users want both.
8. **Salah tracker (not just notifications).** A simple "did you pray Fajr / Dhuhr / …" check-off with a streak — the prayer page is already there, this is a tiny extension with strong religious-habit value.
9. **Qiyam al-layl / Tahajjud helper.** Calculates last-third-of-night based on Maghrib + Fajr and offers a gentle reminder. Especially valuable in Ramadan, which you already have as a mode.
10. **Sadaqah tracker.** Optional, private — log charity given, intentions, etc.

**Quieter, but meaningful**

11. **Audio with ayah-by-ayah highlighting** while playing (if not already implemented in the listening tab). This is the single feature most users mention as "premium-feeling."
12. **Verse of the day notification** (push, not just in-app card) — uses your existing notification plumbing.
13. **Hijri calendar surfaced clearly** — date, special days (Ashura, Arafah, the white days for fasting), with a fasting reminder.
14. **Du'a after each surah.** Some traditions read a specific du'a after Al-Fatiha or after completing the Quran — small UX thoughtfulness.
15. **Privacy & ads stance, communicated.** Religious users care a lot. A one-paragraph "no tracking, no ads, no data sold" line in Settings/About earns trust.

**Polish that increases reverence**

16. **Adab on launch.** A subtle "بسم الله" splash or wudu/intention reminder when opening the Mushaf for the first time of the day.
17. **Don't wake the screen during recitation playback** — already common in the listening world; check that screen-wake is offered only when the user is actively reading, not listening with the phone down.
18. **Arabic typography review.** Make sure the Mushaf font is Uthmanic/Indopak per user preference, with proper tashkeel rendering across Android/iOS (Noto Naskh + KFGQPC are common choices).
19. **Disable system text selection / copy-paste hijacking on Mushaf pages** — accidental selection while scrolling is a common annoyance in Quran apps.
20. **Zakat calculator.** A small, focused tool — gold/silver/cash thresholds, nisab in local currency. Pairs naturally with the Ramadan mode.

### What I would *not* add
- More gamification beyond what you have. Religious apps lose their soul fast when streaks and achievements become the point. Your current stats/achievements are about right — don't push further into badges, leaderboards, or social.
- Social / community features. Different lane, different app.
- AI chat about Islam. Wrong genre for an offline-first reverent app, and the doctrinal risk is real.

---

## Suggested next tasks (if you want to act on this)

In rough order of value-per-effort:

1. **Tafsir per ayah** (bundle Al-Muyassar — small, public domain, authoritative).
2. **Word-by-word & translation toggle** in the reader.
3. **Bookmarks + private notes per ayah**.
4. **Multiple qari support**.
5. **Hadith-of-the-day card on home**.
6. **Salah daily tracker extension on the prayer page**.

Happy to plan any of these as a real task whenever you're ready.
