

# Add PWA Install Button to Settings

## What
Add an "Install App" section in Settings that captures the browser's `beforeinstallprompt` event and provides a one-tap install button. For iOS (which doesn't support `beforeinstallprompt`), show manual instructions ("Share → Add to Home Screen").

## Changes

### `src/pages/SettingsPage.tsx`
- Add a new section before "حول التطبيق" with a Smartphone icon and title "تثبيت التطبيق"
- Use `useState` to store the `beforeinstallprompt` event (captured via `useEffect` on `window`)
- Detect iOS via `navigator.userAgent`
- **Android / Chrome**: Show an install button that calls `deferredPrompt.prompt()` and hides after successful install
- **iOS**: Show instructional text: "اضغط على زر المشاركة ثم 'إضافة إلى الشاشة الرئيسية'"
- **Already installed** (standalone mode detected via `window.matchMedia('(display-mode: standalone')`)): Show a "التطبيق مثبّت بالفعل" message with a checkmark
- Import `Smartphone` icon from lucide-react

### No other files need changes
The PWA manifest and service worker are already configured.

