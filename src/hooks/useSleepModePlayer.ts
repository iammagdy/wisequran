import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceId } from "@/hooks/useDeviceId";
import { sleepModePlayer } from "@/lib/sleep-mode-player";

// Re-export the public API previously exposed by this hook so existing
// import sites (`@/hooks/useSleepModePlayer`) keep working unchanged.
export {
  loadSleepModePrefs,
  hasConfiguredSleepMode,
  SLEEP_PREFS_CHANGED_EVENT,
} from "@/lib/sleep-mode-player";
export type { SleepModePrefs } from "@/lib/sleep-mode-player";

/**
 * Thin React subscription over the module-level Sleep Mode player.
 * The actual audio orchestration, timer, and session lifecycle live in
 * `@/lib/sleep-mode-player` so they survive page navigation — that's
 * what lets the home Sleep Mode tile show "playing · Nm left" while
 * the user is on the home screen, and lets re-entering the Sleep page
 * pick up the same active session.
 */
export function useSleepModePlayer() {
  const { user } = useAuth();
  const deviceId = useDeviceId();

  // Keep the singleton's auth context in sync from React so the
  // supabase session insert can attribute correctly without the
  // singleton having to peek into React.
  useEffect(() => {
    sleepModePlayer.setAuthContext(user?.id ?? null, deviceId);
  }, [user?.id, deviceId]);

  const snapshot = useSyncExternalStore(
    sleepModePlayer.subscribe,
    sleepModePlayer.getSnapshot,
    sleepModePlayer.getSnapshot,
  );

  return {
    prefs: snapshot.prefs,
    setPrefs: sleepModePlayer.setPrefs,
    isPlaying: snapshot.isPlaying,
    isLoading: snapshot.isLoading,
    hasError: snapshot.hasError,
    isOfflineUncached: snapshot.isOfflineUncached,
    remainingSeconds: snapshot.remainingSeconds,
    audioCurrentTime: snapshot.audioCurrentTime,
    audioDuration: snapshot.audioDuration,
    togglePlay: sleepModePlayer.togglePlay,
    stop: sleepModePlayer.stop,
  };
}
