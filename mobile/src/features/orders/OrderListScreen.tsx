import { Button, Column, Text, TextInput } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { useOrders } from '@/features/orders/use-orders';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { formatMMK } from '@/utils/format-mmk';
import { orderStatuses, type OrderStatus } from './order-types';

export function OrderListScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading, isError, error, refetch, isRefetching } = useOrders({
    search: deferredSearch.trim() || undefined,
    status,
  });

  return (
    <Screen testID="orders-screen" scroll={false}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
            {t('orders.title')}
          </Text>
          <Button
            testID="orders-add"
            label={t('orders.add')}
            onPress={() => router.push('/orders/new')}
          />
        </View>

        <TextInput
          testID="orders-search"
          placeholder={t('orders.searchPlaceholder')}
          defaultValue={search}
          onChangeText={setSearch}
        />
        <View style={styles.filters}>
          <FilterChip
            label={t('orders.allStatuses')}
            selected={!status}
            onPress={() => setStatus(undefined)}
            colors={colors}
          />
          {orderStatuses.map((value) => (
            <FilterChip
              key={value}
              label={t(`orders.statuses.${value}`)}
              selected={status === value}
              onPress={() => setStatus(value)}
              colors={colors}
            />
          ))}
        </View>

        {isLoading ? <LoadingState testID="orders-loading" /> : null}

        {isError ? (
          <ErrorState
            testID="orders-error"
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        ) : null}

        {!isLoading && !isError && data?.length === 0 ? (
          <EmptyState
            testID="orders-empty"
            title={search || status ? t('orders.noResults') : t('orders.emptyTitle')}
            description={search || status ? t('orders.adjustFilters') : t('orders.emptyDescription')}
            actionLabel={search || status ? t('orders.clearFilters') : t('orders.add')}
            onAction={() => {
              if (search || status) {
                setSearch('');
                setStatus(undefined);
              } else {
                router.push('/orders/new');
              }
            }}
          />
        ) : null}

        {!isLoading && !isError && data && data.length > 0 ? (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item: order }) => (
              <Pressable
                testID={`order-row-${order.id}`}
                onPress={() => router.push(`/orders/${order.id}`)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Column spacing={4}>
                  <Text textStyle={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                    {order.orderNumber}
                  </Text>
                  <Text textStyle={{ color: colors.textMuted, fontSize: 14 }}>
                    {`${order.customerName} · ${order.townshipOrCity}`}
                  </Text>
                  <Text textStyle={{ color: colors.text, fontWeight: '600' }}>
                    {formatMMK(order.totalMMK)}
                  </Text>
                  <Text textStyle={{ color: colors.textMuted, fontSize: 13 }}>
                    {t('orders.status', { status: t(`orders.statuses.${order.status}`) })}
                  </Text>
                </Column>
              </Pressable>
            )}
          />
        ) : null}
      </View>
    </Screen>
  );
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: { primary: string; surface: string; border: string; text: string };
};

function FilterChip({ label, selected, onPress, colors }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}>
      <Text textStyle={{ color: selected ? '#fff' : colors.text, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 8,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
  },
});
