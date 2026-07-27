import { Column, Text } from '@expo/ui';

import { Screen } from '@/components/Screen';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function AssistantScreen() {
  const { t } = useLocale();
  const { colors } = useTheme();

  return (
    <Screen testID="assistant-screen">
      <Column spacing={12}>
        <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
          {t('assistant.title')}
        </Text>
        <Text textStyle={{ color: colors.textMuted }}>{t('assistant.placeholder')}</Text>
      </Column>
    </Screen>
  );
}
