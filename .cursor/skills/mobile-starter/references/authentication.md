# JWT Authentication

Align with the backend starter and frontend starter auth contract unless the repository documents otherwise.

## Security boundary

The **backend** owns registration, password hashing, JWT issuance, cryptographic verification, refresh rotation, and revocation. The mobile app owns forms, secure token storage, authenticated requests, protected navigation, and safe failure handling.

**Never** treat on-device JWT payload decoding as verification. `GET /auth/verify` is the source of truth for session state.

## Default API contract

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Authenticate |
| `GET` | `/api/v1/auth/verify` | Verify session; return canonical user |
| `POST` | `/api/v1/auth/refresh` | Rotate access token |
| `POST` | `/api/v1/auth/logout` | Revoke session |

Confirm exact paths and field names with the backend. Prefix may be `/api/v1` or `/auth` depending on deployment.

## Types

```ts
type User = {
  id: string
  email: string
  name: string
}

type LoginInput = { email: string; password: string }
type RegisterInput = { name: string; email: string; password: string; confirmPassword: string }
```

## Session lifecycle

Represent at least `bootstrapping`, `authenticated`, and `anonymous`:

1. On startup, call `GET /auth/verify` with stored credentials
2. On success, set authenticated state with canonical user
3. On expired access token, attempt one coordinated refresh, retry request once
4. On refresh/verify failure, clear secure storage and protected query caches → anonymous
5. On login/register success, persist tokens, invalidate auth queries, router shows `(tabs)` via `Stack.Protected`
6. On logout, call backend, clear tokens even if request fails, clear caches, router shows `(auth)`

Deduplicate concurrent refresh with one shared promise. Never refresh the refresh/verify/logout request recursively.

## Auth provider

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

Expose `status` and `user` through `useAuth()`. Route guards read `status` only — do not duplicate auth state in Zustand or similar unless the repository already uses that pattern.

## Token storage

Use **`expo-secure-store`** for access and refresh tokens:

```bash
npx expo install expo-secure-store
```

```ts
// src/features/auth/token-storage.ts
import * as SecureStore from 'expo-secure-store'

const ACCESS_KEY = 'auth.access_token'
const REFRESH_KEY = 'auth.refresh_token'

export const tokenStorage = {
  async save(access: string, refresh?: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, access)
    if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh)
  },
  async getAccess() {
    return SecureStore.getItemAsync(ACCESS_KEY)
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH_KEY)
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY)
    await SecureStore.deleteItemAsync(REFRESH_KEY)
  },
}
```

**Never** store tokens in AsyncStorage. AsyncStorage is acceptable only for non-secret preferences (theme, locale).

Keep a short-lived access token in memory when the API contract returns it to JavaScript, with refresh in SecureStore.

## API client refresh flow

```text
request → 401?
  → if refresh/verify/logout: fail
  → if already retried: clear session, fail
  → await single shared refresh promise
  → retry original request once
  → still 401? clear session, fail
```

## Protected routes

Use **`Stack.Protected`** in root `app/_layout.tsx`:

- `(tabs)` guarded by `status === 'authenticated'`
- `(auth)` guarded by `status === 'anonymous'`
- Show neutral bootstrapping UI while `status === 'bootstrapping'`

When guard flips from authenticated to anonymous, Expo Router clears navigation history for the protected segment — users cannot navigate back to tabs after logout.

Protected routes do not replace server-side authorization. Every API call must still send valid credentials.

## Login and register screens

Located in `app/(auth)/`:

- **login.tsx** — email, password, submit, link to register
- **register.tsx** — name, email, password, confirm password, submit, link to login

Requirements:

- React Hook Form + translated validation messages
- Disabled state while submitting
- Form-level server error display
- Generic credential errors (no account enumeration)
- Keyboard-aware layout
- Accessible labels for all inputs

On success, auth provider updates state; `Stack.Protected` navigates to tabs automatically — avoid manual `router.replace` unless required by deep-link handling.

## Logout

Expose logout from Profile or Settings. Call `POST /auth/logout`, clear SecureStore, clear TanStack Query caches for user-specific data, set anonymous state.

## Failure behavior

- Distinguish network errors from invalid session where product needs offline resilience
- Show translated error messages
- Never expose tokens, password hashes, or stack traces in UI
- Clear sensitive form state on logout
