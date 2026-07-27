import { apiRequest } from '@/lib/api-client'
import type {
  CreateCustomerInput,
  Customer,
  CustomerOrder,
  UpdateCustomerInput,
} from '@/features/customers/types'

export function fetchCustomers(search?: string) {
  const params = search?.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''
  return apiRequest<{ customers: Customer[] }>(`/customers${params}`).then(
    (data) => data.customers,
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
