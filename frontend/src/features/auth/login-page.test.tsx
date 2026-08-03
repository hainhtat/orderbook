import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockDashboardSnapshot } from '@/test/mock-fetch'
import { renderApp } from '@/test/render'

describe('LoginPage', () => {
  it('shows validation errors for empty submit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      }),
    )

    const user = userEvent.setup()
    renderApp(undefined, { initialRoute: '/auth/login' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
  })

  it('submits credentials and navigates on success', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/auth/login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              id: 'user-1',
              name: 'Test Owner',
              email: 'owner@example.com',
            },
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          }),
        })
      }

      if (url.includes('/auth/verify')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              id: 'user-1',
              name: 'Test Owner',
              email: 'owner@example.com',
            },
            shop: {
              id: 'shop-1',
              name: 'Test Shop',
              slug: 'test-shop',
            },
          }),
        })
      }

      if (url.includes('/reports/sales-summary') || url.includes('/reports/preorder-pipeline')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () =>
            url.includes('/reports/preorder-pipeline')
              ? { pipeline: { items: mockDashboardSnapshot.pipeline } }
              : {
                  summary: {
                    from: '2026-01-01',
                    to: '2026-01-01',
                    groupBy: null,
                    totals: mockDashboardSnapshot.today,
                    buckets: [],
                  },
                },
        })
      }

      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            products: [],
            pagination: {
              page: 1,
              limit: 1,
              total: mockDashboardSnapshot.lowStockCount,
              totalPages: 0,
            },
          }),
        })
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'Not found' } }),
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    renderApp(undefined, { initialRoute: '/auth/login' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/email/i), 'owner@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /dashboard/i }),
      ).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalled()
  })
})
