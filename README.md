# f1-scoreboard

Eigen applicatie voor het invoeren, opslaan en tonen van race tijden bij de sims.

## Wat staat er nu

Deze eerste versie bevat:

- een publieke scoreboard-pagina op `/`
- een afgeschermde admin-login op `/admin/login`
- een admin-invoerscherm op `/admin`
- een Postgres-database in Docker
- een eerste SQL-migratie voor `lap_times`

## Structuur

- `app/`: Next.js App Router pagina's en API-routes
- `components/`: herbruikbare UI-componenten
- `lib/`: helpers voor database, tijd-formatting en auth
- `db/migrations/`: SQL migraties
- `db/queries/`: query helpers
- `public/circuits/<slug>/`: circuitafbeelding (`track.png`) en vlag (`flag.png`) per circuit
- `docker/`: Dockerfile voor de app
- `docs/`: aanvullende documentatie

## Interne referentie-docs

Voor sneller begrip van de codebase staan in `docs/` ook deze referenties:

- `repo-overview.md`: snelle uitleg van structuur, verantwoordelijkheden en kernbestanden
- `architecture-and-dataflow.md`: hoe auth, pagina's, API en database samenhangen
- `change-guide.md`: praktische checklist voor toekomstige wijzigingen

## Starten

De standaard `docker-compose.yml` is nu ingericht voor een productie-achtige run:

- de app bouwt eerst met `next build`
- de app start met `npm run start`
- de broncode wordt niet als volume ingemount
- een lege Postgres-volume voert automatisch alle SQL-bestanden in `db/migrations/` uit

Voor lokaal ontwikkelen kun je nog steeds handmatig `npm install` en `npm run dev` gebruiken buiten Docker.

1. Maak `.env` op basis van `.env.example`
2. Vul veilige waarden in voor:
   `POSTGRES_PASSWORD`, `ADMIN_ACCESS_CODE`, `ADMIN_SESSION_TOKEN`
3. Gebruik voor lokaal draaien buiten Docker Compose standaard:
   `DATABASE_HOST=localhost`
4. Start de omgeving:

```powershell
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
