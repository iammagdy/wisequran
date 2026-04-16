/*
  # Create device_hifz table

  ## Purpose
  Stores hifz (memorization) status per surah per anonymous device.
  Enables offline-resilient cloud backup of memorization progress.

  ## New Table: device_hifz
  - `device_id` (text) — anonymous device UUID from localStorage
  - `surah_number` (int) — surah number 1–114
  - `status` (text) — 'none', 'reading', or 'memorized'
  - `updated_at` (timestamptz) — last updated timestamp
  - PRIMARY KEY: (device_id, surah_number)

  ## Security
  - RLS enabled
  - Anon role can insert/update/select rows where device_id is non-empty.
  - NOTE: This intentionally follows the same anonymous device-id pattern as
    `recitation_history`. The app is fully anonymous by design — there is no
    server-side binding between a request and a device UUID. Any client that
    knows a device_id can access its rows, which is an accepted trade-off for
    a zero-auth, local-first app.
*/

CREATE TABLE IF NOT EXISTS device_hifz (
  device_id text NOT NULL,
  surah_number integer NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  status text NOT NULL DEFAULT 'none' CHECK (status IN ('none', 'reading', 'memorized')),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (device_id, surah_number)
);

ALTER TABLE device_hifz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can insert own hifz"
  ON device_hifz FOR INSERT
  TO anon
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Devices can update own hifz"
  ON device_hifz FOR UPDATE
  TO anon
  USING (device_id IS NOT NULL AND length(device_id) > 0)
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Devices can read own hifz"
  ON device_hifz FOR SELECT
  TO anon
  USING (device_id IS NOT NULL AND length(device_id) > 0);

CREATE INDEX IF NOT EXISTS idx_device_hifz_device_id ON device_hifz(device_id);
