import { Button, Column, Text, TextInput } from '@expo/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { isApiError } from '@/api/client';
import { FormError } from '@/components/FormError';
import { ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { useAdjustProductStock, useProduct } from '@/features/products/use-products';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type StockFormValues = {
  deltaQty: string;
  reason: string;
  note: string;
};

export function StockAdjustScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id ?? '');
  const adjustStock = useAdjustProductStock(id ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StockFormValues>({
    defaultValues: { deltaQty: '', reason: '', note: '' },
  });

  if (isLoading) {
    return (
      <Screen testID="stock-adjust-screen">
        <LoadingState testID="stock-adjust-loading" />
      </Screen>
    );
  }

  if (isError || !product) {
    return (
      <Screen testID="stock-adjust-screen">
        <ErrorState
          testID="stock-adjust-error"
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    if (!/^-?\d+$/.test(values.deltaQty) || values.deltaQty === '0' || values.deltaQty === '-0') {
      setFormError(t('products.invalidAmount'));
      return;
    }

    try {
      await adjustStock.mutateAsync({
        deltaQty: Number(values.deltaQty),
        reason: values.reason.trim(),
        note: values.note.trim() || undefined,
      });
      router.back();
    } catch (submitError) {
      if (isApiError(submitError) && submitError.status === 422) {
        setFormError(t('products.insufficientStock'));
        return;
      }
      if (isApiError(submitError)) {
        setFormError(submitError.message);
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
              {t('products.adjustStockTitle')}
            </Text>
            <Text textStyle={{ color: colors.textMuted }}>
              {t('products.adjustStockSubtitle', { stock: String(product.stockQty) })}
            </Text>
          </Column>

          <Column spacing={12}>
            <Controller
              control={control}
              name="deltaQty"
              rules={{ required: t('products.deltaRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="stock-delta"
                  placeholder={t('products.deltaPlaceholder')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numbers-and-punctuation"
                />
              )}
            />
            {errors.deltaQty ? <FormError message={errors.deltaQty.message} /> : null}

            <Controller
              control={control}
              name="reason"
              rules={{ required: t('products.reasonRequired') }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="stock-reason"
                  placeholder={t('products.reason')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.reason ? <FormError message={errors.reason.message} /> : null}

            <Controller
              control={control}
              name="note"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="stock-note"
                  placeholder={t('products.noteOptional')}
                  defaultValue={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </Column>

          <FormError message={formError} />

          <Button
            testID="stock-submit"
            label={adjustStock.isPending ? t('common.loading') : t('products.adjustStock')}
            onPress={() => void onSubmit()}
            disabled={adjustStock.isPending}
          />

          {adjustStock.isPending ? <ActivityIndicator color={colors.primary} /> : null}
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
