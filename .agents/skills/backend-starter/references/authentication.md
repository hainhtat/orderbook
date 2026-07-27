# JWT Authentication

## Default routes

All routes are versioned under `/api/v1/auth`:

| Method | Path | Auth required | Purpose |
| --- | --- | --- | --- |
| `POST` | `/register` | No | Create account |
| `POST` | `/login` | No | Authenticate |
| `GET` | `/verify` | Yes (Bearer) | Return canonical user |
| `POST` | `/refresh` | Cookie/refresh token | Rotate access token |
| `POST` | `/logout` | Yes | Revoke session |

## Registration

Flow: **validator → controller → service → repository**

- Normalize email per product contract; enforce database unique constraint
- Validate password policy at request boundary
- Hash passwords with a current library (e.g. `bcrypt` or `argon2`) with calibrated cost parameters
- Never store, return, or log plaintext passwords
- Avoid check-then-create races: translate unique violation → stable `CONFLICT` error
- Return generic credential failure for wrong passwords and nonexistent accounts
- Map database records to explicit public user shape (no `passwordHash`)

Example request/response shapes (adapt field names to backend contract):

```ts
// POST /api/v1/auth/register
type RegisterBody = { name: string; email: string; password: string }
type AuthSuccessResponse = { user: PublicUser; /* token fields per transport */ }

type PublicUser = {
  id: string
  email: string
  name: string
}
```

## Login

- Validate email and password format at boundary
- Compare password against hash with constant-time comparison where practical
- Return same error shape for invalid email and invalid password (no enumeration)
- Issue tokens per [Token profile](#token-profile)
- Never include password hash in any response

## Token profile

Use a maintained JOSE/JWT library (`jose` recommended). Do not implement cryptography manually.

Define one explicit token profile:

| Claim / rule | Requirement |
| --- | --- |
| Algorithm | Pin allowed algorithm; reject `none`; never accept attacker-controlled `alg` |
| `iss` | Required, validated |
| `aud` | Required, validated |
| `sub` | User ID |
| `iat`, `exp` | Required; short-lived access tokens |
| Token type | Explicit claim distinguishing access vs refresh |
| Claims | Minimal, non-sensitive only |

- Use distinct validation rules and audiences for access vs refresh tokens
- Prefer asymmetric signing when multiple services verify; symmetric secret acceptable for single-service starters
- Keep signing keys outside source control; support key rotation when needed

## Token transport

**Preferred for SPAs:** Secure, HttpOnly, SameSite cookies for refresh; short-lived access token in `Authorization: Bearer` header or also HttpOnly depending on contract.

**Alternative:** Bearer access token in `Authorization` header; refresh in HttpOnly cookie.

Coordinate with the frontend starter skill's auth contract (`/auth/register`, `/auth/login`, `/auth/verify`, `/auth/refresh`, `/auth/logout`).

## Verification middleware

`authenticate` middleware must:

1. Parse `Authorization: Bearer <token>` (or cookie per contract)
2. Cryptographically verify signature with pinned algorithm
3. Validate `iss`, `aud`, `exp`, `nbf`, token type
4. Attach minimal typed principal to request: `{ userId, tokenId?, roles? }`
5. Distinguish missing credentials (`401`) from invalid/expired (`401` with stable code)

Use Express declaration merging in `src/types/express.d.ts`:

```ts
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; roles?: string[] }
      locale?: 'en' | 'my'
    }
  }
}
```

`GET /api/v1/auth/verify` runs the same middleware and returns the canonical public user from the database — not just decoded JWT claims.

## Refresh and logout

When refresh tokens are in scope:

- Prefer Secure, HttpOnly, SameSite cookie for refresh token
- Rotate refresh token on every use; store only hash/server-side session ID
- Detect reuse and revoke session family
- Add CSRF protection when cookies authenticate requests
- `POST /logout` revokes server-side session and clears cookies

Document limitation if stateless JWTs cannot be revoked without a session store.

## Security requirements

- Never place tokens in URLs or logs
- Redact `Authorization` and cookie headers from error logs
- Rate-limit credential and refresh endpoints in production (document as deployment work if not in starter)
- Configure HTTPS and secure cookies at the edge
- Set Express `trust proxy` only for known proxy topology
- Test: expired, malformed, wrong-algorithm, wrong-issuer, wrong-audience, wrong-type tokens
