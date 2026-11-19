-- Standard pricing: an order is priced the moment it is placed, from the shop's prices, so the customer can pay straight away.
-- The admin only steps in to change a price, or when a cut has no price yet.
-- Run AFTER 20261118_shop_stock.sql. Safe to re-run.
--
--   shop_settings.delivery_fee_kes   one standard delivery fee, set on the admin Stock page. Until it is set,
--                                    orders still wait for the admin to give a delivery fee (nothing is guessed).
--   place_customer_order             if every cut in the order has a price AND the delivery fee is set, the order is
--                                    saved as already priced ("quoted"); otherwise it waits for the admin as before.

create table if not exists public.shop_settings (
  id int primary key default 1 check (id = 1),               -- one row
  delivery_fee_kes numeric(10,2) check (delivery_fee_kes >= 0),
  updated_at timestamptz not null default now()
);
insert into public.shop_settings (id) values (1) on conflict (id) do nothing;

alter table public.shop_settings enable row level security;
drop policy if exists "shop_settings_select" on public.shop_settings;
-- Everyone can read it (the cart shows the delivery fee); only admin_set_delivery_fee below can change it.
create policy "shop_settings_select" on public.shop_settings for select to anon, authenticated using (true);

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
revoke all on function public.admin_set_delivery_fee(numeric) from public, anon;
grant execute on function public.admin_set_delivery_fee(numeric) to authenticated;

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
revoke all on function public.place_customer_order(jsonb, text, text, text) from public, anon;
grant execute on function public.place_customer_order(jsonb, text, text, text) to authenticated;

-- Live refresh of the order pages when the fee changes is not needed; the cart reads it on each page load.
