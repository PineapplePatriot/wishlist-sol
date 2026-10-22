-- ════════════════════════════════════════════════════════════════
--  Список Бажань — Supabase setup  (idempotent, safe to re-run)
--  Paste ALL of this into Supabase → SQL Editor → New query → Run.
-- ════════════════════════════════════════════════════════════════

-- 1. The single key-value table the app uses.
create table if not exists public.wishlist_data (
  key        text primary key,
  data       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Enable Row Level Security.
alter table public.wishlist_data enable row level security;

-- 3. Policies — public read + write (no login; admin "spell" is frontend-only).
drop policy if exists "public read"   on public.wishlist_data;
drop policy if exists "public write"  on public.wishlist_data;
drop policy if exists "public update" on public.wishlist_data;
drop policy if exists "public delete" on public.wishlist_data;

create policy "public read"   on public.wishlist_data for select using (true);
create policy "public write"  on public.wishlist_data for insert with check (true);
create policy "public update" on public.wishlist_data for update using (true) with check (true);
create policy "public delete" on public.wishlist_data for delete using (true);

-- 4. Enable realtime — wrapped so re-running doesn't error if already added.
do $$
begin
  alter publication supabase_realtime add table public.wishlist_data;
exception
  when duplicate_object then null;  -- already in publication, ignore
  when undefined_object then       -- publication doesn't exist yet, create it
    create publication supabase_realtime for table public.wishlist_data;
end $$;

-- 5. VERIFY — after running, check these results:
--    • policies: should list 4 rows (read/write/update/delete)
--    • realtime: should list 1 row (wishlist_data)
select '✓ policies' as check, policyname from pg_policies where tablename = 'wishlist_data'
union all
select '✓ realtime' as check, tablename from pg_publication_tables
  where pubname = 'supabase_realtime' and tablename = 'wishlist_data';

-- Done! The app auto-creates two rows: key='items' and key='bookings'.
-- If the verify block shows fewer than 4 policies or no realtime row,
-- something didn't apply — re-run the whole script.
