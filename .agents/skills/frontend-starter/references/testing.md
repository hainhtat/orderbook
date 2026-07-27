# Testing Requirements

## Harness

Configure Vitest with jsdom and a setup file at `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

Install dev dependencies:

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Optional: `@vitest/coverage-v8` for coverage, MSW for HTTP mocking at the network boundary.

**Do not** mock TanStack Query itself, React Router internals, or React Hook Form.

## Custom render helper

Provide `src/test/render.tsx` with a `renderApp` helper that accepts:

- `initialRoute` (memory router)
- Fresh `QueryClient` per test (retries disabled)
- Auth context overrides or MSW handlers
- Deterministic i18n instance with bundled `en`/`my` resources

```ts
export function renderApp(ui: React.ReactElement, options?: RenderAppOptions) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  // wrap with providers + MemoryRouter or createMemoryRouter
}
```

Reset `localStorage`, mocks, and MSW handlers after each test.

## Required tests

Add meaningful tests for at least:

| Area | What to assert |
| --- | --- |
| Smoke | App renders; Home shows translated heading |
| Navigation | Header links reach Home, Profile, Settings; active state updates |
| Auth guard | Loading while verify pending; content after success; redirect after failure |
| Login | Required/invalid fields; successful submit; pending state; server error; safe redirect return |
| Register | Validation incl. password confirmation; success; pending; server/field errors |
| Session restore | `/auth/verify` success restores authenticated UI |
| Token refresh | One coordinated refresh + replay on 401; no infinite loop on refresh failure |
| Logout | Clears user state and protected query data; navigates to login |
| Theme | Selection persists; correct root class applied |
| Language | Toggle changes rendered text between English and Myanmar; persists; `en` fallback works |
| Query hooks | At least one success and one error path for a representative feature query |
| Not found | Unknown route shows translated 404 |
| Accessibility | Icon-only controls have accessible names |

## Test design

- Assert observable behavior, not implementation details.
- Prefer semantic queries: `getByRole`, `getByLabelText`, `getByText`.
- Use `@testing-library/user-event` for interactions.
- Use `waitFor` / `findBy*` for async state — no arbitrary `setTimeout`.
- Avoid broad snapshots, real API calls, and shared mutable clients.
- Test auth races: multiple concurrent `401` responses must produce one refresh request.
- Mock `matchMedia` with change listeners when testing system theme (if implemented).
- Keep translations synchronous and local in tests.

## Example test patterns

**Protected route while bootstrapping:**

```ts
it('shows loading until verify completes', async () => {
  server.use(delayedVerifyHandler)
  renderApp(<App />, { initialRoute: '/' })
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
  await waitFor(() => expect(screen.getByRole('heading', { name: /home/i })).toBeInTheDocument())
})
```

**Language toggle:**

```ts
it('switches to Myanmar', async () => {
  const user = userEvent.setup()
  renderApp(<App />)
  await user.click(screen.getByRole('button', { name: /language/i }))
  await user.click(screen.getByRole('menuitem', { name: /myanmar/i }))
  expect(screen.getByRole('heading', { name: /မူလစာမျက်နှာ/i })).toBeInTheDocument()
})
```

Adapt Myanmar heading text to actual translation keys.

## Verification commands

Expose and run repository-equivalent commands:

```text
lint
typecheck
vitest run
build
```

Add coverage only when requested or already enforced. Prioritize auth, route guards, providers, and API error handling over percentage chasing.
