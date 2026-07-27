import { apiRequest } from '@/lib/api-client'
import type {
  AdjustStockInput,
  Category,
  CreateProductInput,
  Product,
  UpdateProductInput,
} from '@/features/products/types'

export function fetchProducts(includeArchived = false) {
  const params = includeArchived ? '?includeArchived=true' : ''
  return apiRequest<{ products: Product[] }>(`/products${params}`).then(
    (data) => data.products,
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
