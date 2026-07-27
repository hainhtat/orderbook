# Testing Requirements

## Harness

Install:

```bash
npx expo install jest-expo jest @types/jest
npx expo install @testing-library/react-native
```

Configure Jest in `package.json` or `jest.config.js`:

```json
{
  "jest": {
    "preset": "jest-expo"
  }
}
```

**Do not** place test files inside `app/` — Expo Router treats every file there as a route. Use `tests/` or `__tests__/` at project root.

For Expo Router integration tests, use **`expo-router/testing-library`**:

```ts
import { renderRouter, screen } from 'expo-router/testing-library'
```

Recheck Jest version compatibility with `expo-router/testing-library` (Jest 30 support landed in recent expo-router patches).

## Custom render helper

Provide `tests/helpers/render-app.tsx`:

```ts
export function renderApp(options?: {
  initialUrl?: string
  authState?: AuthState
  locale?: 'en' | 'my'
  theme?: 'light' | 'dark'
}) {
  // wrap with providers + renderRouter mock filesystem
}
```

Mock `expo-secure-store`, API client, and NetInfo at architectural boundaries. Do not mock TanStack Query or React Hook Form internals.

Reset mocks and storage between tests.

## Unit tests

Test pure logic and services with injected doubles. Cover at least:

| Area | Cases |
| --- | --- |
| Theme | `resolveTheme` maps light/dark/system correctly |
| Locale | `translate` returns `my` and falls back to `en`; key parity |
| Token storage | save/get/clear wrapper (mock SecureStore) |
| Auth service | login success, invalid credentials, register duplicate |
| Validation | Zod/schema rules for login and register |
| API client | 401 triggers single refresh; refresh failure clears session |

Keep unit tests fast — no native modules unless mocked.

## Integration / component tests

Use `renderRouter` for screens that depend on Expo Router hooks:

```ts
import { renderRouter, screen } from 'expo-router/testing-library'

it('shows login when unauthenticated', async () => {
  renderRouter(
    {
      '(auth)/login': () => require('@/app/(auth)/login').default,
    },
    { initialUrl: '/login' }
  )
  expect(screen.getByText(/log in/i)).toBeOnTheScreen()
})
```

Use `userEvent` from `@testing-library/react-native` for interactions.

### Required coverage

| Area | What to assert |
| --- | --- |
| Bootstrapping | Loading UI while verify pending |
| Auth guard | Unauthenticated user cannot reach tabs; authenticated user cannot reach auth screens |
| Login | Validation errors, successful submit, server error |
| Register | Password confirmation, success, errors |
| Tabs | Home, Profile, Settings render translated titles |
| Settings | Theme toggle changes resolved theme; language toggle changes rendered text |
| Logout | Clears session; returns to auth flow |
| Verify | Session restore after mocked successful verify |
| Refresh | One coordinated refresh on 401; no infinite loop |

## Expo Router testing notes

- Use `renderRouter` whenever a component calls `useRouter`, `usePathname`, `useSegments`, or similar
- Mock `expo-router` `router` object only when testing imperative navigation calls
- Custom matchers: `toHavePathname`, `toHaveSegments` from `expo-router/testing-library`
- For navigation assertions, prefer `toHavePathname` over implementation-detail mocks

## Secure storage in tests

```ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))
```

Never hit real SecureStore in unit tests.

## Verification commands

```text
lint
typecheck
jest --runInBand          # when tests share mocked state
npx expo export             # optional build smoke check
```

Add `test:ci` with `--ci --coverage` only when requested or already enforced. Prioritize auth guards, token handling, and locale/theme toggles over coverage percentage.

## Maestro / E2E (optional)

Maestro flows are out of starter scope unless requested. Document as follow-up for launch → login → tabs → logout smoke testing on device.
