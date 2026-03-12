<p align="center">
  <img src="public/icons/icon-192.png" alt="Wise Quran" width="120" height="120">
</p>

<h1 align="center">Wise Quran — القرآن الكريم</h1>

<p align="center">
  <strong>A modern, offline-first Quran application built as a Progressive Web App.</strong>
</p>

<p align="center">
  <a href="https://quran.thewise.cloud">quran.thewise.cloud</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/iammagdy/wisequran?style=flat-square&color=3d7a5a" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square&color=3d7a5a" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/PWA-Ready-brightgreen?style=flat-square&color=3d7a5a" alt="PWA Ready">
  <img src="https://img.shields.io/badge/React-18-informational?style=flat-square&color=3d7a5a" alt="React">
</p>

<p align="center">
  <a href="#about-the-project">About</a> · <a href="#features">Features</a> · <a href="#screenshots">Screenshots</a> · <a href="#architecture--data">Architecture</a> · <a href="#getting-started">Getting Started</a> · <a href="CONTRIBUTING.md">Contributing</a>
</p>

---

## About The Project

Wise Quran is designed to provide a fast, beautiful, and distraction-free experience for reading the Quran, listening to recitations, and tracking daily prayers and Azkar. 

It is built specifically with offline capabilities in mind — meaning once you download a Surah or audio file, it is permanently stored on your device and can be accessed without an internet connection, making it perfect for travel or areas with low connectivity.

## Features

- 📖 **Full Quran Text** — All 114 surahs with clean Uthmanic typography
- 🎧 **Audio Recitations** — Multiple reciters with ayah-by-ayah tracking
- 🌙 **Azkar & Duas** — Morning/evening remembrances with counters
- 🕌 **Prayer Tracker** — Daily prayer logging and streak tracking
- 📿 **Digital Tasbeeh** — Tap counter with haptic feedback
- 🔍 **Search** — Find surahs by name, number, or ayah text
- 📴 **Offline Mode** — Download surahs and audio for true offline access
- 📱 **Installable PWA** — Add to home screen on Android and iOS
- 🌓 **Dark Mode** — Automatic and manual theme switching
- 🔗 **Ayah Sharing** — Generate beautiful share cards with ayah text

## Screenshots

<p align="center">
  <img src="docs/screenshots/quran-home.png" width="200" alt="Quran Home">
  <img src="docs/screenshots/surah-reader.png" width="200" alt="Surah Reader">
  <img src="docs/screenshots/azkar.png" width="200" alt="Azkar">
  <img src="docs/screenshots/settings.png" width="200" alt="Settings">
</p>

## Tech Stack

- **React** + **TypeScript** — UI framework
- **Vite** — Build tool with PWA plugin
- **Workbox** — Service worker and offline caching
- **IndexedDB** — Local storage for surahs, audio, and tafsir
- **Framer Motion** — Animations
- **shadcn/ui** — Component library

## Architecture & Data

Wise Quran relies on highly optimized modern web APIs to deliver a native-like experience:
- **Service Workers & Workbox:** Caches the application shell, fonts, and assets for instant loading.
- **IndexedDB:** All Quranic text, translations, Tafsir, and downloaded audio files are stored locally in the browser's IndexedDB. This bypasses the typical 50MB browser storage limits, allowing for gigabytes of offline audio storage.
- **React + Tailwind + shadcn/ui:** Ensures a highly responsive layout across desktop, tablet, and mobile devices.

## Getting Started

```bash
# Clone
git clone https://github.com/iammagdy/wisequran.git
cd wisequran

# Install
npm install

# Dev server
npm run dev

# Production build
npm run build
```

The app runs at `http://localhost:8080` by default.

## Acknowledgments

This project was developed and extensively overhauled with the assistance of **[Claude]** (by Anthropic) and **[Gemini]** (by Google), acting as AI pair programmers for major architecture, UI/UX, and PWA offline capabilities.

## License

MIT
