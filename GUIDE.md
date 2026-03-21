# How to Run Good Neighbors Locally

This guide walks you through running the full app on your machine — frontend, backend, and database — using Docker. No manual installs needed beyond Docker itself.

---

## Before You Start

You need two things installed:

1. **Docker Desktop** — https://www.docker.com/products/docker-desktop
   - After installing, open Docker Desktop and make sure it's running (whale icon in your menu bar)
2. **Git** — https://git-scm.com/downloads (most Macs already have it)

---

## Step 1 — Clone the Repo

```bash
git clone https://github.com/Khey17/good-neighbors.git
cd good-neighbors
```

---

## Step 2 — Create Your `.env` File

The backend needs a file called `.env` with secret keys. This file is **never pushed to GitHub** (it's in `.gitignore`) so you have to create it manually.

```bash
cp backend/.env.example backend/.env
```

Now open `backend/.env` in any text editor and fill in the values:

```
DATABASE_URL=postgresql://gn:gnpass@db:5432/goodneighbors
JWT_SECRET=any-random-string-at-least-32-characters-long
GOOGLE_API_KEY=your-gemini-api-key-here
```

- `DATABASE_URL` — leave this exactly as is, it connects to the local Docker database
- `JWT_SECRET` — make up any random string, e.g. `local-dev-secret-abc123xyz456-2026`
- `GOOGLE_API_KEY` — ask the project owner (Karth) for this key over Slack/DM, never share it in chat or commits

---

## Step 3 — Start the App

```bash
docker compose up --build
```

This starts 3 services at once:
- **Database** (PostgreSQL + pgvector) on port `5432`
- **Backend** (FastAPI) on port `8000`
- **Frontend** (React + Nginx) on port `3000`

The first time you run this it takes 2-3 minutes to build. After that it's much faster.

---

## Step 4 — Open the App

| What | URL |
|------|-----|
| App (frontend) | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8000/docs |

Sign up with any fake email and test away.

---

## Step 5 — Making Changes

The workflow is:

1. Pull the latest main before starting work
   ```bash
   git checkout main
   git pull origin main
   ```

2. Create a branch for your work
   ```bash
   git checkout -b your-feature-or-bug-name
   ```

3. Make your changes, then restart Docker to see them
   ```bash
   docker compose up --build
   ```

4. Test at `http://localhost:3000` — make sure it works

5. Push your branch to GitHub
   ```bash
   git add .
   git commit -m "what you changed and why"
   git push origin your-feature-or-bug-name
   ```

6. Open a Pull Request on GitHub from your branch → `main`
7. Tag Karth to review — he approves and merges → Railway auto-deploys to production

---

## Stopping the App

```bash
# Stop containers (keeps your database data)
docker compose down

# Stop AND wipe the database (fresh start)
docker compose down -v
```

---

## Common Issues

**Docker Desktop not running**
> Error: `Cannot connect to the Docker daemon`

Open Docker Desktop and wait for it to fully start, then try again.

---

**Port already in use**
> Error: `Bind for 0.0.0.0:3000 failed: port is already allocated`

Something else is using that port. Either stop that process or restart your machine.

---

**`GOOGLE_API_KEY` missing**
> Embeddings are NULL, matching returns 409

You forgot to fill in the API key in `backend/.env`. Ask Karth for it.

---

**Changes not showing up**
Always run `docker compose up --build` (with `--build`) after changing backend code. Frontend changes in `src/` should hot-reload automatically.

---

**Fresh start — wipe everything**
```bash
docker compose down -v
docker compose up --build
```

---

## Branch Guide

| Branch | Purpose |
|--------|---------|
| `main` | Production — what's live on Railway |
| `bugs` | Bug fixes — branch off this for bug fixes |
| Any feature branch | New features — name it what you're building |

**Never push directly to `main`.** Always open a PR and get it reviewed first.

---

## Questions?

Ping Karth on Slack or open a GitHub issue.
