# PRD

## Original Problem Statement
The user requested two critical iPhone Safari fixes and a version update:
1) Azan audio was completely silent on iPhone Safari.
2) Recitation (tasmee3) incorrectly showed as unsupported on iPhone.
3) After both fixes, the app version had to be updated to 3.2.1 and the changelog popup + markdown changelog had to reflect the release.

## Architecture Decisions
- Keep the unified mobile audio layer, but add iPhone Safari-specific direct-tap Azan playback handling in the Settings UI.
- Prefer HTTPS Azan URLs first on iPhone Safari, with current local sources as fallback, per user choice.
- Keep SpeechRecognition support dynamic, but make iOS detection explicit via `window.SpeechRecognition || window.webkitSpeechRecognition` and iOS version parsing.
- Disable auto mic start on iPhone Safari so `recognition.start()` is only triggered by a direct tap on the mic button.
- Add iOS-specific UX copy for unsupported old iOS versions and Safari microphone permission recovery.

## What Has Been Implemented
- Added iOS version parsing utilities in `src/lib/browser-detect.ts`.
- Updated `useSpeechRecognition.ts` to:
  - detect `window.SpeechRecognition || window.webkitSpeechRecognition`
  - mark iOS < 14.5 as unsupported
  - use `continuous = false` on iPhone Safari
  - restart recognition from `onend` while active on iOS
  - return iOS-specific permission/compatibility state
- Updated `RecitationTestPage.tsx` to:
  - stop hard-blocking iPhone Safari as unsupported
  - show the iOS 14.5+ update message only for confidently older iOS
  - show Safari microphone settings guidance on `not-allowed`
  - use direct `onTouchEnd` + click fallback on the mic button
  - avoid auto-starting the mic on iOS outside a direct gesture
- Added AudioContext warm-up in `useGlobalAudioBootstrap.ts` for first-touch iPhone Safari readiness.
- Added HTTPS-first Azan source ordering in `src/lib/adhan-settings.ts` via `buildAzanSourceList()`.
- Updated `useAdhan.ts` to prefer HTTPS-first Azan URLs on iPhone Safari with local fallback.
- Updated `SettingsPage.tsx` to:
  - add a hidden inline `<audio>` fallback element for Azan playback
  - use direct `onTouchEnd` + click fallback on Azan preview/test buttons
  - trigger Azan playback synchronously from the gesture path with inline playback attributes for iOS
- Updated versioning to `3.2.1` in `package.json`, `src/data/changelog.ts`, and `CHANGELOG.md`.
- Added the required 3.2.1 changelog popup content so users with older localStorage versions receive the update popup automatically.
- Final build passes successfully with `yarn build`.

## Prioritized Backlog
### P0
- Run physical-device validation on real iPhone Safari for:
  - direct-tap Azan playback
  - microphone permission prompt behavior
  - recitation restart-after-silence behavior
- Add a dedicated `data-testid` for the iPhone support/help banner if deeper UI automation is needed.

### P1
- Extract the iOS Azan playback logic from `SettingsPage.tsx` into a dedicated hook or component.
- Reduce `SettingsPage.tsx` size to lower future regression risk.

### P2
- Add device telemetry/debug UI for audio-play rejection reasons and mic permission state.
- Expand automated browser checks around changelog popup and iOS-specific recitation copy.

## Next Tasks
- Validate on physical iPhone Safari versions 14.5, 15, 16, 17, and 18.
- If any iPhone-specific edge case remains, isolate it behind a dedicated Safari diagnostics panel in Settings.
