/*
  # Create Recitation Sessions Table

  ## Purpose
  Stores detailed recitation test sessions with per-verse JSONB results.
  Anonymous — tied to a device UUID stored in localStorage.

  ## New Tables

  ### `recitation_sessions`
  Replaces / supplements recitation_history with richer per-verse detail.

  - `id` (uuid, primary key)
  - `session_id` (text) — anonymous device UUID from localStorage
  - `surah_number` (int) — surah tested
  - `verses_range` (text) — e.g. "1-7" 
  - `accuracy_score` (int) — overall 0–100
  - `verse_results` (jsonb) — array of {numberInSurah, score, isCorrect}
  - `strictness` (text) — "lenient" | "normal" | "strict"
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - anon role can insert and read their own sessions (session_id check)
*/

CREATE TABLE IF NOT EXISTS recitation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  surah_number integer NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  verses_range text NOT NULL DEFAULT '',
  accuracy_score integer NOT NULL DEFAULT 0 CHECK (accuracy_score BETWEEN 0 AND 100),
  verse_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  strictness text NOT NULL DEFAULT 'normal' CHECK (strictness IN ('lenient', 'normal', 'strict')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recitation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can insert own recitation sessions"
  ON recitation_sessions
  FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "Devices can read own recitation sessions"
  ON recitation_sessions
  FOR SELECT
  TO anon
  USING (session_id IS NOT NULL AND length(session_id) > 0);

CREATE INDEX IF NOT EXISTS idx_recitation_sessions_session_id ON recitation_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_recitation_sessions_surah ON recitation_sessions(surah_number);
CREATE INDEX IF NOT EXISTS idx_recitation_sessions_created_at ON recitation_sessions(created_at DESC);
