import { Button, Column, Text, TextInput } from '@expo/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { FormError } from '@/components/FormError';
import { ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { formatMMK } from '@/utils/format-mmk';
import { paymentMethods, type PaymentMethod } from './order-types';
import { useOrder, useRecordPayment } from './use-orders';

type PaymentFormValues = {
  amountMMK: string;
  method: PaymentMethod;
  note: string;
};

export function PaymentFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const orderQuery = useOrder(id ?? '');
  const recordPayment = useRecordPayment(id ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, setValue } = useForm<PaymentFormValues>({
    defaultValues: { amountMMK: '', method: 'CASH', note: '' },
  });
  const selectedMethod = useWatch({ control, name: 'method' });

  if (orderQuery.isLoading) {
    return <Screen><LoadingState testID="payment-loading" /></Screen>;
  }
  if (orderQuery.isError || !orderQuery.data) {
    return (
      <Screen>
        <ErrorState
          testID="payment-error"
          message={orderQuery.error instanceof Error ? orderQuery.error.message : undefined}
          onRetry={() => void orderQuery.refetch()}
        />
      </Screen>
    );
  }

  const order = orderQuery.data;
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const amountMMK = Number(values.amountMMK);
    if (!Number.isInteger(amountMMK) || amountMMK < 1) {
      setFormError(t('orders.invalidPaymentAmount'));
      return;
    }
    if (amountMMK > order.balanceDueMMK) {
      setFormError(t('orders.paymentExceedsBalance'));
      return;
    }
    try {
      await recordPayment.mutateAsync({
        amountMMK,
        method: values.method,
        note: values.note.trim() || undefined,
      });
      router.replace(`/orders/${order.id}`);
    } catch (error) {
      setFormError(isApiError(error) ? error.message : t('common.error'));
    }
  });

  return (
    <Screen scroll={false} testID="payment-form-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Column spacing={20}>
          <Column spacing={6}>
            <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
              {t('orders.recordPayment')}
            </Text>
            <Text textStyle={{ color: colors.textMuted }}>
              {t('orders.balanceRemaining', { balance: formatMMK(order.balanceDueMMK) })}
            </Text>
          </Column>
          <Controller
            control={control}
            name="amountMMK"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                testID="payment-amount"
                placeholder={t('orders.paymentAmount')}
                defaultValue={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="number-pad"
              />
            )}
          />
          <Column spacing={8}>
            <Text textStyle={{ color: colors.textMuted, fontSize: 13 }}>
              {t('orders.paymentMethod')}
            </Text>
            <View style={styles.chipRow}>
              {paymentMethods.map((method) => (
                <Pressable
                  key={method}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedMethod === method }}
                  onPress={() => setValue('method', method)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedMethod === method ? colors.primary : colors.surface,
                      borderColor: selectedMethod === method ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text textStyle={{ color: selectedMethod === method ? '#fff' : colors.text, fontSize: 12 }}>
                    {t(`orders.paymentMethods.${method}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Column>
          <Controller
            control={control}
            name="note"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                testID="payment-note"
                placeholder={t('orders.paymentNote')}
                defaultValue={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          <FormError message={formError} />
          <Button
            testID="payment-submit"
            label={recordPayment.isPending ? t('common.loading') : t('orders.savePayment')}
            disabled={recordPayment.isPending}
            onPress={() => void onSubmit()}
          />
          {recordPayment.isPending ? <ActivityIndicator color={colors.primary} /> : null}
        </Column>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
  },
});
