-- Step 2 of 2 for the customer role. Run after 20261116a. Safe to re-run.
--
-- Adds retail customers (people buying meat for themselves, not butcheries):
--   1. Customers can sign up (role 'customer'); nobody can make themselves admin.
--   2. customer_orders: what they ordered, where to, and the price BIG confirms. Customers can only read
--      their own rows; every change goes through the functions below.
--   3. Customer places an order; an admin confirms the price (no prices are stored in the database yet,
--      they come from the client), the customer pays (payments come in a later step), the admin marks it delivered.

-- 1. Signup
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
    when 'customer' then 'customer'
    else case when new.raw_app_meta_data->>'provider' = 'google' then 'customer' else 'retailer' end
  end)::user_role;

  insert into profiles (
    id, role, full_name, phone, business_name, supplier_type,
    meat_permit_no, meat_permit_expiry, vehicle_reg, load_capacity_kg
  )
  values (
    new.id,
    v_role,
    coalesce(nullif(btrim(v_meta->>'full_name'), ''), ''),
    normalize_ke_phone(v_meta->>'phone'),
    nullif(btrim(v_meta->>'business_name'), ''),
    case when v_role = 'supplier' then
      (case v_meta->>'supplier_type' when 'slaughterhouse' then 'slaughterhouse' else 'wholesaler' end)::supplier_type
    end,
    case when v_role = 'rider' then nullif(btrim(v_meta->>'meat_permit_no'), '') end,
    case when v_role = 'rider' then nullif(v_meta->>'meat_permit_expiry', '')::date end,
    case when v_role = 'rider' then upper(nullif(btrim(v_meta->>'vehicle_reg'), '')) end,
    case when v_role = 'rider' then nullif(v_meta->>'load_capacity_kg', '')::numeric end
  );
  return new;
end
$$;

-- 2. Orders
create table if not exists public.customer_orders (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  items jsonb not null,                       -- [{ "name": "Ribeye", "kg": 2 }]
  delivery_address text not null,
  phone text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'quoted', 'paid', 'delivered', 'cancelled')),
  items_total_kes numeric(10,2) check (items_total_kes >= 0),   -- set by an admin when they confirm the price
  delivery_fee_kes numeric(10,2) check (delivery_fee_kes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_orders_customer_idx on public.customer_orders (customer_id, created_at desc);
create index if not exists customer_orders_status_idx on public.customer_orders (status, created_at desc);

alter table public.customer_orders enable row level security;
drop policy if exists "customer_orders_select" on public.customer_orders;
create policy "customer_orders_select" on public.customer_orders for select to authenticated
  using (customer_id = auth.uid() or is_admin());
-- No insert/update/delete policies on purpose: the functions below are the only way to change a row.

-- 3. Functions
create or replace function public.place_customer_order(p_items jsonb, p_address text, p_notes text default null)
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
  v_admin uuid;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'Add between 1 and 30 cuts to your order';
  end if;
  if nullif(btrim(p_address), '') is null or length(p_address) > 300 then
    raise exception 'Enter a delivery address';
  end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_name := btrim(v_item->>'name');
    v_kg := (v_item->>'kg')::numeric;
    if v_name is null or v_name = '' or length(v_name) > 60 then raise exception 'Invalid cut name'; end if;
    if v_kg is null or v_kg < 0.5 or v_kg > 50 then raise exception '% must be between 0.5 and 50 kg', v_name; end if;
    v_clean := v_clean || jsonb_build_array(jsonb_build_object('name', v_name, 'kg', v_kg));
  end loop;

  insert into customer_orders (customer_id, items, delivery_address, phone, notes)
  values (v_uid, v_clean, btrim(p_address), (select phone from profiles where id = v_uid), nullif(btrim(left(p_notes, 500)), ''))
  returning id into v_id;

  for v_admin in select id from profiles where role = 'admin' loop
    perform notify(v_admin, 'customer_order', 'New customer order #' || v_id, 'Confirm the price so the customer can pay.', jsonb_build_object('customer_order_id', v_id), false);
  end loop;
  return v_id;
end
$$;

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

create or replace function public.admin_set_customer_order_status(p_order_id bigint, p_status text)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_o customer_orders;
begin
  if not is_admin() then raise exception 'Only admins can do this' using errcode = '42501'; end if;
  if p_status not in ('paid', 'delivered', 'cancelled') then raise exception 'Invalid status'; end if;
  update customer_orders set status = p_status, updated_at = now()
   where id = p_order_id and status not in ('delivered', 'cancelled')
  returning * into v_o;
  if not found then raise exception 'This order is already closed'; end if;
  perform notify(v_o.customer_id, 'customer_order', 'Order #' || v_o.id || ' ' || p_status,
    case p_status when 'delivered' then 'Your order has been delivered. Enjoy!' when 'paid' then 'We received your payment.' else 'Your order was cancelled.' end,
    jsonb_build_object('customer_order_id', v_o.id), true);
end
$$;

create or replace function public.customer_cancel_order(p_order_id bigint)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('customer');
begin
  update customer_orders set status = 'cancelled', updated_at = now()
   where id = p_order_id and customer_id = v_uid and status in ('pending', 'quoted');
  if not found then raise exception 'This order can no longer be cancelled'; end if;
end
$$;

revoke all on function public.place_customer_order(jsonb, text, text) from public, anon;
revoke all on function public.admin_quote_customer_order(bigint, numeric, numeric) from public, anon;
revoke all on function public.admin_set_customer_order_status(bigint, text) from public, anon;
revoke all on function public.customer_cancel_order(bigint) from public, anon;
grant execute on function public.place_customer_order(jsonb, text, text) to authenticated;
grant execute on function public.admin_quote_customer_order(bigint, numeric, numeric) to authenticated;
grant execute on function public.admin_set_customer_order_status(bigint, text) to authenticated;
grant execute on function public.customer_cancel_order(bigint) to authenticated;

-- Live refresh of the order pages.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'customer_orders') then
    alter publication supabase_realtime add table public.customer_orders;
  end if;
end $$;
