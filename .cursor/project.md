# Order Notebook — project configuration

Agents and the orchestrator read this file first.

| Field | Value | Notes |
| --- | --- | --- |
| **Project name** | Order Notebook | Multi-tenant SaaS for cosmetic online shops |
| **Spec file** | PROJECT_SPEC.md | **Source of truth** — read before feature work; never edit directly |
| **Backend path** | backend/ | Express + Prisma + JWT |
| **Frontend path** | frontend/ | React + Vite staff console |
| **Mobile path** | mobile/ | Expo (deferred — out of current web-first phase) |
| **Audit reports** | audit/reports/ | Auditor output |
| **Active apps** | web, backend | Current delivery focus |
| **Deferred apps** | mobile | Implement when user reactivates mobile phase |

## Stack

| App | Stack |
| --- | --- |
| Web | React, Vite, TypeScript, React Query, React Router, React Hook Form, shadcn/ui, Tailwind |
| Backend | Express, TypeScript, Prisma, SQLite (dev/test), PostgreSQL (prod), JWT |
| Mobile | React Native, Expo, Expo Router, Expo UI |
| AI assistant | DeepSeek `deepseek-chat` — server-side only, per-shop BYOK |

## Environment files

| File | Purpose |
| --- | --- |
| `backend/.env` | Database, JWT, CORS, `AI_ENCRYPTION_KEY`, `DEEPSEEK_API_KEY` |
| `frontend/.env` | `VITE_API_BASE_URL` only |
| `mobile/.env` | `EXPO_PUBLIC_API_BASE_URL` only |

## Domain notes

- Requirement IDs: `ONB-*`, `CRM-*`, `PRE-*`, etc.
- Currency: MMK integers
- Locales: English + Myanmar (`en`, `my`)
- Tenancy: shop-scoped via JWT membership

## Spec workflow

1. Read relevant `PROJECT_SPEC.md` sections before implementing.
2. Build against spec-defined APIs (§8) and UI routes (§9) only.
3. After intentional changes or milestone completion → invoke `@spec-maintainer`.
4. Drift found → fix code to match spec; spec edits go through `@spec-maintainer` only.
