alter table if exists telemetry_lap_events
  add column if not exists source_ip text;

alter table if exists telemetry_lap_events
  add column if not exists source_port integer;

create index if not exists telemetry_lap_events_source_ip_idx
  on telemetry_lap_events (source_ip, received_at desc);
