import { vi } from 'vitest'
import type { DashboardSnapshot } from '@/features/reports/types'

export const mockUser = {
  id: 'user-1',
  name: 'Test Owner',
  email: 'owner@example.com',
}

export const mockShop = {
  id: 'shop-1',
  name: 'Test Shop',
  slug: 'test-shop',
}

export const mockDashboardSnapshot: DashboardSnapshot = {
  today: { orderCount: 2, revenueMMK: 50_000 },
  monthToDate: { orderCount: 10, revenueMMK: 250_000 },
  openPreorders: {
    count: 3,
    totalMMK: 120_000,
    amountPaidMMK: 60_000,
    balanceDueMMK: 60_000,
  },
  pipeline: [],
  lowStockCount: 0,
  preorderShortages: [],
}

const emptySalesSummary = {
  from: '2026-01-01',
  to: '2026-01-01',
  groupBy: null,
  totals: { orderCount: 0, revenueMMK: 0 },
  buckets: [],
}

export function mockAuthenticatedFetch(handlers: Record<string, () => unknown> = {}) {
  const mergedHandlers = {
    '/reports/sales-summary': () => ({
      summary: {
        ...emptySalesSummary,
        totals: mockDashboardSnapshot.today,
      },
    }),
    '/reports/preorder-pipeline': () => ({
      pipeline: { items: mockDashboardSnapshot.pipeline },
    }),
    '/reports/preorder-shortages': () => ({
      shortages: { items: mockDashboardSnapshot.preorderShortages },
    }),
    '/products': () => ({
      products: [],
      pagination: { page: 1, limit: 1, total: mockDashboardSnapshot.lowStockCount, totalPages: 0 },
    }),
    ...handlers,
  }

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/auth/verify')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ user: mockUser, shop: mockShop }),
        })
      }

      for (const [pattern, handler] of Object.entries(mergedHandlers)) {
        if (url.includes(pattern)) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => handler(),
          })
        }
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Not found' } }),
      })
    }),
  )
}
