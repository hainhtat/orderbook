import { Button, Column, Text } from '@expo/ui';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function OrdersScreen() {
  const { t } = useLocale();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen testID="orders-screen">
      <Column spacing={16}>
        <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
          {t('orders.title')}
        </Text>
        <Text textStyle={{ color: colors.textMuted }}>{t('orders.placeholder')}</Text>
        <Button
          testID="orders-browse-products"
          label={t('orders.browseProducts')}
          onPress={() => router.push('/products')}
        />
      </Column>
    </Screen>
  );
}
