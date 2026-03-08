

# Fix Settings UI Spacing + Add First-Visit Install Banner

## 1. Fix Settings spacing
**`src/pages/SettingsPage.tsx` line 163**: Change `space-y-0` to `space-y-4` so the dark mode toggle, separator, and font size control have proper vertical spacing.

## 2. New Install Banner
**Create `src/components/InstallBanner.tsx`**:
- Fixed banner positioned above bottom nav (`bottom-20`), full width, with calm styling matching the app's spiritual theme
- Logic:
  - Skip if `window.matchMedia('(display-mode: standalone)')` matches (already installed)
  - Skip if `localStorage.getItem('wise-install-dismissed')` is set
  - Listen for `beforeinstallprompt` event → show "Install" button (Android/Chrome)
  - Detect iOS via userAgent → show "Share → Add to Home Screen" text
  - On dismiss: set `wise-install-dismissed` in localStorage
  - On install success: hide and set dismissed
- UI: Card-like banner with app icon, Arabic text "ثبّت التطبيق للوصول السريع", install/instructions, and X close button
- Uses framer-motion for enter/exit animation

## 3. Mount banner
**`src/App.tsx`**: Import `InstallBanner` and render it inside `AppContent`, after `<AppShell>` wrapper (sibling level, so it renders above the shell).

### Files
| File | Change |
|------|--------|
| `src/pages/SettingsPage.tsx` | `space-y-0` → `space-y-4` |
| `src/components/InstallBanner.tsx` | **New** |
| `src/App.tsx` | Add `<InstallBanner />` |

