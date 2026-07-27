import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { orderApi } from './order-api';
import { orderKeys } from './order-keys';
import type {
  CreateOrderInput,
  OrderListFilters,
  OrderStatus,
  RecordPaymentInput,
  UpdateOrderInput,
} from './order-types';

export function useOrders(filters: OrderListFilters = {}) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => orderApi.list(filters),
    select: (data) => data.orders,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderApi.getById(id),
    select: (data) => data.order,
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => orderApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useUpdateOrder(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrderInput) => orderApi.update(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(orderKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

function useOrderAction(id: string) {
  const queryClient = useQueryClient();
  return {
    sync(order: unknown) {
      queryClient.setQueryData(orderKeys.detail(id), order);
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  };
}

export function useTransitionOrder(id: string) {
  const { sync } = useOrderAction(id);
  return useMutation({
    mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) =>
      orderApi.transition(id, status, note),
    onSuccess: sync,
  });
}

export function useRecordPayment(id: string) {
  const { sync } = useOrderAction(id);
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => orderApi.recordPayment(id, input),
    onSuccess: sync,
  });
}
