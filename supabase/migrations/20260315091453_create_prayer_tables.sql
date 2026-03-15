/*
  # Create Prayer Preferences and History Tables

  ## Summary
  This migration creates two tables to support cross-device sync of prayer settings and history.

  ## New Tables

  ### 1. user_prayer_preferences
  Stores per-user adhan and reminder configuration:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users, unique - one row per user)
  - `adhan_voice_id` (text) - selected muezzin voice
  - `adhan_volume` (int) - 0-100 volume level
  - `reminder_volume` (int) - 0-100 chime volume
  - `time_format` (text) - '12h' or '24h'
  - `pre_reminder_minutes` (int) - minutes before prayer for reminder
  - `post_reminder_minutes` (int) - minutes after prayer for reminder
  - `post_reminder_content` (text) - 'simple', 'dhikr', or 'quran'
  - `per_prayer_config` (jsonb) - per-prayer adhan/reminder enable flags
  - `calculation_method` (text) - prayer time calculation method
  - `manual_location` (jsonb) - manually selected city with lat/lng
  - `fajr_special_adhan` (boolean) - use Fajr-specific adhan
  - `takbir_only_mode` (boolean) - play only takbir instead of full adhan
  - `created_at` / `updated_at` (timestamptz)

  ### 2. user_prayer_history
  Stores daily prayer completion records per user:
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `date` (date) - the day this record belongs to
  - `prayer_name` (text) - fajr, dhuhr, asr, maghrib, isha
  - `completed` (boolean) - whether the prayer was completed
  - `completed_at` (timestamptz) - when it was marked complete
  - `created_at` (timestamptz)
  - UNIQUE constraint on (user_id, date, prayer_name)

  ## Security
  - RLS enabled on both tables
  - Users can only read/write their own data
  - No public access
*/

CREATE TABLE IF NOT EXISTS user_prayer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  adhan_voice_id text DEFAULT 'makkah',
  adhan_volume integer DEFAULT 80,
  reminder_volume integer DEFAULT 60,
  time_format text DEFAULT '12h',
  pre_reminder_minutes integer DEFAULT 15,
  post_reminder_minutes integer DEFAULT 0,
  post_reminder_content text DEFAULT 'simple',
  per_prayer_config jsonb DEFAULT '{}'::jsonb,
  calculation_method text DEFAULT 'egyptian',
  manual_location jsonb DEFAULT NULL,
  fajr_special_adhan boolean DEFAULT true,
  takbir_only_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_prayer_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prayer preferences"
  ON user_prayer_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prayer preferences"
  ON user_prayer_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prayer preferences"
  ON user_prayer_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prayer preferences"
  ON user_prayer_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_prayer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  prayer_name text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date, prayer_name)
);

ALTER TABLE user_prayer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prayer history"
  ON user_prayer_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prayer history"
  ON user_prayer_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prayer history"
  ON user_prayer_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prayer history"
  ON user_prayer_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prayer_history_user_date ON user_prayer_history(user_id, date DESC);
