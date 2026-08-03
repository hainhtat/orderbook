export type SalesSummary = {
  from: string
  to: string
  groupBy: 'day' | 'week' | 'month' | null
  totals: { orderCount: number; revenueMMK: number }
  buckets: Array<{ period: string; orderCount: number; revenueMMK: number }>
}

export type TopProductRow = {
  productId: string | null
  productName: string
  productSku: string
  quantity: number
  revenueMMK: number
}

export type PreorderPipelineRow = {
  status: string
  orderCount: number
  totalMMK: number
  amountPaidMMK: number
  balanceDueMMK: number
}
export type PreorderShortageRow = { productId: string; productName: string; productSku: string; orderedQty: number; availableQty: number; toOrderQty: number; preorderCount: number }

export type PaymentMethodRow = {
  method: string
  paymentCount: number
  amountMMK: number
}

export type ReportDateRange = {
  from: string
  to: string
}

export type ReportGroupBy = 'day' | 'week' | 'month'

export type DashboardSnapshot = {
  today: { orderCount: number; revenueMMK: number }
  monthToDate: { orderCount: number; revenueMMK: number }
  openPreorders: {
    count: number
    totalMMK: number
    amountPaidMMK: number
    balanceDueMMK: number
  }
  pipeline: PreorderPipelineRow[]
  lowStockCount: number
  preorderShortages: PreorderShortageRow[]
}
