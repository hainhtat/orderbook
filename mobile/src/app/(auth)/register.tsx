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

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t } = useLocale();
  const { colors } = useTheme();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      await register(values);
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
      } else {
        setFormError(t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <Column spacing={20} style={styles.form}>
          <Column spacing={8}>
            <Text textStyle={{ color: colors.text, fontSize: 28, fontWeight: '700' }}>
              {t('auth.registerTitle')}
            </Text>
            <Text textStyle={{ color: colors.textMuted }}>{t('auth.registerSubtitle')}</Text>
          </Column>

          <Column spacing={12}>
            <Controller
              control={control}
              name="name"
              rules={{ required: t('auth.nameRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="register-name"
                  placeholder={t('auth.name')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoComplete="name"
                />
              )}
            />
            {errors.name ? <FormError message={errors.name.message} /> : null}

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
                  testID="register-email"
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
              rules={{
                required: t('auth.passwordRequired'),
                minLength: { value: 8, message: t('auth.passwordMinLength') },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="register-password"
                  placeholder={t('auth.password')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoComplete="new-password"
                />
              )}
            />
            {errors.password ? <FormError message={errors.password.message} /> : null}

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: t('auth.confirmPasswordRequired'),
                validate: (value) =>
                  value === getValues('password') || t('auth.passwordMismatch'),
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="register-confirm-password"
                  placeholder={t('auth.confirmPassword')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoComplete="new-password"
                />
              )}
            />
            {errors.confirmPassword ? (
              <FormError message={errors.confirmPassword.message} />
            ) : null}
          </Column>

          <FormError message={formError} />

          <Button
            testID="register-submit"
            label={submitting ? t('common.loading') : t('auth.register')}
            onPress={() => void onSubmit()}
            disabled={submitting}
          />

          {submitting ? <ActivityIndicator color={colors.primary} /> : null}

          <View style={styles.footer}>
            <Text textStyle={{ color: colors.textMuted }}>{`${t('auth.hasAccount')} `}</Text>
            <Link href="/login" asChild>
              <Pressable accessibilityRole="link">
                <Text textStyle={{ color: colors.primary }}>{t('auth.signIn')}</Text>
              </Pressable>
            </Link>
          </View>
        </Column>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  form: {
    paddingTop: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
