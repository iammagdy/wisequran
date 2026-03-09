

# Add Splash/Welcome Screen

## Overview
Create an animated splash screen that displays when the app first loads, featuring the app logo, name, and spiritual animations before transitioning to the main content.

## Implementation

### 1. New Component: `src/components/SplashScreen.tsx`
- Full-screen overlay with app's spiritual gradient background
- Centered logo (using existing `/icons/icon-192.png`)
- App name "Wise QURAN" with Arabic subtitle "القرآن الكريم"
- Spiritual animations:
  - Logo scale-in with gentle bounce
  - Pulsing glow ring around logo
  - Floating particles/stars animation
  - Name fade-in with stagger
  - Exit animation (fade out + scale)
- Auto-dismiss after 2.5 seconds
- Use `framer-motion` for smooth animations

### 2. Update: `src/App.tsx`
- Add splash screen state management
- Show `<SplashScreen />` on initial load
- Use `sessionStorage` to only show once per session (not on every navigation)
- Transition to main app content after splash completes

### 3. CSS Additions: `src/index.css`
- Floating particle keyframe animation
- Pulsing glow keyframe for logo ring
- Smooth text reveal animation

## Animation Timeline
```text
0.0s  - Screen appears with gradient background
0.2s  - Logo scales in with spring physics
0.5s  - Glow ring starts pulsing
0.8s  - App name fades in
1.0s  - Subtitle fades in
1.5s  - Particles float gently
2.5s  - Everything fades out, main app reveals
```

## Visual Design
- Same spiritual gradient as app background
- Logo with soft shadow and animated glow
- Decorative geometric patterns (subtle)
- Smooth, calming transitions fitting Islamic aesthetic

