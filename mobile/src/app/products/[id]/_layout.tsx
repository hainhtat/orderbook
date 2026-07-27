import { Stack } from 'expo-router';

import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProductIdLayout() {
  const { t } = useLocale();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="index" options={{ title: t('products.detailTitle') }} />
      <Stack.Screen name="edit" options={{ title: t('products.editTitle') }} />
      <Stack.Screen name="adjust-stock" options={{ title: t('products.adjustStockTitle') }} />
    </Stack>
  );
}
