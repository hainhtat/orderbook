---
name: mobile-starter
description: >-
  Scaffold or modernize a production-minded Expo mobile app using React Native,
  Expo Router, Expo UI (@expo/ui), TypeScript, TanStack React Query, React Hook
  Form, light/dark theming, and English/Myanmar localization with JWT
  register/login, token verification, and protected routes. Use when
  bootstrapping or standardizing a mobile app with tab navigation (Home,
  Profile, Settings), providers, auth flows, and baseline tests. Do not add a
  dedicated third-party UI library.
---

# Mobile Starter

Implementation specification for a future agent. **Do not treat this skill as prebuilt boilerplate** — read it, inspect the destination repository, confirm current official Expo docs, then implement.

## Before you build

1. Inspect the repository, Expo SDK version, package manager, existing API contract, and deployment target (Expo Go vs dev build vs store release).
2. Preserve compatible existing choices. Ask only when a missing answer materially changes security or architecture; otherwise state the assumption and proceed.
3. Read [references/architecture.md](references/architecture.md) before creating structure, routes, providers, UI, theme, or translations.
4. Read [references/authentication.md](references/authentication.md) before implementing register, login, session restoration, protected routes, or token verification.
5. Read [references/testing.md](references/testing.md) before adding or evaluating tests.
6. Read [references/official-sources.md](references/official-sources.md) and recheck linked docs for breaking changes before installing packages.

**Expo skills:** No dedicated Expo Cursor skill was found in the workspace. Use official Expo documentation linked in `official-sources.md` as the primary reference. When Expo MCP or Expo skills become available, prefer them for SDK-specific setup.

Use current stable, mutually compatible releases. **Always install Expo packages with `npx expo install`** (not plain `npm install`) so versions match the project's SDK.

## Target stack

| Layer | Choice |
| --- | --- |
| Platform | React Native via Expo |
| Navigation | Expo Router (file-based routing) |
| UI | **Expo UI** (`@expo/ui`) — universal components; no third-party UI library |
| Language | TypeScript (strict) |
| Server state | TanStack React Query v5 |
| Forms | React Hook Form (+ Zod resolver when validation is needed) |
| Theme | Light and dark with toggle; persist preference |
| i18n | English (`en`) and Myanmar (`my`) with translation resources |
| Auth | JWT integration with backend token verification |
| Secure storage | `expo-secure-store` for tokens (never AsyncStorage for secrets) |
| Locale detection | `expo-localization` |
| Tests | `jest-expo` + `@testing-library/react-native` + `expo-router/testing-library` |

## Build workflow

1. **Scaffold** — Create the app with the current Expo default template (includes Expo Router and Expo UI on SDK 56+):
   ```bash
   npx create-expo-app@latest <app-name> --template default
   ```
   Or specify SDK: `npx create-expo-app@latest <app-name> --template default@sdk-56`

2. **Install dependencies** — Use `npx expo install` for all Expo/React Native packages. Add React Query, React Hook Form, and testing libraries per [references/official-sources.md](references/official-sources.md).

3. **Implement architecture** — Follow [references/architecture.md](references/architecture.md) for folder layout, providers, tab navigation, theme, and translations.

4. **Implement authentication** — Follow [references/authentication.md](references/authentication.md). Never invent a backend inside a mobile-only request.

5. **Build screens** — Empty but polished Home, Profile, and Settings tabs inside a default tab layout. Login and register screens outside the tab group.

6. **Add tests** — Follow [references/testing.md](references/testing.md).

7. **Verify** — Run lint, typecheck, tests, and `npx expo export` or project-equivalent build check. Fix failures caused by the work.

8. **Report** — State assumptions, expected backend endpoints, verification performed, and remaining infrastructure work.

## Quality rules

- **No third-party UI library** — Do not add NativeWind, React Native Paper, gluestack, Tamagui, or similar. Use `@expo/ui` universal components (`Host`, `Row`, `Column`, `Button`, `Switch`, `TextInput`, etc.) and React Native primitives where needed.
- Keep server state in TanStack Query, form state in React Hook Form, route state in Expo Router, theme in its provider, and session state in one auth abstraction.
- Use strict TypeScript. Validate untrusted API data at the boundary when a validation library is available.
- Keep every user-visible string in translation resources for both `en` and `my`.
- Meet mobile accessibility basics: labels, touch targets, screen reader names, and visible focus where platform supports it.
- Design interfaces with commercial-app quality — clear hierarchy, meaningful empty/loading/error states, safe areas, and keyboard-aware forms.
- Never claim JWT verification based on parsing payload or checking `exp` on-device without a backend `/auth/verify` call.
- Never store access or refresh tokens in AsyncStorage.

## Completion criteria

Finish only when the app has:

- Root providers (`SafeAreaProvider` → `ThemeProvider` → `LocaleProvider` → `QueryClientProvider` → `AuthProvider`)
- `(tabs)` layout with Home, Profile, and Settings tabs
- `(auth)` group with login and register screens
- `Stack.Protected` guards for authenticated vs public routes
- Theme toggle (light/dark) and language toggle (English/Myanmar)
- Translation files for `en` and `my`
- Session bootstrap via `GET /auth/verify` with explicit loading state
- Authenticated API client with coordinated refresh behavior
- Baseline tests per [references/testing.md](references/testing.md)
- Passing lint, typecheck, and test commands
