# Official Sources

Recheck before implementation — Expo SDK and Router APIs change frequently.

Last reviewed: 2026-07-27

**Expo skills note:** No dedicated Expo Cursor agent skill was available in this workspace. Use the official sources below. If Expo MCP or Expo skills are added later, prefer them for SDK-specific commands and breaking changes.

## Expo platform

| Topic | Source |
| --- | --- |
| Expo documentation | https://docs.expo.dev/ |
| Create Expo app | https://docs.expo.dev/get-started/create-a-project/ |
| Expo SDK changelog | https://expo.dev/changelog/sdk-56 |
| Environment variables | https://docs.expo.dev/guides/environment-variables/ |
| Expo Router introduction | https://docs.expo.dev/router/introduction/ |

## Expo Router

| Topic | Source |
| --- | --- |
| Navigation layouts | https://docs.expo.dev/router/basics/navigation-layouts/ |
| JavaScript tabs | https://docs.expo.dev/router/advanced/tabs/ |
| Protected routes | https://docs.expo.dev/router/advanced/protected/ |
| Protected routes blog | https://expo.dev/blog/simplifying-auth-flows-with-protected-routes |
| Router testing | https://docs.expo.dev/router/reference/testing/ |

## Expo UI

| Topic | Source |
| --- | --- |
| Expo UI blog (SDK 56 stable) | https://expo.dev/blog/expo-ui-stable-sdk-56 |
| Universal components | https://docs.expo.dev/versions/latest/sdk/ui/universal/ |
| Swift UI layer | https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/ |
| Jetpack Compose layer | https://docs.expo.dev/versions/latest/sdk/ui/jetpack-compose/ |

## React Native ecosystem

| Topic | Source |
| --- | --- |
| React Native | https://reactnative.dev/docs/getting-started |
| TanStack Query React Native | https://tanstack.com/query/latest/docs/framework/react/react-native |
| React Hook Form | https://react-hook-form.com/get-started |
| React Native Testing Library | https://callstack.github.io/react-native-testing-library/ |
| Unit testing with Jest (Expo) | https://docs.expo.dev/develop/unit-testing/ |

## Expo modules (commonly used in starter)

| Topic | Source |
| --- | --- |
| expo-localization | https://docs.expo.dev/versions/latest/sdk/localization/ |
| expo-secure-store | https://docs.expo.dev/versions/latest/sdk/securestore/ |
| expo-constants | https://docs.expo.dev/versions/latest/sdk/constants/ |
| expo-status-bar | https://docs.expo.dev/versions/latest/sdk/status-bar/ |
| @react-native-async-storage/async-storage | https://react-native-async-storage.github.io/async-storage/ |
| @react-native-community/netinfo | https://github.com/react-native-netinfo/react-native-netinfo |

## Security

| Topic | Source |
| --- | --- |
| JWT best practices (RFC 8725) | https://datatracker.ietf.org/doc/html/rfc8725 |

## Recommended install commands (verify at install time)

```bash
# Scaffold (SDK 56 default template includes Expo Router + Expo UI)
npx create-expo-app@latest <app-name> --template default

# Always use expo install for compatible versions
npx expo install expo-router expo-localization expo-secure-store
npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-community/netinfo
npx expo install react-native-safe-area-context react-native-screens

# Data + forms (check compatibility; may use npm/pnpm for non-Expo packages)
npx expo install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers

# Testing
npx expo install jest-expo jest @types/jest @testing-library/react-native
```

## Version notes (2026)

- **Expo SDK 56** ships React Native 0.85, React 19.2, stable **Expo UI** (`@expo/ui`) in the default template, and Expo Router with `Stack.Protected`.
- **Expo UI** universal components (`Host`, `Row`, `Column`, `Button`, `Switch`, `TextInput`) are the intended UI layer for this starter — not third-party kits.
- **Expo Router tabs**: JavaScript tabs (`Tabs` from `expo-router`) are the starter default; native tabs (`expo-router/unstable-native-tabs`) are optional.
- **`Stack.Protected`** requires SDK 53+. Use declarative `guard` props instead of imperative redirect effects in root layout.
- **TanStack Query** on React Native needs `onlineManager` + `focusManager` wiring for correct refetch behavior.
- **Tokens** belong in `expo-secure-store`, not AsyncStorage.
- **Jest**: use `jest-expo` preset; test files live outside `app/`. Use `expo-router/testing-library` for route tests.
- **Env vars**: only `EXPO_PUBLIC_*` are available client-side.

## Contract alignment

When pairing with backend/frontend starter skills, align on:

| Concern | Convention |
| --- | --- |
| API base | `EXPO_PUBLIC_API_BASE_URL` → `/api/v1` |
| Auth endpoints | register, login, verify, refresh, logout |
| Locales | `en`, `my` |
| Verify | `GET /auth/verify` returns canonical user |
| Token storage | SecureStore on mobile; HttpOnly cookies on web |

Confirm transport (Bearer vs cookie) with the backend before integration testing.
