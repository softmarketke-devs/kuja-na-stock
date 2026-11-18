-- BIG Premium Cuts sells its own stock. This adds the shop's stock list and makes ordering respect it.
-- Run AFTER 20261116a, 20261116b and 20261116c. Safe to re-run.
--
--   shop_items       the cuts you sell: price per kg, kilos in stock, on or off the website.
--   Ordering         a customer can only order cuts that are on and have enough stock. Placing an order takes the kilos
--                    out of stock in the same step (two people cannot both buy the last kilos); cancelling puts them back.
--   Estimated price  an order gets an estimated total from the shop prices; the admin still confirms the final price,
--                    because the real weight of a cut can differ.

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
create policy "shop_items_select" on public.shop_items for select to anon, authenticated
  using (is_active or is_admin());
-- No insert/update/delete policy on purpose: admins change items through admin_save_shop_item below.

-- The cuts from the old hard-coded list, all OFF with no stock so nothing is sold until you set real numbers.
-- Prices already confirmed by the client are filled in.
insert into public.shop_items (name, blurb, image, price_per_kg, sort_order) values
  ('Tomahawk', 'Bone-in ribeye, the showpiece.', '/cuts/tomahawk.jpg', null, 10),
  ('Sirloin on Bone', 'Dry-aged, bone-in.', '/cuts/sirloin-on-bone.jpg', 1420, 20),
  ('Oxtail', 'Our best seller.', '/cuts/oxtail.jpg', null, 30),
  ('Mutura', 'Grilled Kenyan sausage, sold as a 1 kg pack.', '/cuts/mutura.png', 1350, 40),
  ('The Steak Bundle', 'Tomahawk, T-bone and cowboy rib.', '/cuts/the-steak-bundle.jpg', null, 50),
  ('Cowboy Rib', null, null, null, 60), ('T-bone', null, null, null, 61), ('Ribeye', null, null, null, 62),
  ('Fillet', null, null, null, 63), ('Short Ribs', null, null, null, 64), ('Brisket', null, null, null, 65),
  ('Shank', null, null, null, 66), ('Osso Buco', null, null, null, 67), ('Stew Cuts', null, null, null, 68),
  ('Chunk', null, null, null, 69), ('Minced Meat', null, null, null, 70), ('Liver', null, null, null, 71),
  ('Kidney', null, null, null, 72), ('Heart', null, null, null, 73), ('Pork Rib-eye Chops', null, null, null, 74),
  ('Whole Rabbit', null, null, 1550, 75)
on conflict (name) do nothing;

-- Admin adds or edits a cut. p_id null = new cut.
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

alter table public.customer_orders add column if not exists estimated_total_kes numeric(10,2);

-- Puts an order's kilos back on the shelf (cancelled before delivery).
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
revoke all on function public.restore_shop_stock(jsonb) from public, anon, authenticated;

-- Placing an order now checks and takes the stock.
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

  insert into customer_orders (customer_id, items, delivery_address, phone, notes, payment_method, estimated_total_kes)
  values (v_uid, v_clean, btrim(p_address), (select phone from profiles where id = v_uid), nullif(btrim(left(p_notes, 500)), ''), p_payment_method,
          case when v_all_priced then v_est end)
  returning id into v_id;

  for v_admin in select id from profiles where role = 'admin' loop
    perform notify(v_admin, 'customer_order', 'New customer order #' || v_id, 'Confirm the price so the customer can pay.', jsonb_build_object('customer_order_id', v_id), false);
  end loop;
  return v_id;
end
$$;

create or replace function public.customer_cancel_order(p_order_id bigint)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := require_role('customer');
  v_o customer_orders;
begin
  update customer_orders set status = 'cancelled', updated_at = now()
   where id = p_order_id and customer_id = v_uid and status in ('pending', 'quoted')
  returning * into v_o;
  if not found then raise exception 'This order can no longer be cancelled'; end if;
  perform restore_shop_stock(v_o.items);
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

revoke all on function public.admin_save_shop_item(uuid, text, text, numeric, numeric, boolean) from public, anon;
grant execute on function public.admin_save_shop_item(uuid, text, text, numeric, numeric, boolean) to authenticated;
revoke all on function public.place_customer_order(jsonb, text, text, text) from public, anon;
grant execute on function public.place_customer_order(jsonb, text, text, text) to authenticated;
