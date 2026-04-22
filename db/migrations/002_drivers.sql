create table if not exists drivers (
  id bigserial primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into drivers (name)
select distinct driver_name
from lap_times
where driver_name is not null
  and trim(driver_name) <> ''
on conflict (name) do nothing;

create index if not exists drivers_name_idx
  on drivers (name asc);
