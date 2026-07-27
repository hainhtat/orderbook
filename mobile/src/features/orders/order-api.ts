import { apiRequest } from '@/api/client';

import type {
  CreateOrderInput,
  Order,
  OrderListFilters,
  OrderStatus,
  Payment,
  RecordPaymentInput,
  UpdateOrderInput,
} from './order-types';

export const orderApi = {
  list(filters: OrderListFilters = {}): Promise<{ orders: Order[] }> {
    const params = new URLSearchParams();
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    if (filters.status) params.set('status', filters.status);
    const query = params.toString();
    return apiRequest(`/orders${query ? `?${query}` : ''}`);
  },

  getById(id: string): Promise<{ order: Order }> {
    return apiRequest(`/orders/${id}`);
  },

  create(input: CreateOrderInput): Promise<{ order: Order }> {
    return apiRequest('/orders', { method: 'POST', body: input });
  },

  update(id: string, input: UpdateOrderInput): Promise<{ order: Order }> {
    return apiRequest(`/orders/${id}`, { method: 'PATCH', body: input });
  },

  transition(id: string, status: OrderStatus, note?: string): Promise<{ order: Order }> {
    return apiRequest(`/orders/${id}/status`, {
      method: 'POST',
      body: { status, note: note?.trim() || undefined },
    });
  },

  recordPayment(
    id: string,
    input: RecordPaymentInput,
  ): Promise<{ order: Order; payment: Payment }> {
    return apiRequest(`/orders/${id}/payments`, { method: 'POST', body: input });
  },
};
