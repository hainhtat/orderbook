import { Stack } from 'expo-router';

import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function OrdersLayout() {
  const { t } = useLocale();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="new" options={{ title: t('orders.createTitle') }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
