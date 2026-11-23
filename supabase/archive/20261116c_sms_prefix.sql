-- Texts now start with "BIG:" instead of the old "KNS:". Safe to re-run.
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
      values (p_user, v_phone, 'BIG: ' || p_title || '. ' || p_message);
    end if;
  end if;
end
$$;
