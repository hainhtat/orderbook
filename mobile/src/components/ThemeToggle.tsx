import { StyleSheet, View } from 'react-native';
import { Row, Switch, Text } from '@expo/ui';

import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export function ThemeToggle() {
  const { t } = useLocale();
  const { resolvedTheme, toggleTheme, colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text textStyle={{ color: colors.text }}>{t('settings.appearance')}</Text>
      <Row spacing={8}>
        <Text textStyle={{ color: colors.textMuted }}>
          {resolvedTheme === 'dark' ? t('settings.themeDark') : t('settings.themeLight')}
        </Text>
        <Switch
          testID="theme-toggle"
          value={resolvedTheme === 'dark'}
          onValueChange={toggleTheme}
        />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
});
