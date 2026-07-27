import { Button, Column, Text, TextInput } from '@expo/ui';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { FormError } from '@/components/FormError';
import { Screen } from '@/components/Screen';
import { isApiError } from '@/api/client';
import { useAuth } from '@/features/auth/use-auth';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type ShopFormValues = {
  name: string;
  phone: string;
  address: string;
};

export default function ShopSetupScreen() {
  const { createShop } = useAuth();
  const { t } = useLocale();
  const { colors } = useTheme();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ShopFormValues>({
    defaultValues: { name: '', phone: '', address: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      await createShop({
        name: values.name.trim(),
        phone: values.phone.trim() || undefined,
        address: values.address.trim() || undefined,
      });
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
              {t('shop.setupTitle')}
            </Text>
            <Text textStyle={{ color: colors.textMuted }}>{t('shop.setupSubtitle')}</Text>
          </Column>

          <Column spacing={12}>
            <Controller
              control={control}
              name="name"
              rules={{ required: t('shop.shopNameRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="shop-name"
                  placeholder={t('shop.shopName')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.name ? <FormError message={errors.name.message} /> : null}

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="shop-phone"
                  placeholder={t('shop.phone')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="shop-address"
                  placeholder={t('shop.address')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </Column>

          <FormError message={formError} />

          <Button
            testID="shop-submit"
            label={submitting ? t('common.loading') : t('shop.createShop')}
            onPress={() => void onSubmit()}
            disabled={submitting}
          />

          {submitting ? <ActivityIndicator color={colors.primary} /> : null}
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
});
