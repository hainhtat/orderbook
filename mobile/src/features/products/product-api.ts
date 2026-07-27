import { apiRequest } from '@/api/client';

import type { ListProductsParams, Product } from './product-types';

export const productApi = {
  list(params?: ListProductsParams): Promise<{ products: Product[] }> {
    const search = new URLSearchParams();
    if (params?.includeArchived) {
      search.set('includeArchived', 'true');
    }
    const query = search.toString();
    return apiRequest(`/products${query ? `?${query}` : ''}`);
  },

  getById(id: string): Promise<{ product: Product }> {
    return apiRequest(`/products/${id}`);
  },
};
