-- Live tracking of a delivery run. Safe to re-run.
-- One row per run holds the carrier's latest position. The carrier's phone sends
-- it through report_run_location() while the run is picked_up. The supplier, the
-- carrier and every retailer with an order on the run can read it (via the
-- delivery_runs policy). The row is deleted when the run ends.

create table if not exists public.run_locations (
  run_id uuid primary key references public.delivery_runs(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  heading double precision,
  speed_kmh double precision,
  updated_at timestamptz not null default now()
);

alter table public.run_locations enable row level security;

drop policy if exists "run_locations_select" on public.run_locations;
create policy "run_locations_select" on public.run_locations for select to authenticated
  using (exists (select 1 from public.delivery_runs r where r.id = run_locations.run_id));

create or replace function public.report_run_location(
  p_run_id uuid, p_lat double precision, p_lng double precision,
  p_heading double precision default null, p_speed_kmh double precision default null
) returns void language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := require_role('rider');
begin
  if not exists (
    select 1 from delivery_runs where id = p_run_id and rider_id = v_uid and status = 'picked_up'
  ) then
    raise exception 'Location is shared only while you are on this run';
  end if;
  insert into run_locations (run_id, rider_id, lat, lng, heading, speed_kmh, updated_at)
  values (p_run_id, v_uid, p_lat, p_lng, p_heading, p_speed_kmh, now())
  on conflict (run_id) do update
    set lat = excluded.lat, lng = excluded.lng, heading = excluded.heading,
        speed_kmh = excluded.speed_kmh, updated_at = now();
end
$$;

revoke execute on function public.report_run_location(uuid, double precision, double precision, double precision, double precision) from public, anon;
grant execute on function public.report_run_location(uuid, double precision, double precision, double precision, double precision) to authenticated;

-- Stop keeping a position once the run is over (or handed back).
create or replace function public.clear_run_location() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from 'picked_up' then
    delete from run_locations where run_id = new.id;
  end if;
  return new;
end
$$;

drop trigger if exists trg_clear_run_location on public.delivery_runs;
create trigger trg_clear_run_location after update of status on public.delivery_runs
  for each row when (old.status = 'picked_up' and new.status <> 'picked_up')
  execute function public.clear_run_location();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'run_locations') then
    alter publication supabase_realtime add table public.run_locations;
  end if;
end
$$;
