-- ════════════════════════════════════════════════════════════════
--  Список Бажань — Supabase setup
--  Paste this whole file into Supabase → SQL Editor → New query → Run.
--  Safe to re-run (uses "if not exists" / "drop policy if exists").
-- ════════════════════════════════════════════════════════════════

-- 1. The single key-value table the app uses.
create table if not exists public.wishlist_data (
  key        text primary key,
  data       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Turn on Row Level Security.
alter table public.wishlist_data enable row level security;

-- 3. Policies.
--    This wishlist is fully public (anyone with the link can read AND book),
--    which matches how the app works — there is no per-user login, just the
--    admin "spell" on the frontend. So we allow the anon role full access.
--    If you ever want stricter rules, edit these.
drop policy if exists "public read"   on public.wishlist_data;
drop policy if exists "public write"  on public.wishlist_data;
drop policy if exists "public update" on public.wishlist_data;
drop policy if exists "public delete" on public.wishlist_data;

create policy "public read"   on public.wishlist_data for select using (true);
create policy "public write"  on public.wishlist_data for insert with check (true);
create policy "public update" on public.wishlist_data for update using (true) with check (true);
create policy "public delete" on public.wishlist_data for delete using (true);

-- 4. Enable realtime so every visitor sees bookings update live.
alter publication supabase_realtime add table public.wishlist_data;

-- Done! The app writes two rows automatically: key='items' and key='bookings'.
