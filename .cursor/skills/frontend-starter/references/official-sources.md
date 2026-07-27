# Official Sources

Recheck these before implementation — frontend tooling changes quickly. Prefer official docs over blog posts when they conflict.

Last reviewed: 2026-07-27

## Core tooling

| Topic | Source |
| --- | --- |
| Vite | https://vite.dev/guide/ |
| Vite env variables | https://vite.dev/guide/env-and-mode.html |
| Vitest | https://vitest.dev/guide/ |
| Vitest browser/DOM | https://vitest.dev/guide/browser/ |
| TypeScript | https://www.typescriptlang.org/docs/ |

## React ecosystem

| Topic | Source |
| --- | --- |
| React | https://react.dev/ |
| React Router modes | https://reactrouter.com/start/modes |
| React Router Data Mode routing | https://reactrouter.com/start/data/routing |
| React Router `createBrowserRouter` | https://api.reactrouter.com/v7/functions/react-router.createBrowserRouter.html |
| TanStack Query installation | https://tanstack.com/query/latest/docs/framework/react/installation |
| TanStack Query quick start | https://tanstack.com/query/latest/docs/framework/react/quick-start |
| TanStack Query testing | https://tanstack.com/query/latest/docs/framework/react/guides/testing |
| React Hook Form get started | https://react-hook-form.com/get-started |

## UI, styling, icons

| Topic | Source |
| --- | --- |
| shadcn/ui installation | https://ui.shadcn.com/docs/installation |
| shadcn/ui Vite setup | https://ui.shadcn.com/docs/installation/vite |
| shadcn/ui CLI | https://ui.shadcn.com/docs/cli |
| shadcn/ui Vite dark mode | https://ui.shadcn.com/docs/dark-mode/vite |
| Tailwind CSS | https://tailwindcss.com/docs |
| Tailwind dark mode | https://tailwindcss.com/docs/dark-mode |
| Lucide React | https://lucide.dev/guide/react |

## Internationalization

| Topic | Source |
| --- | --- |
| react-i18next quick start | https://react.i18next.com/guides/quick-start |
| react-i18next hooks | https://react.i18next.com/latest/using-with-hooks |
| i18next configuration | https://www.i18next.com/overview/configuration-options |

## Testing

| Topic | Source |
| --- | --- |
| React Testing Library | https://testing-library.com/docs/react-testing-library/intro/ |
| jest-dom matchers | https://github.com/testing-library/jest-dom |
| user-event | https://testing-library.com/docs/user-event/intro |
| MSW (optional HTTP mocking) | https://mswjs.io/docs/ |

## Security

| Topic | Source |
| --- | --- |
| JWT best practices (RFC 8725) | https://datatracker.ietf.org/doc/html/rfc8725 |

## Recommended install commands (verify versions at install time)

```bash
# Scaffold
pnpm create vite@latest <app-name> --template react-ts

# Or shadcn-first scaffold
pnpm dlx shadcn@latest init -t vite

# Core runtime
pnpm add react-router @tanstack/react-query react-hook-form i18next react-i18next lucide-react

# Optional validation
pnpm add zod @hookform/resolvers

# Tailwind (if not added by shadcn init)
pnpm add tailwindcss @tailwindcss/vite

# Testing
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# shadcn components (add as needed)
pnpm dlx shadcn@latest add button input label card dropdown-menu form
```

## Version notes (2026)

- **React Router v7** uses the `react-router` package with Data Mode as the recommended pattern for SPAs needing loaders, actions, and data APIs.
- **TanStack Query v5** uses `isPending` (not v4's `isLoading` for initial fetch in all cases). Requires React 18+.
- **shadcn/ui** supports `pnpm dlx shadcn@latest init -t vite` and Tailwind v4 via `@tailwindcss/vite`.
- **Vitest** shares `vite.config.ts`; use `/// <reference types="vitest/config" />` for typed test config.
- **i18next v24+** requires `Intl.PluralRules` polyfill in Hermes/React Native only; not needed for standard web targets.
- **Zod v4** works with `@hookform/resolvers` v5; use `z.infer<typeof schema>` for form types.
