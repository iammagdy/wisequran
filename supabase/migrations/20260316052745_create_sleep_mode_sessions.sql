/*
  # Create sleep_mode_sessions table

  ## Summary
  Creates a table to track Quran sleep mode listening sessions.

  ## New Tables
  - `sleep_mode_sessions`
    - `id` (uuid, primary key)
    - `user_id` (uuid, nullable - for authenticated users)
    - `device_id` (text, nullable - for anonymous/local users)
    - `reciter_id` (text - which reciter was chosen)
    - `surah_number` (integer - starting surah number)
    - `timer_minutes` (integer - session duration in minutes)
    - `nature_sound` (text, nullable - which nature sound was used)
    - `completed` (boolean - whether the timer ran to completion)
    - `started_at` (timestamptz - session start time)
    - `ended_at` (timestamptz, nullable - session end time)

  ## Security
  - RLS enabled
  - Authenticated users can manage their own sessions
  - Anonymous users can insert sessions (tracked by device_id)
*/

CREATE TABLE IF NOT EXISTS sleep_mode_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  device_id text,
  reciter_id text NOT NULL DEFAULT 'alafasy',
  surah_number integer NOT NULL DEFAULT 1,
  timer_minutes integer NOT NULL DEFAULT 30,
  nature_sound text,
  completed boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE sleep_mode_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert own sessions"
  ON sleep_mode_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view own sessions"
  ON sleep_mode_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own sessions"
  ON sleep_mode_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can insert sessions with device_id"
  ON sleep_mode_sessions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND device_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS sleep_mode_sessions_user_id_idx ON sleep_mode_sessions (user_id);
CREATE INDEX IF NOT EXISTS sleep_mode_sessions_device_id_idx ON sleep_mode_sessions (device_id);
CREATE INDEX IF NOT EXISTS sleep_mode_sessions_started_at_idx ON sleep_mode_sessions (started_at DESC);
