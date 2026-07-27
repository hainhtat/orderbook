# Architecture

## Runtime decisions

- Target a supported **Node.js LTS** release. Declare it in `engines` or the repository's version file.
- Use **strict TypeScript** and one deliberate module strategy. Prefer ESM (`"type": "module"`) for new projects; configure Node, TypeScript, Jest, and build output consistently.
- Use **Express 5** when current dependencies support it. Let rejected async handler promises reach centralized error middleware.
- Use **`tsx watch src/server.ts`** for development. **`tsx` strips types only** — always run `tsc --noEmit` in CI. Build with `tsc` and run compiled output in production.
- Use **ESLint flat config** with current `typescript-eslint` type-aware recommended rules. Ignore generated Prisma client output and `dist/`.

## Suggested structure

Adapt names to repository conventions while preserving responsibilities:

```text
src/
  app.ts                    # createApp() — no listen()
  server.ts                 # bootstrap, listen, graceful shutdown
  config/
    env.ts                  # validated environment
    cors.ts                 # CORS options from env
  api/
    v1/
      index.ts              # mounts v1 routers
      auth/
        auth.routes.ts
        auth.controller.ts
        auth.service.ts
        auth.repository.ts
        auth.validators.ts
        auth.types.ts
  middleware/
    authenticate.ts
    validate-request.ts
    not-found.ts
    error-handler.ts
    locale.ts
    request-id.ts
  database/
    client.ts               # Prisma client factory
  errors/
    app-error.ts
    error-codes.ts
  i18n/
    index.ts
    locales/
      en.json
      my.json
  utilities/
    tokens.ts
    passwords.ts
  types/
    express.d.ts            # Request augmentation
tests/
  unit/
  integration/
  helpers/
prisma/
  postgresql/
    schema.prisma
    migrations/
  sqlite/
    schema.prisma
```

Do not force every feature into all file types when a layer has no logic. Keep genuinely shared code outside feature folders.

## Layer boundaries

| Layer | Responsibility |
| --- | --- |
| **Routes** | Declare paths, attach validators, auth middleware, and controller handlers |
| **Validators** | express-validator chains for params, query, headers, cookies, body |
| **Controllers** | Map validated HTTP input → service calls → HTTP response. No Prisma, no business rules |
| **Services** | Use-case logic, transactions, password/token orchestration, domain errors. No Express types |
| **Repositories** | Prisma queries and persistence mapping. No leaking generated Prisma errors to controllers |
| **Middleware** | Auth, locale, validation results, request IDs, not-found, error serialization |
| **Utilities** | Small stateless helpers only — not a business-logic dumping ground |

Prefer dependency construction in a composition root so unit tests can inject repositories, clocks, token services, and password services.

## App vs server separation

**Critical for Supertest.** Export the configured Express app without calling `listen`:

```ts
// src/app.ts
export function createApp(deps: AppDependencies): Express {
  const app = express()
  // middleware + routes
  return app
}

// src/server.ts
const app = createApp(buildDependencies())
const server = app.listen(port, () => { /* ... */ })
// graceful shutdown: close server, disconnect Prisma
```

Tests import `createApp(testDeps)` and pass it to Supertest — no network port required.

## Middleware order

1. Request ID and trusted proxy configuration
2. Security headers (if included)
3. CORS
4. Body parsers with explicit size limits (`express.json({ limit: '...' })`)
5. Locale negotiation
6. Access logging with secret redaction (if included)
7. `/api/v1` routers
8. Not-found middleware
9. Centralized four-argument error middleware

Mount authentication only on protected routes. Ensure preflight requests are not blocked by auth.

## API versioning

Mount the initial API at **`/api/v1`**. Include at least:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Liveness/readiness (no secrets) |
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Authenticate |
| `GET` | `/api/v1/auth/verify` | Verify session, return canonical user |
| `POST` | `/api/v1/auth/refresh` | Rotate access token (when refresh in scope) |
| `POST` | `/api/v1/auth/logout` | Revoke session (when refresh in scope) |

Version public contracts, not internal folders alone. Use consistent response envelopes only when they add value.

## Provider tree (conceptual)

Express does not use React-style providers, but the **composition root** serves the same role — wire dependencies once at startup:

```text
validateEnv()
└─ createPrismaClient(config)
   └─ createAuthRepository(prisma)
      └─ createAuthService(repo, tokens, passwords)
         └─ createAuthController(service)
            └─ createApp({ controllers, middleware, i18n })
```

## Scripts and lifecycle

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "jest --selectProjects unit",
    "test:integration": "jest --selectProjects integration",
    "test:coverage": "jest --coverage",
    "db:generate": "prisma generate",
    "db:dev:push": "prisma db push --schema prisma/sqlite/schema.prisma",
    "db:dev:reset": "prisma db push --force-reset --schema prisma/sqlite/schema.prisma",
    "db:prod:migrate": "prisma migrate dev --schema prisma/postgresql/schema.prisma",
    "db:prod:deploy": "prisma migrate deploy --schema prisma/postgresql/schema.prisma"
  }
}
```

Adapt script names to Prisma 7 `prisma.config.ts` conventions when the installed version requires them.

Load and validate environment before constructing dependencies. Handle `SIGTERM` and `SIGINT`: stop accepting traffic, close HTTP server, disconnect Prisma, exit cleanly.

## TypeScript configuration

Prefer strict options:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## ESLint configuration

Use ESLint flat config with typescript-eslint:

```bash
pnpm add -D eslint @eslint/js typescript-eslint
```

Enable type-aware linting for `src/**/*.ts`. Ignore `dist/`, `node_modules/`, and generated Prisma output.
