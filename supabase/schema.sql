-- "החסד היומי" - Supabase schema.
-- Run with: supabase db push  (or paste into the SQL editor).

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  -- Mirrors what was last pushed to Kesher's customer record (UpdateCustomer)
  -- so receipts for future charges on this customerRef are emailed automatically.
  receipt_email text,
  receipt_id_number text,
  wallet_balance numeric(10, 2) not null default 0 check (wallet_balance >= 0),
  -- Kesher tokenization: only the token + display digits are ever stored.
  kesher_token text,
  kesher_card_last4 text,
  kesher_card_brand text,
  kesher_card_expiry text,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  last_donation_date date,
  auto_pilot_enabled boolean not null default false,
  auto_pilot_amount numeric(10, 2) not null default 5,
  auto_reload_enabled boolean not null default false,
  auto_reload_threshold numeric(10, 2) not null default 10,
  auto_reload_amount numeric(10, 2) not null default 50,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- `create table if not exists` above does not retrofit new columns onto a
-- table that already existed - these two ALTERs make re-running this file
-- safe on a database created before receipt_email/receipt_id_number existed.
alter table public.profiles add column if not exists receipt_email text;
alter table public.profiles add column if not exists receipt_id_number text;

-- -------------------------------------------------------------- categories --
-- Editable from the admin site - this is what "what you can donate to" and
-- the category chips on the giving screen are actually driven by.
create table if not exists public.categories (
  id text primary key,
  label text not null,
  description text not null default '',
  /** Ionicons glyph name. */
  icon text not null default 'heart-outline',
  sort_order integer not null default 0,
  is_active boolean not null default true
);

insert into public.categories (id, label, description, icon, sort_order) values
  ('orphans', 'יתומים', 'תמיכה ביתומים ואלמנות', 'heart-outline', 1),
  ('medical', 'רפואה', 'סיוע לחולים ולמשפחותיהם', 'medkit-outline', 2),
  ('torah', 'עמלי תורה', 'החזקת לומדי תורה', 'book-outline', 3),
  ('families', 'משפחות נזקקות', 'מזון וצרכי בית בסיסיים', 'home-outline', 4)
on conflict (id) do nothing;

-- --------------------------------------------------------------- charities --
create table if not exists public.charities (
  id text primary key,
  name text not null,
  category_id text not null check (category_id in ('orphans', 'medical', 'torah', 'families')),
  description text not null default '',
  allocation integer not null default 100 check (allocation between 0 and 100),
  has_clause_46 boolean not null default false,
  is_active boolean not null default true
);

-- --------------------------------------------------------------- donations --
create table if not exists public.donations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  category_id text not null check (category_id in ('orphans', 'medical', 'torah', 'families')),
  charity_id text references public.charities (id),
  dedication text,
  status text not null default 'completed' check (status in ('completed', 'pending', 'failed')),
  source text not null default 'manual' check (source in ('manual', 'auto')),
  receipt_url text,
  -- Client-generated id, so retrying an offline donation cannot double-charge.
  client_id text,
  created_at timestamptz not null default now()
);

create index if not exists donations_user_created_idx
  on public.donations (user_id, created_at desc);
create index if not exists donations_created_idx on public.donations (created_at desc);
create unique index if not exists donations_client_id_idx
  on public.donations (user_id, client_id) where client_id is not null;

-- `charities`/`donations` shipped with a fixed CHECK list before categories
-- were admin-editable; swap it for a real foreign key so new categories
-- actually work. Wrapped in DO blocks so re-running this file is a no-op
-- once the swap has happened once.
alter table public.charities drop constraint if exists charities_category_id_check;
alter table public.donations drop constraint if exists donations_category_id_check;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'charities_category_id_fkey') then
    alter table public.charities add constraint charities_category_id_fkey
      foreign key (category_id) references public.categories (id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'donations_category_id_fkey') then
    alter table public.donations add constraint donations_category_id_fkey
      foreign key (category_id) references public.categories (id);
  end if;
end $$;

-- ------------------------------------------------------------ giving_settings --
-- Editable from the admin site - drives the coin buttons on the giving screen.
create table if not exists public.giving_settings (
  id text primary key default 'default',
  coin_amounts jsonb not null default '[1, 5, 10]'::jsonb
);

insert into public.giving_settings (id) values ('default')
on conflict (id) do nothing;

-- ----------------------------------------------------- wallet_transactions --
create table if not exists public.wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('topUp', 'donation', 'refund')),
  amount numeric(10, 2) not null,
  description text not null default '',
  kesher_transaction_id text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_tx_user_created_idx
  on public.wallet_transactions (user_id, created_at desc);

-- ------------------------------------------------------------------ quotes --
create table if not exists public.quotes (
  id text primary key,
  text text not null,
  source text not null default '',
  is_active boolean not null default true
);

-- --------------------------------------------------------------- approvals --
create table if not exists public.approvals (
  id text primary key,
  rabbi_name text not null,
  title text not null default '',
  image_url text not null,
  year text not null default '',
  sort_order integer not null default 0
);

-- ---------------------------------------------------------- kesher_settings --
-- Non-secret Kesher (קשר סליקה) routing ids. The API username/password stay
-- as Edge Function secrets and never appear in this table.
create table if not exists public.kesher_settings (
  id text primary key default 'default',
  tokenization_page_id text,
  project_number text
);

insert into public.kesher_settings (id) values ('default')
on conflict (id) do nothing;

-- ------------------------------------------------------- helper predicates --
-- SECURITY DEFINER avoids the infinite recursion you get when an RLS policy on
-- `profiles` needs to read `profiles` to decide who is an admin.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- ------------------------------------------------------------------- RLS ---
alter table public.profiles enable row level security;
alter table public.donations enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.charities enable row level security;
alter table public.quotes enable row level security;
alter table public.approvals enable row level security;
alter table public.kesher_settings enable row level security;
alter table public.categories enable row level security;
alter table public.giving_settings enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "admin reads profiles" on public.profiles;
create policy "admin reads profiles" on public.profiles
  for select using (public.is_admin());

drop policy if exists "own donations" on public.donations;
create policy "own donations" on public.donations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "admin reads donations" on public.donations;
create policy "admin reads donations" on public.donations
  for select using (public.is_admin());

drop policy if exists "own wallet transactions" on public.wallet_transactions;
create policy "own wallet transactions" on public.wallet_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "admin reads wallet transactions" on public.wallet_transactions;
create policy "admin reads wallet transactions" on public.wallet_transactions
  for select using (public.is_admin());

-- Public content is readable by everyone; only admins may edit it.
drop policy if exists "public read charities" on public.charities;
create policy "public read charities" on public.charities for select using (is_active or public.is_admin());
drop policy if exists "admin writes charities" on public.charities;
create policy "admin writes charities" on public.charities
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read quotes" on public.quotes;
create policy "public read quotes" on public.quotes for select using (is_active or public.is_admin());
drop policy if exists "admin writes quotes" on public.quotes;
create policy "admin writes quotes" on public.quotes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read approvals" on public.approvals;
create policy "public read approvals" on public.approvals for select using (true);
drop policy if exists "admin writes approvals" on public.approvals;
create policy "admin writes approvals" on public.approvals
  for all using (public.is_admin()) with check (public.is_admin());

-- Neither column is secret on its own (the API username/password that would
-- make them dangerous live only as Edge Function secrets), so any signed-in
-- app instance may read them to build the hosted card-entry URL.
drop policy if exists "public read kesher settings" on public.kesher_settings;
create policy "public read kesher settings" on public.kesher_settings
  for select using (true);
drop policy if exists "admin writes kesher settings" on public.kesher_settings;
create policy "admin writes kesher settings" on public.kesher_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (is_active or public.is_admin());
drop policy if exists "admin writes categories" on public.categories;
create policy "admin writes categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read giving settings" on public.giving_settings;
create policy "public read giving settings" on public.giving_settings
  for select using (true);
drop policy if exists "admin writes giving settings" on public.giving_settings;
create policy "admin writes giving settings" on public.giving_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------- profile bootstrapping --
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------- money RPCs --
-- The client never writes wallet_balance directly; both mutations are atomic.

create or replace function public.apply_donation(
  p_amount numeric,
  p_category text,
  p_dedication text default null,
  p_source text default 'manual',
  p_client_id text default null
) returns public.donations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_donation public.donations;
  v_next integer;
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Replaying an offline donation must be a no-op, not a second charge.
  if p_client_id is not null then
    select * into v_donation from public.donations
    where user_id = auth.uid() and client_id = p_client_id;
    if found then
      return v_donation;
    end if;
  end if;

  select * into v_profile from public.profiles where id = auth.uid() for update;

  if not found then
    raise exception 'profile not found';
  end if;

  if v_profile.wallet_balance < p_amount then
    raise exception 'insufficient funds';
  end if;

  v_next := case
    when v_profile.last_donation_date = v_today then v_profile.streak_current
    when v_profile.last_donation_date = v_today - 1 then v_profile.streak_current + 1
    else 1
  end;

  insert into public.donations (user_id, amount, category_id, dedication, source, client_id)
  values (auth.uid(), p_amount, p_category, p_dedication, p_source, p_client_id)
  returning * into v_donation;

  insert into public.wallet_transactions (user_id, kind, amount, description)
  values (auth.uid(), 'donation', -p_amount,
          case when p_source = 'auto' then 'תרומה אוטומטית' else 'תרומה יומית' end);

  update public.profiles
  set wallet_balance = wallet_balance - p_amount,
      streak_current = v_next,
      streak_longest = greatest(streak_longest, v_next),
      last_donation_date = v_today,
      last_seen_at = now()
  where id = auth.uid();

  return v_donation;
end;
$$;

-- Called by the charge Edge Function after Kesher confirms the money moved.
create or replace function public.credit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_kesher_transaction_id text default null
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  -- Only the service role may mint balance; a user cannot credit themselves.
  if auth.role() <> 'service_role' then
    raise exception 'forbidden';
  end if;

  if p_kesher_transaction_id is not null and exists (
    select 1 from public.wallet_transactions
    where kesher_transaction_id = p_kesher_transaction_id
  ) then
    select wallet_balance into v_balance from public.profiles where id = p_user_id;
    return v_balance;
  end if;

  insert into public.wallet_transactions (user_id, kind, amount, description, kesher_transaction_id)
  values (p_user_id, 'topUp', p_amount, p_description, p_kesher_transaction_id);

  update public.profiles
  set wallet_balance = wallet_balance + p_amount
  where id = p_user_id
  returning wallet_balance into v_balance;

  return v_balance;
end;
$$;

-- Records a donation charged directly to the saved card, bypassing the
-- prepaid wallet entirely - used when the wallet balance is insufficient and
-- the user has a card on file. Only Kesher's charge Edge Function (service
-- role) may call this, and only after the charge itself already succeeded.
create or replace function public.apply_direct_donation(
  p_user_id uuid,
  p_amount numeric,
  p_category text,
  p_dedication text default null,
  p_kesher_transaction_id text default null,
  p_source text default 'manual'
) returns public.donations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donation public.donations;
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
  v_next integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden';
  end if;

  if p_kesher_transaction_id is not null and exists (
    select 1 from public.donations
    where user_id = p_user_id and client_id = p_kesher_transaction_id
  ) then
    select * into v_donation from public.donations
    where user_id = p_user_id and client_id = p_kesher_transaction_id;
    return v_donation;
  end if;

  select case
    when last_donation_date = v_today then streak_current
    when last_donation_date = v_today - 1 then streak_current + 1
    else 1
  end into v_next
  from public.profiles where id = p_user_id;

  if v_next is null then
    raise exception 'profile not found';
  end if;

  insert into public.donations (user_id, amount, category_id, dedication, status, source, client_id)
  values (p_user_id, p_amount, p_category, p_dedication, 'completed', p_source, p_kesher_transaction_id)
  returning * into v_donation;

  update public.profiles
  set streak_current = v_next,
      streak_longest = greatest(streak_longest, v_next),
      last_donation_date = v_today,
      last_seen_at = now()
  where id = p_user_id;

  return v_donation;
end;
$$;

-- ----------------------------------------------------------- admin metrics --
create or replace function public.admin_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Jerusalem')::date;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return json_build_object(
    'totalUsers', (select count(*) from public.profiles),
    'newUsers7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'totalRaised', (select coalesce(sum(amount), 0) from public.donations where status = 'completed'),
    'raisedToday', (select coalesce(sum(amount), 0) from public.donations
                    where status = 'completed'
                      and (created_at at time zone 'Asia/Jerusalem')::date = v_today),
    'donationCount', (select count(*) from public.donations where status = 'completed'),
    'averageDonation', (select coalesce(avg(amount), 0) from public.donations where status = 'completed'),
    'activeDonorsToday', (select count(distinct user_id) from public.donations
                          where (created_at at time zone 'Asia/Jerusalem')::date = v_today),
    'activeDonors7d', (select count(distinct user_id) from public.donations
                       where created_at > now() - interval '7 days'),
    'walletFloat', (select coalesce(sum(wallet_balance), 0) from public.profiles),
    'savedCards', (select count(*) from public.profiles where kesher_token is not null),
    'autoPilotUsers', (select count(*) from public.profiles where auto_pilot_enabled),
    'byCategory', (select coalesce(json_agg(row_to_json(c)), '[]'::json) from (
      select d.category_id, coalesce(cat.label, d.category_id) as category_label,
             sum(d.amount) as total, count(*) as count
      from public.donations d
      left join public.categories cat on cat.id = d.category_id
      where d.status = 'completed'
      group by d.category_id, cat.label order by total desc
    ) c),
    'daily', (select coalesce(json_agg(row_to_json(d)), '[]'::json) from (
      select (created_at at time zone 'Asia/Jerusalem')::date as day,
             sum(amount) as total,
             count(*) as count,
             count(distinct user_id) as donors
      from public.donations
      where status = 'completed' and created_at > now() - interval '30 days'
      group by day order by day
    ) d)
  );
end;
$$;

revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.apply_donation(numeric, text, text, text, text) to authenticated;
