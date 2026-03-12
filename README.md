<p align="center">
  <img src="public/icons/icon-192.png" alt="Wise Quran" width="80" height="80">
</p>

<h1 align="center">Wise Quran</h1>

<p align="center">
  القرآن الكريم — A modern, offline-first Quran app built as a Progressive Web App.
</p>

<p align="center">
  <a href="https://quran.thewise.cloud">Live Demo</a> · <a href="#features">Features</a> · <a href="#screenshots">Screenshots</a> · <a href="#getting-started">Getting Started</a>
</p>

---

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

## License

MIT
