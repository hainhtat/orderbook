import { apiRequest } from '@/lib/api-client'
import type {
  CreateCustomerInput,
  Customer,
  CustomerOrder,
  UpdateCustomerInput,
} from '@/features/customers/types'

export function fetchCustomers(search?: string, page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search?.trim()) params.set('q', search.trim())
  return apiRequest<{ customers: Customer[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>(`/customers?${params}`).then(
    (data) => Object.assign(data.customers, { pagination: data.pagination }),
  )
}

export function fetchCustomer(id: string) {
  return apiRequest<{ customer: Customer }>(`/customers/${id}`).then(
    (data) => data.customer,
  )
}

export function createCustomer(input: CreateCustomerInput) {
  return apiRequest<{ customer: Customer }>('/customers', {
    method: 'POST',
    body: input,
  }).then((data) => data.customer)
}

export function updateCustomer(id: string, input: UpdateCustomerInput) {
  return apiRequest<{ customer: Customer }>(`/customers/${id}`, {
    method: 'PATCH',
    body: input,
  }).then((data) => data.customer)
}

export function fetchCustomerOrders(id: string) {
  return apiRequest<{ orders: CustomerOrder[] }>(`/customers/${id}/orders`).then(
    (data) => data.orders,
  )
}
