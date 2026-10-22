-- ════════════════════════════════════════════════════════════════
--  Список Бажань — Emerald Edition · Supabase setup
--  Idempotent: safe to re-run. Paste ALL of it into
--  Supabase → SQL Editor → New query → Run.
--
--  Who can do what:
--    • guests (anon)  → read the list, book / chip in / cancel THEIR OWN booking
--    • admin          → everything else (gifts, settings, photos)
--  Guests never write to tables directly — bookings go through
--  book_item() / cancel_booking(), which check the rules server-side.
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── 1. Admins ────────────────────────────────────────────────────
-- Only users listed here count as admin. Creating an Auth user is
-- not enough on its own, so a stray sign-up can never edit the list.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
-- (no policies: invisible to the browser, managed from the dashboard)

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ── 2. Settings (single row) ─────────────────────────────────────
create table if not exists public.settings (
  id         int primary key default 1 check (id = 1),
  title      text not null default 'Список Бажань',
  subtitle   text not null default 'до дня народження',
  event_date timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;
alter table public.settings enable row level security;

-- ── 3. Gifts ─────────────────────────────────────────────────────
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  category    text not null,
  price       text not null default '',
  star        text not null default '' check (star in ('', 'top', 'want')),
  photo       text not null default '',
  description text not null default '',
  links       text[] not null default '{}',
  group_gift  boolean not null default false,
  group_slots int check (group_slots is null or group_slots between 2 and 50),
  created_at  timestamptz not null default now()
);
-- 💚 "most wanted": at most one per tier — enforced by the database itself
create unique index if not exists items_one_top_per_category
  on public.items (category) where star = 'top';
alter table public.items enable row level security;

-- ── 4. Bookings ──────────────────────────────────────────────────
-- nickname is NULL for surprise bookings, so the name never reaches
-- any browser. The real name + the cancel token live in
-- booking_secrets, which no browser can read.
create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  nickname   text,
  surprise   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists bookings_item_idx on public.bookings (item_id);
alter table public.bookings enable row level security;

create table if not exists public.booking_secrets (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  nickname   text not null,
  token      uuid not null default gen_random_uuid()
);
alter table public.booking_secrets enable row level security;
-- (no policies: only the functions below touch it)

-- ── 5. Policies ──────────────────────────────────────────────────
drop policy if exists "settings read"  on public.settings;
drop policy if exists "settings admin" on public.settings;
create policy "settings read"  on public.settings for select using (true);
create policy "settings admin" on public.settings for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "items read"  on public.items;
drop policy if exists "items admin" on public.items;
create policy "items read"  on public.items for select using (true);
create policy "items admin" on public.items for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "bookings read"         on public.bookings;
drop policy if exists "bookings admin delete" on public.bookings;
create policy "bookings read"         on public.bookings for select using (true);
create policy "bookings admin delete" on public.bookings for delete using (public.is_admin());

-- ── 6. Booking functions (the only way guests can write) ─────────
-- Locks the gift row, so two guests clicking at the same moment are
-- handled one after the other — the second gets a clear error.
create or replace function public.book_item(p_item_id uuid, p_nickname text, p_surprise boolean default false)
returns table (booking_id uuid, token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_item  public.items%rowtype;
  v_count int;
  v_nick  text := left(trim(coalesce(p_nickname, '')), 40);
  v_id    uuid;
  v_token uuid;
begin
  if v_nick = '' then raise exception 'NICKNAME_REQUIRED'; end if;

  select * into v_item from public.items where id = p_item_id for update;
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;

  select count(*) into v_count from public.bookings where item_id = p_item_id;
  if not v_item.group_gift and v_count > 0 then
    raise exception 'ALREADY_BOOKED';
  end if;
  if v_item.group_gift and v_item.group_slots is not null and v_count >= v_item.group_slots then
    raise exception 'GROUP_FULL';
  end if;

  insert into public.bookings (item_id, nickname, surprise)
  values (p_item_id, case when p_surprise then null else v_nick end, coalesce(p_surprise, false))
  returning id into v_id;

  insert into public.booking_secrets (booking_id, nickname)
  values (v_id, v_nick)
  returning booking_secrets.token into v_token;

  return query select v_id, v_token;
end $$;

-- Cancel your own booking: requires the token your browser got when booking.
create or replace function public.cancel_booking(p_booking_id uuid, p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.booking_secrets where booking_id = p_booking_id and token = p_token) then
    raise exception 'NOT_YOUR_BOOKING';
  end if;
  delete from public.bookings where id = p_booking_id;
  return true;
end $$;

revoke all on function public.book_item(uuid, text, boolean) from public;
revoke all on function public.cancel_booking(uuid, uuid)      from public;
grant execute on function public.book_item(uuid, text, boolean) to anon, authenticated;
grant execute on function public.cancel_booking(uuid, uuid)      to anon, authenticated;

-- ── 7. Photo storage ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('gift-photos', 'gift-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "gift photos read"         on storage.objects;
drop policy if exists "gift photos admin insert" on storage.objects;
drop policy if exists "gift photos admin update" on storage.objects;
drop policy if exists "gift photos admin delete" on storage.objects;
create policy "gift photos read"         on storage.objects for select using (bucket_id = 'gift-photos');
create policy "gift photos admin insert" on storage.objects for insert with check (bucket_id = 'gift-photos' and public.is_admin());
create policy "gift photos admin update" on storage.objects for update using (bucket_id = 'gift-photos' and public.is_admin());
create policy "gift photos admin delete" on storage.objects for delete using (bucket_id = 'gift-photos' and public.is_admin());

-- ── 8. Realtime (live updates for everyone) ──────────────────────
do $$
declare t text;
begin
  foreach t in array array['items', 'bookings', 'settings'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then
        execute format('create publication supabase_realtime for table public.%I', t);
    end;
  end loop;
end $$;

-- ── 9. VERIFY ────────────────────────────────────────────────────
-- Expect: 3 tables in realtime, 6 table policies, 4 storage policies, 1 bucket.
select '✓ realtime' as "check", tablename as name from pg_publication_tables
  where pubname = 'supabase_realtime' and tablename in ('items', 'bookings', 'settings')
union all
select '✓ policy', tablename || ': ' || policyname from pg_policies
  where schemaname = 'public' and tablename in ('settings', 'items', 'bookings')
union all
select '✓ storage policy', policyname from pg_policies
  where schemaname = 'storage' and policyname like 'gift photos%'
union all
select '✓ bucket', id from storage.buckets where id = 'gift-photos';

-- ════════════════════════════════════════════════════════════════
--  LAST STEP (once): make the owner an admin.
--  1) Authentication → Users → Add user → "Create new user"
--     (email + password, tick "Auto Confirm User").
--  2) Run this, with their email:
--
--  insert into public.admins (user_id)
--  select id from auth.users where email = 'owner@example.com'
--  on conflict do nothing;
-- ════════════════════════════════════════════════════════════════
