export type Category = {
  id: string
  name: string
  sortOrder: number
}

export type Product = {
  id: string
  sku: string
  name: string
  priceMMK: number
  stockQty: number
  reservedQty: number
  soldQuantity: number
  salesRevenueMMK: number
  lowStockAt: number | null
  imageUrl: string | null
  isArchived: boolean
  categoryId: string | null
}

export type CreateProductInput = {
  sku: string
  name: string
  priceMMK: number
  stockQty?: number
  lowStockAt?: number
  imageUrl?: string
  categoryId?: string
}

export type UpdateProductInput = Partial<{
  sku: string
  name: string
  priceMMK: number
  lowStockAt: number | null
  imageUrl: string | null
  categoryId: string | null
}>

export type AdjustStockInput = {
  deltaQty: number
  reason: string
  note?: string
}
