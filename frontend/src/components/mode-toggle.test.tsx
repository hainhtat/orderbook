import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ModeToggle } from '@/components/mode-toggle'
import { renderWithProviders } from '@/test/render'

describe('ModeToggle', () => {
  it('changes theme immediately with one click and persists it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ModeToggle />)

    await user.click(
      screen.getByRole('button', { name: /switch to dark theme/i }),
    )

    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('order-notebook.theme')).toBe('dark')
    expect(
      screen.getByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument()
  })
})
