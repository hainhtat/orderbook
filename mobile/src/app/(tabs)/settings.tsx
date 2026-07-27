import { Button, Column, Text } from '@expo/ui';
import { StyleSheet, View } from 'react-native';

import { LanguageToggle } from '@/components/LanguageToggle';
import { Screen } from '@/components/Screen';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/features/auth/use-auth';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const { shop, logout } = useAuth();
  const { t } = useLocale();
  const { colors } = useTheme();

  return (
    <Screen testID="settings-screen">
      <Column spacing={24}>
        <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
          {t('settings.title')}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Column spacing={16}>
            <Text textStyle={{ color: colors.text, fontWeight: '600' }}>{t('settings.shop')}</Text>
            <Text textStyle={{ color: colors.textMuted }}>
              {shop?.name ?? t('settings.noShop')}
            </Text>
          </Column>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Column spacing={16}>
            <ThemeToggle />
            <LanguageToggle />
          </Column>
        </View>

        <Button
          testID="logout-button"
          variant="outlined"
          label={t('settings.logout')}
          onPress={() => void logout()}
        />
      </Column>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
});
