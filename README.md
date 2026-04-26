# f1-scoreboard

Een simpele webapplicatie om rondetijden van simracing-sessies bij te houden en te vergelijken op een publiek scoreboard.

## Features
- **Publiek Scoreboard:** Overzicht van de snelste tijden per circuit.
- **Admin Paneel:** Beveiligde omgeving (`/admin`) voor het beheren van coureurs en tijden.
- **Automatische Migraties:** Database-schema's worden automatisch bijgewerkt via Docker.
- **Responsive Design:** Werkt zowel op desktop als mobiel tijdens het rijden.

## Structuur
- `app/`: Next.js App Router pagina's en API-routes
- `components/`: React componenten.
- `db/`: Database logica (queries en SQL-migraties).
- `lib/`: Utilities voor auth, database connecties en formatting.
- `public/circuits/`: Assets zoals circuit-outlines en vlaggen.
- `docs/`: Diepgaande documentatie over de architectuur.

## Documentatie
Zie de `docs/` map voor meer details:
- Repo Overview: Architectuur en mappenstructuur.
- Architecture & Dataflow: Hoe data door de app stroomt.
- Change Guide: Checklist voor het toevoegen van nieuwe features.

## Starten

### Lokale Ontwikkeling
De omgeving draait volledig in Docker met hot-reloading via een override file.

1. Kopieer `.env.example` naar `.env` en vul de variabelen in.
2. Start de containers:

```bash
docker compose up -d --build
```

5. Open:

- publiek scoreboard: `http://localhost:3000`
- admin login: `http://localhost:3000/admin/login`

## Eerste run op een andere pc of VPS

Als de database nog leeg is, hoef je geen losse migratiecommando's te draaien.
De Postgres-container voert de SQL-bestanden uit `db/migrations/` automatisch uit bij de eerste start van een nieuwe database-volume.

Schone testflow:

1. clone de repo
2. maak `.env` op basis van `.env.example`
3. zet veilige waarden in `.env`
4. start met `docker compose up -d --build`

Als je opnieuw helemaal schoon wilt testen met een lege database:

```powershell
docker compose down -v
docker compose up -d --build
```

`docker compose down -v` verwijdert ook de Postgres-volume, dus alle data gaat dan weg.

## Production notes

Voor productie of een VPS:

- zet `APP_URL` op je echte URL, bijvoorbeeld `https://jouwdomein.nl`
- gebruik sterke, unieke waarden voor `POSTGRES_PASSWORD`, `ADMIN_ACCESS_CODE` en `ADMIN_SESSION_TOKEN`
- publiceer alleen de poorten die je echt nodig hebt
- gebruik bij voorkeur een reverse proxy met HTTPS voor publiek verkeer

## Admin en publiek gescheiden

De publieke scoreboard-pagina toont alleen tijden.
De admin-route is apart afgeschermd met een access code uit `.env`.
De invoer-API accepteert alleen requests met een geldige admin-sessiecookie.

Dat is bewust simpel gehouden zodat je zonder zware auth-setup kunt starten. Later kunnen we dit uitbreiden naar echte gebruikersaccounts.

## Eerste databasis-opzet

De app slaat tijden nu op in een enkele tabel `lap_times`.
Dat houdt de eerste versie overzichtelijk. Later kunnen we dit normaliseren naar bijvoorbeeld:

- `drivers`
- `tracks`
- `cars`
- `sessions`
- `lap_times`

## Bronnen

Voor de frameworkkeuze heb ik me gebaseerd op de actuele officiele Next.js-installatiedocs en pakketinformatie:

- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/getting-started/upgrading
- https://www.npmjs.com/package/next
- https://www.npmjs.com/package/pg

## Repo-klaar voor GitHub

Voor een schone repository commit je in ieder geval niet mee:

- `.next/`
- `node_modules/`
- `.env`

Die lokale bestanden worden nu afgevangen via `.gitignore`.
