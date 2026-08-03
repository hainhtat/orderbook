import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockAuthenticatedFetch } from '@/test/mock-fetch'
import { renderApp } from '@/test/render'

function mockVerifyPending() {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      () =>
        new Promise(() => {
          // intentionally pending
        }),
    ),
  )
}

function mockVerifyFailure() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    }),
  )
}

describe('AuthGuard', () => {
  it('shows loading until verify completes', () => {
    mockVerifyPending()
    localStorage.setItem('order-notebook.accessToken', 'access-token')
    renderApp(undefined, { initialRoute: '/dashboard' })

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders dashboard after successful verify', async () => {
    mockAuthenticatedFetch()
    localStorage.setItem('order-notebook.accessToken', 'access-token')

    renderApp(undefined, { initialRoute: '/dashboard' })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /dashboard/i }),
      ).toBeInTheDocument()
    })
  })

  it('redirects to login when verify fails', async () => {
    mockVerifyFailure()
    localStorage.setItem('order-notebook.accessToken', 'expired-token')

    renderApp(undefined, { initialRoute: '/dashboard' })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /sign in/i }),
      ).toBeInTheDocument()
    })
  })
})
