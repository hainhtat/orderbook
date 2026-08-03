import { apiRequest } from '@/lib/api-client'
import type {
  AdjustStockInput,
  Category,
  CreateProductInput,
  Product,
  UpdateProductInput,
} from '@/features/products/types'

export function fetchLowStockProductCount() {
  const params = new URLSearchParams({ lowStock: 'true', page: '1', limit: '1' })
  return apiRequest<{
    products: Product[]
    pagination?: { page: number; limit: number; total: number; totalPages: number }
  }>(`/products?${params}`).then((data) => data.pagination?.total ?? data.products.length)
}

export function fetchProducts(includeArchived = false, page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (includeArchived) params.set('includeArchived', 'true')
  return apiRequest<{ products: Product[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>(`/products?${params}`).then(
    (data) => Object.assign(data.products, { pagination: data.pagination }),
  )
}

export function fetchProduct(id: string) {
  return apiRequest<{ product: Product }>(`/products/${id}`).then(
    (data) => data.product,
  )
}

export function createProduct(input: CreateProductInput) {
  return apiRequest<{ product: Product }>('/products', {
    method: 'POST',
    body: input,
  }).then((data) => data.product)
}

export function updateProduct(id: string, input: UpdateProductInput) {
  return apiRequest<{ product: Product }>(`/products/${id}`, {
    method: 'PATCH',
    body: input,
  }).then((data) => data.product)
}

export function archiveProduct(id: string) {
  return apiRequest<{ product: Product }>(`/products/${id}`, {
    method: 'DELETE',
  }).then((data) => data.product)
}

export function adjustProductStock(id: string, input: AdjustStockInput) {
  return apiRequest<{ product: Product }>(`/products/${id}/adjust-stock`, {
    method: 'POST',
    body: input,
  }).then((data) => data.product)
}

export function fetchCategories() {
  return apiRequest<{ categories: Category[] }>('/categories').then(
    (data) => data.categories,
  )
}

export function createCategory(input: { name: string; sortOrder?: number }) {
  return apiRequest<{ category: Category }>('/categories', {
    method: 'POST',
    body: input,
  }).then((data) => data.category)
}
