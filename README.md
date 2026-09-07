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
| Shared types | `@galactic/shared` workspace package |

---

## Project Structure

```
galactic-spacefarer/
├── package.json              # Root — npm workspaces + concurrently dev script
├── packages/
│   └── shared/               # @galactic/shared — single source of truth for all types
│       └── src/index.ts
├── server/                   # Express REST API
│   ├── src/
│   │   ├── index.ts          # Server entry point, bootstraps DB + Express
│   │   ├── db.ts             # SQLite schema, migrations, seed data, CRUD helpers
│   │   ├── auth.ts           # JWT sign/verify, authenticate + requireAdmin middleware
│   │   ├── mailer.ts         # Nodemailer welcome email (non-blocking)
│   │   ├── types.ts          # Server-only types (UserRow with password hash)
│   │   └── routes/
│   │       ├── authRoutes.ts       # POST /api/auth/login
│   │       └── spacefarerRoutes.ts # Full CRUD + /retire action
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── client/                   # React + Tailwind frontend
    ├── src/
    │   ├── main.tsx           # Entry point
    │   ├── App.tsx            # Root — auth gate, list ↔ detail navigation
    │   ├── api.ts             # Typed fetch wrapper for all API calls
    │   ├── types.ts           # Re-exports from @galactic/shared (no duplication)
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── StatusBadge.tsx
    │   │   └── CreateSpacefarerModal.tsx
    │   └── pages/
    │       ├── LoginPage.tsx
    │       ├── SpacefarerList.tsx   # List Report — filter, sort, paginate
    │       └── SpacefarerDetail.tsx # Object Page — read + edit
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Getting Started

### Option A — Docker Compose (recommended)

**Prerequisites:** Docker Desktop

```bash
# 1. Clone and enter the project
git clone https://github.com/TagajN/galactic-spacefarer.git
cd galactic-spacefarer

# 2. (Optional) override secrets / SMTP — skip to use safe defaults
cp server/.env.example .env
# edit .env as needed

# 3. Build and start everything
docker compose up --build
```

| Service | URL |
|---|---|
| UI | http://localhost:3000 |
| API | http://localhost:4005 |

The SQLite database is persisted in a Docker named volume (`db_data`) — data survives container restarts. To reset it: `docker compose down -v`.

---

### Option B — Local dev (Node.js)

**Prerequisites:** Node.js ≥ 20, npm ≥ 10

```bash
# 1. Install all workspace dependencies
npm install

# 2. (Optional) configure SMTP for real welcome emails
cp server/.env.example server/.env
# edit server/.env with your SMTP credentials

# 3. Start both servers with hot reload
npm run dev
```

| Service | URL |
|---|---|
| UI | http://localhost:5173 |
| API | http://localhost:4005 |

> The SQLite database (`server/galactic.db`) is created and seeded automatically on first start.

---

## Seed Users

| Username | Password | Role | Planet |
|---|---|---|---|
| `alice` | `alice` | admin | PlanetX |
| `bob` | `bob` | viewer | PlanetY |
| `carol` | `carol` | viewer | PlanetX |
| `dave` | `dave` | admin | PlanetY |

---

## API Reference

All routes except `/api/auth/login` require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Returns JWT token + user info |

### Spacefarers

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/spacefarers` | any | List (filtered to caller's planet). Query: `status`, `spacesuitColor`, `sortBy`, `sortDir`, `page`, `pageSize` |
| `GET` | `/api/spacefarers/:id` | any | Get one (planet-scoped) |
| `POST` | `/api/spacefarers` | admin | Create — validates skill (1–10), enhances stardust, sends welcome email |
| `PATCH` | `/api/spacefarers/:id` | admin | Update fields (planet-scoped) |
| `DELETE` | `/api/spacefarers/:id` | admin | Delete (planet-scoped) |
| `PATCH` | `/api/spacefarers/:id/retire` | admin | Set status → RETIRED |

### Reference data

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/departments` | All departments |
| `GET` | `/api/positions` | All positions ordered by rank |

---

## Task Coverage

| Task | Requirement | Implementation |
|---|---|---|
| Task 1 | Spacefarer entity with cosmic fields | `db.ts` schema — `stardust_collection`, `wormhole_navigation_skill`, `origin_planet`, `spacesuit_color`, FK to `departments` + `positions` |
| Task 2 | CRUD operations | Full REST CRUD in `spacefarerRoutes.ts` |
| Task 2 | Service protected from cosmic invaders | JWT `authenticate` on every route; `requireAdmin` on writes |
| Task 3 | @Before — validate & enhance on create | Skill range check (1–10), stardust default (100), status forced to `CANDIDATE` |
| Task 3 | @After — welcome email | `sendWelcomeEmail()` called non-blocking after successful INSERT |
| Task 4 | List Report with sorting, filtering, pagination | `SpacefarerList.tsx` — filter bar, sort toggle, page controls |
| Task 5 | Object Page — detail view + edit | `SpacefarerDetail.tsx` — read view + full edit form |
| Additional | SQLite database | `better-sqlite3`, auto-created at `server/galactic.db` |
| Additional | Authorised users only | 401 on missing/invalid JWT |
| Additional | Planet X cannot read Planet Y data | Every DB query scoped to `WHERE origin_planet = $user.planet` from JWT claim |

---

## Security Notes

- Passwords stored as bcrypt hashes (cost factor 10) — never plain text
- JWT secret is read from `JWT_SECRET` env var — change from the default before any production deployment
- CORS is locked to `http://localhost:5173` in dev — update `server/src/index.ts` for production origins
- All write operations (create/update/delete/retire) require the `admin` role
- Row-level planet isolation is enforced server-side — the client cannot bypass it by modifying requests

---

## Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both server + client with hot reload |
| `npm run dev --workspace=server` | Server only |
| `npm run dev --workspace=client` | Client only |
| `npm run build --workspace=client` | Production build of React app |
| `npm run build --workspace=server` | Compile TypeScript to `server/dist/` |

---

## Testing

### Server — Vitest unit tests

```bash
npm run test --workspace=server          # run all tests once
npm run test:coverage --workspace=server # with v8 coverage report
```

| File | Tests | What's covered |
|---|---|---|
| `db.test.ts` | 24 | CRUD, filtering, sorting, pagination, temp-file isolation |
| `auth.test.ts` | 7 | `signToken`, `authenticate` middleware, `requireAdmin` |
| `mailer.test.ts` | 3 | `sendWelcomeEmail`, error swallowing |
| `authRoutes.test.ts` | 5 | Login validation, bad credentials, success |
| `spacefarerRoutes.test.ts` | 14 | GET list/single, POST validation, PATCH, DELETE, retire |
| **Total** | **53** | |

### Client — Cypress component tests

```bash
npm run cy:open --workspace=client   # interactive mode
npm run cy:run  --workspace=client   # headless CI mode
```

| File | Tests | What's covered |
|---|---|---|
| `LoginPage.cy.tsx` | ~8 | Form validation, submit, error state, loading |
| `Navbar.cy.tsx` | ~6 | Links, logout, role-based display |
| `SpacefarerList.cy.tsx` | ~25 | List render, filter, sort, paginate, delete, retire, error |
| `SpacefarerDetail.cy.tsx` | ~15 | Read view, edit form, PATCH, cancel, viewer hide, dropdowns |
| `CreateSpacefarerModal.cy.tsx` | ~14 | Required fields, optional fields, selects, loading, errors |
| **Total** | **~68** | |

> All Page Objects live in `client/cypress/support/pageObjects/` — tests never use raw selectors directly.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| `@galactic/shared` workspace package | Single source of truth for all TypeScript types — server and client import from the same place, no duplication |
| Functional `setForm(f => ...)` updaters | Prevents stale-closure bugs when multiple fields update in the same React render cycle |
| Non-blocking `sendWelcomeEmail` | POST /api/spacefarers returns immediately — email failure never blocks the HTTP response |
| `setDbPath()` + `closeDb()` in tests | Each Vitest test gets a fresh temp-file SQLite DB — perfect isolation without mocking |
| `cy.intercept()` for all API mocking | ESM modules cannot be stubbed in Cypress component tests — intercept is the correct approach |
