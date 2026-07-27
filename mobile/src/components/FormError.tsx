import { Text } from '@expo/ui';

import { useTheme } from '@/theme/ThemeProvider';

type FormErrorProps = {
  message?: string | null;
};

export function FormError({ message }: FormErrorProps) {
  const { colors } = useTheme();

  if (!message) {
    return null;
  }

  return (
    <Text
      testID="form-error"
      style={{ padding: 12, borderRadius: 8, width: '100%', backgroundColor: colors.dangerSurface }}
      textStyle={{ color: colors.danger }}>
      {message}
    </Text>
  );
}
