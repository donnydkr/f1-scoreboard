alter table if exists telemetry_packets
  add column if not exists listener_port integer;

alter table if exists telemetry_lap_events
  add column if not exists listener_port integer;

create index if not exists telemetry_packets_listener_port_idx
  on telemetry_packets (listener_port, received_at desc);

create index if not exists telemetry_lap_events_listener_port_idx
  on telemetry_lap_events (listener_port, received_at desc);
