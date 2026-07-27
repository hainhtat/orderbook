import { Host, Text } from '@expo/ui';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export function BootstrappingScreen() {
  const { t } = useLocale();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Host style={{ padding: 24 }}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} testID="bootstrap-spinner" />
          <Text textStyle={{ color: colors.text }}>{t('bootstrap.loading')}</Text>
        </View>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
});
