import { useQuery } from '@tanstack/react-query';

import { productApi } from './product-api';
import { productKeys } from './product-keys';
import type { ListProductsParams } from './product-types';

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
