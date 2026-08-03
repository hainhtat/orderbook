import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportsPage } from '@/features/reports/reports-page'
import { renderWithProviders } from '@/test/render'

const reportMocks = vi.hoisted(() => ({
  download: vi.fn(),
  sales: vi.fn(),
  topProducts: vi.fn(),
  pipeline: vi.fn(),
  payments: vi.fn(),
}))

vi.mock('@/features/reports/api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/features/reports/api')>(),
  downloadOrdersCsv: reportMocks.download,
}))

vi.mock('@/features/reports/use-reports', () => ({
  useSalesSummary: reportMocks.sales,
  useTopProducts: reportMocks.topProducts,
  usePreorderPipeline: reportMocks.pipeline,
  usePaymentMethods: reportMocks.payments,
}))

const query = (data: unknown) => ({
  data,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
})

beforeEach(() => {
  reportMocks.sales.mockReturnValue(query({
    totals: { orderCount: 2, revenueMMK: 45_000 },
    buckets: [{ period: '2026-07-01', orderCount: 2, revenueMMK: 45_000 }],
  }))
  reportMocks.topProducts.mockReturnValue(query([
    { productId: 'p1', productName: 'Tea', productSku: 'TEA-1', quantity: 3, revenueMMK: 30_000 },
  ]))
  reportMocks.pipeline.mockReturnValue(query([]))
  reportMocks.payments.mockReturnValue(query([
    { method: 'COD', paymentCount: 1, amountMMK: 15_000 },
  ]))
  reportMocks.download.mockResolvedValue(undefined)
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })))
})

describe('ReportsPage', () => {
  it('renders the M4 summaries and exports the selected date range', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReportsPage />)

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.getAllByText('45,000 MMK')).toHaveLength(2)
    expect(screen.getByText('Tea')).toBeInTheDocument()
    expect(screen.getByText('No active pre-orders.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('From'))
    await user.type(screen.getByLabelText('From'), '2026-07-01')
    await user.clear(screen.getByLabelText('To'))
    await user.type(screen.getByLabelText('To'), '2026-07-31')
    await user.click(screen.getByRole('button', { name: 'Export orders CSV' }))

    expect(reportMocks.download).toHaveBeenCalledWith({
      from: '2026-07-01',
      to: '2026-07-31',
    })
  })

  it('shows a retryable error without rendering stale report cards', async () => {
    const refetch = vi.fn()
    reportMocks.sales.mockReturnValue({ ...query(undefined), isError: true, refetch })
    const user = userEvent.setup()
    renderWithProviders(<ReportsPage />)

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load reports.')
    expect(screen.queryByText('Sales summary')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('blocks report queries and export for an invalid date range', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReportsPage />)

    await user.clear(screen.getByLabelText('From'))
    await user.type(screen.getByLabelText('From'), '2026-08-01')
    await user.clear(screen.getByLabelText('To'))
    await user.type(screen.getByLabelText('To'), '2026-07-31')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The start date must be on or before the end date.',
    )
    expect(screen.getByRole('button', { name: 'Export orders CSV' })).toBeDisabled()
    expect(reportMocks.sales).toHaveBeenLastCalledWith(
      { from: '2026-08-01', to: '2026-07-31' },
      'day',
      false,
    )
  })
})
