-- Incremental migration. Safe to re-run.
-- 1. products.search_keywords for synonym search.
-- 2. quote_suppliers() now also returns supplier phone, the product's keywords,
--    and listings with zero stock (is_active but available_qty = 0) so retailers
--    can see the cut exists. The UI disables "Add" for them.

alter table public.products add column if not exists search_keywords text[] not null default '{}';

update public.products set search_keywords = v.k
from (values
  ('tenderloin',   array['fillet','filet','steak','beef','premium']),
  ('mince',        array['minced','ground','beef mince','kima']),
  ('matumbo',      array['tripe','offal','stomach']),
  ('ribs',         array['short ribs','goat ribs','nyama choma']),
  ('liver',        array['kidney','offal','maini']),
  ('sirloin',      array['steak','beef','rump'])
) as v(n, k)
where lower(public.products.name) like '%' || v.n || '%' and public.products.search_keywords = '{}';

drop function if exists public.quote_suppliers();
create function public.quote_suppliers()
returns table (
  listing_id uuid,
  supplier_id uuid,
  supplier_name text,
  supplier_type public.supplier_type,
  supplier_verified boolean,
  supplier_phone text,
  product_id uuid,
  product_name text,
  category text,
  unit text,
  search_keywords text[],
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
    l.id, s.id, coalesce(s.business_name, s.full_name), s.supplier_type, s.is_verified, s.phone,
    p.id, p.name, p.category, p.unit, p.search_keywords,
    l.price_per_unit, l.available_qty, l.min_order_qty,
    road_km(me.location, s.location),
    delivery_fee_for(road_km(me.location, s.location)),
    road_km(me.location, s.location) <= s.service_radius_km
  from profiles me
  join supplier_listings l on l.is_active
  join profiles s on s.id = l.supplier_id and s.role = 'supplier' and s.location is not null
  join products p on p.id = l.product_id
  where me.id = auth.uid() and me.location is not null
  order by p.name, l.price_per_unit
$$;

revoke execute on function public.quote_suppliers() from public, anon;
grant execute on function public.quote_suppliers() to authenticated;
