import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { productApi } from './product-api';
import { categoryKeys, productKeys } from './product-keys';
import type {
  AdjustStockInput,
  CreateProductInput,
  ListProductsParams,
  UpdateProductInput,
} from './product-types';

export function useProducts(params?: ListProductsParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.list(params),
    select: (data) => data.products,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getById(id),
    select: (data) => data.product,
    enabled: Boolean(id),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => productApi.listCategories(),
    select: (data) => data.categories,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => productApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) => productApi.update(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(productKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productApi.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

export function useAdjustProductStock(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdjustStockInput) => productApi.adjustStock(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(productKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
