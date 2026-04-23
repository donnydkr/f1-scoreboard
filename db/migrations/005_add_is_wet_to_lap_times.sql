alter table lap_times
add column if not exists is_wet boolean not null default false;
