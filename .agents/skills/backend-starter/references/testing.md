# Testing Requirements

## Jest setup

Install:

```bash
pnpm add -D jest @types/jest ts-jest supertest @types/supertest
```

Use separate Jest projects for unit and integration suites when setup differs:

```ts
// jest.config.ts
import type { Config } from 'jest'

const shared: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
}

export default {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    },
    {
      ...shared,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup-integration.ts'],
      maxWorkers: 1, // or isolated DB per worker
    },
  ],
} satisfies Config
```

For ESM projects, check current Jest ESM guidance — do not mix ESM source, CJS transforms, and mocking semantics accidentally.

Use deterministic test environment variables. Import `createApp(testDeps)` — never call `listen`.

## Test helpers

```ts
// tests/helpers/setup-integration.ts
import { prisma } from '../helpers/test-db'

beforeEach(async () => {
  await resetTestDatabase()
})

afterAll(async () => {
  await prisma.$disconnect()
  await cleanupTestDbFile()
})

// tests/helpers/app.ts
export function createTestApp() {
  return createApp(buildTestDependencies())
}
```

## Unit tests

Test **service** behavior with injected doubles. Cover at least:

| Area | Cases |
| --- | --- |
| Registration | Success, normalized email, duplicate account → conflict |
| Passwords | Hashing, omission from public output |
| Login | Success, invalid credentials (generic error) |
| Tokens | Creation profile, verification outcomes (valid/expired/wrong alg) |
| Errors | Service error propagation and mapping |
| i18n | Locale negotiation, fallback to `en` |
| Validators | Error formatter helpers |

Mock at architectural boundaries (repository, token service), not Prisma internals.

Example:

```ts
describe('AuthService.register', () => {
  it('returns public user without password hash', async () => {
    const result = await service.register({ name: 'A', email: 'a@b.com', password: 'secret123' })
    expect(result.user).not.toHaveProperty('passwordHash')
  })

  it('throws CONFLICT on duplicate email', async () => {
    repo.create.mockRejectedValue(prismaUniqueViolation)
    await expect(service.register(validInput)).rejects.toMatchObject({ code: 'CONFLICT' })
  })
})
```

## Integration tests

Use **Supertest** against the unbound Express app and a **real isolated SQLite** test database.

```ts
import request from 'supertest'
import { createTestApp } from '../helpers/app'

describe('POST /api/v1/auth/register', () => {
  const app = createTestApp()

  it('creates account and returns user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'password123' })
      .expect(201)

    expect(res.body.user).toMatchObject({ email: 'test@example.com', name: 'Test' })
    expect(res.body.user).not.toHaveProperty('passwordHash')
  })

  it('returns 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: 'password123' })
      .expect(422)

    expect(res.body.error.code).toBe('VALIDATION_FAILED')
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'email' })])
    )
  })
})
```

### Required integration coverage

| Area | Cases |
| --- | --- |
| Health | `GET /api/v1/health` returns 200 |
| Register | Success, invalid fields, duplicate email |
| Login | Success, generic credential failure |
| Verify | Missing token, malformed, expired, wrong claims, valid |
| Refresh/logout | When implemented: rotation, reuse detection, session clear |
| Protected routes | Principal attached, 401 without token |
| Errors | 404, malformed JSON, validation, unknown error (no stack) |
| i18n | Default `en`, `Accept-Language: my`, fallback, `Content-Language` |
| CORS | Allowed origin, denied origin, preflight |
| Redaction | No password hashes, tokens, stacks, or DB details in responses |

## Auth integration examples

```ts
describe('GET /api/v1/auth/verify', () => {
  it('returns 401 without token', async () => {
    await request(app).get('/api/v1/auth/verify').expect(401)
  })

  it('returns user with valid token', async () => {
    const { accessToken } = await registerAndLogin(app)
    const res = await request(app)
      .get('/api/v1/auth/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(res.body.user.email).toBe('test@example.com')
  })
})
```

## Database isolation

- Unique SQLite file per worker: `file:./test-${process.env.JEST_WORKER_ID}.db`
- Or `maxWorkers: 1` / `--runInBand` for mutating suites
- Guard: fail immediately if `DATABASE_URL` points to production PostgreSQL
- `prisma db push` before suite; delete files on teardown

Because SQLite differs from PostgreSQL, add a CI job that runs `prisma migrate deploy` against disposable PostgreSQL when feasible.

## Verification commands

```text
lint
typecheck
test              # unit
test:integration  # integration
build
prisma validate   # both schemas
```

Use coverage to find untested security and error branches, not as a substitute for behavioral assertions. Avoid full-response snapshots unless the contract genuinely benefits.
