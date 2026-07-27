import { useLocalSearchParams } from 'expo-router';

import { ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { ProductFormScreen } from '@/features/products/ProductFormScreen';
import { useProduct } from '@/features/products/use-products';

export default function ProductEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id ?? '');

  if (isLoading) {
    return (
      <Screen>
        <LoadingState testID="product-edit-loading" />
      </Screen>
    );
  }

  if (isError || !product) {
    return (
      <Screen>
        <ErrorState
          testID="product-edit-error"
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return <ProductFormScreen mode="edit" product={product} />;
}
