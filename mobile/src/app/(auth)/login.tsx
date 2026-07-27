import { Button, Column, Text, TextInput } from '@expo/ui';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { FormError } from '@/components/FormError';
import { Screen } from '@/components/Screen';
import { isApiError } from '@/api/client';
import { useAuth } from '@/features/auth/use-auth';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useLocale();
  const { colors } = useTheme();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      await login(values);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        setFormError(t('auth.invalidCredentials'));
      } else {
        setFormError(t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <View style={styles.form}>
          <Column spacing={20}>
          <Column spacing={8}>
            <Text textStyle={{ color: colors.text, fontSize: 28, fontWeight: '700' }}>
              {t('auth.loginTitle')}
            </Text>
            <Text textStyle={{ color: colors.textMuted }}>{t('auth.loginSubtitle')}</Text>
          </Column>

          <Column spacing={12}>
            <Controller
              control={control}
              name="email"
              rules={{
                required: t('auth.emailRequired'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('auth.emailInvalid'),
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="login-email"
                  placeholder={t('auth.email')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />
            {errors.email ? <FormError message={errors.email.message} /> : null}

            <Controller
              control={control}
              name="password"
              rules={{ required: t('auth.passwordRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="login-password"
                  placeholder={t('auth.password')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoComplete="password"
                />
              )}
            />
            {errors.password ? <FormError message={errors.password.message} /> : null}
          </Column>

          <FormError message={formError} />

          <Button
            testID="login-submit"
            label={submitting ? t('common.loading') : t('auth.login')}
            onPress={() => void onSubmit()}
            disabled={submitting}
          />

          {submitting ? <ActivityIndicator color={colors.primary} /> : null}

          <View style={styles.footer}>
            <Text textStyle={{ color: colors.textMuted }}>{`${t('auth.noAccount')} `}</Text>
            <Link href="/register" asChild>
              <Pressable accessibilityRole="link">
                <Text textStyle={{ color: colors.primary }}>{t('auth.signUp')}</Text>
              </Pressable>
            </Link>
          </View>
          </Column>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
