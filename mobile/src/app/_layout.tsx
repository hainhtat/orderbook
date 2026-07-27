import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { BootstrappingScreen } from '@/components/BootstrappingScreen';
import { useAuth } from '@/features/auth/use-auth';
import { AppProviders } from '@/providers/AppProviders';
import { useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status, shop } = useAuth();
  const { resolvedTheme } = useTheme();

  const isAuthenticated = status === 'authenticated';
  const needsShopSetup = isAuthenticated && shop === null;

  useEffect(() => {
    if (status !== 'bootstrapping') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'bootstrapping') {
    return <BootstrappingScreen />;
  }

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isAuthenticated && !needsShopSetup}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="products" options={{ headerShown: false }} />
          <Stack.Screen name="customers" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={needsShopSetup}>
          <Stack.Screen name="(setup)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
