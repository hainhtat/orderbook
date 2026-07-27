import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { customerApi } from './customer-api';
import { customerKeys } from './customer-keys';
import type { CreateCustomerInput, ListCustomersParams, UpdateCustomerInput } from './customer-types';

export function useCustomers(params?: ListCustomersParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customerApi.list(params),
    select: (data) => data.customers,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerApi.getById(id),
    select: (data) => data.customer,
    enabled: Boolean(id),
  });
}

export function useCustomerOrders(id: string) {
  return useQuery({
    queryKey: customerKeys.orders(id),
    queryFn: () => customerApi.getOrders(id),
    select: (data) => data.orders,
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customerApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => customerApi.update(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
