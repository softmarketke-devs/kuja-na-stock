-- Makes one account the shop owner (admin): it can manage stock, price orders and mark them paid or delivered.
-- Run in the Supabase SQL editor. Replace the email with the one you signed up with, then sign out and in again.
-- The website cannot do this on purpose: nobody can make themselves admin.
update public.profiles set role = 'admin'
 where id = (select id from auth.users where email = 'YOUR-EMAIL-HERE');
