# f1-scoreboard (yes this is ai slop, but it's cool)

A simple web app for tracking and comparing sim racing lap times on a public scoreboard.

## Features
- **Public Scoreboard:** Overview of the fastest times per circuit.
- **Admin Panel:** Secured area (`/admin`) for managing drivers and lap times.
- **Telemetry Test Lane:** Separate UDP telemetry intake and storage for PS5 testing without touching the live lap-time database.
- **Automatic Migrations:** Database schemas are updated automatically through Docker.
- **Responsive Design:** Works on both desktop and mobile while you are on track.

## Structure
- `app/`: Next.js App Router pages and API routes
- `components/`: React components
- `db/`: Database logic, queries, and SQL migrations
- `db/telemetry-migrations/`: Separate schema for the telemetry test database
- `lib/`: Utilities for auth, database connections, and formatting
- `public/circuits/`: Assets such as circuit outlines and flags
- `docs/`: In-depth documentation about the architecture

## Documentation
See the `docs/` folder for more details:
- Repo Overview: Architecture and folder structure
- Architecture & Dataflow: How data moves through the app
- Change Guide: Checklist for adding new features

## Getting Started

### Setup
The environment runs fully in Docker

1. **Environment:** Copy `.env.example` to `.env` and fill in the variables.
2. **Docker:** Start the containers:

```bash
docker compose up -d --build
```

5. Open:

- public scoreboard: `http://localhost:3000`
- admin login: `http://localhost:3000/admin/login`
- telemetry monitor: `http://localhost:3000/admin/telemetry`

## PS5 Telemetry Test Flow

1. Set `TELEMETRY_UDP_ENABLED=true` in `.env`.
2. Start or rebuild with `docker compose up -d --build`.
3. Open `/admin/telemetry` and verify the listener is active.
4. In the F1 game on PS5, point UDP telemetry to the IP address of the machine running this app and to the configured UDP port.
   - PlayStation 01: `20777`
   - PlayStation 02: `20778`
5. Drive a few laps and watch the separate telemetry page fill with packet logs and extracted lap times.

The telemetry listener stores data in a different Postgres database from the existing scoreboard database. The current implementation is intended as a safe test lane: it logs the most useful packet types and separately stores detected lap completions for the player car.

## Local Telemetry Testing Without a PlayStation

You can simulate telemetry locally with:

```bash
npm run telemetry:test
```

By default this sends packets for 2 virtual consoles to `127.0.0.1:20777` and `127.0.0.1:20778`. You can override this:

```bash
node scripts/send-telemetry-test.mjs --host 127.0.0.1 --ports 20777,20778 --consoles 2 --laps 4
```

This is useful to test the telemetry admin page and to validate that the app can distinguish two simultaneous telemetry sources.

If your telemetry database volume already existed before these telemetry schema changes, the new migration files will not be replayed automatically by Postgres. In that case, recreate only the telemetry volume or apply the SQL changes manually before using the updated telemetry overview.

## First Run on Another PC or VPS

If the database is still empty, you do not need to run separate migration commands.
The Postgres container automatically executes the SQL files in `db/migrations/` when a new database volume starts for the first time.

Clean test flow:

1. clone the repo
2. create `.env` based on `.env.example`
3. set safe values in `.env`
4. start with `docker compose up -d --build`

If you want to test from scratch again with an empty database:

```powershell
docker compose down -v
docker compose up -d --build
```

`docker compose down -v` also removes the Postgres volume, so all data will be deleted.

## Production Notes

For production or a VPS:

- set `APP_URL` to your real URL, for example `https://yourdomain.com`
- use strong, unique values for `POSTGRES_PASSWORD` and `ADMIN_SESSION_TOKEN`
- only expose the ports you actually need
- preferably use a reverse proxy with HTTPS for public traffic

## Update Status In Admin

The admin dashboard can show whether the current deploy appears behind GitHub.

How it works:

- the Docker build writes local git metadata into the image
- the admin page compares that build commit with the latest commit on GitHub for the configured branch

Optional environment variables:

- `GITHUB_REPO_BRANCH`
- `GITHUB_API_TOKEN`

For public repositories, the token is usually not required. For private repositories, configure `GITHUB_API_TOKEN`.

## Admin and Public Separation

The public scoreboard page only shows lap times and may be accessed with /scoreboard
The admin route is separately protected with a password, first time login is admin:admin and may be accessed with /admin
The form page is used to enter lap times with track names and setups and may be accessed with /dashboard
The input API only accepts requests with a valid admin session cookie.

## Sources

For the framework choice, I based this on the current official Next.js installation docs and package information:

- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/getting-started/upgrading
- https://www.npmjs.com/package/next
- https://www.npmjs.com/package/pg
