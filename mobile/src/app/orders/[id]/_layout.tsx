import { Stack } from 'expo-router';

import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function OrderIdLayout() {
  const { t } = useLocale();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="index" options={{ title: t('orders.detailTitle') }} />
      <Stack.Screen name="edit" options={{ title: t('orders.editTitle') }} />
      <Stack.Screen name="payment" options={{ title: t('orders.recordPayment') }} />
    </Stack>
  );
}
