# f1-scoreboard

A simple web app for tracking and comparing sim racing lap times on a public scoreboard.

## Features
- **Public Scoreboard:** Overview of the fastest times per circuit.
- **Admin Panel:** Secured area (`/admin`) for managing drivers and lap times.
- **Automatic Migrations:** Database schemas are updated automatically through Docker.
- **Responsive Design:** Works on both desktop and mobile while you are on track.

## Structure
- `app/`: Next.js App Router pages and API routes
- `components/`: React components
- `db/`: Database logic, queries, and SQL migrations
- `lib/`: Utilities for auth, database connections, and formatting
- `public/circuits/`: Assets such as circuit outlines and flags
- `docs/`: In-depth documentation about the architecture

## Documentation
See the `docs/` folder for more details:
- Repo Overview: Architecture and folder structure
- Architecture & Dataflow: How data moves through the app
- Change Guide: Checklist for adding new features

## Getting Started

### Authentication & Setup
The environment runs fully in Docker with hot reloading through an override file.

1. **Git Auth:** SSH is recommended. For 1Password users, add this to `~/.ssh/config`:
   ```ssh
   Host *
     IdentityAgent "~/Library/Group Containers/2BU8B4S4NG.com.1password/t/agent.sock"
   ```
   Then update your remote:
   ```bash
   git remote set-url origin git@github.com:your-user/f1-scoreboard.git
   ```
2. **Environment:** Copy `.env.example` to `.env` and fill in the variables.
3. **Docker:** Start the containers:

```bash
docker compose up -d --build
```

5. Open:

- public scoreboard: `http://localhost:3000`
- admin login: `http://localhost:3000/admin/login`

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
- use strong, unique values for `POSTGRES_PASSWORD`, `ADMIN_ACCESS_CODE`, and `ADMIN_SESSION_TOKEN`
- only expose the ports you actually need
- preferably use a reverse proxy with HTTPS for public traffic

## Admin and Public Separation

The public scoreboard page only shows lap times.
The admin route is separately protected with an access code from `.env`.
The input API only accepts requests with a valid admin session cookie.

This is intentionally kept simple so you can get started without a heavy auth setup.
Later we can expand this to proper user accounts.

## Initial Database Setup

The app currently stores times in a single `lap_times` table.
That keeps the first version clean and easy to understand.
Later we can normalize it into something like:

- `drivers`
- `tracks`
- `cars`
- `sessions`
- `lap_times`

## Sources

For the framework choice, I based this on the current official Next.js installation docs and package information:

- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/getting-started/upgrading
- https://www.npmjs.com/package/next
- https://www.npmjs.com/package/pg

## Ready for GitHub

For a clean repository, do not commit:

- `.next/`
- `node_modules/`
- `.env`

Those local files are already covered by `.gitignore`.
