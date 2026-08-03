import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHeader } from '@/components/app-header'
import { ThemeProvider } from '@/theme/theme-provider'
import '@/i18n'

vi.mock('@/features/auth/auth-provider', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/features/auth/auth-provider')>(),
  useAuth: () => ({
    state: {
      status: 'authenticated',
      user: { id: 'u1', name: 'Owner', email: 'owner@example.com' },
      shop: { id: 's1', name: 'Green Shop', slug: 'green-shop' },
    },
    logout: vi.fn(),
  }),
}))

beforeEach(() => {
  document.documentElement.className = ''
})

describe('AppHeader mobile navigation', () => {
  it('groups secondary destinations under More in the mobile bar', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/reports']}>
          <AppHeader />
        </MemoryRouter>
      </ThemeProvider>,
    )

    const navigations = screen.getAllByRole('navigation')
    const mobileNavigation = navigations.at(-1)
    expect(mobileNavigation).toBeDefined()
    expect(within(mobileNavigation!).getAllByRole('link')).toHaveLength(4)
    expect(within(mobileNavigation!).getByRole('button', { name: 'More' })).toBeInTheDocument()
    expect(screen.getByText('Green Shop')).toBeInTheDocument()
  })
})
