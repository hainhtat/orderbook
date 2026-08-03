export const reportKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
  salesSummary: (range: { from: string; to: string }, groupBy?: string | null) =>
    [...reportKeys.all, 'sales-summary', range, groupBy ?? 'none'] as const,
  topProducts: (range: { from: string; to: string }, limit: number) =>
    [...reportKeys.all, 'top-products', range, limit] as const,
  preorderPipeline: () => [...reportKeys.all, 'preorder-pipeline'] as const,
  paymentMethods: (range: { from: string; to: string }) =>
    [...reportKeys.all, 'payment-methods', range] as const,
}
