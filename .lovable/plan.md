

# Wise QURAN App — Implementation Plan

## Overview
A beautiful, offline-first PWA for reading Quran, accessing أذكار (Azkar), and tracking daily prayers. No accounts, no ads — all data stored locally. Installable on mobile and desktop.

## Design & Vibe
- **Theme**: Calm, spiritual — soft greens, golds, and cream tones (light mode) / deep navy and warm gold (dark mode)
- **Typography**: Clean Arabic-friendly fonts, adjustable size
- **Animations**: Smooth tab transitions, subtle press feedback, fade-ins
- **Layout**: Mobile-first bottom tab navigation, responsive for desktop

## App Structure (4 Main Tabs)

### 1. 📖 Quran Screen
- List of all 114 surahs with surah name (Arabic + English), number of ayahs, and revelation type
- Search surahs by name or number
- Tap a surah to read its ayahs with adjustable font size
- **Last-read position** saved automatically (localStorage)
- **Bookmarks**: save/remove ayahs, view bookmarked list
- Quran text data fetched from a free API (e.g. Alquran.cloud) and cached locally via IndexedDB for offline use

### 2. 📿 Azkar Screen
- Categories: Morning, Evening, After Prayer, Before Sleep, Waking Up, General
- Each dhikr shows Arabic text, translation, and a **tap counter** with haptic-style animation
- Counter resets per dhikr; progress shown per category
- Azkar data bundled in-app (JSON) + downloadable for offline

### 3. ✅ Prayer Checklist
- Five daily prayers: Fajr, Dhuhr, Asr, Maghrib, Isha
- Toggle each as completed with a satisfying check animation
- **Daily reset** at midnight (local time)
- Weekly progress indicator (streak/bar chart)
- Data persisted in localStorage

### 4. ⚙️ Settings
- Light / Dark mode toggle
- Font size slider (affects Quran and Azkar text)
- **Download Manager**: view downloaded surahs/azkar, download all or select specific ones, clear cached data
- Storage usage indicator

## PWA & Offline
- **Web App Manifest**: app name "Wise QURAN", theme color (green/gold), icons, `display: standalone`
- **Service Worker** (using Workbox via vite-plugin-pwa):
  - Precache app shell (HTML, CSS, JS, fonts)
  - Runtime cache for Quran API responses
  - Offline fallback so the app UI always loads
- **Download Manager UI**: user can selectively download Quran surahs or azkar categories into IndexedDB, with progress indicators

## Local Storage Strategy
| Data | Storage |
|------|---------|
| Settings (theme, font) | localStorage |
| Last-read position | localStorage |
| Bookmarks | localStorage |
| Prayer checklist | localStorage |
| Downloaded Quran text | IndexedDB |
| Downloaded Azkar | IndexedDB |

## Tech Stack
- **React + Vite + TypeScript + Tailwind** (existing project setup)
- **vite-plugin-pwa** for manifest + service worker generation
- **idb** (lightweight IndexedDB wrapper) for offline content storage
- **react-router-dom** for tab-based navigation
- **Framer Motion** for smooth transitions and animations
- **Alquran.cloud API** for Quran text data

## File Structure
```
src/
├── assets/
│   └── azkar-data.json          # Bundled azkar content
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx         # Tab navigation
│   │   └── AppShell.tsx          # Main layout wrapper
│   ├── quran/
│   │   ├── SurahList.tsx
│   │   ├── SurahReader.tsx
│   │   ├── SearchBar.tsx
│   │   └── BookmarkList.tsx
│   ├── azkar/
│   │   ├── AzkarCategories.tsx
│   │   ├── AzkarList.tsx
│   │   └── DhikrCounter.tsx
│   ├── prayer/
│   │   ├── PrayerChecklist.tsx
│   │   └── WeeklyProgress.tsx
│   ├── settings/
│   │   ├── SettingsPage.tsx
│   │   └── DownloadManager.tsx
│   └── ui/                       # Existing shadcn components
├── hooks/
│   ├── useLocalStorage.ts
│   ├── useIndexedDB.ts
│   └── useTheme.ts
├── lib/
│   ├── quran-api.ts              # API client for Quran data
│   ├── db.ts                     # IndexedDB setup
│   └── utils.ts
├── pages/
│   ├── QuranPage.tsx
│   ├── AzkarPage.tsx
│   ├── PrayerPage.tsx
│   └── SettingsPage.tsx
└── App.tsx
```

## Implementation Order
1. **App shell & navigation** — bottom tabs, layout, theme toggle
2. **Quran screen** — surah list, reader, search, bookmarks, font size
3. **Azkar screen** — categories, dhikr display, tap counter
4. **Prayer checklist** — toggle prayers, daily reset, weekly view
5. **Settings** — theme, font, download manager
6. **PWA setup** — manifest, service worker, offline caching
7. **IndexedDB integration** — download manager for offline content

