import { Button, Column, Text, TextInput } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { isApiError } from '@/api/client';
import { FormError } from '@/components/FormError';
import { Screen } from '@/components/Screen';
import { useCreateCustomer } from '@/features/customers/use-customers';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type CustomerFormValues = {
  name: string;
  phone: string;
  address: string;
  notes: string;
};

export function CustomerCreateScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const createCustomer = useCreateCustomer();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    defaultValues: { name: '', phone: '', address: '', notes: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await createCustomer.mutateAsync({
        name: values.name.trim(),
        phone: values.phone.trim(),
        address: values.address.trim() || undefined,
        notes: values.notes.trim() || undefined,
      });
      router.replace(`/customers/${result.customer.id}`);
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setFormError(t('customers.duplicatePhone'));
      } else if (isApiError(error)) {
        setFormError(error.message);
      } else {
        setFormError(t('common.error'));
      }
    }
  });

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <Column spacing={20} style={styles.form}>
          <Column spacing={8}>
            <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
              {t('customers.createTitle')}
            </Text>
            <Text textStyle={{ color: colors.textMuted }}>{t('customers.createSubtitle')}</Text>
          </Column>

          <Column spacing={12}>
            <Controller
              control={control}
              name="name"
              rules={{ required: t('customers.nameRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="customer-name"
                  placeholder={t('customers.name')}
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
              rules={{ required: t('customers.phoneRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="customer-phone"
                  placeholder={t('customers.phone')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.phone ? <FormError message={errors.phone.message} /> : null}

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="customer-address"
                  placeholder={t('customers.addressOptional')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="customer-notes"
                  placeholder={t('customers.notesOptional')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </Column>

          <FormError message={formError} />

          <Button
            testID="customer-submit"
            label={createCustomer.isPending ? t('common.loading') : t('customers.save')}
            onPress={() => void onSubmit()}
            disabled={createCustomer.isPending}
          />

          {createCustomer.isPending ? <ActivityIndicator color={colors.primary} /> : null}
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
    paddingTop: 8,
  },
});
