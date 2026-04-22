# Change Guide

Dit document is bedoeld als praktisch naslagwerk voor toekomstige wijzigingen.

## Veelgevraagde wijzigingstypes

## 1. Een veld toevoegen aan opgeslagen rondetijden

Raak meestal deze plekken:

- `components/LapTimeForm.js`
- `app/api/lap-times/route.js`
- `db/queries/lap-times.js`
- `db/migrations/`
- eventueel `components/ScoreboardTable.js`
- eventueel `components/RecentLapTimesList.js`

Controleer altijd:

- frontend validatie
- API-validatie
- SQL insert/select statements
- bestaande migraties versus nieuwe migratie
- eventuele documentatie in `docs/`

## 2. Iets veranderen aan de admin-login

Raak meestal deze plekken:

- `app/admin/login/page.js`
- `components/AdminLoginForm.js`
- `app/api/auth/login/route.js`
- `app/api/auth/logout/route.js`
- `middleware.js`
- `lib/auth.js`
- `.env.example`

## 3. Scoreboard-layout of filtering aanpassen

Raak meestal deze plekken:

- `components/PublicTrackScoreboard.js`
- `components/AdminTrackRecentList.js`
- `components/ScoreboardTable.js`
- `app/globals.css`
- `lib/circuit-assets.js`

## 4. Circuit-assets of vlaggen wijzigen

Raak meestal deze plekken:

- `public/circuits/<slug>/track.png`
- `public/circuits/<slug>/flag.png`
- `lib/circuit-assets.js`
- `docs/f1-2025-track-countries.md`

## 5. Database-schema aanpassen

Werkvolgorde:

1. Nieuwe migratie toevoegen in `db/migrations/`
2. Querylaag aanpassen in `db/queries/`
3. API-routes aanpassen
4. UI aanpassen
5. `README.md` bijwerken als er een nieuwe migratiestap nodig is
6. Relevante docs in `docs/` bijwerken

## Belangrijke conventies in deze repo

- UI-teksten staan centraal in tekstbestanden onder `lib/`
- Circuitnamen worden als strings gebruikt en moeten consistent blijven tussen formulier, assets en database
- Publieke en admin-pagina's zijn server-rendered en forceren dynamische rendering
- Admin-auth is cookie-gebaseerd en hangt af van `.env`
- Grote handmatige style-aanpassingen gebeuren centraal in `app/globals.css`

## Snelle mentale kaart voor Codex

Als je later wilt dat Codex snel werkt, kun je iets zeggen als:

- "Gebruik `docs/repo-overview.md` als startpunt"
- "Gebruik `docs/architecture-and-dataflow.md` voor de datastroom"
- "Gebruik `docs/change-guide.md` als checklist voor de wijziging"

Dat helpt om sneller de juiste bestanden en lagen te vinden.
