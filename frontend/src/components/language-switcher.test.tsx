import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockAuthenticatedFetch } from '@/test/mock-fetch'
import { renderApp } from '@/test/render'

describe('LanguageSwitcher', () => {
  it('switches dashboard heading to Myanmar', async () => {
    mockAuthenticatedFetch()

    localStorage.setItem('order-notebook.accessToken', 'access-token')

    const user = userEvent.setup()
    renderApp(undefined, { initialRoute: '/dashboard' })

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /dashboard/i }),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Test Shop')).toBeInTheDocument()
    expect(screen.queryByText('Test Owner')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /switch to myanmar/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /ဒက်ရှ်ဘုတ်/i }),
      ).toBeInTheDocument()
    })
  })
})
