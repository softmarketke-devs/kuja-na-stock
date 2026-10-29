-- Accounts created before the signup trigger existed have no profile row, which made
-- the dashboard redirect in a loop. Create the missing profiles with the same default
-- the trigger uses (retailer). Safe to re-run. Promote an account afterwards with, for example:
--   update profiles set role = 'admin' where id = '<user id>';
insert into public.profiles (id, role, full_name)
select u.id, 'retailer',
       coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
