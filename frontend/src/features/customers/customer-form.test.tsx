import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CustomerForm } from '@/features/customers/customer-form'
import { ApiError } from '@/lib/api-error'
import { renderWithProviders } from '@/test/render'

describe('CustomerForm', () => {
  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    renderWithProviders(
      <CustomerForm onSubmit={onSubmit} submitLabel="Create customer" />,
    )

    await user.click(screen.getByRole('button', { name: /create customer/i }))

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows duplicate phone error from the API', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(409, {
        code: 'CONFLICT',
        message: 'Conflict',
        details: [{ field: 'phone', code: 'DUPLICATE_PHONE' }],
      }),
    )

    renderWithProviders(
      <CustomerForm onSubmit={onSubmit} submitLabel="Create customer" />,
    )

    await user.type(screen.getByLabelText(/^name$/i), 'Aye Aye')
    await user.type(screen.getByLabelText(/^phone$/i), '09123456789')
    await user.click(screen.getByRole('button', { name: /create customer/i }))

    expect(
      await screen.findByText(/customer with this phone number already exists/i),
    ).toBeInTheDocument()
  })
})
