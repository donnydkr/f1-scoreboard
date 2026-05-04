# Deploy And Release Guide

Deze handleiding beschrijft de simpelste workflow voor deze app:

1. ontwikkelen en testen op je dev-pc
2. code pushen naar GitHub
3. op de sim-laptop de nieuwste versie ophalen
4. de Docker app opnieuw bouwen en starten

## Overzicht

- Dev-pc: hier bouw en test je nieuwe features
- GitHub: centrale bron voor de code
- Sim-pc: draait alleen de live versie

Aanbevolen branch-setup:

- `main`: live branch voor de sim-pc
- `feature/*`: tijdelijke branches voor nieuwe features

## Eerste Installatie Op De Sim-pc

Deze stappen doe je eenmalig op de Ubuntu desktop machine bij de sims.

### 1. Git installeren

```bash
sudo apt update
sudo apt install -y git
git --version
```

### 2. Repo clonen

```bash
cd ~
git clone https://github.com/donny-sys/f1-scoreboard.git
cd ~/f1-scoreboard
```

### 3. `.env` maken

Maak in de repo een `.env` bestand met minimaal:

```env
APP_PORT=3000
POSTGRES_PORT=5432
POSTGRES_DB=f1_scoreboard
POSTGRES_USER=f1_scoreboard
POSTGRES_PASSWORD=kies-een-sterk-wachtwoord
APP_URL=http://localhost:3000
ADMIN_SESSION_TOKEN=kies-een-lange-random-string
```

Voor een random sessietoken:

```bash
openssl rand -hex 32
```

### 4. App starten

```bash
docker compose up -d --build
```

### 5. Controleren

```bash
docker compose ps
docker compose logs -f
```

Open daarna:

- `http://localhost:3000`
- `http://localhost:3000/admin/login`

## Workflow Op De Dev-pc

Gebruik je eigen pc om nieuwe features te maken en te testen.

### Optie A: direct op `main`

Alleen doen als je heel simpel wilt werken en meestal alleen zelf aan de app werkt.

```bash
cd f1-scoreboard
git checkout main
git pull
```

Maak je wijzigingen, test lokaal, en commit daarna:

```bash
git add .
git commit -m "Beschrijving van de wijziging"
git push origin main
```

### Optie B: werken met feature branch

Dit is netter en veiliger.

```bash
cd f1-scoreboard
git checkout main
git pull
git checkout -b feature/nieuwe-feature
```

Maak je wijzigingen, test lokaal, en commit daarna:

```bash
git add .
git commit -m "Voeg nieuwe feature toe"
git push -u origin feature/nieuwe-feature
```

Merge daarna de feature terug naar `main`.

Bijvoorbeeld lokaal:

```bash
git checkout main
git pull
git merge feature/nieuwe-feature
git push origin main
```

## Workflow Op De Sim-pc

De sim-pc gebruik je alleen voor live updates.

Ga naar de repo:

```bash
cd ~/f1-scoreboard
```

Zorg dat je op `main` staat:

```bash
git checkout main
```

Haal de nieuwste code op:

```bash
git pull origin main
```

Herbouw en herstart de app:

```bash
docker compose up -d --build
```

Controleer daarna:

```bash
docker compose ps
```

## Kortste Release-flow

### Op de dev-pc

```bash
git add .
git commit -m "Nieuwe wijziging"
git push
```

Als je met feature branches werkt:

- merge eerst naar `main`

### Op de sim-pc

```bash
cd ~/f1-scoreboard
git pull origin main
docker compose up -d --build
```

## Als GitHub Om Login Vraagt

Voor `git pull` via HTTPS gebruik je niet je gewone GitHub-wachtwoord, maar een personal access token.

Bij de prompt:

- `Username`: je GitHub username
- `Password`: je volledige GitHub token, inclusief `github_pat_...`

## Auto-start Na Herstart

In `docker-compose.yml` staan de services al op:

```yaml
restart: unless-stopped
```

Controleer op Ubuntu ook dat Docker zelf aanstaat:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

Daarna hoort de app na een reboot automatisch terug te komen.

## Helemaal Schoon Herstarten

Let op: dit verwijdert ook alle data uit de database.

```bash
cd ~/f1-scoreboard
docker compose down -v
docker compose up -d --build
```

## Advies

Hou de sim-pc zo schoon mogelijk:

- niet lokaal editen op de sim-pc
- alle codewijzigingen doen op je dev-pc
- GitHub gebruiken als overdrachtspunt
- op de sim-pc alleen `git pull` en `docker compose up -d --build`
