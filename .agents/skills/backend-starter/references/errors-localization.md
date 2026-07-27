# Validation, Errors, Localization, and CORS

## Request validation

Use **express-validator** chains beside each feature.

```ts
// auth.validators.ts
import { body } from 'express-validator'

export const registerValidators = [
  body('name').trim().notEmpty().withMessage('REQUIRED'),
  body('email').trim().isEmail().withMessage('INVALID_EMAIL').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('PASSWORD_TOO_SHORT'),
]
```

Rules:

- Validate every consumed body, path, query, header, and cookie field
- Reject unknown fields when the contract requires strictness
- Stop before the controller via one `validateRequest` middleware
- Use `validationResult(req)` for failures and `matchedData(req)` for sanitized input
- Keep validator messages as **stable codes**, not embedded English prose

### validateRequest middleware

```ts
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError('VALIDATION_FAILED', 422, mapValidationErrors(errors)))
  }
  next()
}
```

Status code conventions:

| Situation | Status |
| --- | --- |
| Semantically invalid fields | `422` (or `400` if project standard) |
| Malformed JSON | `400` |
| Body too large | `413` |

Keep the choice consistent and documented.

## Error contract

Use a typed `AppError`:

```ts
class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    public details?: FieldError[],
    public cause?: unknown,
  ) { super(code) }
}
```

Centralized `errorHandler` maps:

- Validation errors → `422` + field details
- Authentication → `401`
- Authorization → `403`
- Not found → `404`
- Conflict (duplicate email) → `409`
- Prisma known errors → safe mapped responses
- Unknown errors → `500` + localized fallback (no stack in production)

### Response shape

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "တင်သွင်းထားသော အချက်အလက်များ မမှန်ကန်ပါ",
    "details": [
      { "field": "email", "code": "INVALID_EMAIL", "message": "..." }
    ],
    "requestId": "req_abc123"
  }
}
```

- `code` is language-neutral — clients use it for control flow
- `message` is localized human text
- Log internal cause once with request context and redaction
- Never return raw Prisma, JWT, or stack traces in production

## English and Myanmar handling

Support locale identifiers **`en`** and **`my`**, defaulting to `en`.

### Negotiation

1. Parse `Accept-Language` header with quality values
2. Optionally accept documented `?lang=my` or `X-Locale` header
3. Normalize region variants (`en-US` → `en`, `my-MM` → `my`)
4. Fall back deterministically to `en`

### Translation files

```text
src/i18n/locales/
  en.json
  my.json
```

Both files must have **identical key sets**. Use Myanmar Unicode, not legacy Zawgyi.

```json
// en.json
{
  "errors": {
    "VALIDATION_FAILED": "The submitted data is invalid",
    "UNAUTHORIZED": "Authentication required",
    "INVALID_CREDENTIALS": "Invalid email or password",
    "INTERNAL_ERROR": "Something went wrong"
  },
  "auth": {
    "REGISTER_SUCCESS": "Account created successfully"
  }
}
```

### Locale middleware

```ts
export function localeMiddleware(req: Request, res: Response, next: NextFunction) {
  req.locale = negotiateLocale(req) // 'en' | 'my'
  next()
}
```

Use `t(req.locale, 'errors.UNAUTHORIZED')` in error handler.

Response headers:

- `Content-Language: my` when Myanmar is selected
- `Vary: Accept-Language` when representation changes by header

Add a parity test that fails when either locale lacks keys.

## CORS

Configure from validated environment — CORS is browser policy, not authentication.

```ts
import cors from 'cors'

export function createCorsOptions(env: Env): cors.CorsOptions {
  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true) // non-browser clients
      if (env.ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
      callback(new Error('CORS_NOT_ALLOWED'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    exposedHeaders: ['Content-Language'],
    credentials: env.CORS_CREDENTIALS, // true when cookies used
  }
}
```

Rules:

- Allow only explicit trusted origins in production
- Never combine `credentials: true` with wildcard `origin`
- Handle preflight (`OPTIONS`) before authentication middleware
- Do not reflect arbitrary origins
- Test allowed, denied, and preflight behavior

## Environment configuration

Load and validate once at startup. Expose typed immutable config.

### `.env.example`

```env
NODE_ENV=development
PORT=3000

# SQLite for local dev/test
DATABASE_URL=file:./dev.db

# PostgreSQL for production (separate from SQLite)
# DATABASE_URL=postgresql://user:pass@localhost:5432/app
# DIRECT_URL=postgresql://user:pass@localhost:5432/app

ALLOWED_ORIGINS=http://localhost:5173
CORS_CREDENTIALS=true
DEFAULT_LOCALE=en

JWT_ISSUER=my-app
JWT_AUDIENCE=my-app-users
JWT_ACCESS_SECRET=change-me-in-production
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

TRUST_PROXY=false
```

Reject at startup:

- Missing secrets in production
- Invalid URLs
- Weak development defaults in production
- Incompatible database/provider combinations
- Wildcard credentialed CORS

Never commit `.env`, `*.db`, private keys, or real credentials.
