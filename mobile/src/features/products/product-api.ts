import { apiRequest } from '@/api/client';

import type {
  AdjustStockInput,
  Category,
  CreateProductInput,
  ListProductsParams,
  Product,
  UpdateProductInput,
} from './product-types';

function buildQuery(params?: ListProductsParams): string {
  if (!params) {
    return '';
  }
  const search = new URLSearchParams();
  if (params.includeArchived) {
    search.set('includeArchived', 'true');
  }
  if (params.q) {
    search.set('q', params.q);
  }
  if (params.categoryId) {
    search.set('categoryId', params.categoryId);
  }
  if (params.lowStock) {
    search.set('lowStock', 'true');
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const productApi = {
  list(params?: ListProductsParams): Promise<{ products: Product[] }> {
    return apiRequest(`/products${buildQuery(params)}`);
  },

  getById(id: string): Promise<{ product: Product }> {
    return apiRequest(`/products/${id}`);
  },

  create(input: CreateProductInput): Promise<{ product: Product }> {
    return apiRequest('/products', { method: 'POST', body: input });
  },

  update(id: string, input: UpdateProductInput): Promise<{ product: Product }> {
    return apiRequest(`/products/${id}`, { method: 'PATCH', body: input });
  },

  archive(id: string): Promise<{ product: Product }> {
    return apiRequest(`/products/${id}`, { method: 'DELETE' });
  },

  adjustStock(id: string, input: AdjustStockInput): Promise<{ product: Product }> {
    return apiRequest(`/products/${id}/adjust-stock`, { method: 'POST', body: input });
  },

  listCategories(): Promise<{ categories: Category[] }> {
    return apiRequest('/categories');
  },

  createCategory(input: { name: string }): Promise<{ category: Category }> {
    return apiRequest('/categories', { method: 'POST', body: input });
  },
};
