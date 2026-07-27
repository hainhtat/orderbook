# Architecture

## Runtime decisions

- Target the **current stable Expo SDK** (SDK 56+ includes stable Expo UI in the default template). Declare the SDK in `app.json` / `app.config.ts`.
- Use **strict TypeScript** with path aliases (`@/` → `src/`).
- Use **Expo Router** file-based routing. Prefer `Stack.Protected` (SDK 53+) for declarative auth guards.
- Use **Expo UI** (`@expo/ui`) universal components as the UI layer. Wrap screen content in `Host`. Use `Row`/`Column` for layout inside `Host`; use React Native `View`/`Text` only when Expo UI does not cover the need.
- Install Expo-compatible packages with **`npx expo install <package>`** — never guess versions manually.
- Configure TanStack Query with React Native `onlineManager` (NetInfo) and `focusManager` (AppState) per official TanStack React Native guidance.

## Suggested structure

```text
app/
  _layout.tsx                 # Root: providers + Stack.Protected auth guards
  (auth)/
    _layout.tsx
    login.tsx
    register.tsx
  (tabs)/
    _layout.tsx               # Tabs: Home, Profile, Settings
    index.tsx                 # Home tab
    profile.tsx
    settings.tsx
  +not-found.tsx
src/
  providers/
    AppProviders.tsx
  features/
    auth/
      auth-provider.tsx
      auth-api.ts
      auth-queries.ts
      auth-types.ts
      use-auth.ts
  api/
    client.ts
    env.ts
  i18n/
    resources.ts              # en + my translation objects
    LocaleProvider.tsx
  theme/
    ThemeProvider.tsx
    colors.ts
  components/
    Screen.tsx                # Safe-area + themed scroll container
    LanguageToggle.tsx
    ThemeToggle.tsx
  lib/
    validation.ts             # Shared Zod schemas (optional)
tests/
  unit/
  integration/
  helpers/
    render-app.tsx
```

Keep route files in `app/` thin — delegate logic to `src/features/`.

## Expo Router layout

### Root layout with protected routes

Use `Stack.Protected` to gate auth vs app segments (SDK 53+):

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'
import { AppProviders } from '@/providers/AppProviders'
import { useAuth } from '@/features/auth/use-auth'

function RootNavigator() {
  const { status } = useAuth()
  const isAuthenticated = status === 'authenticated'
  const isBootstrapping = status === 'bootstrapping'

  if (isBootstrapping) {
    return <BootstrappingScreen />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  )
}
```

Protected routes are **client-side navigation guards only** — not a substitute for server-side authentication.

### Tab layout (Home, Profile, Settings)

Use JavaScript tabs (`Tabs` from `expo-router`) for cross-platform consistency in the starter:

```text
app/(tabs)/
  _layout.tsx
  index.tsx       → Home
  profile.tsx     → Profile
  settings.tsx    → Settings
```

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { useLocale } from '@/i18n/LocaleProvider'

export default function TabLayout() {
  const { t } = useLocale()

  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
    </Tabs>
  )
}
```

**Native tabs** (`expo-router/unstable-native-tabs`) are optional for platform-native tab bars — use only when the product explicitly wants them. The starter default is JavaScript tabs.

Keep tab screens intentionally sparse: translated headings, clear structure, and placeholders for future content.

## Providers

Compose in `AppProviders`:

```text
SafeAreaProvider
└─ ThemeProvider
   └─ LocaleProvider
      └─ QueryClientProvider
         └─ AuthProvider
            └─ {children}   # Expo Router layouts
```

Initialize i18n resources before or inside `LocaleProvider`. Create one `QueryClient` with stable defaults (`staleTime`, `retry: 1`).

Wire React Native integrations for TanStack Query:

```ts
// src/api/query-client.ts
import { AppState, Platform } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { focusManager, onlineManager } from '@tanstack/react-query'

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(!!state.isConnected))
)

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (status) => {
    if (Platform.OS !== 'web') handleFocus(status === 'active')
  })
  return () => subscription.remove()
})
```

## Expo UI usage

Import from `@expo/ui` (universal layer). SDK 56+ stable.

```tsx
import { Host, Column, Row, Button, Switch, TextInput } from '@expo/ui'

export function ExampleScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <Column spacing={16} padding={16}>
        <TextInput placeholder="Email" />
        <Button onPress={handleSubmit}>Submit</Button>
      </Column>
    </Host>
  )
}
```

Rules:

- Wrap Expo UI subtrees in `Host` — required root for native UI tree
- Prefer universal components over `@expo/ui/swift-ui` or `@expo/ui/jetpack-compose` unless platform-specific behavior is required
- Do not add NativeWind, Paper, gluestack, or other UI kits
- Use `react-native-safe-area-context` for safe areas around router screens
- Use `KeyboardAvoidingView` or platform-appropriate keyboard handling on auth forms

## Theme (light / dark)

Support **light** and **dark** with a visible toggle on Settings (minimum). Optional: also support `system` preference following device `useColorScheme`.

- Persist preference in AsyncStorage (non-secret UI preference only)
- Expose `colors`, `resolvedTheme`, `preference`, and `setPreference` from `ThemeProvider`
- Define light and dark palettes in `src/theme/colors.ts`
- Apply colors to navigation headers, tab bar, and screen backgrounds
- Settings screen hosts the theme toggle using Expo UI `Switch` or segmented control pattern

## Localization (English / Myanmar)

Use bundled translation resources (preferred for starter and tests):

```ts
// src/i18n/resources.ts
export const resources = {
  en: {
    tabs: { home: 'Home', profile: 'Profile', settings: 'Settings' },
    auth: { login: 'Log in', register: 'Create account', /* ... */ },
    theme: { light: 'Light', dark: 'Dark', label: 'Appearance' },
    language: { label: 'Language', english: 'English', myanmar: 'မြန်မာ' },
    /* ... */
  },
  my: {
    tabs: { home: 'မူလ', profile: 'ပရိုဖိုင်', settings: 'ဆက်တင်များ' },
    /* mirror all keys */
  },
} as const
```

`LocaleProvider` responsibilities:

- Supported locales: `en`, `my`; fallback `en`
- Detect device language via `expo-localization` `getLocales()[0]?.languageCode`
- Persist user override in AsyncStorage
- Expose `locale`, `setLocale`, and `t(key)` with typed keys
- Use Myanmar Unicode in `my` strings

Settings screen hosts the English/Myanmar language toggle.

Install:

```bash
npx expo install expo-localization @react-native-async-storage/async-storage
```

Set `react: { useSuspense: false }` in i18next init if using i18next directly; a lightweight custom `translate()` function (as above) is also acceptable for the starter.

## Forms

Use React Hook Form with `Controller` for Expo UI / React Native inputs:

```tsx
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform } from 'react-native'

<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
  <Controller
    control={control}
    name="email"
    render={({ field: { onChange, onBlur, value } }) => (
      <TextInput
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        keyboardType="email-address"
        autoCapitalize="none"
      />
    )}
  />
</KeyboardAvoidingView>
```

Login and register forms need: labels/accessibility, validation errors, pending state, form-level server error, password confirmation on register.

## API client

- Base URL from `EXPO_PUBLIC_API_BASE_URL` (typed env access)
- Attach `Authorization: Bearer <token>` from memory or secure storage
- On `401`: one coordinated refresh, then retry once (see authentication reference)
- Normalize errors into typed application errors
- Never log tokens

## Environment configuration

```env
# .env.example
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

Never put signing secrets in `EXPO_PUBLIC_*` variables — they ship in the client bundle.

## Scripts

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watchAll"
  }
}
```

Adapt to the repository's package manager (`pnpm expo start`, etc.).
