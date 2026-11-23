-- Step 1 of 2 for the customer role. Run this on its own FIRST in the Supabase SQL editor, then run
-- 20261116b_customer_orders.sql. (Postgres will not let a new enum value be used in the same transaction.)
-- Safe to re-run.
alter type public.user_role add value if not exists 'customer';
