import { Button, Column, Text } from '@expo/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { useCustomer, useCustomerOrders } from '@/features/customers/use-customers';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { formatMMK } from '@/utils/format-mmk';

export function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const customerQuery = useCustomer(id ?? '');
  const ordersQuery = useCustomerOrders(id ?? '');

  if (customerQuery.isLoading) {
    return (
      <Screen testID="customer-detail-screen">
        <LoadingState testID="customer-detail-loading" />
      </Screen>
    );
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <Screen testID="customer-detail-screen">
        <ErrorState
          testID="customer-detail-error"
          message={
            customerQuery.error instanceof Error ? customerQuery.error.message : undefined
          }
          onRetry={() => void customerQuery.refetch()}
        />
      </Screen>
    );
  }

  const customer = customerQuery.data;

  return (
    <Screen testID="customer-detail-screen">
      <Column spacing={20}>
        <Column spacing={8}>
          <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
            {customer.name}
          </Text>
          <Text textStyle={{ color: colors.textMuted, fontSize: 16 }}>{customer.phone}</Text>
        </Column>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Column spacing={12}>
            <Button
              testID="customer-edit"
              label={t('customers.edit')}
              onPress={() => router.push(`/customers/${customer.id}/edit`)}
            />
            {customer.townshipOrCity ? (
              <InfoBlock
                label={t('customers.townshipOrCity')}
                value={customer.townshipOrCity}
                colors={colors}
              />
            ) : null}
            {customer.detailedAddress ? (
              <InfoBlock
                label={t('customers.detailedAddress')}
                value={customer.detailedAddress}
                colors={colors}
              />
            ) : null}
            {customer.addressLabel ? (
              <InfoBlock
                label={t('customers.addressLabel')}
                value={customer.addressLabel}
                colors={colors}
              />
            ) : null}
            {customer.notes ? (
              <InfoBlock label={t('customers.notes')} value={customer.notes} colors={colors} />
            ) : null}
            {!customer.townshipOrCity &&
            !customer.detailedAddress &&
            !customer.addressLabel &&
            !customer.notes ? (
              <Text textStyle={{ color: colors.textMuted }}>{t('customers.noExtraInfo')}</Text>
            ) : null}
          </Column>
        </View>

        <Column spacing={12}>
          <Text textStyle={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
            {t('customers.orderHistory')}
          </Text>

          {ordersQuery.isLoading ? <LoadingState testID="customer-orders-loading" /> : null}

          {ordersQuery.isError ? (
            <ErrorState
              testID="customer-orders-error"
              message={
                ordersQuery.error instanceof Error ? ordersQuery.error.message : undefined
              }
              onRetry={() => void ordersQuery.refetch()}
            />
          ) : null}

          {ordersQuery.data?.length === 0 ? (
            <Text textStyle={{ color: colors.textMuted }}>{t('customers.noOrders')}</Text>
          ) : null}

          {ordersQuery.data && ordersQuery.data.length > 0 ? (
            <FlatList
              scrollEnabled={false}
              data={ordersQuery.data}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item: order }) => (
                <View
                  style={[styles.orderRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Column spacing={4}>
                    <Text textStyle={{ color: colors.text, fontWeight: '600' }}>
                      {order.orderNumber}
                    </Text>
                    <Text textStyle={{ color: colors.textMuted, fontSize: 13 }}>
                      {t('customers.orderStatus', { status: order.status })}
                    </Text>
                    <Text textStyle={{ color: colors.text, fontSize: 14 }}>
                      {formatMMK(order.totalMMK)}
                    </Text>
                  </Column>
                </View>
              )}
            />
          ) : null}
        </Column>
      </Column>
    </Screen>
  );
}

type InfoBlockProps = {
  label: string;
  value: string;
  colors: { text: string; textMuted: string };
};

function InfoBlock({ label, value, colors }: InfoBlockProps) {
  return (
    <Column spacing={4}>
      <Text textStyle={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text textStyle={{ color: colors.text }}>{value}</Text>
    </Column>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  orderRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  separator: {
    height: 8,
  },
});
