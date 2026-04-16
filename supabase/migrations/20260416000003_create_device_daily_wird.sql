/*
  # Create device_daily_wird table

  ## Purpose
  Stores the daily wird (recitation plan) state per anonymous device.
  Enables offline-resilient cloud backup of wird plan and completion history.

  ## New Table: device_daily_wird
  - `device_id` (text) — anonymous device UUID from localStorage
  - `plan` (int) — plan duration in days (30, 60, 90, or 180)
  - `start_date` (text) — YYYY-MM-DD date when the plan started
  - `completed_days` (text[]) — array of YYYY-MM-DD strings for days marked done
  - `updated_at` (timestamptz) — last updated timestamp
  - PRIMARY KEY: device_id (one active plan per device)

  ## Security
  - RLS enabled
  - Anon role can insert/update/select rows where device_id is non-empty.
  - NOTE: Follows the same intentional anonymous device-id pattern as
    `recitation_history`. No server-side identity binding exists; the app
    is fully anonymous and local-first by design.
  - NOTE: `resetPlan` in useDailyWird.ts does not sync a deletion because
    the offline queue does not support delete operations. The row remains in
    Supabase after a local reset (tracked as a known limitation).
*/

CREATE TABLE IF NOT EXISTS device_daily_wird (
  device_id text PRIMARY KEY,
  plan integer NOT NULL CHECK (plan IN (30, 60, 90, 180)),
  start_date text NOT NULL,
  completed_days text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE device_daily_wird ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can insert own wird"
  ON device_daily_wird FOR INSERT
  TO anon
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Devices can update own wird"
  ON device_daily_wird FOR UPDATE
  TO anon
  USING (device_id IS NOT NULL AND length(device_id) > 0)
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Devices can read own wird"
  ON device_daily_wird FOR SELECT
  TO anon
  USING (device_id IS NOT NULL AND length(device_id) > 0);
