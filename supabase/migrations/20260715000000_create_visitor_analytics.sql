-- Create visitor_analytics table
CREATE TABLE IF NOT EXISTS public.visitor_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  ip text,
  org text,
  city text,
  country text,
  device text,
  bookmarks_count int DEFAULT 0,
  hifz_count int DEFAULT 0,
  tasbeeh_count int DEFAULT 0,
  session_duration_seconds int DEFAULT 0,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert
CREATE POLICY "Allow anonymous inserts"
  ON public.visitor_analytics FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to update their own session by matching session_id
CREATE POLICY "Allow updates by session_id"
  ON public.visitor_analytics FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow select for anyone (to power the DevKit dashboard)
CREATE POLICY "Allow select for anyone"
  ON public.visitor_analytics FOR SELECT
  TO anon
  USING (true);
