# Eerste datamodel

## Huidige tabel

De eerste versie gebruikt bewust een simpele tabel:

- `lap_times`

Kolommen:

- `driver_name`
- `track_name`
- `car_name`
- `lap_time_ms`
- `lap_time_display`
- `session_date`
- `notes`
- `created_at`

## Waarom nog niet genormaliseerd

Dit houdt de eerste versie makkelijk te begrijpen en snel bouwbaar.

## Logische vervolgstap

Later kunnen we opsplitsen naar:

- `drivers`
- `tracks`
- `cars`
- `sessions`
- `lap_times`
