export type Customer = {
  id: string
  name: string
  phone: string
  address: string | null
  notes: string | null
}

export type CreateCustomerInput = {
  name: string
  phone: string
  address?: string
  notes?: string
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>

export type CustomerOrder = {
  id: string
  orderNumber: string
  status: string
  totalMMK: number
  amountPaidMMK: number
  createdAt: string
}
