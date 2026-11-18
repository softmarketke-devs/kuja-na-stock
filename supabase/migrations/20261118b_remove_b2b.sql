-- Removes the butchery / supplier / carrier (B2B) part of the database. BIG Premium Cuts now sells its own
-- stock to customers, so none of it is used any more.
--
-- !! THIS DELETES DATA and cannot be undone. Read it, back up first (Supabase -> Database -> Backups), then run it
-- !! ONCE in the SQL editor, AFTER 20261116a, 20261116b, 20261116c and 20261118_shop_stock.sql.
--
-- What it does, in order:
--   1. Deletes the demo accounts for supplier, butchery and carrier (the demo admin is kept).
--   2. Turns any other old retailer / supplier / rider account into a customer, so nobody is locked out.
--   3. Makes profiles readable by their owner and admins only (the old rule exposed supplier profiles).
--   4. Drops every table, function and type that only the B2B flows used.
-- It keeps: profiles, notifications, sms_outbox, customer_orders, shop_items and the helper functions they use.

begin;

-- 1. Demo accounts (their orders and runs go with them)
delete from auth.users
 where email like 'demo-%@bigcuts.test' and email <> 'demo-admin@bigcuts.test';

-- 2. Old roles become customers. (The old enum values stay in the type; Postgres cannot remove them, and nothing uses them.)
update public.profiles set role = 'customer' where role in ('retailer', 'supplier', 'rider');

-- 3. Profiles: you see your own, admins see all. Replaces a rule that depended on the functions dropped below.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or is_admin());

-- 4. The B2B tables
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

-- ... and the functions that served them (dropped by name, whatever their arguments)
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

-- ... and the types only they used
drop type if exists public.order_status;
drop type if exists public.payment_method;
drop type if exists public.run_status;
drop type if exists public.issue_type;

commit;
