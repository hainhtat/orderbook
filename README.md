# Order Notebook

Multi-tenant SaaS staff console for cosmetic online shops. Shop owners manage messenger orders, catalog, customers, pre-orders, and payments from a **web** and **mobile** app against a shared REST API. Myanmar-first UX with English and Myanmar (Unicode) UI.

**Requirements baseline:** [`PROJECT_SPEC.md`](PROJECT_SPEC.md)

---

## Architecture

Three **independent** applications in one repository (not a monorepo toolchain). Each app has its own `package.json`, lockfile, and config.

```text
pos/
├── backend/          # Express REST API, Prisma, JWT auth
├── frontend/         # React staff web console (Vite)
├── mobile/           # Expo staff mobile app
├── PROJECT_SPEC.md   # Product & technical contract
└── .cursor/          # Agent skills & subagents (Cursor)
```

```text
┌─────────────┐     ┌─────────────┐
│  frontend/  │     │   mobile/   │
│  (React)    │     │   (Expo)    │
└──────┬──────┘     └──────┬──────┘
       │    Bearer JWT      │
       └────────┬───────────┘
                ▼
         ┌─────────────┐
         │  backend/   │
         │  /api/v1    │
         └──────┬──────┘
                ▼
         SQLite (dev) / PostgreSQL (prod)
```

**Tenancy:** All shop data is scoped by `shopId`. Version-one uses a single owner role per shop.

---

## Technology stack

| Layer | Web (`frontend/`) | Mobile (`mobile/`) | API (`backend/`) |
| --- | --- | --- | --- |
| Runtime | Vite + React 19 | Expo SDK 57 + React Native | Node.js + Express |
| Language | TypeScript | TypeScript | TypeScript |
| Routing | React Router | Expo Router | — |
| UI | shadcn/ui + Tailwind | Expo UI (`@expo/ui`) | — |
| Server state | TanStack React Query | TanStack React Query | — |
| Forms | React Hook Form + Zod | React Hook Form | express-validator |
| Auth | JWT (access + refresh) | JWT + SecureStore | jose + bcrypt |
| Database | — | — | Prisma (SQLite dev / PostgreSQL prod) |
| i18n | i18next (`en`, `my`) | bundled resources (`en`, `my`) | `Accept-Language` errors |
| Tests | Vitest + RTL | Jest + RNTL | Jest + Supertest |

**AI assistant (planned M5):** DeepSeek (`deepseek-chat`) via OpenAI-compatible API; per-shop BYOK encrypted at rest.

---

## Prerequisites

- **Node.js** 20+ (22+ recommended for Expo SDK 57)
- **npm** 10+
- For mobile device testing: Expo Go or a dev build

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set JWT_SECRET, AI_ENCRYPTION_KEY, and optionally DEEPSEEK_API_KEY
npm install
npm run db:push
npm run dev
```

API base: `http://localhost:3000/api/v1`  
Health: `http://localhost:3000/api/v1/health`

### 2. Web

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

### 3. Mobile

```bash
cd mobile
cp .env.example .env
npm install
npm start
```

For a physical device, set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP (e.g. `http://192.168.1.10:3000/api/v1`).

---

## Development workflow

| Task | Backend | Frontend | Mobile |
| --- | --- | --- | --- |
| Dev server | `npm run dev` | `npm run dev` | `npm start` |
| Typecheck | `npm run typecheck` | `npm run typecheck` | `npm run typecheck` |
| Unit tests | `npm test` | `npm run test:run` | `npm test` |
| Integration tests | `npm run test:integration` | — | — |
| Production build | `npm run build` | `npm run build` | `npx expo export` |
| DB schema (dev) | `npm run db:push` | — | — |

**Typical local session:** start `backend` first, then `frontend` (and optionally `mobile`).

**Spec changes:** Do not edit `PROJECT_SPEC.md` directly. Invoke the `@spec-maintainer` Cursor subagent after milestones or API/schema changes.

**Specialized agents** (`.cursor/agents/`): `@backend-developer`, `@frontend-developer`, `@mobile-developer`, `@spec-maintainer`.

---

## Environment variables

### `backend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite path for dev (`file:./dev.db`) |
| `JWT_SECRET` | Yes | Signing secret (16+ characters) |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Yes | Token validation claims |
| `AI_ENCRYPTION_KEY` | Yes | 32+ chars; encrypts shop BYOK keys in DB |
| `CORS_ORIGINS` | Yes | Comma-separated web/mobile dev origins |
| `DEEPSEEK_API_KEY` | No | Dev LLM key (M5 assistant) |
| `DEEPSEEK_MODEL` | No | Default `deepseek-chat` |

See [`backend/.env.example`](backend/.env.example) for the full list.

### `frontend/.env`

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | API base (default `http://localhost:3000/api/v1`) |

### `mobile/.env`

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | API base (use LAN IP on device) |

Never commit `.env` files. Copy from each app's `.env.example`.

---

## Directory structure

```text
pos/
├── .cursor/
│   ├── agents/                 # Cursor subagents (backend, frontend, mobile, spec)
│   └── skills/                 # Implementation specs (starter skills)
├── backend/
│   ├── prisma/sqlite/          # Dev/test Prisma schema
│   ├── src/
│   │   ├── api/v1/             # Versioned routes (auth, shops, products, customers)
│   │   ├── config/             # Env validation, CORS
│   │   ├── middleware/         # Auth, tenant, validation, errors
│   │   └── ...
│   └── tests/                  # Unit + integration (Supertest)
├── frontend/
│   └── src/
│       ├── app/                # Router, providers, query client
│       ├── features/           # auth, products, customers, shops
│       ├── components/ui/      # shadcn primitives
│       └── i18n/locales/       # en, my
├── mobile/
│   └── src/
│       ├── app/                # Expo Router screens
│       ├── features/           # auth, products, customers
│       ├── api/                # Typed API client
│       └── i18n/               # en, my
├── PROJECT_SPEC.md
├── PROJECT_SPEC.html
└── .cursorrules
```

---

## Implementation status

| Milestone | Scope | Status |
| --- | --- | --- |
| **M0** | Auth, shop onboarding, health | Done |
| **M1** | Products, categories, customers | Done |
| **M2** | Standard orders & payments | Planned |
| **M3** | Pre-orders & inventory reservation | Planned |
| **M4** | Reporting | Planned |
| **M5** | AI order assistant (DeepSeek BYOK) | Planned |
| **M6** | Hardening & pilot | Planned |

---

## License

Private / unlicensed unless otherwise specified by the repository owner.
