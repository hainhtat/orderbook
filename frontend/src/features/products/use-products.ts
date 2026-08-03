import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adjustProductStock,
  archiveProduct,
  createCategory,
  createProduct,
  fetchCategories,
  fetchProduct,
  fetchProducts,
  updateProduct,
} from '@/features/products/api'
import { categoryKeys, productKeys } from '@/features/products/query-keys'
import type {
  AdjustStockInput,
  CreateProductInput,
  UpdateProductInput,
} from '@/features/products/types'

export function useProducts(
  includeArchived = false,
  page = 1,
  limit = 20,
  needsPreorderRestock = false,
) {
  return useQuery({
    queryKey: [...productKeys.list(includeArchived, needsPreorderRestock), page, limit],
    queryFn: () => fetchProducts(includeArchived, page, limit, needsPreorderRestock),
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => fetchProduct(id!),
    enabled: Boolean(id),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: fetchCategories,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(id, input),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(id), product)
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useArchiveProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => archiveProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useAdjustProductStock(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AdjustStockInput) => adjustProductStock(id, input),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(id), product)
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => createCategory({ name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.list() })
    },
  })
}
