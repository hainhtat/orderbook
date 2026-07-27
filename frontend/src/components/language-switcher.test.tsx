import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '@/test/render'

describe('LanguageSwitcher', () => {
  it('switches dashboard heading to Myanmar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
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
      }),
    )

    localStorage.setItem('order-notebook.accessToken', 'access-token')

    const user = userEvent.setup()
    renderApp(undefined, { initialRoute: '/dashboard' })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /dashboard/i }),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /language/i }))
    await user.click(screen.getByRole('menuitem', { name: /myanmar/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /ဒက်ရှ်ဘုတ်/i }),
      ).toBeInTheDocument()
    })
  })
})
