import { Column, Text } from '@expo/ui';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/use-auth';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { colors } = useTheme();

  return (
    <Screen testID="dashboard-screen">
      <Column spacing={12}>
        <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
          {t('dashboard.title')}
        </Text>
        {user ? (
          <Text textStyle={{ color: colors.textMuted }}>
            {t('dashboard.welcome', { name: user.name })}
          </Text>
        ) : null}
        <Text textStyle={{ color: colors.textMuted }}>{t('dashboard.placeholder')}</Text>
      </Column>
    </Screen>
  );
}
