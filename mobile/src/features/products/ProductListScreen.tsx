import { Button, Text, TextInput } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { useProducts } from '@/features/products/use-products';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { formatMMK, isLowStock } from '@/utils/format-mmk';

export function ProductListContent() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch, isRefetching } = useProducts();

  const filtered = useMemo(() => {
    if (!data) {
      return [];
    }
    const query = search.trim().toLowerCase();
    if (!query) {
      return data.filter((product) => !product.isArchived);
    }
    return data.filter(
      (product) =>
        !product.isArchived &&
        (product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query)),
    );
  }, [data, search]);

  if (isLoading) {
    return (
      <View style={styles.flex}>
        <LoadingState testID="products-loading" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.flex}>
        <ErrorState
          testID="products-error"
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  if (!filtered.length) {
    return (
      <View style={styles.flex}>
        <EmptyState
          testID="products-empty"
          title={search ? t('products.noResults') : t('products.emptyTitle')}
          description={search ? undefined : t('products.emptyDescription')}
          actionLabel={search ? undefined : t('products.add')}
          onAction={search ? undefined : () => router.push('/products/new')}
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.search}>
        <TextInput
          testID="products-search"
          placeholder={t('products.searchPlaceholder')}
          defaultValue={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        style={styles.flex}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: product }) => {
          const lowStock = isLowStock(product.stockQty, product.lowStockAt);
          return (
            <Pressable
              testID={`product-row-${product.id}`}
              onPress={() => router.push(`/products/${product.id}`)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <View style={styles.rowInner}>
                <View style={styles.rowMain}>
                  <Text textStyle={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                    {product.name}
                  </Text>
                  <Text textStyle={{ color: colors.textMuted, fontSize: 13 }}>{product.sku}</Text>
                </View>
                <View style={styles.rowMeta}>
                  <Text textStyle={{ color: colors.text, fontWeight: '600' }}>
                    {formatMMK(product.priceMMK)}
                  </Text>
                  <Text
                    textStyle={{
                      color: lowStock ? colors.danger : colors.textMuted,
                      fontSize: 13,
                    }}>
                    {t('products.stock', { qty: String(product.stockQty) })}
                  </Text>
                </View>
              </View>
              {lowStock ? (
                <View style={[styles.badge, { backgroundColor: colors.dangerSurface }]}>
                  <Text textStyle={{ color: colors.danger, fontSize: 12, fontWeight: '600' }}>
                    {t('products.lowStock')}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

export function ProductListScreen({ showTitle = true }: { showTitle?: boolean }) {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();

  return (
    <Screen testID="products-screen" scroll={false}>
      <View style={styles.screen}>
        <View style={styles.header}>
          {showTitle ? (
            <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
              {t('products.title')}
            </Text>
          ) : (
            <View />
          )}
          <Button
            testID="products-add"
            label={t('products.add')}
            onPress={() => router.push('/products/new')}
          />
        </View>
        <ProductListContent />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  search: {
    marginBottom: 8,
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowMain: {
    flex: 1,
    gap: 4,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 8,
  },
});
