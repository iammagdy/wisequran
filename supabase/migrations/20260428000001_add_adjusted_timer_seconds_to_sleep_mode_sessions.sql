/*
  # Add adjusted_timer_seconds to sleep_mode_sessions

  ## Summary
  Adds a column to capture the user-adjusted Sleep Mode duration (in
  seconds) when the user shortens or extends the running session from
  the OS lock-screen scrubber. The originally-selected `timer_minutes`
  is preserved for comparison.

  ## Changes
  - Adds nullable `adjusted_timer_seconds` integer column. NULL means
    the user never adjusted the timer from the lock screen — analytics
    queries should fall back to `timer_minutes * 60` in that case.
*/

ALTER TABLE sleep_mode_sessions
  ADD COLUMN IF NOT EXISTS adjusted_timer_seconds integer;
