import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
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
      .mockResolvedValueOnce({
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
