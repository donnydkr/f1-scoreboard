create table if not exists lap_times (
  id bigserial primary key,
  driver_name text not null,
  track_name text not null,
  car_name text not null,
  lap_time_ms integer not null check (lap_time_ms > 0),
  lap_time_display text not null,
  session_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists lap_times_best_time_idx
  on lap_times (lap_time_ms asc, created_at asc);

create index if not exists lap_times_recent_idx
  on lap_times (created_at desc);

create index if not exists lap_times_session_date_idx
  on lap_times (session_date desc);
