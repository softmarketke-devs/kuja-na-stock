-- =====================================================================================================================
-- BIG Premium Cuts: the complete database, in ONE script.
--
-- HOW TO USE
--   Supabase -> SQL Editor -> paste this whole file -> Run. That is all. Run it on a brand-new project, or on the
--   project you already have (it moves a half-migrated database to the final shape). It is safe to run again.
--   Afterwards run supabase/make_admin.sql once, to make your own account the shop owner.
--
-- IF IT STOPS WITH A MESSAGE STARTING "Run this one line first"
--   Your database is an old one that has no 'customer' account type yet. Postgres will not let a new type value be added
--   and used in the same run, so: paste and run ONLY the one line the message shows, then run this whole file again.
--   (Most databases never see this: a new project, or one that already has customers, goes straight through.)
--
-- WHAT IT DOES
--   1. Sets up accounts: customers and the shop owner (admin). Nobody can make themselves admin.
--   2. Clears out the old butchery / supplier / carrier (B2B) parts: tables, functions, ALL the seeded demo accounts
--      (demo-...@bigcuts.test) and unused profile columns.   !! This DELETES that old data for good. Back up first (Supabase -> Database -> Backups).
--   3. Creates the shop: cuts with price and kilos in stock, one standard delivery fee, customer orders with automatic
--      pricing, stock taken at order time, and M-Pesa payment recording.
--
-- It replaces the old supabase/migrations/* files (kept in supabase/archive/ for history only; do not run them).
-- =====================================================================================================================

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. Account types
-- ---------------------------------------------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typname = 'user_role') then
    create type public.user_role as enum ('customer', 'admin');
  elsif not exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'user_role' and e.enumlabel = 'customer') then
    -- Postgres cannot add a type value and use it in the same run, so stop here with the exact fix.
    raise exception 'Run this one line first, on its own, then run this whole file again:   alter type public.user_role add value ''customer'';';
  end if;
  -- (An older database also has retailer / supplier / rider in this type. They stay, since Postgres cannot remove type
  --  values, but nothing uses them and every such account is turned into a customer below.)
end $$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. Profiles: one row per sign-in, with the shop role and contact details
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text not null default '',
  phone text,                          -- +2547XXXXXXXX
  address text,                        -- the customer's usual delivery address
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists address text;
alter table public.profiles alter column role set default 'customer';

-- Small helpers used by the rules below. They run as the owner so a rule can look at profiles without looping.
create or replace function public.normalize_ke_phone(p text)
returns text language sql immutable
as $$
  select case
    when p is null or btrim(p) = '' then null
    when regexp_replace(p, '\D', '', 'g') ~ '^0[17]\d{8}$'
      then '+254' || substr(regexp_replace(p, '\D', '', 'g'), 2)
    when regexp_replace(p, '\D', '', 'g') ~ '^254[17]\d{8}$'
      then '+' || regexp_replace(p, '\D', '', 'g')
    else btrim(p)
  end
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public
as $$ select coalesce((select role = 'admin' from profiles where id = auth.uid()), false) $$;

create or replace function public.my_role()
returns public.user_role language sql stable security definer
set search_path = public
as $$ select role from profiles where id = auth.uid() $$;

create or replace function public.require_role(p_role public.user_role)
returns uuid language plpgsql stable security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Please sign in again' using errcode = '28000';
  end if;
  if not exists (select 1 from profiles where id = v_uid and role = p_role) then
    raise exception 'Only % accounts can do this', p_role using errcode = '42501';
  end if;
  return v_uid;
end
$$;

-- People may edit their own name, phone and address, but never their role.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_admin() and new.role is distinct from old.role then
    raise exception 'You cannot change your account type';
  end if;
  new.phone := normalize_ke_phone(new.phone);
  new.updated_at := now();
  return new;
end
$$;
drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Every new sign-up becomes a CUSTOMER, whatever the sign-up form asked for (email or Google). The shop owner is
-- promoted to admin by hand (supabase/make_admin.sql).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}');
begin
  insert into profiles (id, role, full_name, phone)
  values (
    new.id,
    'customer',
    coalesce(nullif(btrim(coalesce(v_meta->>'full_name', v_meta->>'name')), ''), ''),
    normalize_ke_phone(v_meta->>'phone')
  )
  on conflict (id) do nothing;
  return new;
end
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. Clear out the old butchery / supplier / carrier (B2B) parts      (nothing happens here on a brand-new project)
-- ---------------------------------------------------------------------------------------------------------------------
-- The seeded demo accounts (demo-supplier, demo-butchery, demo-carrier, demo-admin @bigcuts.test) and everything they
-- own. Real accounts never use that address, so nothing real is touched.
delete from auth.users where email like 'demo-%@bigcuts.test';

-- Every remaining old-role account becomes a customer, so nobody is locked out.
alter table public.profiles drop constraint if exists supplier_type_only_for_suppliers;
do $$
begin
  if exists (select 1 from public.profiles where role::text in ('retailer', 'supplier', 'rider')) then
    execute 'update public.profiles set role = ''customer'' where role::text in (''retailer'', ''supplier'', ''rider'')';
  end if;
end $$;

-- Who can read profiles: you see your own, admins see all. (The old rule exposed supplier profiles.)
alter table public.profiles enable row level security;
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- The old tables ...
drop table if exists public.delivery_issues cascade;
drop table if exists public.run_offers cascade;
drop table if exists public.run_locations cascade;
drop table if exists public.rider_availability cascade;
drop table if exists public.payments cascade;
drop table if exists public.order_secrets cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.delivery_runs cascade;
drop table if exists public.retailer_inventory cascade;
drop table if exists public.supplier_listings cascade;
drop table if exists public.products cascade;

-- ... the functions that served them (dropped by name, whatever their arguments) ...
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = any (array[
         'accept_run', 'admin_set_carrier_verified', 'assign_run', 'can_see_order', 'cancel_order', 'carrier_block_reason',
         'check_low_stock', 'clear_run_location', 'complete_run_if_done', 'confirm_delivery', 'delivery_fee_for',
         'evening_sweep', 'fail_delivery', 'is_run_rider', 'mark_run_picked_up', 'morning_sweep', 'next_delivery_date',
         'offer_run', 'open_runs_for_me', 'place_order', 'quote_suppliers', 'release_run', 'reorder_last_delivery',
         'report_issue', 'report_run_location', 'resolve_issue', 'road_km', 'run_load_kg', 'set_rider_availability',
         'shares_order_with', 'supplier_assign_rider', 'supplier_respond'
       ])
  loop
    execute 'drop function if exists ' || r.sig || ' cascade';
  end loop;
end $$;

-- ... their types, and the profile columns only they used (business, permit, vehicle and map fields).
drop type if exists public.order_status;
drop type if exists public.payment_method;
drop type if exists public.run_status;
drop type if exists public.issue_type;
alter table public.profiles drop column if exists location;
alter table public.profiles drop column if exists lat;
alter table public.profiles drop column if exists lng;
alter table public.profiles drop column if exists service_radius_km;
alter table public.profiles drop column if exists business_name;
alter table public.profiles drop column if exists supplier_type;
alter table public.profiles drop column if exists meat_permit_no;
alter table public.profiles drop column if exists meat_permit_expiry;
alter table public.profiles drop column if exists vehicle_reg;
alter table public.profiles drop column if exists load_capacity_kg;
alter table public.profiles drop column if exists is_verified;
drop type if exists public.supplier_type;

-- ---------------------------------------------------------------------------------------------------------------------
-- 4. Notifications and text messages
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb not null default '{}',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- Filled by notify(); sent by the website's server (src/lib/sms.ts).
create table if not exists public.sms_outbox (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  to_phone text not null,
  message text not null,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz
);
create index if not exists sms_outbox_status_idx on public.sms_outbox (status, id);
delete from public.sms_outbox where to_phone like '+25471300000%';     -- texts queued for the demo accounts' made-up numbers

alter table public.notifications enable row level security;
alter table public.sms_outbox enable row level security;              -- no policies: the server only
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;      -- only the "read" flag is editable

-- An in-app notification, optionally also queued as an SMS ("BIG: ...").
create or replace function public.notify(
  p_user uuid, p_type text, p_title text, p_message text,
  p_data jsonb default '{}', p_sms boolean default false
) returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  insert into notifications (user_id, type, title, message, data)
  values (p_user, p_type, p_title, p_message, coalesce(p_data, '{}'));

  if p_sms then
    select phone into v_phone from profiles where id = p_user;
    if v_phone is not null and v_phone <> '' then
      insert into sms_outbox (user_id, to_phone, message)
      values (p_user, v_phone, 'BIG: ' || p_title || '. ' || p_message);
    end if;
  end if;
end
$$;

-- Hands the server a batch of texts to send (also retries failures and anything stuck for 10 minutes).
create or replace function public.claim_sms_batch(p_limit int default 50)
returns setof public.sms_outbox language sql security definer
set search_path = public
as $$
  update sms_outbox
  set status = 'sending', attempts = attempts + 1, claimed_at = now()
  where id in (
    select id from sms_outbox
    where (status = 'queued')
       or (status = 'failed' and attempts < 3)
       or (status = 'sending' and claimed_at < now() - interval '10 minutes')
    order by id
    limit p_limit
    for update skip locked
  )
  returning *
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 5. The shop: your cuts, their prices and kilos in stock, and one standard delivery fee
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 60),
  blurb text,
  image text,                                                  -- path under /public, e.g. /cuts/tomahawk.jpg
  price_per_kg numeric(10,2) check (price_per_kg > 0),         -- empty = "price confirmed when you order"
  stock_kg numeric(10,1) not null default 0 check (stock_kg >= 0),
  is_active boolean not null default false,                    -- off = hidden from the website
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shop_items enable row level security;
drop policy if exists "shop_items_select" on public.shop_items;
-- Everyone (signed in or not) sees the cuts that are switched on; admins see all of them.
create policy "shop_items_select" on public.shop_items for select to anon, authenticated using (is_active or is_admin());

create table if not exists public.shop_settings (
  id int primary key default 1 check (id = 1),                 -- always one row
  delivery_fee_kes numeric(10,2) check (delivery_fee_kes >= 0),
  updated_at timestamptz not null default now()
);
insert into public.shop_settings (id) values (1) on conflict (id) do nothing;
alter table public.shop_settings enable row level security;
drop policy if exists "shop_settings_select" on public.shop_settings;
create policy "shop_settings_select" on public.shop_settings for select to anon, authenticated using (true);

-- The cuts the website has always shown, switched ON so the homepage looks as before. Each starts with 20 kg as a
-- PLACEHOLDER: set the real kilos on the admin Stock page before you sell. Prices are only the ones the client has
-- confirmed; the rest read "Price on confirmation". Cuts that already exist are left exactly as you set them.
insert into public.shop_items (name, blurb, image, price_per_kg, sort_order, is_active, stock_kg) values
  ('Tomahawk', 'Bone-in ribeye, the showpiece.', '/cuts/tomahawk.jpg', null, 10, true, 20),
  ('Sirloin on Bone', 'Dry-aged, bone-in.', '/cuts/sirloin-on-bone.jpg', 1420, 20, true, 20),
  ('Oxtail', 'Our best seller.', '/cuts/oxtail.jpg', null, 30, true, 20),
  ('Mutura', 'Grilled Kenyan sausage, sold as a 1 kg pack.', '/cuts/mutura.png', 1350, 40, true, 20),
  ('The Steak Bundle', 'Tomahawk, T-bone and cowboy rib.', '/cuts/the-steak-bundle.jpg', null, 50, true, 20),
  ('Cowboy Rib', null, null, null, 60, true, 20), ('T-bone', null, null, null, 61, true, 20), ('Ribeye', null, null, null, 62, true, 20),
  ('Fillet', null, null, null, 63, true, 20), ('Short Ribs', null, null, null, 64, true, 20), ('Brisket', null, null, null, 65, true, 20),
  ('Shank', null, null, null, 66, true, 20), ('Osso Buco', null, null, null, 67, true, 20), ('Stew Cuts', null, null, null, 68, true, 20),
  ('Chunk', null, null, null, 69, true, 20), ('Minced Meat', null, null, null, 70, true, 20), ('Liver', null, null, null, 71, true, 20),
  ('Kidney', null, null, null, 72, true, 20), ('Heart', null, null, null, 73, true, 20), ('Pork Rib-eye Chops', null, null, null, 74, true, 20),
  ('Whole Rabbit', null, null, 1550, 75, true, 20)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------------------------------------------------
-- 6. Customer orders
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.customer_orders (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  items jsonb not null,                       -- [{ "name": "Ribeye", "kg": 2 }]
  delivery_address text not null,
  phone text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'quoted', 'paid', 'delivered', 'cancelled')),
                                              -- pending = waiting for a price, quoted = price ready to pay
  payment_method text not null default 'mpesa' check (payment_method in ('mpesa', 'cash_on_delivery')),
  mpesa_checkout_id text,                     -- Safaricom's id for the payment prompt we sent
  mpesa_receipt text,                         -- M-Pesa transaction code once paid
  paid_at timestamptz,
  estimated_total_kes numeric(10,2),          -- from the shop prices when every cut has one
  items_total_kes numeric(10,2) check (items_total_kes >= 0),
  delivery_fee_kes numeric(10,2) check (delivery_fee_kes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- (an older copy of this table may lack some of these)
alter table public.customer_orders add column if not exists payment_method text not null default 'mpesa';
alter table public.customer_orders add column if not exists mpesa_checkout_id text;
alter table public.customer_orders add column if not exists mpesa_receipt text;
alter table public.customer_orders add column if not exists paid_at timestamptz;
alter table public.customer_orders add column if not exists estimated_total_kes numeric(10,2);
create index if not exists customer_orders_customer_idx on public.customer_orders (customer_id, created_at desc);
create index if not exists customer_orders_status_idx on public.customer_orders (status, created_at desc);

alter table public.customer_orders enable row level security;
drop policy if exists "customer_orders_select" on public.customer_orders;
create policy "customer_orders_select" on public.customer_orders for select to authenticated
  using (customer_id = auth.uid() or is_admin());
-- No insert / update / delete policies on purpose: the functions below are the only way to change an order.

-- Every M-Pesa payment prompt we send. Kept separately from the order so that a second prompt, a cancelled order or a
-- price change can never make a real payment disappear: whatever Safaricom confirms is recorded here against the prompt.
create table if not exists public.mpesa_attempts (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.customer_orders(id) on delete cascade,
  checkout_id text unique,                    -- Safaricom's id for this prompt (set once Safaricom accepts it)
  amount numeric(10,2) not null,
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'paid_needs_review')),
                                              -- paid_needs_review = money arrived but the order could not take it (cancelled, already paid, or too little)
  result_desc text,
  receipt text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists mpesa_attempts_order_idx on public.mpesa_attempts (order_id, created_at desc);
alter table public.mpesa_attempts enable row level security;
drop policy if exists "mpesa_attempts_select" on public.mpesa_attempts;
create policy "mpesa_attempts_select" on public.mpesa_attempts for select to authenticated
  using (is_admin() or exists (select 1 from customer_orders o where o.id = order_id and o.customer_id = auth.uid()));

-- ---------------------------------------------------------------------------------------------------------------------
-- 7. What customers and the owner can DO (each checks who is calling)
-- ---------------------------------------------------------------------------------------------------------------------
-- Owner: add or edit a cut. p_id null = a new cut.
create or replace function public.admin_save_shop_item(
  p_id uuid, p_name text, p_blurb text, p_price numeric, p_stock numeric, p_active boolean
) returns uuid language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not is_admin() then raise exception 'Only admins can do this' using errcode = '42501'; end if;
  if nullif(btrim(p_name), '') is null or length(btrim(p_name)) > 60 then raise exception 'Enter the name of the cut'; end if;
  if p_price is not null and p_price <= 0 then raise exception 'The price must be more than 0'; end if;
  if p_stock is null or p_stock < 0 or p_stock > 100000 then raise exception 'Enter the kilos in stock (0 or more)'; end if;
  if coalesce(p_active, false) and p_price is null then raise exception 'Set a price before switching a cut on'; end if;
  if p_id is null then
    insert into shop_items (name, blurb, price_per_kg, stock_kg, is_active)
    values (btrim(p_name), nullif(btrim(p_blurb), ''), p_price, p_stock, coalesce(p_active, false))
    returning id into v_id;
  else
    update shop_items
       set name = btrim(p_name), blurb = nullif(btrim(p_blurb), ''), price_per_kg = p_price, stock_kg = p_stock,
           is_active = coalesce(p_active, false), updated_at = now()
     where id = p_id returning id into v_id;
    if v_id is null then raise exception 'That cut no longer exists'; end if;
  end if;
  return v_id;
exception when unique_violation then
  raise exception 'There is already a cut called %', btrim(p_name);
end
$$;

-- Owner: the one standard delivery fee.
create or replace function public.admin_set_delivery_fee(p_fee numeric)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'Only admins can do this' using errcode = '42501'; end if;
  if p_fee is null or p_fee < 0 or p_fee > 100000 then raise exception 'Enter the delivery fee in KSh (0 or more)'; end if;
  update shop_settings set delivery_fee_kes = p_fee, updated_at = now() where id = 1;
end
$$;

-- Puts an order's kilos back on the shelf (an order cancelled before delivery).
create or replace function public.restore_shop_stock(p_items jsonb)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  for v_item in select * from jsonb_array_elements(p_items) loop
    update shop_items set stock_kg = stock_kg + (v_item->>'kg')::numeric, updated_at = now() where name = v_item->>'name';
  end loop;
end
$$;

-- Customer: place an order. Checks the cuts are on sale and in stock, takes the kilos off in the same step, and
-- if every cut has a price AND the delivery fee is set, saves it already priced ("quoted") so they can pay at once.
drop function if exists public.place_customer_order(jsonb, text, text);   -- an older version without the payment choice
create or replace function public.place_customer_order(p_items jsonb, p_address text, p_notes text default null, p_payment_method text default 'mpesa')
returns bigint language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('customer');
  v_item jsonb;
  v_clean jsonb := '[]';
  v_id bigint;
  v_name text;
  v_kg numeric;
  v_shop shop_items;
  v_est numeric := 0;
  v_all_priced boolean := true;
  v_fee numeric;
  v_priced boolean;
  v_admin uuid;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'Add between 1 and 30 cuts to your order';
  end if;
  if p_payment_method not in ('mpesa', 'cash_on_delivery') then
    raise exception 'Choose how you will pay';
  end if;
  if nullif(btrim(p_address), '') is null or length(p_address) > 300 then
    raise exception 'Enter a delivery address';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_name := btrim(v_item->>'name');
    v_kg := (v_item->>'kg')::numeric;
    if v_kg is null or v_kg < 0.5 or v_kg > 50 then raise exception '% must be between 0.5 and 50 kg', coalesce(v_name, 'A cut'); end if;
    -- Lock the row so two orders for the last kilos cannot both succeed.
    select * into v_shop from shop_items where name = v_name and is_active for update;
    if not found then raise exception '% is not available right now', v_name; end if;
    if v_shop.stock_kg < v_kg then
      raise exception 'Only % kg of % is left', v_shop.stock_kg, v_name;
    end if;
    update shop_items set stock_kg = stock_kg - v_kg, updated_at = now() where id = v_shop.id;
    if v_shop.price_per_kg is null then v_all_priced := false; else v_est := v_est + v_shop.price_per_kg * v_kg; end if;
    v_clean := v_clean || jsonb_build_array(jsonb_build_object('name', v_name, 'kg', v_kg));
  end loop;

  select delivery_fee_kes into v_fee from shop_settings where id = 1;
  v_priced := v_all_priced and v_fee is not null;

  insert into customer_orders (customer_id, items, delivery_address, phone, notes, payment_method, estimated_total_kes,
                               status, items_total_kes, delivery_fee_kes)
  values (v_uid, v_clean, btrim(p_address), (select phone from profiles where id = v_uid), nullif(btrim(left(p_notes, 500)), ''), p_payment_method,
          case when v_all_priced then v_est end,
          case when v_priced then 'quoted' else 'pending' end,
          case when v_priced then v_est end,
          case when v_priced then v_fee end)
  returning id into v_id;

  for v_admin in select id from profiles where role = 'admin' loop
    perform notify(v_admin, 'customer_order', 'New customer order #' || v_id,
      case when v_priced then 'Priced automatically from the shop prices. Nothing to do unless you want to change it.'
           else 'Set the price so the customer can pay.' end,
      jsonb_build_object('customer_order_id', v_id), false);
  end loop;
  return v_id;
end
$$;

-- Customer: cancel their own order until it is paid. The kilos go back on the shelf.
create or replace function public.customer_cancel_order(p_order_id bigint)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('customer');
  v_o customer_orders;
begin
  if exists (select 1 from mpesa_attempts where order_id = p_order_id and status = 'pending' and created_at > now() - interval '3 minutes') then
    raise exception 'A payment prompt was just sent to your phone. Finish it there, or wait a few minutes, then cancel.';
  end if;
  update customer_orders set status = 'cancelled', updated_at = now()
   where id = p_order_id and customer_id = v_uid and status in ('pending', 'quoted')
  returning * into v_o;
  if not found then raise exception 'This order can no longer be cancelled'; end if;
  perform restore_shop_stock(v_o.items);
end
$$;

-- Owner: set or change an order's price (the customer is told by SMS).
create or replace function public.admin_quote_customer_order(p_order_id bigint, p_items_total numeric, p_delivery_fee numeric)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_o customer_orders;
begin
  if not is_admin() then raise exception 'Only admins can do this' using errcode = '42501'; end if;
  if p_items_total is null or p_items_total <= 0 or p_delivery_fee is null or p_delivery_fee < 0 then
    raise exception 'Enter the items total and the delivery fee';
  end if;
  if exists (select 1 from mpesa_attempts where order_id = p_order_id and status = 'pending' and created_at > now() - interval '3 minutes') then
    raise exception 'The customer has an M-Pesa prompt open on their phone. Wait a few minutes before changing the price.';
  end if;
  update customer_orders
     set items_total_kes = p_items_total, delivery_fee_kes = p_delivery_fee, status = 'quoted', updated_at = now()
   where id = p_order_id and status in ('pending', 'quoted')
  returning * into v_o;
  if not found then raise exception 'This order can no longer be priced'; end if;
  perform notify(v_o.customer_id, 'customer_order', 'Order #' || v_o.id || ' priced',
    'Total KSh ' || to_char(p_items_total + p_delivery_fee, 'FM999,999,990') || ' including delivery. Open your order to continue.',
    jsonb_build_object('customer_order_id', v_o.id), true);
end
$$;

-- Owner: mark an order paid, delivered or cancelled (cancelling puts the kilos back).
create or replace function public.admin_set_customer_order_status(p_order_id bigint, p_status text)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_o customer_orders;
begin
  if not is_admin() then raise exception 'Only admins can do this' using errcode = '42501'; end if;
  if p_status not in ('paid', 'delivered', 'cancelled') then raise exception 'Invalid status'; end if;
  update customer_orders set status = p_status, updated_at = now(), paid_at = case when p_status = 'paid' then now() else paid_at end
   where id = p_order_id and status not in ('delivered', 'cancelled')
  returning * into v_o;
  if not found then raise exception 'This order is already closed'; end if;
  if p_status = 'cancelled' then perform restore_shop_stock(v_o.items); end if;
  perform notify(v_o.customer_id, 'customer_order', 'Order #' || v_o.id || ' ' || p_status,
    case p_status when 'delivered' then 'Your order has been delivered. Enjoy!' when 'paid' then 'We received your payment.' else 'Your order was cancelled.' end,
    jsonb_build_object('customer_order_id', v_o.id), true);
end
$$;

-- ----- M-Pesa payment prompts (server only: the website's server uses the service key) -----
drop function if exists public.mark_customer_order_paid(bigint, text, numeric);   -- replaced by the functions below

-- Step 1: reserve an attempt for the customer's own priced order. Refuses a second prompt while one is still open.
create or replace function public.begin_mpesa_attempt(p_order_id bigint, p_customer uuid)
returns table (o_attempt_id bigint, o_amount numeric, o_phone text) language plpgsql security definer
set search_path = public
as $$
declare
  v_o customer_orders;
  v_total numeric;
  v_id bigint;
begin
  select * into v_o from customer_orders where id = p_order_id and customer_id = p_customer for update;
  if not found or v_o.status <> 'quoted' then raise exception 'This order is not ready to pay'; end if;
  if v_o.phone is null or v_o.phone = '' then raise exception 'Add your mobile number on your account page first'; end if;
  if exists (select 1 from mpesa_attempts where order_id = p_order_id and status = 'pending' and created_at > now() - interval '3 minutes') then
    raise exception 'A payment prompt was just sent to your phone. Finish it there, or wait a few minutes and try again.';
  end if;
  v_total := coalesce(v_o.items_total_kes, 0) + coalesce(v_o.delivery_fee_kes, 0);
  insert into mpesa_attempts (order_id, amount, phone) values (p_order_id, v_total, v_o.phone) returning id into v_id;
  return query select v_id, v_total, v_o.phone;
end
$$;

-- Step 2: Safaricom accepted the prompt (or it could not be sent).
create or replace function public.set_mpesa_attempt_checkout(p_attempt_id bigint, p_checkout_id text)
returns void language sql security definer
set search_path = public
as $$ update mpesa_attempts set checkout_id = p_checkout_id where id = p_attempt_id and checkout_id is null $$;

create or replace function public.fail_mpesa_attempt(p_attempt_id bigint, p_reason text)
returns void language sql security definer
set search_path = public
as $$ update mpesa_attempts set status = 'failed', result_desc = left(p_reason, 200), resolved_at = now() where id = p_attempt_id and status = 'pending' $$;

-- Step 3: Safaricom's answer arrives. A cancelled or timed-out prompt just marks the attempt failed. A real payment
-- marks the order paid when it still can be; otherwise it is flagged for the owner to refund or sort out, never lost.
-- Safe if Safaricom sends the same answer twice.
create or replace function public.apply_mpesa_result(p_checkout_id text, p_result_code int, p_desc text, p_amount numeric, p_receipt text)
returns text language plpgsql security definer
set search_path = public
as $$
declare
  v_a mpesa_attempts;
  v_o customer_orders;
  v_total numeric;
  v_admin uuid;
begin
  select * into v_a from mpesa_attempts where checkout_id = p_checkout_id for update;
  if not found then return 'unknown'; end if;
  if v_a.status <> 'pending' then return 'already ' || v_a.status; end if;

  if p_result_code <> 0 then
    update mpesa_attempts set status = 'failed', result_desc = left(coalesce(p_desc, 'Payment was not completed'), 200), resolved_at = now() where id = v_a.id;
    return 'failed';
  end if;

  select * into v_o from customer_orders where id = v_a.order_id for update;
  v_total := coalesce(v_o.items_total_kes, 0) + coalesce(v_o.delivery_fee_kes, 0);
  if v_o.status = 'quoted' and p_amount >= v_total then
    update customer_orders set status = 'paid', mpesa_receipt = p_receipt, paid_at = now(), updated_at = now() where id = v_o.id;
    update mpesa_attempts set status = 'paid', receipt = p_receipt, resolved_at = now() where id = v_a.id;
    perform notify(v_o.customer_id, 'customer_order', 'Payment received for order #' || v_o.id,
      'M-Pesa code ' || p_receipt || '. We will deliver your order soon.', jsonb_build_object('customer_order_id', v_o.id), true);
    return 'paid';
  end if;

  update mpesa_attempts set status = 'paid_needs_review', receipt = p_receipt, resolved_at = now(),
         result_desc = 'Order was ' || v_o.status || '; received ' || p_amount || ', order total ' || v_total
   where id = v_a.id;
  for v_admin in select id from profiles where role = 'admin' loop
    perform notify(v_admin, 'customer_order', 'M-Pesa payment needs review: order #' || v_o.id,
      'KSh ' || p_amount || ' arrived (M-Pesa code ' || p_receipt || ') but the order is ' || v_o.status || '. Refund it or fix the order.',
      jsonb_build_object('customer_order_id', v_o.id), false);
  end loop;
  return 'needs_review';
end
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 8. Who may call what
-- ---------------------------------------------------------------------------------------------------------------------
-- Tables are only changed through the functions above, never directly.
revoke insert, update, delete on public.customer_orders, public.shop_items, public.shop_settings, public.mpesa_attempts from anon, authenticated;

-- Internal helpers: never callable from the website.
revoke execute on function
  public.notify(uuid, text, text, text, jsonb, boolean),
  public.handle_new_user(),
  public.guard_profile_update(),
  public.require_role(public.user_role),
  public.restore_shop_stock(jsonb)
from public, anon, authenticated;

-- Server only (the website's server uses the service key).
revoke execute on function
  public.claim_sms_batch(int),
  public.begin_mpesa_attempt(bigint, uuid),
  public.set_mpesa_attempt_checkout(bigint, text),
  public.fail_mpesa_attempt(bigint, text),
  public.apply_mpesa_result(text, int, text, numeric, text)
from public, anon, authenticated;
grant execute on function
  public.claim_sms_batch(int),
  public.begin_mpesa_attempt(bigint, uuid),
  public.set_mpesa_attempt_checkout(bigint, text),
  public.fail_mpesa_attempt(bigint, text),
  public.apply_mpesa_result(text, int, text, numeric, text)
to service_role;

-- Signed-in people only (each function checks the caller's role itself).
revoke execute on function
  public.place_customer_order(jsonb, text, text, text),
  public.customer_cancel_order(bigint),
  public.admin_quote_customer_order(bigint, numeric, numeric),
  public.admin_set_customer_order_status(bigint, text),
  public.admin_save_shop_item(uuid, text, text, numeric, numeric, boolean),
  public.admin_set_delivery_fee(numeric)
from public, anon;
grant execute on function
  public.place_customer_order(jsonb, text, text, text),
  public.customer_cancel_order(bigint),
  public.admin_quote_customer_order(bigint, numeric, numeric),
  public.admin_set_customer_order_status(bigint, text),
  public.admin_save_shop_item(uuid, text, text, numeric, numeric, boolean),
  public.admin_set_delivery_fee(numeric)
to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- 9. Live updates: the order and notification pages refresh when these change (row rules still apply)
-- ---------------------------------------------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['customer_orders', 'notifications'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Done. Next: run supabase/make_admin.sql once (with your email) so you can manage stock and orders.
