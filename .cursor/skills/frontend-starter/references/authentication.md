# JWT Authentication Contract

## Security boundary

Treat authentication as a frontend integration with a trusted backend. The backend owns registration, password hashing, credential validation, JWT issuance, signature verification, claim validation, refresh rotation, revocation, and authorization. The frontend owns forms, session bootstrap, authenticated requests, protected navigation, and safe failure handling.

**Never** implement signing or trustworthy verification with a secret embedded in the browser. Decoding a JWT payload is untrusted display logic, not verification.

## Default API contract

Use the repository's documented contract when present. Otherwise isolate these assumptions so they are easy to replace:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account and optionally establish a session |
| `POST` | `/auth/login` | Authenticate and establish a session |
| `POST` | `/auth/refresh` | Rotate/renew the short-lived access token |
| `GET` | `/auth/verify` | Verify the current session and return the canonical user |
| `POST` | `/auth/logout` | Revoke/clear the current session |

Model the canonical user separately from token claims. Give request and response bodies explicit TypeScript types, but confirm actual field names with the backend.

Example types (adapt to backend):

```ts
type User = {
  id: string
  email: string
  name: string
}

type AuthResponse = {
  user: User
}

type RegisterInput = {
  name: string
  email: string
  password: string
}

type LoginInput = {
  email: string
  password: string
}
```

## Session lifecycle

Represent at least `bootstrapping`, `authenticated`, and `anonymous` states.

1. On startup, call `GET /auth/verify` with credentials included.
2. On success, store the returned canonical user in auth/query state and render protected routes.
3. On expired access token, attempt one refresh per [Token transport](#token-transport), then retry the original request once.
4. On refresh or verification failure, clear client session state and protected query caches, then render public routes.
5. On login/register success, establish the session, consume the canonical user response, invalidate relevant queries, and navigate to the sanitized intended route.
6. On logout, call the backend, clear session state even if the request fails safely, remove protected cached data, and navigate to login.

Deduplicate concurrent refresh attempts with one shared promise. Prevent retry loops by never refreshing the refresh/verify/logout request recursively.

## Auth provider shape

Expose a minimal context API:

```ts
type AuthState =
  | { status: 'bootstrapping' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User }

type AuthContextValue = {
  state: AuthState
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}
```

Use TanStack Query for `verify` and user cache where appropriate, but keep a single source of truth for route-guard decisions.

## Protected routes

Implement an `AuthGuard` (component or route wrapper) that:

- Renders a neutral loading UI while `status === 'bootstrapping'`
- Redirects to `/login` with `?redirect=` when `status === 'anonymous'`
- Sanitizes redirect targets (reject external and protocol-relative URLs)
- Renders children or `<Outlet />` when authenticated

Implement a `PublicOnlyGuard` for `/login` and `/register` that redirects authenticated users away.

## Token transport

**Preferred:** Secure, HttpOnly, SameSite cookies issued by the backend, with `credentials: 'include'`, because browser JavaScript cannot read HttpOnly tokens. Coordinate CSRF protection with the backend when cookies authenticate requests.

**Alternative:** If the backend returns an access token to JavaScript, keep a short-lived access token in memory and attach `Authorization: Bearer <token>`. Prefer refresh token in HttpOnly cookie. Use persistent web storage only when the user accepts XSS exposure and the backend cannot support safer transport; document the tradeoff.

Never log tokens or put them in URLs, query strings, analytics, error messages, translation files, or build-time environment files.

## API client refresh flow

Centralize in `api-client.ts`:

```text
request → 401?
  → if refresh/verify/logout: fail
  → if already retried: clear session, fail
  → await single shared refresh promise
  → retry original request once
  → still 401? clear session, fail
```

Treat `401` as authentication problem (eligible for one coordinated refresh). Treat `403` as authenticated-but-forbidden (do not refresh automatically).

## Verification rules

Require the backend to cryptographically verify tokens. The frontend `GET /auth/verify` call is the source of truth for session state. A browser may decode claims only for non-authoritative UI hints and must treat them as untrusted until server verification succeeds.

## Login and register forms

Both forms use React Hook Form with translated validation messages.

**Login:** email, password, remember-me optional, server error on failure.

**Register:** name, email, password, password confirmation, server/field errors.

On success, invalidate auth-related queries and navigate to safe `redirect` param or `/`.

Avoid account-enumeration details in errors unless backend policy permits them.

## Failure behavior

- Preserve a safe relative intended route; reject external redirects.
- Reset sensitive form values and cached user data at logout or session invalidation.
- Distinguish network/offline failure from conclusively invalid session where product requirements need it.
- Show translated, accessible error messages via `role="alert"` or `aria-live`.
