---
name: frontend-starter
description: >-
  Scaffold or modernize a production-minded React SPA starter using Vite,
  TypeScript, Vitest, TanStack React Query, React Router Data Mode, React Hook
  Form, shadcn/ui, Tailwind CSS, Lucide icons, light/dark theming, and
  English/Myanmar localization with JWT register/login and token verification.
  Use when bootstrapping, initializing, or standardizing a frontend app with
  providers, an app shell, Home/Profile/Settings pages, auth flows, protected
  routes, and baseline tests.
---

# Frontend Starter

Implementation specification for a future agent. **Do not treat this skill as prebuilt boilerplate** — read it, inspect the destination repository, confirm current official docs, then implement.

## Before you build

1. Inspect the repository, package manager, existing conventions, API contract, and deployment target.
2. Preserve compatible existing choices. Ask only when a missing answer materially changes security or architecture; otherwise state the assumption and proceed.
3. Read [references/architecture.md](references/architecture.md) before creating structure, routes, providers, UI, or translations.
4. Read [references/authentication.md](references/authentication.md) before implementing register, login, session restoration, protected routes, or token verification.
5. Read [references/testing.md](references/testing.md) before adding or evaluating tests.
6. Read [references/official-sources.md](references/official-sources.md) and recheck linked docs for breaking changes before installing packages.

Use current stable releases that are mutually compatible. Do not blindly copy version-specific snippets from this skill.

## Target stack

| Layer | Choice |
| --- | --- |
| Build | Vite (`react-ts` template) |
| UI | React + strict TypeScript |
| Routing | React Router v7 Data Mode (`createBrowserRouter`, `RouterProvider`) |
| Server state | TanStack React Query v5 |
| Forms | React Hook Form (+ Zod resolver when validation is needed) |
| Components | shadcn/ui (source-owned) + Tailwind CSS |
| Icons | Lucide React (named imports only) |
| i18n | `i18next` + `react-i18next` |
| Locales | English (`en`) and Myanmar (`my`) |
| Theme | Light and dark with toggle; persist preference |
| Auth | JWT integration with backend token verification |
| Tests | Vitest + React Testing Library + user-event |

## Build workflow

1. **Scaffold** — Create the app with Vite's React TypeScript template. Do not overwrite unrelated files.
   ```bash
   pnpm create vite@latest <app-name> --template react-ts
   ```
   Or scaffold via shadcn when starting fresh:
   ```bash
   pnpm dlx shadcn@latest init -t vite
   ```

2. **Configure tooling** — Set up Tailwind (prefer `@tailwindcss/vite`), `@` path aliases in both `tsconfig.json` and `tsconfig.app.json`, and matching `vite.config.ts` alias resolution with `@types/node`.

3. **Install core dependencies** — Add React Router, TanStack Query, React Hook Form, i18n packages, Lucide, and testing libraries per [references/official-sources.md](references/official-sources.md). Add shadcn/ui via `pnpm dlx shadcn@latest init` and add only components the starter actually uses.

4. **Implement architecture** — Follow [references/architecture.md](references/architecture.md) for folder layout, provider tree, routes, layout, theme, and translations. Design mobile-first: establish the narrow viewport and touch interaction model before adding larger-screen enhancements.

5. **Implement authentication** — Follow [references/authentication.md](references/authentication.md). Never invent a backend inside a frontend-only request.

6. **Add pages and shell** — Empty but polished Home, Profile, and Settings pages inside a default layout with header, navigation, theme toggle, and language toggle.

7. **Add tests** — Follow [references/testing.md](references/testing.md). Provide a custom `renderApp` helper and required behavioral coverage.

8. **Verify** — Run formatting, linting, typecheck, `vitest run`, and production build. Fix failures attributable to the work.

9. **Report** — State assumptions, expected backend endpoints, verification performed, and any remaining backend work.

## Quality rules

- Keep server state in TanStack Query, form state in React Hook Form, route state in React Router, theme state in its provider, and session state in one auth abstraction. Do not duplicate ownership.
- Use strict TypeScript and typed environment access. Validate untrusted API data at the boundary when a validation library is available or requested.
- Prefer feature-oriented modules and small public interfaces. Avoid a generic dumping-ground `utils` folder.
- Use shadcn/ui primitives as source-owned components and Lucide icons through direct named imports.
- Meet basic accessibility: semantic landmarks, visible focus, labels, keyboard operation, status/error announcements, and icon-only accessible names.
- Keep every user-visible string in translation resources for both `en` and `my`, including validation, navigation, auth, theme, and error text.
- Design interfaces with the quality of a modern commercial web application — clear hierarchy, thoughtful spacing and typography, meaningful empty/loading/error states, and subtle interactions where appropriate. Avoid generated CRUD-scaffold aesthetics.
- Reuse existing repository patterns before introducing new ones.
- Never claim JWT verification based on parsing its payload or checking `exp` in the browser.

## Completion criteria

Finish only when the app has:

- Complete provider tree (`ThemeProvider` → `QueryClientProvider` → `AuthProvider` → `RouterProvider`, with i18n initialized before render)
- Public `/login` and `/register` routes with public-only guards
- Protected layout routes for `/`, `/profile`, and `/settings`
- Header with navigation, theme toggle, and English/Myanmar language toggle
- Translation files for `en` and `my`
- Session bootstrap via `/auth/verify` with explicit loading state
- Authenticated API client with coordinated refresh behavior
- Baseline tests from [references/testing.md](references/testing.md)
- Passing typecheck, test, and build commands
