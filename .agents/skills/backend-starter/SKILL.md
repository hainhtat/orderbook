---
name: backend-starter
description: >-
  Scaffold or modernize a production-minded REST API starter using TypeScript,
  Express, Prisma, SQLite for local development and tests, PostgreSQL for
  production, express-validator, CORS, Jest, Supertest, ESLint,
  typescript-eslint, and tsx watch mode. Use when bootstrapping or
  standardizing a versioned Express backend with layered routes/controllers/
  services, middleware, validators, utilities, JWT register/login and
  verification, environment configuration, Prisma migrations, English/Myanmar
  responses, consistent errors, and unit/integration tests.
---

# Backend Starter

Implementation specification for a future agent. **Do not treat this skill as prebuilt boilerplate** — read it, inspect the destination repository, confirm current official docs, then implement.

## Before you build

1. Inspect the repository, package manager, supported Node version, deployment model, existing API contract, database conventions, and token transport.
2. Preserve compatible conventions. Ask only when a missing answer materially changes security or public API behavior; otherwise state the assumption and proceed.
3. Read [references/architecture.md](references/architecture.md) before creating structure, layers, middleware, or API versioning.
4. Read [references/database.md](references/database.md) before configuring Prisma, SQLite, PostgreSQL, or migrations.
5. Read [references/authentication.md](references/authentication.md) before implementing registration, login, verification, refresh, or logout.
6. Read [references/errors-localization.md](references/errors-localization.md) before implementing validation, errors, English/Myanmar handling, or CORS.
7. Read [references/testing.md](references/testing.md) before adding or reviewing tests.
8. Read [references/official-sources.md](references/official-sources.md) and recheck linked docs for breaking changes before installing packages.

Use current stable, mutually compatible releases. Do not blindly copy version-specific snippets from this skill.

## Target stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js LTS |
| Language | TypeScript (strict) |
| Framework | Express |
| ORM | Prisma |
| Local/test DB | SQLite |
| Production DB | PostgreSQL |
| Validation | express-validator |
| CORS | `cors` middleware |
| Auth | JWT (register, login, verify; refresh/logout when in scope) |
| Dev runner | `tsx watch` |
| Build | `tsc` → `node dist/` |
| Lint | ESLint flat config + typescript-eslint |
| Tests | Jest + Supertest |
| i18n | English (`en`) and Myanmar (`my`) API messages |

## Build workflow

1. **Initialize** — Create a strict TypeScript Node application. Separate `app` construction from process startup so Supertest can import the app without opening a port.

2. **Install dependencies** — Add Express, Prisma, express-validator, CORS, JWT/password libraries, and testing/lint tooling per [references/official-sources.md](references/official-sources.md).

3. **Configure environment** — Validate all config at startup. Provide `.env.example`. Never read `process.env` ad hoc in feature modules.

4. **Implement layers** — Follow [references/architecture.md](references/architecture.md) for routes, controllers, services, middleware, validators, and utilities.

5. **Configure database** — Follow [references/database.md](references/database.md). Never deploy SQLite migration SQL to PostgreSQL.

6. **Implement auth** — Follow [references/authentication.md](references/authentication.md). Cryptographic verification happens server-side only.

7. **Implement errors, i18n, CORS** — Follow [references/errors-localization.md](references/errors-localization.md).

8. **Add tests** — Follow [references/testing.md](references/testing.md). Unit tests for services; integration tests with Supertest and isolated SQLite.

9. **Verify** — Run lint, typecheck, unit tests, integration tests, and production build. Fix failures caused by the work.

10. **Report** — State assumptions, routes, environment variables, migration workflow, verification performed, and remaining infrastructure work.

## Quality rules

- Keep controllers thin, services transport-agnostic, Prisma access behind repositories or a database boundary, and middleware focused on cross-cutting HTTP concerns.
- Validate every untrusted request location and pass only validated `matchedData` into controllers/services.
- Use strict TypeScript. Avoid `any`, non-null assertions for environment variables, and untyped augmentation of `Request`.
- Return stable machine-readable error codes. Treat translated messages as presentation, not client control flow.
- Never expose stack traces, database errors, password hashes, JWTs, secrets, or internal exception details in API responses.
- Keep security configuration explicit: trusted origins, proxy behavior, body limits, JWT algorithms/claims, cookie attributes, and rate-limiting expectations.
- Avoid speculative domains, generic base classes, singletons hidden behind side effects, and business logic in utilities.

## Completion criteria

Finish only when the app has:

- Versioned API at `/api/v1` with health and auth routes
- Layered structure: routes → controllers → services → repositories
- express-validator chains and validation middleware on all inputs
- Centralized error handler with stable error codes
- English/Myanmar locale negotiation and translation files
- Focused CORS configuration from validated environment
- JWT register/login/verify (and refresh/logout when in scope)
- Prisma schemas and workflows for SQLite (dev/test) and PostgreSQL (prod)
- `.env.example`, typed config, graceful shutdown
- Unit and integration tests per [references/testing.md](references/testing.md)
- Passing lint, typecheck, test, and build commands
