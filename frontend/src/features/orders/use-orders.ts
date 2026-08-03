import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkUpdatePreorderExpectedDate,
  collectCod,
  createOrder,
  fetchOrder,
  fetchOrders,
  recordPayment,
  transitionOrder,
  updateOrder,
} from '@/features/orders/api'
import { orderKeys } from '@/features/orders/query-keys'
import type { CollectCodInput, CreateOrderInput, OrderFilters, OrderStatus, RecordPaymentInput, UpdateOrderInput } from '@/features/orders/types'

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
  })
}

export function useTransitionOrder(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) =>
      transitionOrder(id, status, note),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(id), order)
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

export function useRecordPayment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordPayment(id, input),
    onSuccess: ({ order }) => {
      queryClient.setQueryData(orderKeys.detail(id), order)
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

export function useCollectCod(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CollectCodInput) => collectCod(id, input),
    onSuccess: ({ order }) => {
      queryClient.setQueryData(orderKeys.detail(id), order)
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: ['cashbook'] })
    },
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => fetchOrder(id!),
    enabled: Boolean(id),
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

export function useBulkUpdatePreorderExpectedDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkUpdatePreorderExpectedDate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

export function useUpdateOrder(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateOrderInput) => updateOrder(id, input),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(id), order)
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}
