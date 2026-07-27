# Official Sources

Recheck before implementation — Node tooling and Prisma configuration change frequently.

Last reviewed: 2026-07-27

## Core runtime

| Topic | Source |
| --- | --- |
| Node.js | https://nodejs.org/docs/latest/api/ |
| TypeScript | https://www.typescriptlang.org/docs/ |
| tsx (dev runner) | https://tsx.is/ |
| tsx watch mode | https://tsx.is/watch-mode |

## Express

| Topic | Source |
| --- | --- |
| Express 5 guide | https://expressjs.com/en/5x/guide/routing.html |
| Express middleware | https://expressjs.com/en/5x/guide/using-middleware/ |
| Express error handling | https://expressjs.com/en/5x/guide/error-handling/ |
| cors middleware | https://github.com/expressjs/cors |

## Prisma

| Topic | Source |
| --- | --- |
| Prisma docs | https://www.prisma.io/docs |
| Prisma config reference | https://www.prisma.io/docs/orm/reference/prisma-config-reference |
| Database drivers / adapters | https://www.prisma.io/docs/orm/core-concepts/supported-databases/database-drivers |
| SQLite connector | https://www.prisma.io/docs/orm/core-concepts/supported-databases/sqlite |
| PostgreSQL connector | https://www.prisma.io/docs/orm/core-concepts/supported-databases/postgresql |
| Migrate limitations | https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/limitations-and-known-issues |
| Deploy migrations | https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate |

## Validation, lint, test

| Topic | Source |
| --- | --- |
| express-validator | https://express-validator.github.io/docs/ |
| ESLint flat config | https://eslint.org/docs/latest/use/configure/configuration-files |
| typescript-eslint | https://typescript-eslint.io/getting-started/ |
| typescript-eslint typed linting | https://typescript-eslint.io/getting-started/typed-linting |
| Jest | https://jestjs.io/docs/getting-started |
| Jest TypeScript | https://jestjs.io/docs/getting-started#using-typescript |
| Jest ESM | https://jestjs.io/docs/ecmascript-modules |
| Supertest | https://github.com/forwardemail/supertest |

## Security

| Topic | Source |
| --- | --- |
| jose (JWT) | https://github.com/panva/jose |
| JWT best practices (RFC 8725) | https://datatracker.ietf.org/doc/html/rfc8725 |
| bcrypt / argon2 | Use maintained password-hashing library docs |

## Recommended install commands (verify versions at install time)

```bash
# Runtime
pnpm add express cors express-validator
pnpm add -D typescript tsx @types/node @types/express @types/cors

# Prisma
pnpm add @prisma/client
pnpm add -D prisma
# Prisma 7 may also require:
# pnpm add @prisma/adapter-pg @prisma/adapter-better-sqlite3 pg better-sqlite3

# Auth
pnpm add jose bcrypt
pnpm add -D @types/bcrypt

# Validation env (optional but recommended)
pnpm add zod

# Lint
pnpm add -D eslint @eslint/js typescript-eslint

# Test
pnpm add -D jest @types/jest ts-jest supertest @types/supertest
```

## Version notes (2026)

- **tsx** is the recommended dev runner for Express + TypeScript. It strips types via esbuild — always run `tsc --noEmit` separately in CI. Use `tsx watch src/server.ts` for watch mode.
- **Express 5** passes rejected async handler promises to error middleware natively.
- **Prisma 7** introduces `prisma.config.ts`, mandatory driver adapters, and explicit client output paths. Recheck the installed version's guide before scaffolding — v6 and v7 setup differ materially.
- **SQLite + PostgreSQL dual setup** is supported for this skill but has dialect risks. PostgreSQL migrations are canonical; SQLite uses `db push` for disposable dev/test. Never mix migration histories.
- **Jest + Supertest**: export `createApp()` without `listen()`. Supertest binds in-process — no real network port.
- **express-validator v7+**: use `matchedData(req)` and map validation failures to stable error codes.
- **ESLint flat config** is the current standard; use `typescript-eslint` type-aware rules for `src/**/*.ts`.

## Frontend contract alignment

When pairing with the frontend starter skill, align on:

| Endpoint | Method |
| --- | --- |
| `/api/v1/auth/register` | `POST` |
| `/api/v1/auth/login` | `POST` |
| `/api/v1/auth/verify` | `GET` |
| `/api/v1/auth/refresh` | `POST` |
| `/api/v1/auth/logout` | `POST` |
| `/api/v1/health` | `GET` |

Confirm exact request/response field names, cookie vs bearer transport, and CORS origin before integration testing across repos.
