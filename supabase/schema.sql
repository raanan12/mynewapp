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
  -- Legal record of terms-of-service acceptance, gating card entry.
  terms_accepted_at timestamptz,
  terms_version text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- `create table if not exists` above does not retrofit new columns onto a
-- table that already existed - these ALTERs make re-running this file safe
-- on a database created before these columns existed.
alter table public.profiles add column if not exists receipt_email text;
alter table public.profiles add column if not exists receipt_id_number text;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists terms_version text;

-- -------------------------------------------------------------- categories --
-- Editable from the admin site - this is what "what you can donate to" and
-- the category chips on the giving screen are actually driven by.
create table if not exists public.categories (
  id text primary key,
  label text not null,
  description text not null default '',
  /** Ionicons glyph name. */
  icon text not null default 'heart-outline',
  -- Admin-uploaded image that replaces the Lucide icon entirely when set.
  icon_image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

alter table public.categories add column if not exists icon_image_url text;

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
  is_active boolean not null default true,
  -- Longer write-up for the transparency screen + optional link to the
  -- organization's own site. Light markdown subset ("## " sub-headers,
  -- "**text**" bold) is parsed client-side, not here.
  long_description text not null default '',
  website_url text
);

alter table public.charities add column if not exists long_description text not null default '';
alter table public.charities add column if not exists website_url text;

insert into public.charities (id, name, category_id, description, allocation, has_clause_46) values
  ('yad-yesomim', 'יד ליתומים', 'orphans', 'ליווי חודשי ליתומים עד גיל 18', 60, true),
  ('beit-almanot', 'בית האלמנות', 'orphans', 'סיוע כלכלי ורגשי לאלמנות', 40, true),
  ('ezer-marpe', 'עזר מרפא', 'medical', 'ציוד רפואי והסעות לטיפולים', 55, true),
  ('refuah-vechesed', 'רפואה וחסד', 'medical', 'תמיכה במשפחות של חולים קשים', 45, true),
  ('keren-amelei-torah', 'קרן עמלי תורה', 'torah', 'מלגות קיום לאברכים', 100, true),
  ('lechem-chukeinu', 'לחם חוקנו', 'families', 'סלי מזון שבועיים למשפחות', 70, true),
  ('chesed-bakehila', 'חסד בקהילה', 'families', 'תשלומי חשמל, מים וארנונה', 30, false)
on conflict (id) do nothing;

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

insert into public.quotes (id, text, source) values
  ('q1', 'וּצְדָקָה תַּצִּיל מִמָּוֶת', 'משלי י, ב'),
  ('q2', 'גָּדוֹל הַמַּעֲשֶׂה יוֹתֵר מִן הָעוֹשֶׂה', 'בבא בתרא ט'),
  ('q3', 'עוֹלָם חֶסֶד יִבָּנֶה', 'תהילים פט, ג'),
  ('q4', 'כָּל הַמְקַיֵּים נֶפֶשׁ אַחַת, כְּאִילּוּ קִיֵּים עוֹלָם מָלֵא', 'סנהדרין ד, ה'),
  ('q5', 'אֵין הַצְּדָקָה מִשְׁתַּלֶּמֶת אֶלָּא לְפִי חֶסֶד שֶׁבָּהּ', 'סוכה מט'),
  ('q6', 'צֶדֶק צֶדֶק תִּרְדֹּף', 'דברים טז, כ'),
  ('q7', 'מַתָּן בַּסֵּתֶר יִכְפֶּה אָף', 'משלי כא, יד')
on conflict (id) do nothing;

-- --------------------------------------------------------------- approvals --
create table if not exists public.approvals (
  id text primary key,
  rabbi_name text not null,
  title text not null default '',
  image_url text not null,
  year text not null default '',
  sort_order integer not null default 0,
  rabbi_photo_url text,
  video_url text
);

alter table public.approvals add column if not exists rabbi_photo_url text;
alter table public.approvals add column if not exists video_url text;

insert into public.approvals (id, rabbi_name, title, image_url, year, sort_order) values
  ('a1', 'הרב יצחק זילברשטיין שליט״א', 'מכתב ברכה והסכמה לפעילות הארגון',
   'https://placehold.co/900x1200/1A2B4C/D4AF37/png?text=%D7%94%D7%A1%D7%9B%D7%9E%D7%94', 'תשפ״ה', 1),
  ('a2', 'הרב שריאל רוזנברג שליט״א', 'אישור על ניהול כספי הצדקה כהלכה',
   'https://placehold.co/900x1200/1A2B4C/D4AF37/png?text=%D7%90%D7%99%D7%A9%D7%95%D7%A8', 'תשפ״ד', 2),
  ('a3', 'הרב משה שאול קליין שליט״א', 'הסכמה לגביית מעשר כספים דרך האפליקציה',
   'https://placehold.co/900x1200/1A2B4C/D4AF37/png?text=%D7%9E%D7%9B%D7%AA%D7%91', 'תשפ״ד', 3)
on conflict (id) do nothing;

-- -------------------------------------------------------------- app_texts --
-- Free-form UI copy (tab bar labels, association/tax-receipt details, ...)
-- editable from the admin site. Only keys the app code actually reads have
-- any effect - see `defaultTexts` in src/constants/content.ts for the set.
create table if not exists public.app_texts (
  id text primary key,
  value text not null default ''
);

insert into public.app_texts (id, value) values
  ('tab_giving', 'נתינה'),
  ('tab_wallet', 'כרטיס'),
  ('tab_history', 'היסטוריה'),
  ('tab_trust', 'שקיפות'),
  ('tab_settings', 'הגדרות'),
  ('association_name', 'עמותת החסד היומי'),
  ('association_number', '58-0000000'),
  ('association_clause46', 'אישור מס הכנסה לפי סעיף 46 לפקודה'),
  ('association_address', 'רחוב הרב קוק 1, ירושלים'),
  ('history_title', 'ההיסטוריה שלי'),
  ('history_total_label', 'סך הנתינה'),
  ('history_donations_label', 'תרומות'),
  ('history_streak_label', 'הרצף הארוך'),
  ('history_empty_title', 'עוד לא נתרם דבר'),
  ('history_empty_body', 'כל תרומה תופיע כאן יחד עם הקבלה שלה.'),
  ('terms_header_title', 'תקנון ותנאי שימוש'),
  ('terms_page_title', 'תקנון, תנאי שימוש ומדיניות פרטיות'),
  ('trust_title', 'לאן הכסף הולך'),
  ('wallet_title', 'כרטיס אשראי'),
  ('box_logo_url', ''),
  ('tab_icon_giving', ''),
  ('tab_icon_wallet', ''),
  ('tab_icon_history', ''),
  ('tab_icon_trust', ''),
  ('tab_icon_settings', ''),
  ('terms_version', '1.0')
on conflict (id) do nothing;

-- --------------------------------------------------------- terms_sections --
-- Terms-of-service body, editable from the admin site. `terms_version`
-- (in app_texts above) gates re-acceptance: bump it whenever a paragraph
-- here changes materially, so every user - including ones who already
-- accepted an older wording - is asked to accept again before their next
-- card entry (see add-card.tsx / src/services/terms.ts).
create table if not exists public.terms_sections (
  id text primary key,
  title text not null,
  body text not null default '',
  sort_order integer not null default 0
);

insert into public.terms_sections (id, title, body, sort_order) values
  ('t1', '1. כללי ואישור התקנון', $$1.1. שימוש באפליקציה, הרשמה אליה, הזנת פרטים אישיים ו/או ביצוע תרומה מותנים בהסכמה מלאה, מפורשת ובלתי חוזרת לכל תנאי תקנון זה.

1.2. אישור התקנון באמצעות סימון תיבת הסימון ו/או לחיצה על כפתור ההמשך/אישור מהווה חוזה משפטי מחייב בין המשתמש לבין מפעיל האפליקציה.

1.3. אם אינך מסכים לתנאי מתנאי תקנון זה, אינך מורשה לעשות כל שימוש באפליקציה או למסור בה פרטים כלשהם.$$, 1),
  ('t2', '2. עיבוד תשלומים, אשראי ושמירת אסימונים (Tokens)', $$2.1. פרטי כרטיס האשראי המלאים של המשתמש (מספר כרטיס, תוקף, קוד CVV) אינם נשמרים, אינם מעובדים ואינם מאוחסנים בשרתי האפליקציה או אצל מפעילה.

2.2. כל פעולות הסליקה, אבטחת נתוני התשלום המוצפנים ויצירת מפתח הזיהוי המוצפן ("Token") מבוצעות באופן ישיר ובלעדי על ידי ספק סליקה חיצוני מורשה בעל תקן אבטחה בינלאומי PCI-DSS (להלן: "ספק הסליקה").

2.3. המשתמש מסכים ומאשר באופן מפורש את שמירת ה-Token אצל ספק הסליקה לצורך ביצוע תרומות עתידיות או חוזרות בהתאם להוראותיו באפליקציה.$$, 2),
  ('t3', '3. אבטחת מידע והסרת אחריות גורפת מאירועי אבטחה/דליפות מידע', $$3.1. מפעיל האפליקציה יישם אמצעי אבטחת מידע סבירים ומקובלים. עם זאת, בסביבה טכנולוגית ומקוונת (אינטרנט, שרתי ענן, אפליקציות ניידות) לא ניתן להבטיח אבטחה מוחלטת או חסינות הרמטית מפני חדירות, פריצות, כשלים טכניים או מתקפות סייבר.

3.2. הסרת אחריות מוחלטת מכל דליפת מידע: מפעיל האפליקציה, מנהליו, עובדיו, שותפיו או מי מטעמו לא יישאו בכל אחריות, ישירה, עקיפה, תוצאתית או מיוחדת, לכל נזק, הפסד, עוגמת נפש, פגיעה בפרטיות, הוצאה או כפל חיוב שיגרמו למשתמש או למי מטעמו כתוצאה מ: א. דליפה, זליגה, חשיפה, או גישה בלתי מורשית לכל פרטי המשתמש שמורים במערכת (לרבות אך לא רק: שם מלא, כתובת דוא"ל, מספר טלפון, תעודת זהות, כתובת מגורים, היסטוריית תרומות, כתובות IP ונתוני שימוש). ב. דליפה, פריצה או שימוש לרעה בנתוני אשראי או ב-Token שאירעו אצל ספק הסליקה החיצוני או בתווך התקשורת אליו. ג. מתקפות סייבר, נוזקות, סוסים טרויאניים, פריצות לשרתים/בסיסי נתונים, תקשורת לקויה או כוח עליון.

3.3. המשתמש מצהיר ומאשר כי הזנת כל פיסת מידע אישי באפליקציה, כמו גם ביצוע התשלום ושמירת ה-Token, נעשים על אחריותו הבלעדית והמלאה. המשתמש מוותר באופן סופי ובלתי חוזר על כל טענה, דרישה או תביעה כנגד מפעיל האפליקציה בגין אירועי אבטחת מידע כאמור.$$, 3),
  ('t4', '4. ברירת דין ופנייה לגורמים המוסמכים', $$4.1. בכל מקרה של טענה או דרישה הנוגעת למעילת אשראי, חיוב כפול, כשל בסליקה או שימוש לרעה ב-Token, תהיה פניית המשתמש מופנית בראש ובראשונה לחברת הסליקה החיצונית ו/או לחברת האשראי המנפיקה, בהתאם להוראות חוק שירותי תשלום, תשע"ט-2019.

4.2. על תקנון זה יחולו אך ורק דיני מדינת ישראל, וסמכות השיפוט הבלעדית בכל עניין הנובע ממנו תהיה מסורה לבתי המשפט המוסמכים במחוז הראשי של מפעיל האפליקציה.$$, 4)
on conflict (id) do nothing;

-- ------------------------------------------------------------ home_message --
-- The optional "atmosphere sentence" shown on the giving screen, editable
-- from the admin site - text alone, or text + an uploaded image.
create table if not exists public.home_message (
  id text primary key default 'default',
  text text not null default '',
  image_url text
);

insert into public.home_message (id) values ('default')
on conflict (id) do nothing;

-- ---------------------------------------------------------- reminder_slots --
-- Admin-defined preset reminder/auto-pilot times. A user can also add their
-- own free-hour slots, kept only on their device (see Settings.customReminders
-- in src/types/index.ts) - those never appear in this table.
create table if not exists public.reminder_slots (
  id text primary key,
  label text not null,
  hour integer not null default 8 check (hour between 0 and 23),
  minute integer not null default 0 check (minute between 0 and 59),
  sort_order integer not null default 0
);

insert into public.reminder_slots (id, label, hour, minute, sort_order) values
  ('morning', 'בוקר (אחרי שחרית)', 8, 0, 1),
  ('afternoon', 'צהריים (מנחה)', 13, 30, 2),
  ('evening', 'ערב (לפני מעריב)', 19, 0, 3),
  ('preShabbat', 'ערב שבת', 14, 0, 4)
on conflict (id) do nothing;

-- -------------------------------------------------------------- app_popup --
-- Opening popup shown once per day on the giving screen when enabled.
create table if not exists public.app_popup (
  id text primary key default 'default',
  enabled boolean not null default false,
  image_url text,
  link_url text
);

insert into public.app_popup (id) values ('default')
on conflict (id) do nothing;

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
alter table public.app_texts enable row level security;
alter table public.terms_sections enable row level security;
alter table public.home_message enable row level security;
alter table public.reminder_slots enable row level security;
alter table public.app_popup enable row level security;

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

drop policy if exists "public read app texts" on public.app_texts;
create policy "public read app texts" on public.app_texts
  for select using (true);
drop policy if exists "admin writes app texts" on public.app_texts;
create policy "admin writes app texts" on public.app_texts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read terms sections" on public.terms_sections;
create policy "public read terms sections" on public.terms_sections
  for select using (true);
drop policy if exists "admin writes terms sections" on public.terms_sections;
create policy "admin writes terms sections" on public.terms_sections
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read home message" on public.home_message;
create policy "public read home message" on public.home_message
  for select using (true);
drop policy if exists "admin writes home message" on public.home_message;
create policy "admin writes home message" on public.home_message
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read reminder slots" on public.reminder_slots;
create policy "public read reminder slots" on public.reminder_slots
  for select using (true);
drop policy if exists "admin writes reminder slots" on public.reminder_slots;
create policy "admin writes reminder slots" on public.reminder_slots
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read app popup" on public.app_popup;
create policy "public read app popup" on public.app_popup
  for select using (true);
drop policy if exists "admin writes app popup" on public.app_popup;
create policy "admin writes app popup" on public.app_popup
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

-- Real per-day guard for auto-pilot, checked by the `kesher-charge` Edge
-- Function BEFORE it charges the card - the client-side lock in
-- useAutoPilot.ts only protects against overlapping calls within one app
-- session, not a second app launch (or device) racing the first.
create or replace function public.has_auto_donation_today(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.donations
    where user_id = p_user_id
      and source = 'auto'
      and status = 'completed'
      and (created_at at time zone 'Asia/Jerusalem')::date = (now() at time zone 'Asia/Jerusalem')::date
  );
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

-- ------------------------------------------------------------- storage ---
-- Single public bucket for admin-uploaded assets (approval letters/photos,
-- charity images, future logo/popup art, ...). Public read so the app can
-- show them without auth; writes are admin-only.
insert into storage.buckets (id, name, public)
values ('app-assets', 'app-assets', true)
on conflict (id) do nothing;

drop policy if exists "public read app-assets" on storage.objects;
create policy "public read app-assets" on storage.objects
  for select using (bucket_id = 'app-assets');

drop policy if exists "admin writes app-assets" on storage.objects;
create policy "admin writes app-assets" on storage.objects
  for all using (bucket_id = 'app-assets' and public.is_admin())
  with check (bucket_id = 'app-assets' and public.is_admin());

-- ------------------------------------------------------- push notifications --
-- No Edge Function needed: `pg_net` calls Expo's push API directly from a
-- Postgres function, and `pg_cron` runs it every minute. If either
-- extension is unavailable on your plan, enable it first under
-- Database > Extensions in the Supabase dashboard.
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- One row per signed-in device. Upserted by the app on launch (see
-- src/services/push.ts) - `token` is an Expo push token, not an APNs/FCM
-- token, so nothing platform-specific is exposed here.
create table if not exists public.push_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now()
);

-- Composed from the admin site. `dispatch_due_push` (below) picks up any row
-- where `sent_at` is still null once `scheduled_at` has passed - leaving
-- `scheduled_at` at its default sends it on the next minute's tick, which is
-- what a "one-time, send now" push is under the hood.
create table if not exists public.push_notifications (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  link_url text,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
alter table public.push_notifications enable row level security;

drop policy if exists "own push token" on public.push_tokens;
create policy "own push token" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "admin manages push notifications" on public.push_notifications;
create policy "admin manages push notifications" on public.push_notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- SECURITY DEFINER so it can read every row in `push_tokens` despite each
-- user's RLS policy only allowing them to see their own - the same
-- justification as `is_admin()` above, just for a cron job instead of a
-- policy. Sends everyone the same message in one batched request; Expo's
-- API accepts up to 100 messages per call, which comfortably covers this
-- app's current audience. If that stops being true, chunk `messages` into
-- groups of 100 before the http_post below.
create or replace function public.dispatch_due_push()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification record;
  v_messages jsonb;
begin
  for v_notification in
    select * from public.push_notifications
    where sent_at is null and scheduled_at <= now()
  loop
    select coalesce(jsonb_agg(jsonb_build_object(
      'to', t.token,
      'title', v_notification.title,
      'body', v_notification.body,
      'data', jsonb_build_object('url', v_notification.link_url)
    )), '[]'::jsonb)
    into v_messages
    from public.push_tokens t;

    if jsonb_array_length(v_messages) > 0 then
      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := v_messages
      );
    end if;

    update public.push_notifications
    set sent_at = now()
    where id = v_notification.id;
  end loop;
end;
$$;

-- `cron.schedule` upserts by job name (no direct access to the `cron.job`
-- table is needed, or granted, in the SQL editor) - calling this again on a
-- re-run updates the existing job in place rather than duplicating it.
select cron.schedule('dispatch-push-notifications', '* * * * *', 'select public.dispatch_due_push();');
