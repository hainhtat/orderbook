import { Button, Text } from '@expo/ui';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type LoadingStateProps = {
  testID?: string;
};

export function LoadingState({ testID = 'loading-state' }: LoadingStateProps) {
  const { colors } = useTheme();
  const { t } = useLocale();

  return (
    <View testID={testID} style={styles.centered}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text textStyle={{ color: colors.textMuted }}>{t('common.loading')}</Text>
    </View>
  );
}

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  testID?: string;
};

export function ErrorState({ message, onRetry, testID = 'error-state' }: ErrorStateProps) {
  const { colors } = useTheme();
  const { t } = useLocale();

  return (
    <View testID={testID} style={styles.centered}>
      <Text textStyle={{ color: colors.danger, textAlign: 'center' }}>
        {message ?? t('common.error')}
      </Text>
      {onRetry ? <Button label={t('common.retry')} onPress={onRetry} /> : null}
    </View>
  );
}

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  testID = 'empty-state',
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View testID={testID} style={styles.centered}>
      <Text textStyle={{ color: colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text textStyle={{ color: colors.textMuted, textAlign: 'center' }}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 12 }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
});
