import { useLocalSearchParams } from 'expo-router';

import { ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { OrderFormScreen } from '@/features/orders/OrderFormScreen';
import { useOrder } from '@/features/orders/use-orders';

export default function OrderEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, isError, error, refetch } = useOrder(id ?? '');

  if (isLoading) {
    return (
      <Screen>
        <LoadingState testID="order-edit-loading" />
      </Screen>
    );
  }

  if (isError || !order) {
    return (
      <Screen>
        <ErrorState
          testID="order-edit-error"
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return <OrderFormScreen mode="edit" order={order} />;
}
