# 🚀 Galactic Spacefarer Adventure

A full-stack TypeScript monorepo implementing the Galactic Spacefarer Adventure System — a CRUD application for managing intergalactic spacefarers, with JWT authentication, planet-level row isolation, cosmic event handlers, and a React + Tailwind UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite |
| Backend | Node.js, Express 4, TypeScript, tsx (hot reload) |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` password hashing |
| Email | Nodemailer (SMTP, configurable) |
| Linter | oxlint (client + server) |
| Shared types | `@galactic/shared` workspace package |

---

## Getting Started

### Option A — Docker (no Node.js required)

**Prerequisites:** Docker Desktop

```bash
# 1. Clone and enter the project
git clone https://github.com/TagajN/galactic-spacefarer-aldi.git
cd galactic-spacefarer-aldi

# 2. (Optional) configure SMTP for welcome emails
# Create server/.env and set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM

# 3. Start everything with hot reload
docker compose up
```

| Service | URL |
|---|---|
| UI | http://localhost:5173 |
| API | http://localhost:4005 |

Both server and client support hot reload — source changes reflect immediately without restarting containers. The SQLite database is persisted in a Docker named volume (`db_data`). To reset it: `docker compose down -v`.

---

### Option B — Local dev (Node.js)

**Prerequisites:** Node.js ≥ 20, npm ≥ 10

```bash
# 1. Install all workspace dependencies
npm install

# 2. (Optional) configure SMTP for welcome emails
# Create server/.env and set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM

# 3. Start both servers with hot reload
npm run dev
```

| Service | URL |
|---|---|
| UI | http://localhost:5173 |
| API | http://localhost:4005 |

> The SQLite database (`server/galactic.db`) is created and seeded automatically on first start.

---

## Testing

### Server — Vitest unit tests

```bash
npm run test --workspace=server          # run all tests once
npm run test:coverage --workspace=server # with v8 coverage report
```

### Client — Cypress component tests

```bash
npm run cy:open --workspace=client   # interactive mode
npm run cy:run  --workspace=client   # headless CI mode
```

> All Page Objects live in `client/cypress/support/pageObjects/` — tests never use raw selectors directly.
