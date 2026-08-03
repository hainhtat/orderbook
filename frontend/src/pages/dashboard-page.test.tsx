import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '@/pages/dashboard-page'
import { renderWithProviders } from '@/test/render'

const dashboardMock = vi.hoisted(() => vi.fn())

vi.mock('@/features/reports/use-reports', () => ({
  useDashboard: dashboardMock,
}))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })))
})

describe('DashboardPage', () => {
  it('renders sales, inventory, and pre-order report links from the snapshot', () => {
    dashboardMock.mockReturnValue({
      data: {
        today: { orderCount: 2, revenueMMK: 25_000 },
        monthToDate: { orderCount: 7, revenueMMK: 90_000 },
        openPreorders: {
          count: 1,
          totalMMK: 20_000,
          amountPaidMMK: 5_000,
          balanceDueMMK: 15_000,
        },
        pipeline: [],
        lowStockCount: 2,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderWithProviders(<MemoryRouter><DashboardPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('25,000 MMK')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Full reports' })).toHaveAttribute('href', '/reports')
    expect(screen.getByRole('link', { name: 'View pre-orders' })).toHaveAttribute('href', '/pre-orders')
    expect(screen.getByRole('link', { name: 'View products' })).toHaveAttribute('href', '/products')
  })

  it('announces load failures and retries the dashboard query', async () => {
    const refetch = vi.fn()
    dashboardMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    })
    const user = userEvent.setup()

    renderWithProviders(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load dashboard.')

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalledOnce()
  })
})
