-- Phase D — Real-User Monitoring (RUM) for Core Web Vitals.
--
-- One row per finalized metric (LCP / CLS / INP / TTFB) per session
-- per page path. Inserted fire-and-forget by `src/lib/vitals.ts` when
-- the user is signed in + online + Supabase is configured.
--
-- The table is intentionally narrow (no UA, no IP, no device data) so
-- it never becomes a privacy or storage concern. Percentiles per
-- (path, name) over a recent window can be computed with a single
-- `percentile_cont` aggregate.
--
-- Example query for p50/p75/p95 LCP per page over the last 7 days:
--   select path,
--          percentile_cont(0.5) within group (order by value) as p50,
--          percentile_cont(0.75) within group (order by value) as p75,
--          percentile_cont(0.95) within group (order by value) as p95
--     from web_vitals
--    where name = 'LCP' and ts > now() - interval '7 days'
--    group by path
--    order by p75 desc;

create table if not exists public.web_vitals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (name in ('LCP','CLS','INP','TTFB')),
  value       double precision not null,
  rating      text not null check (rating in ('good','needs-improvement','poor')),
  path        text not null,
  session_id  text not null,
  ts          timestamptz not null default now()
);

create index if not exists web_vitals_ts_idx     on public.web_vitals (ts desc);
create index if not exists web_vitals_name_ts_idx on public.web_vitals (name, ts desc);
create index if not exists web_vitals_user_idx   on public.web_vitals (user_id, ts desc);

alter table public.web_vitals enable row level security;

-- Each user can insert their own samples; the SDK passes the
-- authenticated user_id automatically.
create policy "users can insert own vitals"
  on public.web_vitals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- A user can read their own samples (useful for showing personal
-- "your last session" stats client-side). Aggregate dashboards run
-- with the service-role key from the server side and bypass RLS.
create policy "users can read own vitals"
  on public.web_vitals
  for select
  to authenticated
  using (auth.uid() = user_id);
