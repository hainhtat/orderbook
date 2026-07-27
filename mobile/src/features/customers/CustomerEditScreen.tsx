import { Button, Column, Text, TextInput } from '@expo/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { isApiError } from '@/api/client';
import { FormError } from '@/components/FormError';
import { ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { useCustomer, useUpdateCustomer } from '@/features/customers/use-customers';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type CustomerFormValues = {
  name: string;
  phone: string;
  townshipOrCity: string;
  detailedAddress: string;
  addressLabel: string;
  notes: string;
};

export function CustomerEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const customerQuery = useCustomer(id ?? '');
  const updateCustomer = useUpdateCustomer(id ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    values: customerQuery.data
      ? {
          name: customerQuery.data.name,
          phone: customerQuery.data.phone,
          townshipOrCity: customerQuery.data.townshipOrCity ?? '',
          detailedAddress: customerQuery.data.detailedAddress ?? '',
          addressLabel: customerQuery.data.addressLabel ?? '',
          notes: customerQuery.data.notes ?? '',
        }
      : undefined,
    defaultValues: {
      name: '',
      phone: '',
      townshipOrCity: '',
      detailedAddress: '',
      addressLabel: '',
      notes: '',
    },
  });

  if (customerQuery.isLoading) {
    return (
      <Screen testID="customer-edit-screen">
        <LoadingState testID="customer-edit-loading" />
      </Screen>
    );
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <Screen testID="customer-edit-screen">
        <ErrorState
          testID="customer-edit-error"
          message={
            customerQuery.error instanceof Error ? customerQuery.error.message : undefined
          }
          onRetry={() => void customerQuery.refetch()}
        />
      </Screen>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await updateCustomer.mutateAsync({
        name: values.name.trim(),
        phone: values.phone.trim(),
        townshipOrCity: values.townshipOrCity.trim() || null,
        detailedAddress: values.detailedAddress.trim() || null,
        addressLabel: values.addressLabel.trim() || null,
        notes: values.notes.trim() || undefined,
      });
      router.replace(`/customers/${id}`);
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
              {t('customers.editTitle')}
            </Text>
            <Text textStyle={{ color: colors.textMuted }}>{t('customers.editSubtitle')}</Text>
          </Column>

          <Column spacing={12}>
            <Controller
              control={control}
              name="name"
              rules={{ required: t('customers.nameRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="customer-edit-name"
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
                  testID="customer-edit-phone"
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
              name="townshipOrCity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="customer-edit-township"
                  placeholder={t('customers.townshipOrCityOptional')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <Controller
              control={control}
              name="addressLabel"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="customer-edit-address-label"
                  placeholder={t('customers.addressLabelOptional')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <Controller
              control={control}
              name="detailedAddress"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="customer-edit-detailed-address"
                  placeholder={t('customers.detailedAddressOptional')}
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
                  testID="customer-edit-notes"
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
            testID="customer-edit-submit"
            label={updateCustomer.isPending ? t('common.loading') : t('customers.save')}
            onPress={() => void onSubmit()}
            disabled={updateCustomer.isPending}
          />

          {updateCustomer.isPending ? <ActivityIndicator color={colors.primary} /> : null}
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
