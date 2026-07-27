import { Button, Column, Text } from '@expo/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { useArchiveProduct, useProduct } from '@/features/products/use-products';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { formatMMK, isLowStock } from '@/utils/format-mmk';

export function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id ?? '');
  const archiveProduct = useArchiveProduct();

  if (isLoading) {
    return (
      <Screen testID="product-detail-screen">
        <LoadingState testID="product-detail-loading" />
      </Screen>
    );
  }

  if (isError || !product) {
    return (
      <Screen testID="product-detail-screen">
        <ErrorState
          testID="product-detail-error"
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  const lowStock = isLowStock(product.stockQty, product.lowStockAt);
  const availableQty = product.stockQty - product.reservedQty;

  return (
    <Screen testID="product-detail-screen">
      <Column spacing={20}>
        <Column spacing={8}>
          <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
            {product.name}
          </Text>
          <Text textStyle={{ color: colors.textMuted }}>{product.sku}</Text>
        </Column>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Column spacing={12}>
            <DetailRow label={t('products.price')} value={formatMMK(product.priceMMK)} colors={colors} />
            <DetailRow
              label={t('products.stock')}
              value={String(product.stockQty)}
              colors={colors}
              valueColor={lowStock ? colors.danger : colors.text}
            />
            <DetailRow
              label={t('products.reserved')}
              value={String(product.reservedQty)}
              colors={colors}
            />
            <DetailRow
              label={t('products.available')}
              value={String(availableQty)}
              colors={colors}
            />
            {product.lowStockAt !== null ? (
              <DetailRow
                label={t('products.lowStockThreshold')}
                value={String(product.lowStockAt)}
                colors={colors}
              />
            ) : null}
          </Column>
        </View>

        {product.isArchived ? (
          <View style={[styles.badge, { backgroundColor: colors.dangerSurface }]}>
            <Text textStyle={{ color: colors.danger, fontWeight: '600' }}>
              {t('products.archived')}
            </Text>
          </View>
        ) : null}

        {lowStock && !product.isArchived ? (
          <View style={[styles.badge, { backgroundColor: colors.dangerSurface }]}>
            <Text textStyle={{ color: colors.danger, fontWeight: '600' }}>
              {t('products.lowStock')}
            </Text>
          </View>
        ) : null}

        {!product.isArchived ? (
          <Column spacing={12}>
            <Button
              testID="product-edit"
              label={t('products.edit')}
              onPress={() => router.push(`/products/${product.id}/edit`)}
            />
            <Button
              testID="product-adjust-stock"
              label={t('products.adjustStock')}
              onPress={() => router.push(`/products/${product.id}/adjust-stock`)}
            />
            <Button
              testID="product-archive"
              label={archiveProduct.isPending ? t('common.loading') : t('products.archive')}
              onPress={() => {
                Alert.alert(t('products.archiveTitle'), t('products.archiveConfirm'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('products.archive'),
                    style: 'destructive',
                    onPress: () => {
                      void archiveProduct.mutateAsync(product.id).then(() => {
                        router.replace('/products');
                      });
                    },
                  },
                ]);
              }}
              disabled={archiveProduct.isPending}
            />
          </Column>
        ) : null}
      </Column>
    </Screen>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  colors: { text: string; textMuted: string };
  valueColor?: string;
};

function DetailRow({ label, value, colors, valueColor }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text textStyle={{ color: colors.textMuted }}>{label}</Text>
      <Text textStyle={{ color: valueColor ?? colors.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
