import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadOrdersCsv,
  fetchPaymentMethods,
  fetchSalesSummary,
  fetchTopProducts,
} from '@/features/reports/api'
import { configureApiClient } from '@/lib/api-client'

const range = { from: '2026-07-01', to: '2026-07-31' }

beforeEach(() => {
  configureApiClient({
    getAccessToken: () => 'old-access-token',
    getRefreshToken: () => 'refresh-token',
    setTokens: vi.fn(),
    clearSession: vi.fn(),
  })
})

describe('reports API contract', () => {
  it('serializes date range, grouping, and product limit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        summary: { totals: {}, buckets: [] },
        items: [],
        breakdown: { items: [] },
      }),
    })))

    await fetchSalesSummary(range, 'week')
    await fetchTopProducts(range, 5)
    await fetchPaymentMethods(range)

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/reports/sales-summary?from=2026-07-01&to=2026-07-31&groupBy=week'),
      expect.any(Object),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/reports/top-products?from=2026-07-01&to=2026-07-31&limit=5'),
      expect.any(Object),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/reports/payment-methods?from=2026-07-01&to=2026-07-31'),
      expect.any(Object),
    )
  })

  it('refreshes an expired session before retrying CSV export', async () => {
    let accessToken = 'old-access-token'
    const setTokens = vi.fn((nextAccessToken: string) => {
      accessToken = nextAccessToken
    })
    configureApiClient({
      getAccessToken: () => accessToken,
      getRefreshToken: () => 'refresh-token',
      setTokens,
      clearSession: vi.fn(),
    })

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Expired' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: async () => new Blob(['orderNumber,totalMMK']),
      })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:orders'),
      revokeObjectURL: vi.fn(),
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await downloadOrdersCsv(range)

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer old-access-token')
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh')
    expect(setTokens).toHaveBeenCalledWith('new-access-token', 'new-refresh-token')
    expect(fetchMock.mock.calls[2][1].headers.get('Authorization')).toBe('Bearer new-access-token')
    expect(click).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:orders')
  })
})
