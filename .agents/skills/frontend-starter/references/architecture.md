# Architecture

## Stack decisions

- Start from Vite's `react-ts` template or `pnpm dlx shadcn@latest init -t vite`.
- Use **React Router v7 Data Mode** with `createBrowserRouter` and `RouterProvider`. Create the router once outside React state. Keep TanStack Query as the server-state owner; use route loaders/guards for redirects and orchestration, not as a second cache.
- Use **TanStack React Query v5** through one application `QueryClient` and query-key factories. Create the client outside component render (module scope or stable ref pattern).
- Use **React Hook Form** for form state. Prefer Zod + `@hookform/resolvers` when schema validation is needed; keep schemas as the source of inferred form types.
- Initialize **shadcn/ui** using current Vite instructions with Tailwind's Vite plugin (`tailwindcss`, `@tailwindcss/vite`). Add only components used by the starter (`button`, `dropdown-menu`, `input`, `label`, `card`, etc.).
- Use named **`lucide-react`** imports. Do not dynamically import the full icon map.
- Use **`i18next`** with **`react-i18next`**. Initialize before the React tree renders.

## Suggested structure

Adapt names to established repository conventions while preserving these boundaries:

```text
src/
  app/
    providers.tsx
    router.tsx
    query-client.ts
  components/
    ui/                    # shadcn source-owned primitives
    app-header.tsx
    mode-toggle.tsx
    language-switcher.tsx
  features/
    auth/
      api.ts
      auth-provider.tsx
      auth-guard.tsx
      queries.ts
      types.ts
      login-page.tsx
      register-page.tsx
  layouts/
    app-layout.tsx
  pages/
    home-page.tsx
    profile-page.tsx
    settings-page.tsx
    not-found-page.tsx
  lib/
    api-client.ts
    env.ts
  i18n/
    index.ts
    locales/
      en/
        common.json
        auth.json
        pages.json
      my/
        common.json
        auth.json
        pages.json
  test/
    setup.ts
    render.tsx
  main.tsx
```

Keep the three namespace files per locale (`common`, `auth`, `pages`) so translations remain replaceable rather than embedded in components.

## Providers

Compose providers in one `AppProviders` entry point:

```text
StrictMode
└─ ThemeProvider
   └─ QueryClientProvider
      └─ AuthProvider
         └─ RouterProvider
```

Initialize i18next as an imported singleton before this tree (import `./i18n` in `main.tsx`). If auth needs router navigation, invert only the minimum necessary boundary or let guards redirect declaratively; do not create circular imports. Add React Query Devtools only in development.

Create one application `QueryClient` with deliberate defaults:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})
```

Do not globally disable useful caching behavior merely to simplify tests.

## Routes and layout

Define these routes:

| Path | Access | Content |
| --- | --- | --- |
| `/login` | Public only | Login form; redirect authenticated users to `/` or intended route |
| `/register` | Public only | Registration form with password confirmation |
| `/` | Protected | `AppLayout` index → Home page |
| `/profile` | Protected | Profile page |
| `/settings` | Protected | Settings page |
| `*` | Public | Translated not-found page |

`AppLayout` must render:

- Semantic `<header>` with primary navigation (Home, Profile, Settings) and active route styling
- Theme toggle (light/dark)
- Language switcher (English / Myanmar)
- User/account action (e.g. logout when authenticated)
- `<main>` with `<Outlet />`

Keep Home, Profile, and Settings intentionally sparse but visually polished: unique translated headings, clear page structure, and room for future content. Include meaningful empty states rather than blank pages.

Represent session bootstrap explicitly. Show a neutral loading state while `/auth/verify` is pending. Do not briefly render protected content or redirect to login before bootstrap completes.

## Theme

Support **light** and **dark** with a visible toggle.

- Persist the choice under an app-specific `localStorage` key.
- Apply `light` or `dark` class to `document.documentElement` (or use shadcn's Vite dark-mode pattern).
- Avoid flash of wrong theme on first paint when practical (inline script or early read before paint).
- Use shadcn `DropdownMenu` or `Toggle` with Lucide `Sun` / `Moon` icons.
- Include screen-reader labels and translated menu options.

Optional: also support `system` preference if the repository already uses it; the minimum requirement is explicit light/dark toggle.

## Localization (English / Myanmar)

Configure i18next with:

- `fallbackLng: 'en'`
- `supportedLngs: ['en', 'my']`
- Namespaces: `common`, `auth`, `pages`
- Bundled JSON resources (preferred for starter/tests) or HTTP backend with local files under `public/locales/`

Language switcher requirements:

- Toggle or select between English and Myanmar
- Persist choice in `localStorage`
- Update `document.documentElement.lang` on change (`en` / `my`)
- Use Myanmar script for `my` translations in JSON files

Translate navigation, page headings, auth labels/errors, validation messages, theme options, language names, loading text, and fallback errors. Tests must use a synchronous local i18n instance — no network-loaded translations in tests.

Example i18n init pattern:

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from './locales/en/common.json'
import myCommon from './locales/my/common.json'
// ... other namespaces

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, auth: enAuth, pages: enPages },
    my: { common: myCommon, auth: myAuth, pages: myPages },
  },
  lng: localStorage.getItem('locale') ?? 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'my'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})
```

## Forms and data access

Create typed login and registration forms with:

- Labels and appropriate `autocomplete` attributes
- Disabled/pending states during submission
- Field-level validation errors
- Form-level server error display
- Password confirmation on registration
- Duplicate-submission prevention

Keep HTTP transport in one `api-client`. Expose feature-specific API functions and query/mutation hooks rather than calling `fetch` throughout components. Normalize non-2xx failures into a typed application error. Use `VITE_API_BASE_URL` from environment.

Integrate React Hook Form with shadcn form primitives (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`) when those components are added.

## Vite and Vitest configuration

Merge Vitest into `vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

Add Vitest types to `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  }
}
```

## Configuration and scripts

Provide `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Never place signing keys, refresh secrets, or privileged tokens in `VITE_*` variables — they ship to browsers.

Required `package.json` scripts:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "typecheck": "tsc -b --noEmit",
  "lint": "eslint .",
  "test": "vitest",
  "test:run": "vitest run"
}
```

Keep path aliases aligned across TypeScript, Vite, Vitest, and shadcn `components.json`.
