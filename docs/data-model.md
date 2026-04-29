# Datamodel

De app gebruikt een bewust compact PostgreSQL-model. Coureurs zitten in een eigen tabel, maar rondetijden bewaren nog steeds de coureurnaam en circuitnaam als tekst zodat de eerste versie simpel blijft.

## Tabellen

### `drivers`

- `id`
- `name`
- `created_at`

`name` is uniek. Bij het verwijderen van een coureur verwijdert de app ook alle rondetijden met dezelfde `driver_name`.

### `lap_times`

- `id`
- `driver_name`
- `track_name`
- `car_name`
- `lap_time_ms`
- `lap_time_display`
- `setup`
- `seat`
- `is_wet`
- `session_date`
- `notes`
- `created_at`

Belangrijke regel: per `driver_name`, `track_name` en `is_wet` bewaart de app alleen de snelste tijd. Een langzamere of gelijke nieuwe tijd wordt overgeslagen; een snellere tijd vervangt de vorige beste tijd voor die combinatie.

### `app_settings`

- `key`
- `value`
- `updated_at`

Deze tabel wordt onder andere gebruikt voor `public_active_circuit`, zodat het publieke scoreboard automatisch naar het laatst ingevoerde circuit kan schakelen.

## Nog niet genormaliseerd

Circuits, auto's, setups en stoelen zijn nog geen aparte tabellen. Ze bestaan als vaste opties in de frontend en als tekstwaarden in `lap_times`.

Een logische vervolgstap is normaliseren naar aparte tabellen voor bijvoorbeeld:

- `tracks`
- `cars`
- `setups`
- `seats`
- `sessions`
