import * as Clipboard from 'expo-clipboard';
import { Button, Column, Text } from '@expo/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { useOrder, useTransitionOrder } from '@/features/orders/use-orders';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDeliveryClipboard } from '@/utils/delivery-clipboard';
import { formatMMK } from '@/utils/format-mmk';

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { data: order, isLoading, isError, error, refetch } = useOrder(id ?? '');
  const [copying, setCopying] = useState(false);
  const transition = useTransitionOrder(id ?? '');

  if (isLoading) {
    return (
      <Screen testID="order-detail-screen">
        <LoadingState testID="order-detail-loading" />
      </Screen>
    );
  }

  if (isError || !order) {
    return (
      <Screen testID="order-detail-screen">
        <ErrorState
          testID="order-detail-error"
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  const canEdit = order.status === 'DRAFT' || order.status === 'CONFIRMED';
  const transitionTo = (status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    const perform = async () => {
      try {
        await transition.mutateAsync({ status });
      } catch (transitionError) {
        Alert.alert(
          t('common.error'),
          transitionError instanceof Error ? transitionError.message : t('common.error'),
        );
      }
    };
    Alert.alert(
      t(`orders.actions.${status}`),
      t(`orders.confirmActions.${status}`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t(`orders.actions.${status}`),
          style: status === 'CANCELLED' ? 'destructive' : 'default',
          onPress: () => void perform(),
        },
      ],
    );
  };

  const handleCopyDelivery = async () => {
    setCopying(true);
    try {
      await Clipboard.setStringAsync(formatDeliveryClipboard(order));
      Alert.alert(t('orders.copiedToClipboard'));
    } catch {
      Alert.alert(t('orders.copyError'));
    } finally {
      setCopying(false);
    }
  };

  return (
    <Screen testID="order-detail-screen">
      <Column spacing={20}>
        <Column spacing={8}>
          <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
            {order.orderNumber}
          </Text>
          <Text textStyle={{ color: colors.textMuted }}>
            {t('orders.detailSummary', {
              total: formatMMK(order.totalMMK),
              paid: formatMMK(order.amountPaidMMK),
            })}
          </Text>
          <Text textStyle={{ color: colors.textMuted }}>
            {t('orders.status', { status: t(`orders.statuses.${order.status}`) })}
          </Text>
        </Column>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Column spacing={8}>
            <Text textStyle={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
              {t('orders.paymentSummary')}
            </Text>
            <DetailRow label={t('orders.total')} value={formatMMK(order.totalMMK)} colors={colors} />
            <DetailRow
              label={t('orders.amountPaid')}
              value={formatMMK(order.amountPaidMMK)}
              colors={colors}
            />
            <DetailRow
              label={t('orders.balanceDue')}
              value={formatMMK(order.balanceDueMMK)}
              colors={colors}
            />
            {order.balanceDueMMK > 0 && order.status !== 'CANCELLED' ? (
              <Button
                testID="order-record-payment"
                label={t('orders.recordPayment')}
                onPress={() => router.push(`/orders/${order.id}/payment`)}
              />
            ) : null}
          </Column>
        </View>

        {order.status === 'DRAFT' ? (
          <Button
            testID="order-confirm"
            label={t('orders.actions.CONFIRMED')}
            onPress={() => transitionTo('CONFIRMED')}
            disabled={transition.isPending}
          />
        ) : null}
        {order.status === 'CONFIRMED' ? (
          <Button
            testID="order-complete"
            label={t('orders.actions.COMPLETED')}
            onPress={() => transitionTo('COMPLETED')}
            disabled={transition.isPending}
          />
        ) : null}
        {order.status !== 'CANCELLED' ? (
          <Button
            testID="order-cancel"
            label={t('orders.actions.CANCELLED')}
            onPress={() => transitionTo('CANCELLED')}
            disabled={transition.isPending}
          />
        ) : null}

        <Button
          testID="order-copy-delivery"
          label={copying ? t('orders.copying') : t('orders.copyDeliveryInfo')}
          onPress={() => void handleCopyDelivery()}
          disabled={copying}
        />

        {canEdit ? (
          <Button
            testID="order-edit"
            label={t('orders.edit')}
            onPress={() => router.push(`/orders/${order.id}/edit`)}
          />
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Column spacing={12}>
            <Text textStyle={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
              {t('orders.deliveryTitle')}
            </Text>
            <DetailRow label={t('orders.customerName')} value={order.customerName} colors={colors} />
            <DetailRow label={t('orders.customerPhone')} value={order.customerPhone} colors={colors} />
            <DetailRow label={t('orders.townshipOrCity')} value={order.townshipOrCity} colors={colors} />
            <DetailRow
              label={t('orders.addressLabel')}
              value={order.addressLabel ?? t('orders.noAddressLabel')}
              colors={colors}
            />
            <DetailRow
              label={t('orders.detailedAddress')}
              value={order.detailedAddress}
              colors={colors}
            />
          </Column>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Column spacing={12}>
            <Text textStyle={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
              {t('orders.itemsTitle')}
            </Text>
            {order.lineItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Column spacing={4}>
                  <Text textStyle={{ color: colors.text, fontWeight: '600' }}>{item.productName}</Text>
                  <Text textStyle={{ color: colors.textMuted, fontSize: 13 }}>
                    {`${item.productSku} · ${t('orders.quantity', { qty: String(item.quantity) })}`}
                  </Text>
                </Column>
                <Text textStyle={{ color: colors.text, fontWeight: '600' }}>
                  {formatMMK(item.lineTotalMMK)}
                </Text>
              </View>
            ))}
          </Column>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Column spacing={12}>
            <Text textStyle={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
              {t('orders.paymentsTitle')}
            </Text>
            {order.payments.length === 0 ? (
              <Text textStyle={{ color: colors.textMuted }}>{t('orders.noPayments')}</Text>
            ) : (
              order.payments.map((payment) => (
                <View key={payment.id} style={styles.itemRow}>
                  <Column spacing={4}>
                    <Text textStyle={{ color: colors.text, fontWeight: '600' }}>
                      {t(`orders.paymentMethods.${payment.method}`)}
                    </Text>
                    {payment.note ? (
                      <Text textStyle={{ color: colors.textMuted, fontSize: 13 }}>
                        {payment.note}
                      </Text>
                    ) : null}
                  </Column>
                  <Text textStyle={{ color: colors.text, fontWeight: '600' }}>
                    {formatMMK(payment.amountMMK)}
                  </Text>
                </View>
              ))
            )}
          </Column>
        </View>
      </Column>
    </Screen>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  colors: { text: string; textMuted: string };
};

function DetailRow({ label, value, colors }: DetailRowProps) {
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
});
