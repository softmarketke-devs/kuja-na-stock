-- Incremental migration for a database that already has the v0.6.0 schema.
-- Run once in the Supabase SQL editor. Safe to re-run: functions use
-- "create or replace", grants are idempotent and the seed skips existing names.
--
-- 1. Carriers must be checked by an admin before they can take runs.
-- 2. Admin function to mark a carrier's permit and vehicle as checked.
-- 3. Larger red-meat catalogue (cuts and trade names).
--
-- NOTE: after step 1, every existing carrier is blocked until an admin checks
-- them (see /dashboard/admin). Mark existing test carriers with:
--   update profiles set is_verified = true where role = 'rider';

-- 1. Permit check rule
create or replace function public.carrier_block_reason(p_carrier profiles, p_run_id uuid, p_run_date date)
returns text language plpgsql stable security definer
set search_path = public
as $$
declare
  v_kg numeric := run_load_kg(p_run_id);
begin
  if nullif(btrim(p_carrier.meat_permit_no), '') is null or p_carrier.meat_permit_expiry is null then
    return 'No meat transport permit is recorded on your account';
  end if;
  if not p_carrier.is_verified then
    return 'Your permit and vehicle have not been checked yet. An admin must check them before you can take runs';
  end if;
  if p_carrier.meat_permit_expiry < p_run_date then
    return 'Your meat transport permit expires before ' || to_char(p_run_date, 'Dy DD Mon') || '. Renew it and update your account page';
  end if;
  if nullif(btrim(p_carrier.vehicle_reg), '') is null or p_carrier.load_capacity_kg is null then
    return 'Add your vehicle registration and load capacity on your account page';
  end if;
  if v_kg > p_carrier.load_capacity_kg then
    return 'This run is ' || v_kg || ' kg, more than the ' || p_carrier.load_capacity_kg || ' kg load capacity';
  end if;
  return null;
end
$$;

-- 2. Admin check function
create or replace function public.admin_set_carrier_verified(p_carrier_id uuid, p_verified boolean)
returns void language plpgsql security definer
set search_path = public
as $$
declare
  v_carrier profiles;
begin
  perform require_role('admin');
  select * into v_carrier from profiles where id = p_carrier_id and role = 'rider' for update;
  if not found then
    raise exception 'Carrier not found';
  end if;
  if p_verified and (nullif(btrim(v_carrier.meat_permit_no), '') is null
      or v_carrier.meat_permit_expiry is null
      or nullif(btrim(v_carrier.vehicle_reg), '') is null) then
    raise exception 'This carrier has not recorded a permit and vehicle yet';
  end if;
  if v_carrier.is_verified = p_verified then
    return;
  end if;

  update profiles set is_verified = p_verified where id = p_carrier_id;
  if p_verified then
    perform notify(p_carrier_id, 'carrier_verified', 'Permit checked',
      'Your permit and vehicle have been checked. You can now take runs.', '{}', true);
  else
    perform notify(p_carrier_id, 'carrier_unverified', 'Permit needs attention',
      'Your permit or vehicle could not be confirmed. Check the details on your account page or contact us.', '{}', true);
  end if;
end
$$;

revoke execute on function public.admin_set_carrier_verified(uuid, boolean) from public, anon;
grant execute on function public.admin_set_carrier_verified(uuid, boolean) to authenticated;

-- 3. Catalogue
insert into public.products (name, category, unit) values
  ('Beef (with bone)', 'Beef', 'kg'),
  ('Beef (boneless)', 'Beef', 'kg'),
  ('Beef steak (fillet)', 'Beef', 'kg'),
  ('Beef bones', 'Beef', 'kg'),
  ('Goat meat', 'Goat & mutton', 'kg'),
  ('Mutton', 'Goat & mutton', 'kg'),
  ('Matumbo (beef tripe)', 'Offal', 'kg'),
  ('Beef liver', 'Offal', 'kg'),
  ('Goat offal (mixed)', 'Offal', 'kg'),
  -- Cuts and trade names benchmarked against a Nairobi retail butchery's counter.
  ('Sirloin steak', 'Beef', 'kg'),
  ('T-bone steak', 'Beef', 'kg'),
  ('Rib eye', 'Beef', 'kg'),
  ('Rump steak', 'Beef', 'kg'),
  ('Topside steak', 'Beef', 'kg'),
  ('Silverside steak', 'Beef', 'kg'),
  ('Beef short ribs', 'Beef', 'kg'),
  ('Ossobuco (beef shank)', 'Beef', 'kg'),
  ('Beef blade (gichiri)', 'Beef', 'kg'),
  ('Beef cubes (stewing)', 'Beef', 'kg'),
  ('Beef mince', 'Beef', 'kg'),
  ('Lean steak mince', 'Beef', 'kg'),
  ('Beef fat', 'Beef', 'kg'),
  ('Ox tail', 'Offal', 'kg'),
  ('Beef kidney', 'Offal', 'kg'),
  ('Ox tongue', 'Offal', 'kg'),
  ('Beef heart', 'Offal', 'kg'),
  ('Beef trotters', 'Offal', 'kg'),
  ('Goat matumbo', 'Offal', 'kg'),
  ('Goat liver', 'Offal', 'kg'),
  ('Goat head (cleaned)', 'Offal', 'kg'),
  ('Goat trotters', 'Offal', 'kg'),
  ('Whole goat carcass', 'Goat & mutton', 'kg'),
  ('Whole lamb carcass', 'Goat & mutton', 'kg'),
  ('Goat ribs', 'Goat & mutton', 'kg'),
  ('Goat leg', 'Goat & mutton', 'kg'),
  ('Goat shoulder', 'Goat & mutton', 'kg'),
  ('Lamb leg', 'Goat & mutton', 'kg'),
  ('Lamb loin chops', 'Goat & mutton', 'kg'),
  ('Mutton mince', 'Goat & mutton', 'kg')
on conflict (name) do nothing;
