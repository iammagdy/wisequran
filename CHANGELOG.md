# Changelog

All notable changes to WiseQuran will be documented in this file.

## [3.2.0] - 2026-03-18

### 🔊 Mobile Audio Reliability Release

This release focuses on rebuilding the app's mobile audio behavior across Quran listening, Adhan, reminders, and notification delivery.

### ✨ New Features

- **Unified Mobile Audio Layer**
  - Quran listening, Adhan, reminder sounds, and Settings previews now use a shared playback pipeline
  - Added a global audio bootstrap on the first user interaction to improve Android/iPhone readiness

### 🔧 Improvements

- **Prayer & Reminder Reliability**
  - Prayer notifications now prefer service worker delivery when available
  - Added catch-up checks when the app returns to the foreground after being backgrounded
  - Reminder and Adhan events are tracked per day to reduce duplicate firing after reloads

- **PWA Audio Caching**
  - Added local `/audio/adhan/*.mp3` files to PWA asset caching
  - Expanded Workbox precache support to include MP3 assets

### 🐛 Bug Fixes

- Fixed Quran listening playback regression on mobile browsers
- Fixed fragmented Adhan/reminder playback paths causing failures on Android and iPhone
- Fixed Settings audio previews and quick test buttons to use the new shared playback layer

### 📝 Notes

- Background audio behavior in PWAs still depends on platform restrictions, especially on iPhone, but the app now applies the most reliable foreground/background-safe strategy available within the current web app architecture.

## [3.0.0] - 2026-03-17

### 🎯 Major Release: Accessibility & Usability Overhaul

This release focuses on comprehensive accessibility improvements to meet WCAG 2.1 AA/AAA standards and enhance usability for all users, particularly those with motor impairments, low vision, and motion sensitivity.

### ✨ New Features

- **Touch Target Accessibility** - All interactive elements now meet WCAG 44x44px minimum touch target size
  - Fixed 23+ undersized buttons across the app
  - Improved tap accuracy on mobile devices
  - Better experience for users with motor impairments

### 🔧 Improvements

#### Accessibility Enhancements
- **Audio Player Controls**
  - Increased stop/close button size from 36x36px to 44x44px
  - Improved hit area on speed selector buttons
  - Enhanced close button accessibility in Now Playing screen

- **Navigation & Buttons**
  - Fixed back button sizing across all pages (TasbeehPage, PrayerPage, SurahReaderPage)
  - Improved page navigation button sizes
  - Enhanced touch targets for view toggle buttons

- **Interactive Elements**
  - Increased bookmark button touch target from 32px to 44px
  - Improved tafsir button accessibility
  - Enhanced ayah copy button from 28px to 44px
  - Fixed inline ayah seek buttons in Focus Mode

- **Component-Specific Fixes**
  - Loop and timer toggle buttons: 36x36px → 44x44px
  - Previous/next ayah buttons: 40x40px → 44x44px
  - Prayer settings buttons: 26px → 44px height
  - Tasbeeh target option buttons: 26px → 44px height

#### Visual & UX Improvements
- All changes maintain visual consistency and design intent
- Icon sizes remain unchanged while expanding touch targets via padding
- No layout regressions or visual changes

### 🐛 Bug Fixes

- Fixed undersized interactive elements failing WCAG AAA accessibility requirements
- Resolved inconsistent touch target sizing across components
- Fixed button sizing inconsistencies in header controls

### 📊 Quality Metrics

- **WCAG Compliance**: Improved from partial AA to more comprehensive AA compliance
- **Touch Target Coverage**: 100% of interactive elements now meet 44x44px minimum
- **Build Status**: All TypeScript checks passing
- **Performance**: No performance impact from changes

### 🔍 Files Modified

- `src/components/quran/GlobalAudioBar.tsx` - Audio player controls
- `src/components/quran/NowPlayingScreen.tsx` - Now playing screen buttons
- `src/components/quran/FocusMode.tsx` - Focus mode controls
- `src/components/quran/ListeningTab.tsx` - Listening tab controls
- `src/components/quran/SurahBottomBar.tsx` - Surah playback controls
- `src/pages/SurahReaderPage.tsx` - Surah reader buttons and controls
- `src/pages/TasbeehPage.tsx` - Tasbeeh counter controls
- `src/pages/PrayerPage.tsx` - Prayer time settings buttons
- `package.json` - Version bump to 3.0.0

### 🚀 Known Issues

None at this time. All reported accessibility issues have been addressed.

### 📝 Notes

This release is part of a larger accessibility improvement initiative. Future releases will address:
- Bottom navigation responsive design for small screens (< 500px)
- Text size scaling (minimum 12px)
- Audio bar safe area positioning
- Motion reduction support (`prefers-reduced-motion`)
- Additional responsive design improvements

---

## [2.9.0] - 2026-02-15

### ✨ Features
- Recitation redesign with improved UI
- Enhanced update detection mechanism
- Localization improvements

### 🐛 Bug Fixes
- Fixed Safari audio deadlocks (iOS)
- UI responsiveness improvements
- Scaling fixes across devices

---

## [2.8.3] - 2026-02-10

### 🐛 Bug Fixes
- Resolved Safari audio deadlocks affecting iOS users

---

## [2.8.2] - 2026-02-08

### 🔧 Improvements
- UI responsiveness enhancements
- Scaling adjustments for better device compatibility

---

## Previous Versions

See git history for changes in earlier versions.
