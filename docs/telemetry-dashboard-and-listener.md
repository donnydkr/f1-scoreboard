# Telemetry Dashboard And Listener

Dit document beschrijft de telemetry-functionaliteit die naast het bestaande scoreboard is toegevoegd.

Doel van deze laag:

- UDP telemetry van F1 opvangen
- die data apart houden van de bestaande scoreboard-database
- in admin zichtbaar maken wat er binnenkomt en wanneer
- later veilig kunnen doorgroeien naar automatische import van echte rondetijden
- ook geschikt zijn voor tests zonder PlayStation
- rekening houden met twee PlayStations tegelijk

## Hoofdidee

De bestaande app werkte al met:

- een Next.js app
- een hoofd-Postgres database voor `lap_times`
- een admin-omgeving voor invoer en beheer

De telemetry-laag is daar bewust naast gebouwd, niet erdoorheen.

Dat betekent:

- de gewone scoreboard-data blijft in de bestaande database
- telemetry krijgt een eigen Postgres database
- telemetry heeft een eigen admin-overzicht
- ontvangen telemetry schrijft dus niet direct naar `lap_times`

Dat maakt testen veiliger. Als parsing of packet-herkenning nog niet perfect is, raakt dat je echte records niet.

## Wat er is toegevoegd

### Nieuwe admin-routes

- `/admin`
  Compact dashboard met samenvatting en knoppen
- `/admin/records`
  Volledig records-overzicht voor handmatige scoreboard-records
- `/admin/telemetry`
  Telemetry-overzicht met listenerstatus, packets en gedetecteerde rondes

### Nieuwe database-onderdelen

- `db/telemetry-migrations/001_initial_schema.sql`
  Basis-tabellen voor telemetry packets en telemetry lap events
- `db/telemetry-migrations/002_add_lap_event_source_columns.sql`
  Extra kolommen om de bron van lap events op te slaan

### Nieuwe lib/query-bestanden

- `lib/telemetry-db.js`
  Aparte Postgres connectie voor telemetry
- `lib/telemetry-parser.js`
  Binaire packet parsing voor een subset van F1 UDP packets
- `lib/telemetry-receiver.js`
  UDP listener, packet-routing en opslagtrigger
- `lib/telemetry-state.js`
  Runtime status in memory voor listenerstatus en counters
- `db/queries/telemetry.js`
  Inserts en reads voor de telemetry database

### Nieuwe admin-component

- `components/AdminTelemetryDashboard.js`
  UI voor runtime status, packet-overzicht en lap event-overzicht

### Nieuwe testtool

- `scripts/send-telemetry-test.mjs`
  Lokale UDP test-sender die virtuele consoles simuleert

## Architectuur in het kort

De flow is:

1. De admin opent `/admin` of `/admin/telemetry`
2. De app roept `ensureTelemetryReceiverStarted()` aan
3. De UDP listener bindt op `TELEMETRY_UDP_HOST:TELEMETRY_UDP_PORT`
4. Binnenkomende UDP packets worden geparsed
5. Geselecteerde packettypes worden opgeslagen in de telemetry database
6. Gedetecteerde afgeronde rondes worden apart opgeslagen als `telemetry_lap_events`
7. `/admin/telemetry` leest die data terug en toont:
   - listenerstatus
   - runtime counters
   - recente packets
   - recente rondes

## Waarom de listener start vanuit admin-pagina's

Oorspronkelijk was het idee om de listener automatisch te starten bij app-boot.

In de praktijk gaf dat build-problemen in Next.js, omdat de combinatie van:

- `instrumentation.js`
- Node UDP (`node:dgram`)
- `pg`

in die bundel onhandig samenkwam.

Daarom is gekozen voor een stabielere aanpak:

- de listener start zodra een Node-adminpagina wordt geopend
- dat gebeurt nu vanuit:
  - `app/admin/page.js`
  - `app/admin/telemetry/page.js`

Voor deze applicatie is dat prima, omdat telemetry vooral een admin/testfunctie is.

## Aparte telemetry database

De telemetry database gebruikt een eigen connectie en een eigen Docker service:

- hoofd database: `db`
- telemetry database: `telemetry-db`

Belangrijke voordelen:

- geen risico op vervuiling van `lap_times`
- ruwe packets kunnen uitgebreider gelogd worden
- migrations voor telemetry kunnen los evolueren
- je kunt telemetry data makkelijker weggooien of resetten

## Tabellen in de telemetry database

### `telemetry_packets`

Deze tabel bewaart packet-level logging.

Belangrijke velden:

- `received_at`
- `source_ip`
- `source_port`
- `packet_id`
- `packet_name`
- `session_uid`
- `frame_identifier`
- `payload_size_bytes`
- `payload_json`

Doel:

- kunnen zien wat er binnenkwam
- kunnen zien wanneer het binnenkwam
- packettypes kunnen inspecteren zonder direct alles naar scoreboard-data te vertalen

### `telemetry_lap_events`

Deze tabel bewaart gedetecteerde rondes.

Belangrijke velden:

- `received_at`
- `source_ip`
- `source_port`
- `session_uid`
- `driver_name`
- `track_name`
- `completed_lap_number`
- `lap_time_ms`
- `lap_time_display`
- `car_position`
- `raw_summary`

Doel:

- losse ronde-events apart analyseren
- sneller kunnen beoordelen of parsing klopt
- later gecontroleerd kunnen beslissen welke rondes je naar de echte scoreboard-tabellen wilt overzetten

## Welke packets nu ondersteund worden

De parser richt zich nu op een beperkte maar bruikbare subset:

- `session` packet (`packetId = 1`)
- `lap_data` packet (`packetId = 2`)
- `participants` packet (`packetId = 4`)
- `time_trial` packet (`packetId = 14`)

Niet elk packet wordt opgeslagen. De opslag is bewust selectief gehouden via:

- `TELEMETRY_PERSIST_PACKET_IDS`

Standaard:

- `1,2,4,14`

Dat voorkomt dat de telemetry database direct onnodig snel volloopt.

## Hoe packet parsing nu werkt

### Header parsing

`lib/telemetry-parser.js` leest eerst de packet header:

- packet format
- game version
- packet id
- session uid
- frame id
- player car index

Daarna bepaalt de app welk packet-type verder gelezen moet worden.

### Session packet

Uit `session` wordt onder andere gelezen:

- track id
- track name
- session type
- temperaturen

Die informatie wordt in een session-cache gezet.

### Participants packet

Uit `participants` wordt onder andere gelezen:

- player naam
- network id
- race number

Ook die data gaat in de session-cache.

### Lap data packet

Uit `lap_data` leest de app voor de player car:

- laatste rondetijd
- huidig lapnummer
- positie
- sector
- statusvelden

Als een ronde geldig genoeg lijkt, wordt daarvan een `telemetry_lap_event` gemaakt.

## In-memory runtime state

`lib/telemetry-state.js` houdt processtatus bij voor de admin-UI.

Voorbeelden:

- of telemetry aan staat
- of de socket actief luistert
- wanneer de listener gestart is
- hoeveel packets gezien zijn
- hoeveel packets opgeslagen zijn
- hoeveel lap events opgeslagen zijn
- laatste fout

Deze data zit alleen in memory van het actieve Next.js proces.

Dat betekent:

- handig voor live debuggen
- niet bedoeld als permanente bron van waarheid
- na restart beginnen die counters opnieuw

## Session cache

De receiver houdt een kleine cache per `session_uid` bij.

Daarin zit:

- session-info zoals `trackId` en `trackName`
- participants-info zoals naam per car index
- een set van al verwerkte lap keys

Die cache helpt om:

- rondes later te kunnen tonen met coureurnaam en circuitnaam
- dubbele lap events te vermijden

## Waarom twee PlayStations ondersteund kunnen worden

De app is niet gelimiteerd tot één telemetry-bron.

De scheiding gebeurt nu via:

- `source_ip`
- `source_port`
- `session_uid`

In de UI wordt daarom bij telemetry-rondes en packets ook de bron getoond.

Praktisch betekent dit:

- twee consoles kunnen tegelijk naar dezelfde UDP listener sturen
- de app kan de bronnen uit elkaar houden
- in admin kun je zien welke bron welke packets en rondes leverde

Belangrijke nuance:

- de parser leest nu nog primair de `playerCarIndex` per packet
- voor de huidige testdoelen is dat voldoende
- als je later ook complete multiplayer-velden of alle auto's tegelijk wilt volgen, moet de parser verder uitgebreid worden

## Lokale testflow zonder PlayStation

Omdat niet altijd een console beschikbaar is, is er een lokale test-sender toegevoegd.

Bestand:

- `scripts/send-telemetry-test.mjs`

Deze sender bouwt synthetische UDP packets voor:

- `participants`
- `session`
- `lap_data`

En kan twee virtuele consoles simuleren.

### Gebruik in Docker

Omdat `node` of `npm` niet altijd lokaal op Windows beschikbaar is, is de beste route:

```powershell
docker compose exec app npm run telemetry:test
```

Of met expliciete parameters:

```powershell
docker compose exec app node scripts/send-telemetry-test.mjs --host 127.0.0.1 --port 20777 --consoles 2 --laps 4
```

### Wat de test-sender doet

Per virtuele console:

1. stuurt een `participants` packet
2. stuurt een `session` packet
3. stuurt meerdere `lap_data` packets

Elke virtuele console heeft:

- eigen `sessionUid`
- eigen naam
- eigen player car index
- eigen lap times

Zo kun je in `/admin/telemetry` controleren of:

- packets binnenkomen
- lap events verschijnen
- bronnen zichtbaar zijn
- twee consoles gescheiden zichtbaar blijven

## Environment variables

Belangrijke telemetry variabelen:

- `TELEMETRY_DATABASE_HOST`
- `TELEMETRY_DATABASE_PORT`
- `TELEMETRY_POSTGRES_DB`
- `TELEMETRY_POSTGRES_USER`
- `TELEMETRY_POSTGRES_PASSWORD`
- `TELEMETRY_UDP_ENABLED`
- `TELEMETRY_UDP_HOST`
- `TELEMETRY_UDP_PORT`
- `TELEMETRY_PERSIST_PACKET_IDS`

Belangrijke praktijkregel:

- als `TELEMETRY_UDP_ENABLED=false`, dan blijft de listener uit

## Docker-opzet

De Docker setup bevat nu:

- `app`
- `db`
- `telemetry-db`

De app publiceert ook een UDP-poort:

- `${TELEMETRY_UDP_PORT}:${TELEMETRY_UDP_PORT}/udp`

Daardoor kan externe telemetry, bijvoorbeeld van een echte PlayStation, de container bereiken.

## Bekende valkuil bij migrations

De telemetry database draait in Docker met init scripts uit:

- `db/telemetry-migrations/`

Belangrijke nuance:

- die scripts draaien alleen automatisch bij een nieuwe lege Postgres volume

Dus:

- nieuwe migrationbestanden worden niet vanzelf toegepast op een bestaande telemetry volume

Dat was relevant bij de toevoeging van:

- `source_ip`
- `source_port`

Als je een oudere telemetry volume had, moest die volume opnieuw aangemaakt worden of de SQL handmatig uitgevoerd worden.

## Admin-weergave

`/admin/telemetry` laat op dit moment zien:

### Runtime status

- listener aan of uit
- bind host en poort
- starttijd
- laatste packet
- laatste lap
- packet ids die worden opgeslagen
- aantal sessies in cache
- aantal packets gezien door het proces

### Packet verdeling

- welke packet types de listener in dit proces heeft gezien

### Gedetecteerde rondetijden

- ontvangsttijd
- bron
- coureur
- circuit
- lapnummer
- rondetijd
- positie
- bron-type

### Recente packets

- ontvangsttijd
- packetnaam
- bron IP en poort
- frame id
- grootte in bytes
- compacte JSON-samenvatting

## Waarom records en telemetry gescheiden admin-pagina's hebben

Het admin-dashboard werd te vol.

Daarom is de admin-omgeving opgesplitst in:

- `/admin`
  Compact overzicht
- `/admin/records`
  Beheer van handmatige scoreboard-records
- `/admin/telemetry`
  Telemetry testomgeving

Dat houdt de dagelijkse admin-flow rustiger en maakt telemetry meer een aparte debug/test-tool.

## Huidige beperkingen

De telemetry-laag is bruikbaar, maar nog bewust voorzichtig.

Belangrijkste beperkingen:

- parsing richt zich op een beperkte subset van packettypes
- lap detectie focust op de player car
- telemetry schrijft nog niet automatisch door naar `lap_times`
- er is nog geen admin-actie zoals "keur deze telemetry ronde goed"
- er is nog geen retention-strategie voor oude telemetry data

## Goede vervolgstappen

Logische vervolgstappen zijn:

- een admin-knop om telemetry testdata vanuit de UI te genereren
- een knop om een telemetry lap handmatig naar de echte scoreboard-database over te zetten
- uitgebreidere parsing voor meer packettypes
- support voor meer dan alleen de player car
- automatische opschoning van oude telemetry packets
- filters op bron, circuit en sessie in `/admin/telemetry`

## Relevante bestanden

Belangrijkste bestanden van dit geheel:

- `app/admin/page.js`
- `app/admin/records/page.js`
- `app/admin/telemetry/page.js`
- `components/AdminDatabaseManager.js`
- `components/AdminTelemetryDashboard.js`
- `db/queries/telemetry.js`
- `db/telemetry-migrations/001_initial_schema.sql`
- `db/telemetry-migrations/002_add_lap_event_source_columns.sql`
- `docker-compose.yml`
- `docker/app.Dockerfile`
- `lib/admin-text.js`
- `lib/telemetry-db.js`
- `lib/telemetry-parser.js`
- `lib/telemetry-receiver.js`
- `lib/telemetry-state.js`
- `scripts/send-telemetry-test.mjs`

## Samenvatting

De telemetry-laag is opgezet als een veilige teststraat naast het bestaande scoreboard.

Kernpunten:

- aparte database
- aparte admin-pagina
- UDP listener in Node runtime
- packet logging plus aparte lap event opslag
- ondersteuning voor twee bronnen tegelijk
- lokale testmogelijkheid zonder PlayStation

Daarmee kun je eerst betrouwbaar observeren en testen, voordat je besluit om telemetry ook echt automatisch naar je scoreboard-records door te zetten.
