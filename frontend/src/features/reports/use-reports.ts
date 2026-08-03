import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardSnapshot,
  fetchPaymentMethods,
  fetchPreorderPipeline,
  fetchSalesSummary,
  fetchTopProducts,
} from '@/features/reports/api'
import { reportKeys } from '@/features/reports/query-keys'
import type { ReportDateRange, ReportGroupBy } from '@/features/reports/types'

export function useDashboard() {
  return useQuery({
    queryKey: reportKeys.dashboard(),
    queryFn: fetchDashboardSnapshot,
  })
}

export function useSalesSummary(
  range: ReportDateRange,
  groupBy: ReportGroupBy | null = 'day',
  enabled = true,
) {
  return useQuery({
    queryKey: reportKeys.salesSummary(range, groupBy),
    queryFn: () => fetchSalesSummary(range, groupBy),
    enabled,
  })
}

export function useTopProducts(range: ReportDateRange, limit = 10, enabled = true) {
  return useQuery({
    queryKey: reportKeys.topProducts(range, limit),
    queryFn: () => fetchTopProducts(range, limit),
    enabled,
  })
}

export function usePreorderPipeline() {
  return useQuery({
    queryKey: reportKeys.preorderPipeline(),
    queryFn: fetchPreorderPipeline,
  })
}

export function usePaymentMethods(range: ReportDateRange, enabled = true) {
  return useQuery({
    queryKey: reportKeys.paymentMethods(range),
    queryFn: () => fetchPaymentMethods(range),
    enabled,
  })
}
