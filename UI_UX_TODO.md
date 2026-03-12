# UI/UX TODO — Wise Quran

Polish items for future improvement (non-blocking).

## Minor Layout

- [ ] InstallBanner overlaps bottom content briefly before dismissal — consider positioning it higher or adding extra padding
- [ ] NowPlayingScreen `pb-40` padding at bottom of ayah list — verify on very small screens (320px width)
- [ ] GlobalAudioBar bottom offset uses `calc(4rem + env(safe-area-inset-bottom))` — test on phones with gesture navigation

## Typography

- [ ] Verify Amiri font loading when truly offline (font should be precached by service worker)
- [ ] Test Arabic line-height in ayah cards on smaller font size settings

## Animations

- [ ] Splash screen runs for 2.5s — consider reducing to 1.5s on repeat visits
- [ ] Bottom nav pill animation (`layoutId="nav-pill"`) — test for jank on low-end Android

## RTL

- [ ] All components use RTL correctly via `dir="rtl"` on `<html>` tag
- [ ] GlobalAudioBar explicitly sets `dir="rtl"` on inner container ✓
- [ ] No mixed-direction issues found in current review

## Accessibility

- [ ] Add ARIA labels to audio player controls (Play, Pause, Close)
- [ ] Ensure color contrast ratios meet WCAG AA for muted-foreground text
- [ ] Test with screen readers (TalkBack on Android, VoiceOver on iOS)
