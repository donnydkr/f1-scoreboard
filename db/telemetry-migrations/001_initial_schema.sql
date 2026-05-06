create table if not exists telemetry_packets (
  id bigserial primary key,
  received_at timestamptz not null default now(),
  source_ip text,
  source_port integer,
  packet_format integer,
  game_year integer,
  game_major_version integer,
  game_minor_version integer,
  packet_version integer,
  packet_id integer not null,
  packet_name text not null,
  session_uid text,
  session_time_seconds numeric(10, 3),
  frame_identifier bigint,
  overall_frame_identifier bigint,
  player_car_index integer,
  secondary_player_car_index integer,
  payload_size_bytes integer not null,
  packet_hex_preview text,
  payload_json jsonb
);

create index if not exists telemetry_packets_received_at_idx
  on telemetry_packets (received_at desc);

create index if not exists telemetry_packets_packet_id_idx
  on telemetry_packets (packet_id, received_at desc);

create index if not exists telemetry_packets_session_uid_idx
  on telemetry_packets (session_uid, received_at desc);

create table if not exists telemetry_lap_events (
  id bigserial primary key,
  telemetry_packet_id bigint references telemetry_packets(id) on delete set null,
  received_at timestamptz not null default now(),
  session_uid text,
  packet_format integer,
  driver_index integer not null,
  player_car_index integer,
  is_player_car boolean not null default false,
  driver_name text,
  track_id integer,
  track_name text,
  session_type integer,
  completed_lap_number integer,
  current_lap_number integer,
  lap_time_ms integer not null,
  lap_time_display text not null,
  current_lap_time_ms integer,
  sector integer,
  result_status integer,
  pit_status integer,
  car_position integer,
  source text not null default 'lap_data',
  raw_summary jsonb
);

create unique index if not exists telemetry_lap_events_unique_idx
  on telemetry_lap_events (
    session_uid,
    driver_index,
    coalesce(completed_lap_number, -1),
    lap_time_ms,
    source
  );

create index if not exists telemetry_lap_events_received_at_idx
  on telemetry_lap_events (received_at desc);

create index if not exists telemetry_lap_events_track_name_idx
  on telemetry_lap_events (track_name, received_at desc);
