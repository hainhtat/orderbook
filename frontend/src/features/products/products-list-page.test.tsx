import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '@/test/render'

const mockUser = {
  id: 'user-1',
  name: 'Test Owner',
  email: 'owner@example.com',
}

const mockShop = {
  id: 'shop-1',
  name: 'Test Shop',
  slug: 'test-shop',
}

function mockAuthenticatedFetch(handlers: Record<string, () => unknown>) {
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

      for (const [pattern, handler] of Object.entries(handlers)) {
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

describe('ProductsListPage', () => {
  it('shows empty state when there are no products', async () => {
    mockAuthenticatedFetch({
      '/products': () => ({ products: [] }),
      '/categories': () => ({ categories: [] }),
    })
    localStorage.setItem('order-notebook.accessToken', 'access-token')

    renderApp(undefined, { initialRoute: '/products' })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /no products yet/i }),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole('link', { name: /add your first product/i }),
    ).toHaveAttribute('href', '/products/new')
  })
})
