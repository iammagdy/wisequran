/*
  # Create device_bookmarks table

  ## Purpose
  Stores per-ayah bookmarks and private notes. Each row is owned by
  either an authenticated user (`user_id`) or an anonymous device
  (`device_id`). The stable `owner_key` column combines both cases so
  the composite primary key is uniform and works with PostgREST upsert
  on a fixed conflict target.

  ## Columns
  - `owner_key` (text) — `'u:' || user_id` for signed-in users, or
    `'d:' || device_id` for anonymous devices. Enforced by a CHECK.
  - `user_id` (uuid, nullable) — FK to `auth.users.id`. Populated only
    for rows owned by authenticated users.
  - `device_id` (text, nullable) — anonymous device UUID. Populated for
    both anonymous rows and user-owned rows (recording which device
    made the write; not used for RLS on user rows).
  - `surah` (int), `ayah` (int) — 1..114 / >=1
  - `ayah_text` (text) — snapshot of the ayah text
  - `surah_name` (text) — snapshot of the surah name
  - `note` (text) — private plain-text note (empty when no note)
  - `bookmarked` (boolean) — explicit bookmark flag, independent of note
  - `created_at` / `updated_at` (timestamptz)
  - `deleted` (boolean) — soft-delete flag (the offline sync queue does
    not support DELETE; removals are synced as upserts with
    `deleted = true`).
  - PRIMARY KEY: (owner_key, surah, ayah)

  ## Security
  - RLS enabled.
  - Authenticated users: full access only to rows where
    `user_id = auth.uid()`. Private notes of signed-in users are never
    exposed to anonymous callers.
  - Anonymous (anon) role: only rows with `user_id IS NULL` and a
    non-empty `device_id`. Follows the same device-id trust model used
    elsewhere in the project (`recitation_history`, `device_daily_*`)
    and is intentional for anonymous local-first usage — clients using
    someone else's device_id is out of scope for the anonymous tier.
  - Signing in then syncing re-uploads local bookmarks under the
    user's owner_key, giving cross-device and reinstall survival that
    is bound to the authenticated identity, not the device id.
*/

CREATE TABLE IF NOT EXISTS device_bookmarks (
  owner_key text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text,
  surah integer NOT NULL CHECK (surah BETWEEN 1 AND 114),
  ayah integer NOT NULL CHECK (ayah >= 1),
  ayah_text text NOT NULL DEFAULT '',
  surah_name text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  bookmarked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (owner_key, surah, ayah),
  CHECK (
    (user_id IS NOT NULL AND owner_key = 'u:' || user_id::text)
    OR (user_id IS NULL AND device_id IS NOT NULL
        AND length(device_id) > 0
        AND owner_key = 'd:' || device_id)
  )
);

ALTER TABLE device_bookmarks ENABLE ROW LEVEL SECURITY;

-- Authenticated users: full control over their own rows, and only those.
CREATE POLICY "Users can read own bookmarks"
  ON device_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON device_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON device_bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON device_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anonymous users: only anonymous (device-owned) rows are visible to
-- the anon role. User-owned rows are never exposed to anon.
CREATE POLICY "Anon can read anonymous device bookmarks"
  ON device_bookmarks FOR SELECT
  TO anon
  USING (user_id IS NULL AND device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Anon can insert anonymous device bookmarks"
  ON device_bookmarks FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Anon can update anonymous device bookmarks"
  ON device_bookmarks FOR UPDATE
  TO anon
  USING (user_id IS NULL AND device_id IS NOT NULL AND length(device_id) > 0)
  WITH CHECK (user_id IS NULL AND device_id IS NOT NULL AND length(device_id) > 0);

CREATE INDEX IF NOT EXISTS idx_device_bookmarks_user_id
  ON device_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_device_bookmarks_device_id
  ON device_bookmarks(device_id);
CREATE INDEX IF NOT EXISTS idx_device_bookmarks_owner_updated
  ON device_bookmarks(owner_key, updated_at DESC);
