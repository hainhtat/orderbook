import { Button, Row, Text } from '@expo/ui';
import { StyleSheet, View } from 'react-native';

import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text textStyle={{ color: colors.text }}>{t('settings.language')}</Text>
      <Row spacing={8}>
        <Button
          testID="language-en"
          variant={locale === 'en' ? 'filled' : 'outlined'}
          label={t('settings.english')}
          onPress={() => setLocale('en')}
        />
        <Button
          testID="language-my"
          variant={locale === 'my' ? 'filled' : 'outlined'}
          label={t('settings.myanmar')}
          onPress={() => setLocale('my')}
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
