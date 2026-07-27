import { apiRequest } from '@/lib/api-client'
import type { CreateOrderInput, Order, OrderFilters, OrderStatus, Payment, RecordPaymentInput, UpdateOrderInput } from '@/features/orders/types'
export type Pagination = { page: number; limit: number; total: number; totalPages: number }

export function fetchOrders(filters: OrderFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, String(value))
  })
  const query = params.size ? `?${params.toString()}` : ''
  return apiRequest<{ orders: Order[]; pagination?: Pagination }>(`/orders${query}`).then((data) => Object.assign(data.orders, { pagination: data.pagination }))
}

export function fetchOrder(id: string) {
  return apiRequest<{ order: Order }>(`/orders/${id}`).then((data) => data.order)
}

export function createOrder(input: CreateOrderInput) {
  return apiRequest<{ order: Order }>('/orders', {
    method: 'POST',
    body: input,
  }).then((data) => data.order)
}

export function updateOrder(id: string, input: UpdateOrderInput) {
  return apiRequest<{ order: Order }>(`/orders/${id}`, {
    method: 'PATCH',
    body: input,
  }).then((data) => data.order)
}

export function transitionOrder(id: string, status: OrderStatus, note?: string) {
  return apiRequest<{ order: Order }>(`/orders/${id}/status`, {
    method: 'POST',
    body: { status, note: note?.trim() || undefined },
  }).then((data) => data.order)
}

export function recordPayment(id: string, input: RecordPaymentInput) {
  return apiRequest<{ order: Order; payment: Payment }>(`/orders/${id}/payments`, {
    method: 'POST',
    body: input,
  })
}
