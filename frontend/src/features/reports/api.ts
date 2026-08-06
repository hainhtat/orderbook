import { fetchLowStockProductCount } from '@/features/products/api'
import { apiRequest, apiResponse } from '@/lib/api-client'
import type {
  DashboardSnapshot,
  PaymentMethodRow,
  PreorderPipelineRow,
  PreorderShortageRow,
  ReportDateRange,
  ReportGroupBy,
  SalesSummary,
  TopProductRow,
} from '@/features/reports/types'
import { shiftYangonIsoDate, todayYangonIsoDate } from '@/lib/date'

function buildRangeParams(range: ReportDateRange, extra?: Record<string, string>) {
  const params = new URLSearchParams({ from: range.from, to: range.to, ...extra })
  return params.toString()
}

function localIsoDate(date: string | Date = new Date()): string {
  if (typeof date === 'string') return date
  return todayYangonIsoDate(date)
}

function todayIsoDate(): string {
  return localIsoDate()
}

function monthStartIsoDate(): string {
  const today = todayYangonIsoDate()
  return `${today.slice(0, 7)}-01`
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const today = todayIsoDate()
  const monthStart = monthStartIsoDate()
  const todayRange = { from: today, to: today }
  const monthRange = { from: monthStart, to: today }

  const [todaySummary, monthSummary, pipeline, shortages, lowStockCount] = await Promise.all([
    fetchSalesSummary(todayRange, null),
    fetchSalesSummary(monthRange, null),
    fetchPreorderPipeline(),
    apiRequest<{ shortages: { items: PreorderShortageRow[] } }>('/reports/preorder-shortages').then((data) => data.shortages.items),
    fetchLowStockProductCount(),
  ])
  const outstandingPipeline = pipeline.filter((row) => !['FULFILLED', 'COMPLETED', 'CANCELLED'].includes(row.status))

  const openPreorders = outstandingPipeline.reduce(
    (acc, row) => ({
      count: acc.count + row.orderCount,
      totalMMK: acc.totalMMK + row.totalMMK,
      amountPaidMMK: acc.amountPaidMMK + row.amountPaidMMK,
      balanceDueMMK: acc.balanceDueMMK + row.balanceDueMMK,
    }),
    { count: 0, totalMMK: 0, amountPaidMMK: 0, balanceDueMMK: 0 },
  )

  return {
    today: todaySummary.totals,
    monthToDate: monthSummary.totals,
    openPreorders,
    pipeline: outstandingPipeline,
    lowStockCount,
    preorderShortages: shortages,
  }
}

export function fetchSalesSummary(range: ReportDateRange, groupBy?: ReportGroupBy | null) {
  const extra = groupBy ? { groupBy } : undefined
  return apiRequest<{ summary: SalesSummary }>(
    `/reports/sales-summary?${buildRangeParams(range, extra)}`,
  ).then((data) => data.summary)
}

export function fetchTopProducts(range: ReportDateRange, limit = 10) {
  return apiRequest<{ from: string; to: string; items: TopProductRow[] }>(
    `/reports/top-products?${buildRangeParams(range, { limit: String(limit) })}`,
  ).then((data) => data.items)
}

export function fetchPreorderPipeline() {
  return apiRequest<{ pipeline: { items: PreorderPipelineRow[] } }>(
    '/reports/preorder-pipeline',
  ).then((data) => data.pipeline.items)
}

export function fetchPaymentMethods(range: ReportDateRange) {
  return apiRequest<{ breakdown: { from: string; to: string; items: PaymentMethodRow[] } }>(
    `/reports/payment-methods?${buildRangeParams(range)}`,
  ).then((data) => data.breakdown.items)
}

export async function downloadOrdersCsv(range: ReportDateRange) {
  const response = await apiResponse(
    `/reports/orders/export?${buildRangeParams(range)}`,
  )
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `orders-${range.from}-${range.to}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export { localIsoDate, shiftYangonIsoDate, todayYangonIsoDate }
