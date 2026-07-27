# Prisma and Database Workflow

## Non-negotiable provider boundary

SQLite and PostgreSQL use **different Prisma providers** and generate **incompatible migration SQL**.

- Never create migrations against SQLite and run those files against PostgreSQL.
- Changing only `DATABASE_URL` does not change a schema's provider.
- Treat PostgreSQL as the authoritative production schema and migration history.

If exact production parity matters more than the explicit SQLite requirement, explain the limitation and offer containerized PostgreSQL for all environments:

```bash
docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:18
```

Otherwise implement the dual-provider workflow below.

## Recommended layout

```text
prisma/
  postgresql/
    schema.prisma       # canonical schema + migrations/
    migrations/
  sqlite/
    schema.prisma       # parity schema for local dev and tests
```

### PostgreSQL schema (production)

```prisma
// prisma/postgresql/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../generated/postgresql"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### SQLite schema (local/test)

```prisma
// prisma/sqlite/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../../generated/sqlite"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Keep models logically aligned with PostgreSQL schema
```

Adapt generator `output` and config to the installed Prisma version. **Prisma 7** may require `prisma.config.ts`, driver adapters (`@prisma/adapter-pg`, `@prisma/adapter-better-sqlite3`), and explicit client output paths — recheck official docs.

## Migration workflows

| Environment | Command | Purpose |
| --- | --- | --- |
| PostgreSQL dev | `prisma migrate dev --schema prisma/postgresql/schema.prisma` | Author and apply production migrations |
| PostgreSQL prod | `prisma migrate deploy --schema prisma/postgresql/schema.prisma` | Apply pending migrations in CI/CD |
| SQLite local | `prisma db push --schema prisma/sqlite/schema.prisma` | Disposable local schema sync |
| SQLite test | `prisma db push` per worker/suite | Reset test database |

**Never** run `migrate dev`, `db push`, or destructive resets at application startup or in production.

If using a connection pooler (PgBouncer, Neon, Supabase), add `?pgbouncer=true` to the pooled URL and use a separate `DIRECT_URL` for migrations.

## Schema parity

Keep model names, scalar fields, relations, unique constraints, and application-visible defaults logically aligned across schemas. Document intentional provider differences:

- Native enum vs string representation
- JSON/JSONB support
- Timestamp precision and timezone behavior
- Index syntax and collations

Add a CI check or review step that detects unintended model drift. Do not promise production correctness solely because SQLite tests pass.

## Local and test lifecycle

- Store SQLite files outside version control (`.gitignore` `*.db`, `*.db-journal`).
- Give each parallel integration-test worker an **isolated SQLite file**, or run database-writing suites serially (`jest --runInBand`).
- Reset with documented schema push/reset, then seed minimal deterministic fixtures.
- Never point tests at development or production PostgreSQL URLs.
- Close every Prisma client and remove temporary database files during teardown.

## Runtime client selection

Construct the provider-correct Prisma client from validated environment:

```ts
// Pseudocode — adapt to installed Prisma version and adapter requirements
function createPrismaClient(env: Env): PrismaClient {
  if (env.NODE_ENV === 'production') {
    // PostgreSQL with driver adapter if Prisma 7+
    return createPostgresClient(env.DATABASE_URL)
  }
  // SQLite for development and test
  return createSqliteClient(env.DATABASE_URL)
}
```

Fail closed on unknown environment/database combinations. Expose a narrow repository interface to services.

## Production checklist

- Commit migration SQL; review generated SQL before deploy
- Use `migrate deploy` in CI/CD, not from local machines
- Back up production data before risky migrations
- Use expand/migrate/contract for destructive changes on large tables
- Keep connection strings and credentials out of source control and logs
- Use least-privilege runtime and migration credentials when infrastructure supports it
