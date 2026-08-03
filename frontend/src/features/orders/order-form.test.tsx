import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { OrderForm } from '@/features/orders/order-form'
import { renderWithProviders } from '@/test/render'

vi.mock('@/features/customers/use-customers', () => ({
  useCustomers: () => ({ data: [] }),
}))

vi.mock('@/features/products/use-products', () => ({
  useProducts: () => ({
    data: [
      {
        id: 'product-1',
        sku: 'SKU-1',
        name: 'Limited product',
        priceMMK: 1_000,
        stockQty: 2,
        reservedQty: 0,
        soldQuantity: 0,
        salesRevenueMMK: 0,
        lowStockAt: 0,
        imageUrl: null,
        isArchived: false,
        categoryId: null,
      },
    ],
  }),
}))

describe('OrderForm', () => {
  it('starts in pre-order mode when requested', () => {
    renderWithProviders(
      <OrderForm
        mode="create"
        initialOrderType="PREORDER"
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
    expect(screen.getByLabelText('Expected fulfillment date')).toBeInTheDocument()
  })

  it('does not let a standard-order cart exceed available stock', async () => {
    const user = userEvent.setup()
    renderWithProviders(<OrderForm mode="create" onSubmit={vi.fn()} />)

    const product = screen.getByRole('button', { name: /Limited product/ })
    await user.click(product)
    await user.click(product)

    expect(product).toBeDisabled()
    const quantityButtons = screen.getAllByRole('button', { name: /qty|quantity/i })
    expect(quantityButtons.at(-1)).toBeDisabled()
    expect(screen.getByText('2', { selector: 'span.w-6' })).toBeInTheDocument()
  })
})
