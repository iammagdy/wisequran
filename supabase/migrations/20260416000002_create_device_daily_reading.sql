/*
  # Create device_daily_reading table

  ## Purpose
  Stores daily Quran reading ayah counts per anonymous device.
  Enables offline-resilient cloud backup of daily reading progress.

  ## New Table: device_daily_reading
  - `device_id` (text) — anonymous device UUID from localStorage
  - `date` (text) — YYYY-MM-DD date key
  - `count` (int) — number of ayahs read on this date
  - `updated_at` (timestamptz) — last updated timestamp
  - PRIMARY KEY: (device_id, date)

  ## Security
  - RLS enabled
  - Anon role can insert/update/select rows where device_id is non-empty.
  - NOTE: Follows the same intentional anonymous device-id pattern as
    `recitation_history`. No server-side identity binding exists; the app
    is fully anonymous and local-first by design.
*/

CREATE TABLE IF NOT EXISTS device_daily_reading (
  device_id text NOT NULL,
  date text NOT NULL,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (device_id, date)
);

ALTER TABLE device_daily_reading ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can insert own daily reading"
  ON device_daily_reading FOR INSERT
  TO anon
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Devices can update own daily reading"
  ON device_daily_reading FOR UPDATE
  TO anon
  USING (device_id IS NOT NULL AND length(device_id) > 0)
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Devices can read own daily reading"
  ON device_daily_reading FOR SELECT
  TO anon
  USING (device_id IS NOT NULL AND length(device_id) > 0);

CREATE INDEX IF NOT EXISTS idx_device_daily_reading_device_id ON device_daily_reading(device_id);
