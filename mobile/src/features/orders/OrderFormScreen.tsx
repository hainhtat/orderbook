import { Button, Column, Text, TextInput } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { isApiError } from '@/api/client';
import { FormError } from '@/components/FormError';
import { Screen } from '@/components/Screen';
import { useCustomers } from '@/features/customers/use-customers';
import type { Order } from '@/features/orders/order-types';
import { useCreateOrder, useUpdateOrder } from '@/features/orders/use-orders';
import { useProducts } from '@/features/products/use-products';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

type OrderFormValues = {
  customerId: string;
  channelReference: string;
  discountMMK: string;
  notes: string;
  customerName: string;
  customerPhone: string;
  townshipOrCity: string;
  detailedAddress: string;
  addressLabel: string;
  lineItems: { productId: string; quantity: string }[];
};

type OrderFormScreenProps = {
  mode: 'create' | 'edit';
  order?: Order;
};

export function OrderFormScreen({ mode, order }: OrderFormScreenProps) {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder(order?.id ?? '');
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OrderFormValues>({
    defaultValues: {
      customerId: order?.customerId ?? '',
      channelReference: order?.channelReference ?? '',
      discountMMK: order ? String(order.discountMMK) : '0',
      notes: order?.notes ?? '',
      customerName: order?.customerName ?? '',
      customerPhone: order?.customerPhone ?? '',
      townshipOrCity: order?.townshipOrCity ?? '',
      detailedAddress: order?.detailedAddress ?? '',
      addressLabel: order?.addressLabel ?? '',
      lineItems:
        order?.lineItems.map((item) => ({
          productId: item.productId ?? '',
          quantity: String(item.quantity),
        })) ?? [{ productId: '', quantity: '1' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const selectedCustomerId = useWatch({ control, name: 'customerId' });
  const selectedLineItems = useWatch({ control, name: 'lineItems' });
  const customerId = selectedCustomerId;
  const isPending = createOrder.isPending || updateOrder.isPending;

  useEffect(() => {
    if (mode !== 'create' || !customerId) {
      return;
    }
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) {
      return;
    }
    setValue('customerName', customer.name);
    setValue('customerPhone', customer.phone);
    if (customer.townshipOrCity) {
      setValue('townshipOrCity', customer.townshipOrCity);
    }
    if (customer.detailedAddress) {
      setValue('detailedAddress', customer.detailedAddress);
    }
    if (customer.addressLabel) {
      setValue('addressLabel', customer.addressLabel);
    }
  }, [customerId, customers, mode, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const lineItems = values.lineItems
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      }));

    if (lineItems.length === 0 || lineItems.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setFormError(t('orders.lineItemsRequired'));
      return;
    }

    const payload = {
      channelReference: values.channelReference.trim() || undefined,
      discountMMK: values.discountMMK.trim() ? Number(values.discountMMK) : undefined,
      notes: values.notes.trim() || undefined,
      delivery: {
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim(),
        townshipOrCity: values.townshipOrCity.trim(),
        detailedAddress: values.detailedAddress.trim(),
        addressLabel: values.addressLabel.trim() || null,
      },
      lineItems,
    };

    try {
      if (mode === 'create') {
        const result = await createOrder.mutateAsync({
          customerId: values.customerId,
          ...payload,
        });
        router.replace(`/orders/${result.order.id}`);
        return;
      }

      const result = await updateOrder.mutateAsync({
        channelReference: values.channelReference.trim() || null,
        discountMMK: values.discountMMK.trim() ? Number(values.discountMMK) : 0,
        notes: values.notes.trim() || null,
        delivery: payload.delivery,
        lineItems,
      });
      router.replace(`/orders/${result.order.id}`);
    } catch (submitError) {
      if (isApiError(submitError)) {
        setFormError(submitError.message);
      } else {
        setFormError(t('common.error'));
      }
    }
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <Column spacing={20} style={styles.form}>
          <Column spacing={8}>
            <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
              {mode === 'create' ? t('orders.createTitle') : t('orders.editTitle')}
            </Text>
            <Text textStyle={{ color: colors.textMuted }}>{t('orders.createSubtitle')}</Text>
          </Column>

          {mode === 'create' ? (
            <Column spacing={8}>
              <Text textStyle={{ color: colors.textMuted, fontSize: 13 }}>{t('orders.customer')}</Text>
              <View style={styles.chipRow}>
                {customers.map((customer) => (
                  <Pressable
                    key={customer.id}
                    onPress={() => setValue('customerId', customer.id)}
                    style={[
                      styles.chip,
                      {
                        borderColor:
                          selectedCustomerId === customer.id ? colors.primary : colors.border,
                        backgroundColor:
                          selectedCustomerId === customer.id ? colors.primary : colors.surface,
                      },
                    ]}>
                    <Text
                      textStyle={{
                        color: selectedCustomerId === customer.id ? '#fff' : colors.text,
                        fontSize: 13,
                        fontWeight: '600',
                      }}>
                      {customer.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.customerId || !selectedCustomerId ? (
                <FormError message={!selectedCustomerId ? t('orders.customerRequired') : undefined} />
              ) : null}
            </Column>
          ) : null}

          <Column spacing={12}>
            <Text textStyle={{ color: colors.text, fontWeight: '600' }}>{t('orders.deliveryTitle')}</Text>
            {(['customerName', 'customerPhone', 'townshipOrCity', 'addressLabel', 'detailedAddress'] as const).map(
              (fieldName) => (
                <Controller
                  key={fieldName}
                  control={control}
                  name={fieldName}
                  rules={{
                    required:
                      fieldName === 'addressLabel'
                        ? false
                        : t('orders.fieldRequired'),
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      testID={`order-${fieldName}`}
                      placeholder={t(`orders.${fieldName}`)}
                      defaultValue={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType={fieldName === 'customerPhone' ? 'phone-pad' : 'default'}
                    />
                  )}
                />
              ),
            )}
          </Column>

          <Column spacing={12}>
            <View style={styles.lineHeader}>
              <Text textStyle={{ color: colors.text, fontWeight: '600' }}>{t('orders.itemsTitle')}</Text>
              <Button
                label={t('orders.addItem')}
                onPress={() => append({ productId: '', quantity: '1' })}
              />
            </View>
            {fields.map((field, index) => (
              <View key={field.id} style={[styles.lineCard, { borderColor: colors.border }]}>
                <View style={styles.chipRow}>
                  {products.map((product) => (
                    <Pressable
                      key={product.id}
                      onPress={() => setValue(`lineItems.${index}.productId`, product.id)}
                      style={[
                        styles.chip,
                        {
                          borderColor:
                            selectedLineItems[index]?.productId === product.id
                              ? colors.primary
                              : colors.border,
                          backgroundColor:
                            selectedLineItems[index]?.productId === product.id
                              ? colors.primary
                              : colors.surface,
                        },
                      ]}>
                      <Text
                        textStyle={{
                          color:
                            selectedLineItems[index]?.productId === product.id ? '#fff' : colors.text,
                          fontSize: 12,
                          fontWeight: '600',
                        }}>
                        {product.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Controller
                  control={control}
                  name={`lineItems.${index}.quantity`}
                  rules={{ required: t('orders.fieldRequired') }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      testID={`order-line-qty-${index}`}
                      placeholder={t('orders.quantityLabel')}
                      defaultValue={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                    />
                  )}
                />
                {fields.length > 1 ? (
                  <Button label={t('orders.removeItem')} onPress={() => remove(index)} />
                ) : null}
              </View>
            ))}
          </Column>

          <Controller
            control={control}
            name="channelReference"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="order-channel-reference"
                placeholder={t('orders.channelReference')}
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
                testID="order-notes"
                placeholder={t('orders.notesOptional')}
                defaultValue={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />

          <FormError message={formError} />

          <Button
            testID="order-submit"
            label={isPending ? t('common.loading') : t('common.save')}
            onPress={() => void onSubmit()}
            disabled={isPending}
          />

          {isPending ? <ActivityIndicator color={colors.primary} /> : null}
        </Column>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { paddingTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  lineCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
});
