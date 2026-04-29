# Repo Overview

Dit document is bedoeld als snel referentiepunt voor hoe deze repository is opgebouwd en waar welke verantwoordelijkheid zit.

## Stack

- Framework: Next.js 15 App Router
- UI: React 19
- Database: PostgreSQL via `pg`
- Styling: centrale globale stylesheet in `app/globals.css`
- Auth: simpele admin-cookie op basis van `.env`

## Hoofddoel van de app

De app heeft twee hoofdrollen:

- Publieke scoreboard-pagina op `/` voor het tonen van rondetijden
- Admin-omgeving op `/admin` voor login, invoer en beheer van tijden

## Belangrijkste mappen

- `app/`
  Next.js routes, pagina's en API-endpoints
- `components/`
  Herbruikbare UI-componenten voor publiek en admin
- `db/migrations/`
  SQL-migraties voor het schema
- `db/queries/`
  Database-querylaag die door pagina's en API-routes wordt gebruikt
- `lib/`
  Tekstconfig, auth helpers, constants, DB-helper en andere kleine utilities
- `public/`
  Statische assets, met per circuit een eigen map voor `track.png` en `flag.png`
- `docs/`
  Projectdocumentatie en referentiepunten

## Kernroutes

- `/`
  Laadt alle tijden op en toont het publieke scoreboard
- `/admin/login`
  Loginformulier voor de admin-omgeving
- `/admin`
  Beveiligde pagina met invoerformulier en recente tijden

## API-routes

- `POST /api/auth/login`
  Controleert de admin access code en zet de sessiecookie
- `POST /api/auth/logout`
  Verwijdert de sessiecookie en redirect naar `/admin/login`
- `POST /api/drivers`
  Maakt een coureur aan of retourneert een bestaande
- `POST /api/lap-times`
  Slaat een rondetijd op of vervangt een eerdere langzamere tijd voor dezelfde coureur op hetzelfde circuit
- `DELETE /api/lap-times/[id]`
  Verwijdert een bestaande rondetijd

## Belangrijkste componenten

- `components/PublicTrackScoreboard.js`
  Hoofdweergave van het publieke scoreboard
- `components/ScoreboardTable.js`
  Tabelweergave van top- en recente tijden
- `components/AdminShell.js`
  Bovenste admin-layout met header en logout
- `components/LapTimeForm.js`
  Invoerformulier voor nieuwe tijden
- `components/AdminTrackRecentList.js`
  Admin-filtering per circuit en overzicht van recente tijden
- `components/RecentLapTimesList.js`
  Lijst met recente tijden plus delete-knop
- `components/DriverName.js`
  Weergave van coureursnamen inclusief optionele F1-stijl 3-letter code

## Belangrijkste lib-bestanden

- `lib/db.js`
  Bouwt de Postgres connectie op
- `lib/auth.js`
  Controleert of de admin-cookie geldig is
- `lib/constants.js`
  Centrale constants zoals cookie-naam en refresh-interval
- `lib/admin-text.js`
  Teksten voor admin UI en API-fouten
- `lib/public-text.js`
  Teksten voor de publieke UI
- `lib/circuit-assets.js`
  Mapping van circuitnaam naar outline- en vlag-assets

## Data-opzet in het kort

De kernentiteiten zijn:

- `drivers`
  Bevat coureurnamen
- `lap_times`
  Bevat per record een tijd voor een coureur op een circuit

Belangrijke ontwerpkeuze:

- Bij het opslaan van een nieuwe tijd wordt per `driver_name + track_name + is_wet` alleen de snelste tijd bewaard
- Een nieuwe langzamere of gelijke tijd wordt niet opgeslagen
- Een nieuwe snellere tijd vervangt de vorige tijd voor die combinatie
- Setup en stoel worden als tekstwaarden op de rondetijd opgeslagen

## Config via environment variables

Zie `.env.example` voor de basisinstellingen:

- `DATABASE_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `APP_URL`
- `ADMIN_ACCESS_CODE`
- `ADMIN_SESSION_TOKEN`

## Hoe dit document later handig is

Als je later aan Codex wilt vragen om iets aan te passen, kun je verwijzen naar dit document voor:

- waar functionaliteit globaal leeft
- welke route of component waarschijnlijk geraakt moet worden
- welke laag verantwoordelijk is: pagina, component, API, query of migratie
