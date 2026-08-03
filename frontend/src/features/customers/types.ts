export type Customer = {
  id: string
  name: string
  phone: string
  townshipOrCity: string | null
  detailedAddress: string | null
  addressLabel: string | null
  notes: string | null
  lifetimeSpendMMK?: number
  openPreorderCount?: number
  lastOrder: {
    id: string
    createdAt: string
    totalMMK: number
    itemSummary: string
  } | null
}

export type CreateCustomerInput = {
  name: string
  phone: string
  townshipOrCity?: string
  detailedAddress?: string
  addressLabel?: string
  notes?: string
}

export type UpdateCustomerInput = {
  name?: string
  phone?: string
  townshipOrCity?: string | null
  detailedAddress?: string | null
  addressLabel?: string | null
  notes?: string
}

export type CustomerOrder = {
  id: string
  orderNumber: string
  status: string
  type: string
  totalMMK: number
  amountPaidMMK: number
  createdAt: string
}

export type CustomerOrdersResult = {
  orders: CustomerOrder[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
