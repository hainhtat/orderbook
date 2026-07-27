import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCustomer,
  fetchCustomer,
  fetchCustomerOrders,
  fetchCustomers,
  updateCustomer,
} from '@/features/customers/api'
import { customerKeys } from '@/features/customers/query-keys'
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@/features/customers/types'

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: customerKeys.list(search),
    queryFn: () => fetchCustomers(search),
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(id ?? ''),
    queryFn: () => fetchCustomer(id!),
    enabled: Boolean(id),
  })
}

export function useCustomerOrders(id: string | undefined) {
  return useQuery({
    queryKey: customerKeys.orders(id ?? ''),
    queryFn: () => fetchCustomerOrders(id!),
    enabled: Boolean(id),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => updateCustomer(id, input),
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(id), customer)
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}
