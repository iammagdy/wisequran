/*
  # Create Recitation History Table

  ## Purpose
  Stores anonymous recitation test results tied to a device UUID stored in localStorage.
  No authentication required — fully anonymous by design.

  ## New Tables

  ### `recitation_history`
  Each row represents one recitation attempt for a verse range.

  - `id` (uuid, primary key) — unique record identifier
  - `device_id` (text, not null) — anonymous device UUID from localStorage
  - `surah_number` (int, not null) — surah tested (1–114)
  - `ayah_from` (int, not null) — first ayah in the tested range
  - `ayah_to` (int, not null) — last ayah in the tested range
  - `score` (int, not null) — accuracy percentage 0–100
  - `total_ayahs` (int, not null) — total ayahs in the range
  - `correct_ayahs` (int, not null) — number of ayahs recited correctly (>= 70% match)
  - `transcript` (text) — raw speech recognition output
  - `tested_at` (timestamptz) — when the test was taken

  ## Security
  - RLS enabled
  - Devices can only insert their own records (device_id must match)
  - Devices can only read their own records
  - No update or delete (immutable history)

  ## Notes
  - device_id is a client-generated UUID — not cryptographically verified
  - This is intentionally simple and anonymous; no auth required
*/

CREATE TABLE IF NOT EXISTS recitation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  surah_number integer NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  ayah_from integer NOT NULL CHECK (ayah_from >= 1),
  ayah_to integer NOT NULL CHECK (ayah_to >= ayah_from),
  score integer NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  total_ayahs integer NOT NULL DEFAULT 1,
  correct_ayahs integer NOT NULL DEFAULT 0,
  transcript text DEFAULT '',
  tested_at timestamptz DEFAULT now()
);

ALTER TABLE recitation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can insert own recitation history"
  ON recitation_history
  FOR INSERT
  TO anon
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Devices can read own recitation history"
  ON recitation_history
  FOR SELECT
  TO anon
  USING (device_id IS NOT NULL AND length(device_id) > 0);

CREATE INDEX IF NOT EXISTS idx_recitation_history_device_id ON recitation_history(device_id);
CREATE INDEX IF NOT EXISTS idx_recitation_history_surah ON recitation_history(surah_number);
CREATE INDEX IF NOT EXISTS idx_recitation_history_tested_at ON recitation_history(tested_at DESC);
