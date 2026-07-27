import { apiRequest } from '@/api/client';

import type {
  CreateCustomerInput,
  Customer,
  CustomerOrderSummary,
  ListCustomersParams,
} from './customer-types';

export const customerApi = {
  list(params?: ListCustomersParams): Promise<{ customers: Customer[] }> {
    const search = new URLSearchParams();
    if (params?.q) {
      search.set('q', params.q);
    }
    const query = search.toString();
    return apiRequest(`/customers${query ? `?${query}` : ''}`);
  },

  getById(id: string): Promise<{ customer: Customer }> {
    return apiRequest(`/customers/${id}`);
  },

  create(input: CreateCustomerInput): Promise<{ customer: Customer }> {
    return apiRequest('/customers', { method: 'POST', body: input });
  },

  getOrders(id: string): Promise<{ orders: CustomerOrderSummary[] }> {
    return apiRequest(`/customers/${id}/orders`);
  },
};
