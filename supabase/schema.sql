-- ============================================================================
-- Kuja Na Stock (KNS) — next-morning stock delivery
-- ----------------------------------------------------------------------------
-- Retailers order in the evening, suppliers confirm, confirmed orders are
-- batched into one delivery run per supplier per morning, and a boda rider
-- delivers the run between 05:00 and 07:00 so kiosks are stocked before
-- opening.
--
-- Business rules (mirrored in src/lib/constants.ts):
--   * Order cutoff 21:00 Africa/Nairobi. Before cutoff → delivered tomorrow,
--     after cutoff → the day after.
--   * Delivery window 05:00–07:00.
--   * Delivery fee KSh 50 per road-km (straight line × 1.3), min KSh 100,
--     rounded to the nearest KSh 10. The fee goes to the rider.
--   * Max 6 drops per delivery run.
--   * Unconfirmed orders are cancelled by the morning sweep (03:30).
--
-- All state changes go through SECURITY DEFINER functions below; clients can
-- only read (RLS) and edit their own profile / listings / stock counts.
--
-- Run in the Supabase SQL editor on a fresh project. This replaces the old
-- demo schema — it does not migrate data from it.
-- ============================================================================

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('retailer', 'supplier', 'rider', 'admin');
create type public.supplier_type as enum ('farm', 'depot');
create type public.order_status as enum (
  'pending',    -- placed by retailer, waiting for supplier
  'confirmed',  -- supplier accepted, stock reserved, in a run
  'rejected',   -- supplier declined
  'assigned',   -- a rider accepted the run
  'picked_up',  -- rider collected goods from the supplier
  'delivered',  -- retailer gave the rider the delivery code
  'failed',     -- rider could not hand over (shop closed, refused…)
  'cancelled'   -- retailer cancelled, or supplier never confirmed
);
create type public.run_status as enum ('open', 'assigned', 'picked_up', 'completed', 'cancelled');
create type public.payment_method as enum ('cash', 'mpesa');
create type public.issue_type as enum ('short_delivery', 'bad_quality', 'wrong_item', 'other');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'retailer',
  full_name text not null default '',
  phone text,                          -- E.164, e.g. +254712345678
  business_name text,
  supplier_type public.supplier_type,  -- suppliers only
  address text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  location extensions.geography(point, 4326) generated always as (
    case when lat is not null and lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography
    end
  ) stored,
  -- Supplier: how far they deliver. Rider: how far from their stage they ride.
  service_radius_km numeric(5,1) not null default 10 check (service_radius_km between 1 and 50),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_type_only_for_suppliers
    check ((role = 'supplier') = (supplier_type is not null))
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  unit text not null default 'kg',
  created_at timestamptz not null default now()
);

create table public.supplier_listings (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  price_per_unit numeric(10,2) not null check (price_per_unit > 0),
  available_qty numeric(10,2) not null default 0 check (available_qty >= 0),
  min_order_qty numeric(10,2) not null default 1 check (min_order_qty > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, product_id)
);

create table public.retailer_inventory (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  current_stock numeric(10,2) not null default 0 check (current_stock >= 0),
  low_stock_threshold numeric(10,2) not null default 10 check (low_stock_threshold >= 0),
  reorder_qty numeric(10,2) not null default 20 check (reorder_qty > 0),
  updated_at timestamptz not null default now(),
  unique (retailer_id, product_id)
);

create table public.delivery_runs (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  rider_id uuid references public.profiles(id) on delete set null,
  run_date date not null,
  status public.run_status not null default 'open',
  rider_fee numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  picked_up_at timestamptz,
  completed_at timestamptz,
  supplier_alerted_at timestamptz  -- set when the morning sweep warns "no rider yet"
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity unique,
  retailer_id uuid not null references public.profiles(id) on delete cascade,
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  run_id uuid references public.delivery_runs(id) on delete set null,
  status public.order_status not null default 'pending',
  delivery_date date not null,
  delivery_window text not null default '05:00-07:00',
  delivery_address text not null,
  delivery_lat double precision not null,
  delivery_lng double precision not null,
  distance_km numeric(6,1) not null,
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(10,2) not null,
  total numeric(12,2) generated always as (subtotal + delivery_fee) stored,
  notes text,
  status_reason text,
  confirmed_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  listing_id uuid references public.supplier_listings(id) on delete set null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  unique (order_id, product_id)
);

-- Kept apart from orders so the rider (who can read the order) never sees it.
create table public.order_secrets (
  order_id uuid primary key references public.orders(id) on delete cascade,
  delivery_code text not null,
  failed_attempts int not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  method public.payment_method not null,
  amount numeric(12,2) not null check (amount >= 0),
  mpesa_ref text,
  collected_by uuid references public.profiles(id) on delete set null,
  collected_at timestamptz not null default now()
);

create table public.delivery_issues (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  issue_type public.issue_type not null,
  description text not null,
  quantity_short numeric(10,2),
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.rider_availability (
  rider_id uuid not null references public.profiles(id) on delete cascade,
  available_date date not null,
  primary key (rider_id, available_date)
);

-- Which riders were already told about a run (so re-offers don't spam).
create table public.run_offers (
  run_id uuid not null references public.delivery_runs(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  offered_at timestamptz not null default now(),
  primary key (run_id, rider_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  data jsonb not null default '{}',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Written by notify(); drained by the app server (src/lib/sms.ts).
create table public.sms_outbox (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  to_phone text not null,
  message text not null,
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz
);

create index on public.supplier_listings (product_id) where is_active;
create index on public.profiles using gist (location);
create index on public.orders (retailer_id, delivery_date);
create index on public.orders (supplier_id, status);
create index on public.orders (run_id);
create index on public.order_items (order_id);
create index on public.delivery_runs (run_date, status);
create index on public.delivery_runs (rider_id);
create index on public.notifications (user_id, created_at desc);
create index on public.sms_outbox (status, id);

-- ---------------------------------------------------------------------------
-- Small helpers
-- ---------------------------------------------------------------------------
create or replace function public.today_nairobi()
returns date language sql stable
as $$ select (now() at time zone 'Africa/Nairobi')::date $$;

-- Orders placed before 21:00 Nairobi time arrive the next morning.
create or replace function public.next_delivery_date(p_at timestamptz default now())
returns date language sql stable
as $$
  select case
    when (p_at at time zone 'Africa/Nairobi')::time < time '21:00'
      then (p_at at time zone 'Africa/Nairobi')::date + 1
    else (p_at at time zone 'Africa/Nairobi')::date + 2
  end
$$;

-- Approximate road distance: straight line × 1.3.
create or replace function public.road_km(a extensions.geography, b extensions.geography)
returns numeric language sql stable
set search_path = public, extensions
as $$ select round((st_distance(a, b) / 1000.0 * 1.3)::numeric, 1) $$;

create or replace function public.delivery_fee_for(p_km numeric)
returns numeric language sql immutable
as $$ select greatest(100, round(p_km * 50 / 10) * 10) $$;

create or replace function public.ksh(p numeric)
returns text language sql immutable
as $$ select 'KSh ' || to_char(p, 'FM999,999,990') $$;

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

-- ---------------------------------------------------------------------------
-- RLS helpers (SECURITY DEFINER so policies don't recurse)
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role language sql stable security definer
set search_path = public
as $$ select role from profiles where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public
as $$ select coalesce((select role = 'admin' from profiles where id = auth.uid()), false) $$;

create or replace function public.is_run_rider(p_run_id uuid)
returns boolean language sql stable security definer
set search_path = public
as $$ select exists (select 1 from delivery_runs where id = p_run_id and rider_id = auth.uid()) $$;

create or replace function public.can_see_order(p_order_id uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from orders o
    left join delivery_runs r on r.id = o.run_id
    where o.id = p_order_id
      and (o.retailer_id = auth.uid() or o.supplier_id = auth.uid() or r.rider_id = auth.uid())
  )
$$;

-- True when the caller and p_profile are on the same order (retailer,
-- supplier, rider), so each can see the other's name, phone and address.
create or replace function public.shares_order_with(p_profile uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from orders o
    left join delivery_runs r on r.id = o.run_id
    where auth.uid() in (o.retailer_id, o.supplier_id, r.rider_id)
      and p_profile in (o.retailer_id, o.supplier_id, r.rider_id)
  )
$$;

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

-- In-app notification, optionally mirrored to SMS via sms_outbox.
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
      values (p_user, v_phone, 'KNS: ' || p_title || '. ' || p_message);
    end if;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
-- Create a profile for every new auth user. Admin can never be self-assigned.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}');
  v_role user_role;
begin
  v_role := (case v_meta->>'role'
    when 'supplier' then 'supplier'
    when 'rider' then 'rider'
    else 'retailer'
  end)::user_role;

  insert into profiles (id, role, full_name, phone, business_name, supplier_type)
  values (
    new.id,
    v_role,
    coalesce(nullif(btrim(v_meta->>'full_name'), ''), ''),
    normalize_ke_phone(v_meta->>'phone'),
    nullif(btrim(v_meta->>'business_name'), ''),
    case when v_role = 'supplier' then
      (case v_meta->>'supplier_type' when 'farm' then 'farm' else 'depot' end)::supplier_type
    end
  );
  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own profile, but not their role or verified flag.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not is_admin() then
    if new.role is distinct from old.role or new.is_verified is distinct from old.is_verified then
      raise exception 'You cannot change your account type or verification status';
    end if;
  end if;
  if new.role <> 'supplier' then
    new.supplier_type := null;
  elsif new.supplier_type is null then
    new.supplier_type := coalesce(old.supplier_type, 'depot');
  end if;
  new.phone := normalize_ke_phone(new.phone);
  new.updated_at := now();
  return new;
end
$$;

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.check_low_stock()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_product products;
begin
  select * into v_product from products where id = new.product_id;
  perform notify(
    new.retailer_id, 'low_stock',
    'Low stock: ' || v_product.name,
    v_product.name || ' is down to ' || new.current_stock || ' ' || v_product.unit
      || '. Order before 9 PM to get it tomorrow morning.',
    jsonb_build_object('product_id', new.product_id)
  );
  return new;
end
$$;

create trigger low_stock_check
  after update of current_stock on public.retailer_inventory
  for each row
  when (old.current_stock > new.low_stock_threshold and new.current_stock <= new.low_stock_threshold)
  execute function public.check_low_stock();

-- ---------------------------------------------------------------------------
-- Retailer: supplier comparison
-- ---------------------------------------------------------------------------
-- Every active listing with its distance and delivery fee from the caller's
-- shop, so retailers see the full landed cost before ordering.
create or replace function public.quote_suppliers()
returns table (
  listing_id uuid,
  supplier_id uuid,
  supplier_name text,
  supplier_type public.supplier_type,
  supplier_verified boolean,
  product_id uuid,
  product_name text,
  category text,
  unit text,
  price_per_unit numeric,
  available_qty numeric,
  min_order_qty numeric,
  distance_km numeric,
  delivery_fee numeric,
  in_range boolean
) language sql stable security definer
set search_path = public, extensions
as $$
  select
    l.id, s.id, coalesce(s.business_name, s.full_name), s.supplier_type, s.is_verified,
    p.id, p.name, p.category, p.unit,
    l.price_per_unit, l.available_qty, l.min_order_qty,
    road_km(me.location, s.location),
    delivery_fee_for(road_km(me.location, s.location)),
    road_km(me.location, s.location) <= s.service_radius_km
  from profiles me
  join supplier_listings l on l.is_active and l.available_qty > 0
  join profiles s on s.id = l.supplier_id and s.role = 'supplier' and s.location is not null
  join products p on p.id = l.product_id
  where me.id = auth.uid() and me.location is not null
  order by p.name, l.price_per_unit
$$;

-- ---------------------------------------------------------------------------
-- Retailer: ordering
-- ---------------------------------------------------------------------------
-- p_items: [{"listing_id": "...", "quantity": 20}, ...] — all from one supplier.
create or replace function public.place_order(p_supplier_id uuid, p_items jsonb, p_notes text default null)
returns uuid language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := require_role('retailer');
  v_me profiles;
  v_sup profiles;
  v_km numeric;
  v_order_id uuid;
  v_order_no bigint;
  v_date date := next_delivery_date();
  v_item jsonb;
  v_listing supplier_listings;
  v_product products;
  v_qty numeric;
  v_subtotal numeric := 0;
  v_fee numeric;
  v_code text;
begin
  select * into v_me from profiles where id = v_uid;
  if v_me.location is null then
    raise exception 'Set your shop location in Settings before ordering';
  end if;

  select * into v_sup from profiles where id = p_supplier_id and role = 'supplier';
  if not found then
    raise exception 'Supplier not found';
  end if;
  if v_sup.location is null then
    raise exception 'This supplier has not set a pickup location yet';
  end if;

  v_km := road_km(v_me.location, v_sup.location);
  if v_km > v_sup.service_radius_km then
    raise exception 'Your shop is % km away, outside this supplier''s % km delivery area',
      v_km, v_sup.service_radius_km;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item';
  end if;

  v_fee := delivery_fee_for(v_km);

  insert into orders (retailer_id, supplier_id, delivery_date, delivery_address,
                      delivery_lat, delivery_lng, distance_km, delivery_fee, notes)
  values (v_uid, p_supplier_id, v_date,
          coalesce(nullif(v_me.address, ''), v_me.business_name, 'Shop'),
          v_me.lat, v_me.lng, v_km, v_fee, nullif(btrim(p_notes), ''))
  returning id, order_no into v_order_id, v_order_no;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_listing from supplier_listings
    where id = (v_item->>'listing_id')::uuid and supplier_id = p_supplier_id and is_active;
    if not found then
      raise exception 'An item is no longer available from this supplier';
    end if;
    select * into v_product from products where id = v_listing.product_id;

    v_qty := (v_item->>'quantity')::numeric;
    if v_qty is null or v_qty < v_listing.min_order_qty then
      raise exception 'Minimum order for % is % %', v_product.name, v_listing.min_order_qty, v_product.unit;
    end if;
    if v_qty > v_listing.available_qty then
      raise exception 'Only % % of % available', v_listing.available_qty, v_product.unit, v_product.name;
    end if;

    begin
      insert into order_items (order_id, product_id, listing_id, quantity, unit_price)
      values (v_order_id, v_listing.product_id, v_listing.id, v_qty, v_listing.price_per_unit);
    exception when unique_violation then
      raise exception '% is in the order twice', v_product.name;
    end;
    v_subtotal := v_subtotal + v_qty * v_listing.price_per_unit;
  end loop;

  update orders set subtotal = v_subtotal where id = v_order_id;

  -- 4-digit handover code from a CSPRNG.
  v_code := lpad(((('x' || encode(gen_random_bytes(2), 'hex'))::bit(16)::int) % 10000)::text, 4, '0');
  insert into order_secrets (order_id, delivery_code) values (v_order_id, v_code);

  perform notify(
    p_supplier_id, 'new_order', 'New order #' || v_order_no,
    coalesce(v_me.business_name, v_me.full_name) || ' ordered ' || ksh(v_subtotal)
      || ' for ' || to_char(v_date, 'Dy DD Mon') || ' morning. Confirm in the app before 4 AM.',
    jsonb_build_object('order_id', v_order_id), true
  );
  perform notify(
    v_uid, 'order_placed', 'Order #' || v_order_no || ' sent',
    'Waiting for ' || coalesce(v_sup.business_name, v_sup.full_name) || ' to confirm. Delivery '
      || to_char(v_date, 'Dy DD Mon') || ', 05:00–07:00.',
    jsonb_build_object('order_id', v_order_id)
  );

  return v_order_id;
end
$$;

-- Repeat the retailer's most recent basket (one new order per supplier) for
-- the next delivery date, at today's prices. Suppliers that are out of stock,
-- out of range, or already have an open order for that date are skipped.
create or replace function public.reorder_last_delivery()
returns jsonb language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := require_role('retailer');
  v_last date;
  v_next date := next_delivery_date();
  v_order orders;
  v_items jsonb;
  v_placed int := 0;
  v_skipped int := 0;
begin
  select max(delivery_date) into v_last from orders
  where retailer_id = v_uid and status not in ('cancelled', 'rejected', 'failed');
  if v_last is null then
    raise exception 'You have no previous order to repeat';
  end if;

  for v_order in
    select * from orders
    where retailer_id = v_uid and delivery_date = v_last
      and status not in ('cancelled', 'rejected', 'failed')
  loop
    if exists (
      select 1 from orders
      where retailer_id = v_uid and supplier_id = v_order.supplier_id and delivery_date = v_next
        and status in ('pending', 'confirmed', 'assigned', 'picked_up')
    ) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    select jsonb_agg(jsonb_build_object('listing_id', l.id, 'quantity', greatest(oi.quantity, l.min_order_qty)))
    into v_items
    from order_items oi
    join supplier_listings l
      on l.supplier_id = v_order.supplier_id and l.product_id = oi.product_id and l.is_active
     and l.available_qty >= greatest(oi.quantity, l.min_order_qty)
    where oi.order_id = v_order.id;

    if v_items is null then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    begin
      perform place_order(v_order.supplier_id, v_items, v_order.notes);
      v_placed := v_placed + 1;
    exception when others then
      v_skipped := v_skipped + 1;
    end;
  end loop;

  return jsonb_build_object('placed', v_placed, 'skipped', v_skipped, 'delivery_date', v_next);
end
$$;

create or replace function public.cancel_order(p_order_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('retailer');
  v_order orders;
begin
  select * into v_order from orders where id = p_order_id and retailer_id = v_uid for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Only orders the supplier has not confirmed yet can be cancelled';
  end if;

  update orders set status = 'cancelled', status_reason = 'Cancelled by retailer', updated_at = now()
  where id = p_order_id;

  perform notify(v_order.supplier_id, 'order_cancelled', 'Order #' || v_order.order_no || ' cancelled',
    'The retailer cancelled this order.', jsonb_build_object('order_id', p_order_id));
end
$$;

create or replace function public.report_issue(
  p_order_id uuid, p_type public.issue_type, p_description text, p_quantity_short numeric default null
) returns uuid language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('retailer');
  v_order orders;
  v_issue_id uuid;
begin
  select * into v_order from orders where id = p_order_id and retailer_id = v_uid;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status <> 'delivered' then
    raise exception 'You can only report problems on delivered orders';
  end if;
  if v_order.delivered_at < now() - interval '24 hours' then
    raise exception 'Problems must be reported within 24 hours of delivery';
  end if;
  if nullif(btrim(p_description), '') is null then
    raise exception 'Describe what went wrong';
  end if;

  insert into delivery_issues (order_id, reported_by, issue_type, description, quantity_short)
  values (p_order_id, v_uid, p_type, btrim(p_description), p_quantity_short)
  returning id into v_issue_id;

  perform notify(v_order.supplier_id, 'issue_reported',
    'Problem reported on order #' || v_order.order_no,
    replace(p_type::text, '_', ' ') || ': ' || left(btrim(p_description), 100),
    jsonb_build_object('order_id', p_order_id, 'issue_id', v_issue_id), true);

  return v_issue_id;
end
$$;

-- ---------------------------------------------------------------------------
-- Supplier
-- ---------------------------------------------------------------------------
-- Tell nearby riders who are available that day about an open run.
create or replace function public.offer_run(p_run_id uuid)
returns int language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_run delivery_runs;
  v_sup profiles;
  v_rider_id uuid;
  v_count int := 0;
begin
  select * into v_run from delivery_runs where id = p_run_id and status = 'open';
  if not found then
    return 0;
  end if;
  select * into v_sup from profiles where id = v_run.supplier_id;

  for v_rider_id in
    select p.id from profiles p
    join rider_availability a on a.rider_id = p.id and a.available_date = v_run.run_date
    where p.role = 'rider' and p.location is not null
      and st_dwithin(p.location, v_sup.location, p.service_radius_km * 1000)
      and not exists (
        select 1 from delivery_runs r
        where r.rider_id = p.id and r.run_date = v_run.run_date and r.status in ('assigned', 'picked_up')
      )
      and not exists (select 1 from run_offers o where o.run_id = p_run_id and o.rider_id = p.id)
  loop
    insert into run_offers (run_id, rider_id) values (p_run_id, v_rider_id);
    perform notify(v_rider_id, 'run_offer', 'Delivery run available',
      'Pickup at ' || coalesce(v_sup.business_name, v_sup.full_name) || ', '
        || coalesce(v_sup.address, 'see app') || ' on ' || to_char(v_run.run_date, 'Dy DD Mon')
        || ' at 05:00. Open the app to accept.',
      jsonb_build_object('run_id', p_run_id), true);
    v_count := v_count + 1;
  end loop;
  return v_count;
end
$$;

-- Accept (reserve stock, add to a run) or reject a pending order.
create or replace function public.supplier_respond(p_order_id uuid, p_accept boolean, p_reason text default null)
returns uuid language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('supplier');
  v_order orders;
  v_item record;
  v_run delivery_runs;
  v_new_run boolean := false;
  v_supplier_name text;
begin
  select * into v_order from orders where id = p_order_id and supplier_id = v_uid for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'This order is already %', v_order.status;
  end if;
  select coalesce(business_name, full_name) into v_supplier_name from profiles where id = v_uid;

  if not p_accept then
    update orders
    set status = 'rejected',
        status_reason = coalesce(nullif(btrim(p_reason), ''), 'Supplier could not fulfil this order'),
        updated_at = now()
    where id = p_order_id;
    perform notify(v_order.retailer_id, 'order_rejected', 'Order #' || v_order.order_no || ' declined',
      v_supplier_name || ': ' || coalesce(nullif(btrim(p_reason), ''), 'could not fulfil this order')
        || '. Order from another supplier before 9 PM.',
      jsonb_build_object('order_id', p_order_id), true);
    return null;
  end if;

  if v_order.delivery_date < today_nairobi() then
    raise exception 'The delivery date for this order has passed';
  end if;

  -- Reserve stock.
  for v_item in
    select oi.product_id, oi.quantity, p.name from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = p_order_id
  loop
    update supplier_listings
    set available_qty = available_qty - v_item.quantity, updated_at = now()
    where supplier_id = v_uid and product_id = v_item.product_id and available_qty >= v_item.quantity;
    if not found then
      raise exception 'Not enough % in stock. Update the listing or decline the order', v_item.name;
    end if;
  end loop;

  -- Add to this morning's open run, or start a new one (max 6 drops).
  select * into v_run from delivery_runs r
  where r.supplier_id = v_uid and r.run_date = v_order.delivery_date and r.status = 'open'
    and (select count(*) from orders o where o.run_id = r.id) < 6
  order by r.created_at
  limit 1
  for update;

  if not found then
    insert into delivery_runs (supplier_id, run_date)
    values (v_uid, v_order.delivery_date)
    returning * into v_run;
    v_new_run := true;
  end if;

  update orders
  set status = 'confirmed', run_id = v_run.id, confirmed_at = now(), updated_at = now()
  where id = p_order_id;
  update delivery_runs set rider_fee = rider_fee + v_order.delivery_fee where id = v_run.id;

  perform notify(v_order.retailer_id, 'order_confirmed', 'Order #' || v_order.order_no || ' confirmed',
    v_supplier_name || ' will deliver ' || ksh(v_order.total) || ' of stock on '
      || to_char(v_order.delivery_date, 'Dy DD Mon') || ', 05:00–07:00.',
    jsonb_build_object('order_id', p_order_id), true);

  if v_new_run then
    perform offer_run(v_run.id);
  end if;

  return v_run.id;
end
$$;

-- Hand a run to a specific rider. Shared by accept_run and supplier_assign_rider.
create or replace function public.assign_run(p_run_id uuid, p_rider_id uuid)
returns void language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_run delivery_runs;
  v_rider profiles;
  v_sup profiles;
  v_order orders;
begin
  select * into v_run from delivery_runs where id = p_run_id for update;
  if not found then
    raise exception 'Run not found';
  end if;
  if v_run.status <> 'open' or v_run.rider_id is not null then
    raise exception 'Another rider has already taken this run';
  end if;
  if v_run.run_date < today_nairobi() then
    raise exception 'This run''s delivery date has passed';
  end if;

  select * into v_rider from profiles where id = p_rider_id and role = 'rider';
  if not found then
    raise exception 'Rider not found';
  end if;
  if exists (
    select 1 from delivery_runs
    where rider_id = p_rider_id and run_date = v_run.run_date and status in ('assigned', 'picked_up')
  ) then
    raise exception '% already has a run on %', v_rider.full_name, to_char(v_run.run_date, 'Dy DD Mon');
  end if;

  update delivery_runs set rider_id = p_rider_id, status = 'assigned', accepted_at = now()
  where id = p_run_id;
  update orders set status = 'assigned', updated_at = now()
  where run_id = p_run_id and status = 'confirmed';
  insert into rider_availability (rider_id, available_date)
  values (p_rider_id, v_run.run_date) on conflict do nothing;

  select * into v_sup from profiles where id = v_run.supplier_id;
  perform notify(v_run.supplier_id, 'run_assigned', 'Rider booked for ' || to_char(v_run.run_date, 'Dy DD Mon'),
    v_rider.full_name || ' (' || coalesce(v_rider.phone, 'no phone') || ') will collect at 05:00. Have the goods packed.',
    jsonb_build_object('run_id', p_run_id), true);
  perform notify(p_rider_id, 'run_assigned', 'Run booked for ' || to_char(v_run.run_date, 'Dy DD Mon'),
    'Collect at ' || coalesce(v_sup.business_name, v_sup.full_name) || ', ' || coalesce(v_sup.address, 'see app')
      || ' at 05:00. Earn ' || ksh(v_run.rider_fee) || '.',
    jsonb_build_object('run_id', p_run_id));

  for v_order in select * from orders where run_id = p_run_id and status = 'assigned' loop
    perform notify(v_order.retailer_id, 'rider_assigned', 'Rider booked for order #' || v_order.order_no,
      v_rider.full_name || ' will deliver on ' || to_char(v_order.delivery_date, 'Dy DD Mon') || ', 05:00–07:00.',
      jsonb_build_object('order_id', v_order.id));
  end loop;
end
$$;

-- Supplier books a rider they know, by phone number.
create or replace function public.supplier_assign_rider(p_run_id uuid, p_rider_phone text)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('supplier');
  v_rider_ids uuid[];
begin
  if not exists (select 1 from delivery_runs where id = p_run_id and supplier_id = v_uid) then
    raise exception 'Run not found';
  end if;

  select array_agg(id) into v_rider_ids from profiles
  where role = 'rider' and phone = normalize_ke_phone(p_rider_phone);
  if v_rider_ids is null then
    raise exception 'No rider is registered with phone %. Ask them to sign up as a rider first',
      normalize_ke_phone(p_rider_phone);
  end if;
  if array_length(v_rider_ids, 1) > 1 then
    raise exception 'More than one rider uses that phone number. Contact support';
  end if;

  perform assign_run(p_run_id, v_rider_ids[1]);
end
$$;

create or replace function public.resolve_issue(p_issue_id uuid, p_resolution text)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('supplier');
  v_issue delivery_issues;
  v_order orders;
begin
  select i.* into v_issue from delivery_issues i
  join orders o on o.id = i.order_id
  where i.id = p_issue_id and o.supplier_id = v_uid
  for update of i;
  if not found then
    raise exception 'Issue not found';
  end if;
  if v_issue.status = 'resolved' then
    raise exception 'This issue is already resolved';
  end if;
  if nullif(btrim(p_resolution), '') is null then
    raise exception 'Say how you resolved it (e.g. refund, replacement tomorrow)';
  end if;

  update delivery_issues set status = 'resolved', resolution = btrim(p_resolution), resolved_at = now()
  where id = p_issue_id;

  select * into v_order from orders where id = v_issue.order_id;
  perform notify(v_order.retailer_id, 'issue_resolved', 'Problem on order #' || v_order.order_no || ' resolved',
    btrim(p_resolution), jsonb_build_object('order_id', v_order.id), true);
end
$$;

-- ---------------------------------------------------------------------------
-- Rider
-- ---------------------------------------------------------------------------
create or replace function public.set_rider_availability(p_date date, p_available boolean)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('rider');
begin
  if p_date < today_nairobi() or p_date > today_nairobi() + 7 then
    raise exception 'Pick a date within the next 7 days';
  end if;
  if p_available then
    insert into rider_availability (rider_id, available_date) values (v_uid, p_date)
    on conflict do nothing;
  else
    if exists (
      select 1 from delivery_runs
      where rider_id = v_uid and run_date = p_date and status in ('assigned', 'picked_up')
    ) then
      raise exception 'You have a run booked that day. Release it first';
    end if;
    delete from rider_availability where rider_id = v_uid and available_date = p_date;
  end if;
end
$$;

-- Open runs whose pickup is within the rider's range. Riders can't read
-- delivery_runs/orders until they hold a run, so this is the only view in.
create or replace function public.open_runs_for_me()
returns table (
  run_id uuid,
  run_date date,
  supplier_name text,
  supplier_address text,
  pickup_km numeric,
  drops int,
  rider_fee numeric,
  i_am_available boolean
) language sql stable security definer
set search_path = public, extensions
as $$
  select
    r.id, r.run_date,
    coalesce(s.business_name, s.full_name), s.address,
    road_km(me.location, s.location),
    (select count(*) from orders o where o.run_id = r.id)::int,
    r.rider_fee,
    exists (select 1 from rider_availability a where a.rider_id = me.id and a.available_date = r.run_date)
  from profiles me
  join delivery_runs r on r.status = 'open' and r.rider_id is null and r.run_date >= today_nairobi()
  join profiles s on s.id = r.supplier_id
  where me.id = auth.uid() and me.role = 'rider' and me.location is not null
    and st_dwithin(me.location, s.location, me.service_radius_km * 1000)
  order by r.run_date, road_km(me.location, s.location)
$$;

create or replace function public.accept_run(p_run_id uuid)
returns void language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := require_role('rider');
  v_me profiles;
  v_sup_location extensions.geography;
begin
  select * into v_me from profiles where id = v_uid;
  if v_me.location is null then
    raise exception 'Set your stage location in Settings first';
  end if;
  select s.location into v_sup_location from delivery_runs r
  join profiles s on s.id = r.supplier_id where r.id = p_run_id;
  if v_sup_location is null or not st_dwithin(v_me.location, v_sup_location, v_me.service_radius_km * 1000) then
    raise exception 'This pickup is outside your riding range';
  end if;
  perform assign_run(p_run_id, v_uid);
end
$$;

-- Rider gives the run back before pickup; it's re-offered to others.
create or replace function public.release_run(p_run_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('rider');
  v_run delivery_runs;
  v_rider_name text;
begin
  select * into v_run from delivery_runs where id = p_run_id and rider_id = v_uid for update;
  if not found then
    raise exception 'Run not found';
  end if;
  if v_run.status <> 'assigned' then
    raise exception 'You can only release a run before pickup';
  end if;

  update delivery_runs set rider_id = null, status = 'open', accepted_at = null where id = p_run_id;
  update orders set status = 'confirmed', updated_at = now() where run_id = p_run_id and status = 'assigned';
  delete from run_offers where run_id = p_run_id;
  insert into run_offers (run_id, rider_id) values (p_run_id, v_uid);  -- don't re-offer to them

  select full_name into v_rider_name from profiles where id = v_uid;
  perform notify(v_run.supplier_id, 'run_released', 'Rider cancelled ' || to_char(v_run.run_date, 'Dy DD Mon') || ' run',
    v_rider_name || ' can no longer do this run. We are offering it to other riders. You can also book your own rider in the app.',
    jsonb_build_object('run_id', p_run_id), true);
  perform offer_run(p_run_id);
end
$$;

create or replace function public.mark_run_picked_up(p_run_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('rider');
  v_run delivery_runs;
  v_rider profiles;
  v_order record;
begin
  select * into v_run from delivery_runs where id = p_run_id and rider_id = v_uid for update;
  if not found then
    raise exception 'Run not found';
  end if;
  if v_run.status <> 'assigned' then
    raise exception 'This run is already %', v_run.status;
  end if;

  update delivery_runs set status = 'picked_up', picked_up_at = now() where id = p_run_id;
  update orders set status = 'picked_up', picked_up_at = now(), updated_at = now()
  where run_id = p_run_id and status = 'assigned';

  select * into v_rider from profiles where id = v_uid;
  for v_order in
    select o.id, o.order_no, o.retailer_id, o.total, s.delivery_code
    from orders o join order_secrets s on s.order_id = o.id
    where o.run_id = p_run_id and o.status = 'picked_up'
  loop
    perform notify(v_order.retailer_id, 'order_picked_up', 'Order #' || v_order.order_no || ' on the way',
      v_rider.full_name || ' (' || coalesce(v_rider.phone, '') || ') is bringing your stock. Pay '
        || ksh(v_order.total) || '. Check the goods, then give the rider code ' || v_order.delivery_code || '.',
      jsonb_build_object('order_id', v_order.id), true);
  end loop;
end
$$;

-- Close the run once no order in it is still moving.
create or replace function public.complete_run_if_done(p_run_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from orders where run_id = p_run_id and status in ('confirmed', 'assigned', 'picked_up')
  ) then
    update delivery_runs set status = 'completed', completed_at = now()
    where id = p_run_id and status = 'picked_up';
  end if;
end
$$;

-- Rider enters the retailer's code at handover and records the payment.
-- Returns {"ok": false, "error": ...} for a wrong code (instead of raising)
-- so the failed-attempt counter is kept.
create or replace function public.confirm_delivery(
  p_order_id uuid, p_code text, p_method public.payment_method,
  p_amount numeric default null, p_mpesa_ref text default null
) returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('rider');
  v_order orders;
  v_secret order_secrets;
  v_amount numeric;
  v_left int;
begin
  select o.* into v_order from orders o
  join delivery_runs r on r.id = o.run_id
  where o.id = p_order_id and r.rider_id = v_uid
  for update of o;
  if not found then
    raise exception 'This order is not in your run';
  end if;
  if v_order.status <> 'picked_up' then
    raise exception 'Order #% is %, not out for delivery', v_order.order_no, v_order.status;
  end if;

  select * into v_secret from order_secrets where order_id = p_order_id for update;
  if v_secret.failed_attempts >= 5 then
    raise exception 'Too many wrong codes. Call the supplier to confirm this delivery';
  end if;
  if v_secret.delivery_code <> btrim(coalesce(p_code, '')) then
    update order_secrets set failed_attempts = failed_attempts + 1 where order_id = p_order_id;
    v_left := 4 - v_secret.failed_attempts;
    return jsonb_build_object('ok', false,
      'error', 'Wrong code. Ask the retailer for the code from their SMS (' || v_left || ' tries left)');
  end if;

  if p_method = 'mpesa' and nullif(btrim(p_mpesa_ref), '') is null then
    raise exception 'Enter the M-Pesa confirmation code';
  end if;
  v_amount := coalesce(p_amount, v_order.total);

  update orders set status = 'delivered', delivered_at = now(), updated_at = now() where id = p_order_id;
  insert into payments (order_id, method, amount, mpesa_ref, collected_by)
  values (p_order_id, p_method, v_amount, nullif(upper(btrim(p_mpesa_ref)), ''), v_uid);

  -- Restock the retailer's shelf automatically.
  insert into retailer_inventory (retailer_id, product_id, current_stock)
  select v_order.retailer_id, product_id, sum(quantity) from order_items
  where order_id = p_order_id group by product_id
  on conflict (retailer_id, product_id) do update
    set current_stock = retailer_inventory.current_stock + excluded.current_stock, updated_at = now();

  perform notify(v_order.retailer_id, 'order_delivered', 'Order #' || v_order.order_no || ' delivered',
    'Paid ' || ksh(v_amount) || ' by ' || case p_method when 'mpesa' then 'M-Pesa' else 'cash' end
      || '. Stock updated. Report any problem in the app within 24 hours.',
    jsonb_build_object('order_id', p_order_id), true);
  perform notify(v_order.supplier_id, 'order_delivered', 'Order #' || v_order.order_no || ' delivered',
    'Rider collected ' || ksh(v_amount) || case when v_amount < v_order.total
      then ' (short of ' || ksh(v_order.total) || ')' else '' end || '.',
    jsonb_build_object('order_id', p_order_id));

  perform complete_run_if_done(v_order.run_id);
  return jsonb_build_object('ok', true);
end
$$;

create or replace function public.fail_delivery(p_order_id uuid, p_reason text)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('rider');
  v_order orders;
begin
  select o.* into v_order from orders o
  join delivery_runs r on r.id = o.run_id
  where o.id = p_order_id and r.rider_id = v_uid
  for update of o;
  if not found then
    raise exception 'This order is not in your run';
  end if;
  if v_order.status <> 'picked_up' then
    raise exception 'Order #% is %, not out for delivery', v_order.order_no, v_order.status;
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'Say why the delivery failed';
  end if;

  update orders set status = 'failed', status_reason = btrim(p_reason), updated_at = now() where id = p_order_id;

  perform notify(v_order.retailer_id, 'order_failed', 'Order #' || v_order.order_no || ' not delivered',
    'Rider: ' || btrim(p_reason) || '. Contact the supplier to rearrange.',
    jsonb_build_object('order_id', p_order_id), true);
  perform notify(v_order.supplier_id, 'order_failed', 'Order #' || v_order.order_no || ' not delivered',
    'Rider: ' || btrim(p_reason) || '. The goods are coming back to you; re-add them to your stock.',
    jsonb_build_object('order_id', p_order_id), true);

  perform complete_run_if_done(v_order.run_id);
end
$$;

-- ---------------------------------------------------------------------------
-- Scheduled sweeps (called by /api/cron/* with the service role)
-- ---------------------------------------------------------------------------
-- 21:05 — after the cutoff: nudge suppliers about unconfirmed orders for
-- tomorrow and re-offer open runs to riders who became available since.
create or replace function public.evening_sweep()
returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  v_tomorrow date := today_nairobi() + 1;
  v_rec record;
  v_nudged int := 0;
  v_offers int := 0;
begin
  for v_rec in
    select supplier_id, count(*) as n from orders
    where status = 'pending' and delivery_date = v_tomorrow
    group by supplier_id
  loop
    perform notify(v_rec.supplier_id, 'confirm_reminder', v_rec.n || ' orders waiting for you',
      'Confirm or decline tomorrow''s orders before 4 AM or they will be cancelled.', '{}', true);
    v_nudged := v_nudged + 1;
  end loop;

  for v_rec in select id from delivery_runs where status = 'open' and run_date = v_tomorrow loop
    v_offers := v_offers + offer_run(v_rec.id);
  end loop;

  return jsonb_build_object('suppliers_nudged', v_nudged, 'rider_offers', v_offers);
end
$$;

-- 03:30 — before the morning window: cancel orders nobody confirmed and warn
-- suppliers whose run still has no rider.
create or replace function public.morning_sweep()
returns jsonb language plpgsql security definer
set search_path = public
as $$
declare
  v_today date := today_nairobi();
  v_order orders;
  v_run delivery_runs;
  v_cancelled int := 0;
  v_alerted int := 0;
begin
  for v_order in
    update orders
    set status = 'cancelled', status_reason = 'Supplier did not confirm in time', updated_at = now()
    where status = 'pending' and delivery_date <= v_today
    returning *
  loop
    perform notify(v_order.retailer_id, 'order_expired', 'Order #' || v_order.order_no || ' cancelled',
      'The supplier did not confirm in time. You have not been charged.',
      jsonb_build_object('order_id', v_order.id), true);
    v_cancelled := v_cancelled + 1;
  end loop;

  for v_run in
    select * from delivery_runs
    where status = 'open' and run_date = v_today and supplier_alerted_at is null
  loop
    perform notify(v_run.supplier_id, 'run_unassigned', 'No rider for today''s deliveries',
      'No rider has taken your run yet. Book your own rider in the app with their phone number.',
      jsonb_build_object('run_id', v_run.id), true);
    update delivery_runs set supplier_alerted_at = now() where id = v_run.id;
    v_alerted := v_alerted + 1;
  end loop;

  return jsonb_build_object('orders_cancelled', v_cancelled, 'runs_without_rider', v_alerted);
end
$$;

-- Atomically claim queued SMS for sending (also retries failures and
-- messages stuck in 'sending' for over 10 minutes).
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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.supplier_listings enable row level security;
alter table public.retailer_inventory enable row level security;
alter table public.delivery_runs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_secrets enable row level security;
alter table public.payments enable row level security;
alter table public.delivery_issues enable row level security;
alter table public.rider_availability enable row level security;
alter table public.run_offers enable row level security;
alter table public.notifications enable row level security;
alter table public.sms_outbox enable row level security;  -- no policies: service role only

-- Profiles: yourself, any supplier (public business directory), and anyone
-- you share an order with.
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or role = 'supplier' or is_admin() or shares_order_with(id));
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "products_select" on public.products for select to anon, authenticated using (true);

create policy "listings_select" on public.supplier_listings for select to authenticated
  using (is_active or supplier_id = auth.uid());
create policy "listings_insert_own" on public.supplier_listings for insert to authenticated
  with check (supplier_id = auth.uid() and my_role() = 'supplier');
create policy "listings_update_own" on public.supplier_listings for update to authenticated
  using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());
create policy "listings_delete_own" on public.supplier_listings for delete to authenticated
  using (supplier_id = auth.uid());

create policy "inventory_own" on public.retailer_inventory for all to authenticated
  using (retailer_id = auth.uid())
  with check (retailer_id = auth.uid() and my_role() = 'retailer');

create policy "runs_select" on public.delivery_runs for select to authenticated
  using (
    supplier_id = auth.uid() or rider_id = auth.uid() or is_admin()
    or exists (select 1 from orders o where o.run_id = delivery_runs.id and o.retailer_id = auth.uid())
  );

create policy "orders_select" on public.orders for select to authenticated
  using (retailer_id = auth.uid() or supplier_id = auth.uid() or is_run_rider(run_id) or is_admin());

create policy "order_items_select" on public.order_items for select to authenticated
  using (can_see_order(order_id) or is_admin());

create policy "order_secrets_select_retailer" on public.order_secrets for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and o.retailer_id = auth.uid()));

create policy "payments_select" on public.payments for select to authenticated
  using (can_see_order(order_id) or is_admin());

create policy "issues_select" on public.delivery_issues for select to authenticated
  using (can_see_order(order_id) or is_admin());

create policy "availability_select_own" on public.rider_availability for select to authenticated
  using (rider_id = auth.uid());

create policy "notifications_select_own" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Only the read flag of a notification is editable.
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------
-- Internal: never callable through the API.
revoke execute on function
  public.notify(uuid, text, text, text, jsonb, boolean),
  public.offer_run(uuid),
  public.assign_run(uuid, uuid),
  public.complete_run_if_done(uuid),
  public.handle_new_user(),
  public.guard_profile_update(),
  public.check_low_stock(),
  public.require_role(public.user_role)
from public, anon, authenticated;

-- Cron only.
revoke execute on function
  public.evening_sweep(),
  public.morning_sweep(),
  public.claim_sms_batch(int)
from public, anon, authenticated;
grant execute on function
  public.evening_sweep(),
  public.morning_sweep(),
  public.claim_sms_batch(int)
to service_role;

-- User actions: signed-in users only (each function checks the role itself).
revoke execute on function
  public.quote_suppliers(),
  public.place_order(uuid, jsonb, text),
  public.reorder_last_delivery(),
  public.cancel_order(uuid),
  public.report_issue(uuid, public.issue_type, text, numeric),
  public.supplier_respond(uuid, boolean, text),
  public.supplier_assign_rider(uuid, text),
  public.resolve_issue(uuid, text),
  public.set_rider_availability(date, boolean),
  public.open_runs_for_me(),
  public.accept_run(uuid),
  public.release_run(uuid),
  public.mark_run_picked_up(uuid),
  public.confirm_delivery(uuid, text, public.payment_method, numeric, text),
  public.fail_delivery(uuid, text)
from public, anon;
grant execute on function
  public.quote_suppliers(),
  public.place_order(uuid, jsonb, text),
  public.reorder_last_delivery(),
  public.cancel_order(uuid),
  public.report_issue(uuid, public.issue_type, text, numeric),
  public.supplier_respond(uuid, boolean, text),
  public.supplier_assign_rider(uuid, text),
  public.resolve_issue(uuid, text),
  public.set_rider_availability(date, boolean),
  public.open_runs_for_me(),
  public.accept_run(uuid),
  public.release_run(uuid),
  public.mark_run_picked_up(uuid),
  public.confirm_delivery(uuid, text, public.payment_method, numeric, text),
  public.fail_delivery(uuid, text)
to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (dashboards refresh when these change; RLS still applies)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime
      add table public.orders, public.delivery_runs, public.notifications, public.supplier_listings;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Seed catalog
-- ---------------------------------------------------------------------------
insert into public.products (name, category, unit) values
  ('Maize', 'Grains', 'kg'),
  ('Beans (Rosecoco)', 'Grains', 'kg'),
  ('Rice (Pishori)', 'Grains', 'kg'),
  ('Tomatoes', 'Vegetables', 'kg'),
  ('Red Onions', 'Vegetables', 'kg'),
  ('Irish Potatoes', 'Vegetables', 'kg'),
  ('Cabbage', 'Vegetables', 'heads'),
  ('Sukuma Wiki', 'Vegetables', 'bunches'),
  ('Spinach', 'Vegetables', 'bunches'),
  ('Carrots', 'Vegetables', 'kg'),
  ('Bananas (Ripe)', 'Fruits', 'bunches'),
  ('Avocados', 'Fruits', 'pieces'),
  ('Fresh Milk', 'Dairy', 'litres'),
  ('Farm Eggs', 'Dairy', 'trays'),
  ('Cooking Oil', 'Essentials', 'litres'),
  ('Sugar', 'Essentials', 'kg')
on conflict (name) do nothing;
