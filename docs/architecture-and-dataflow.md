# Architecture And Dataflow

Dit document beschrijft hoe data, pagina's en mutaties door de app bewegen.

## Runtime-model

De app gebruikt server-rendered pagina's binnen de Next.js App Router.

- `app/page.js`
  Vraagt alle tijden op via `getAllLapTimes()` en rendert het publieke scoreboard
- `app/admin/page.js`
  Vraagt chauffeurs en recente tijden op en rendert de admin-omgeving

Beide pagina's gebruiken:

- `export const dynamic = "force-dynamic"`

Daardoor worden de pagina's niet statisch gecached en blijven database-updates zichtbaar.

## Publieke flow

1. De browser opent `/`
2. `app/page.js` roept `getAllLapTimes()` aan
3. De querylaag leest records uit `lap_times`
4. `PublicTrackScoreboard` toont:
   - geselecteerd circuit
   - top 10 tijden
   - recente tijden
   - circuitfilters met outline en vlag
5. `AutoRefresh` roept periodiek `router.refresh()` aan om nieuwe data op te halen

## Admin-auth flow

1. Een gebruiker opent `/admin`
2. `middleware.js` controleert of het pad onder `/admin` valt
3. Als het geen `/admin/login` is, wordt `hasValidAdminSession()` gebruikt
4. Zonder geldige cookie volgt redirect naar `/admin/login`
5. `AdminLoginForm` stuurt de access code naar `POST /api/auth/login`
6. De login-route vergelijkt deze met `ADMIN_ACCESS_CODE`
7. Bij succes wordt een cookie gezet met `ADMIN_SESSION_TOKEN`
8. Daarna kan `/admin` worden bezocht

## Tijd opslaan

1. In de admin-pagina vult de gebruiker `LapTimeForm` in
2. Het formulier verstuurt JSON naar `POST /api/lap-times`
3. De API-route:
   - valideert admin-sessie
   - valideert velden
   - parseert de tijd naar milliseconden
   - roept `createLapTime()` aan
4. `createLapTime()`:
   - opent een database-transactie
   - zoekt bestaande records voor dezelfde coureur en hetzelfde circuit
   - vergelijkt de snelste bestaande tijd met de nieuwe tijd
   - slaat langzamere of gelijke tijd niet op
   - verwijdert eerdere records voor die combinatie als de nieuwe tijd sneller is
   - schrijft de nieuwe snelste tijd weg
5. De frontend toont feedback en doet `router.refresh()`

## Coureur aanmaken

1. In `LapTimeForm` kan een nieuwe coureur worden toegevoegd
2. Het formulier stuurt een request naar `POST /api/drivers`
3. De API-route valideert admin-auth en naam
4. `createDriver()` doet een insert met conflict-afhandeling op `name`
5. De nieuwe of bestaande coureur wordt teruggegeven en meteen geselecteerd in het formulier

## Tijd verwijderen

1. In de admin recente tijdenlijst kan een record worden verwijderd
2. `DELETE /api/lap-times/[id]` wordt aangeroepen
3. De route valideert admin-auth en record-id
4. `deleteLapTimeById()` verwijdert het record
5. De frontend refresht daarna de pagina

## Database-lagen

### Querylaag

De querylaag zit in `db/queries/`:

- `drivers.js`
  Voor ophalen en aanmaken van coureurs
- `lap-times.js`
  Voor lezen, schrijven en verwijderen van tijden

### SQL-schema

Migraties zitten in `db/migrations/`.

Belangrijke bestanden:

- `001_initial_schema.sql`
  Basis `lap_times` tabel
- `002_drivers.sql`
  `drivers` tabel
- `003_app_settings.sql`
  Algemene app-instellingen
- `004_remove_sim_name.sql`
  Verwijdert de oude ongebruikte `sim_name` kolom

## Presentatielagen

### Publiek

- `PublicTrackScoreboard`
  Centrale publieke scoreboard-component
- `ScoreboardTable`
  Tabel voor top- en recente tijden

### Admin

- `AdminShell`
  Admin header en logout
- `LapTimeForm`
  Invoer voor tijden
- `AdminTrackRecentList`
  Circuitfilters en recente tijden
- `RecentLapTimesList`
  Verwijderbare lijstweergave

## Belangrijke ontwerpkeuzes

- Auth is bewust simpel gehouden: geen usersysteem, alleen een geheime code en sessiecookie
- Het publieke scoreboard leest direct uit dezelfde database als de admin-invoer
- Er wordt per coureur per circuit maar één snelste tijd bewaard
- UI-teksten zijn gecentraliseerd in `lib/admin-text.js` en `lib/public-text.js`
- Styling zit grotendeels centraal in `app/globals.css`

## Waar je iets moet aanpassen

Als je iets wilt wijzigen, is dit meestal de route:

- Nieuwe UI-tekst:
  `lib/admin-text.js` of `lib/public-text.js`
- Nieuwe invoervelden:
  `components/LapTimeForm.js`, API-route, querylaag en migratie
- Nieuwe scoreboardweergave:
  `components/PublicTrackScoreboard.js` en/of `components/ScoreboardTable.js`
- Admin-beveiliging:
  `middleware.js`, `lib/auth.js`, auth API-routes
- Databasegedrag:
  `db/queries/*.js` plus eventueel `db/migrations/*.sql`
