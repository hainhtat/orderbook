import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '@/test/render'

const order = {
  id: 'order-1',
  orderNumber: 'SHOP-0001',
  customerId: 'customer-1',
  type: 'STANDARD',
  status: 'TO_DELIVER',
  channel: 'MESSENGER',
  channelReference: null,
  subtotalMMK: 14500,
  discountMMK: 0,
  totalMMK: 14500,
  amountPaidMMK: 0,
  balanceDueMMK: 14500,
  paymentMethod: 'COD',
  paymentStatus: 'UNPAID',
  expectedFulfillAt: null,
  notes: null,
  customerName: 'Mg Mg',
  customerPhone: '0911112222',
  townshipOrCity: 'Yangon',
  detailedAddress: 'No. 5 Pyay Road',
  addressLabel: null,
  createdAt: '2026-07-27T12:00:00.000Z',
  updatedAt: '2026-07-27T12:00:00.000Z',
  lineItems: [{
    id: 'line-1',
    productId: 'product-1',
    productName: 'Facial cream',
    productSku: 'FC-1',
    unitPriceMMK: 7250,
    quantity: 2,
    lineTotalMMK: 14500,
  }],
  payments: [],
}

describe('OrdersListPage', () => {
  it('shows separate COD and fulfillment badges without exposing Draft', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const body = url.includes('/auth/verify')
        ? { user: { id: 'user-1', name: 'Owner', email: 'owner@example.com' }, shop: { id: 'shop-1', name: 'Shop', slug: 'shop' } }
        : url.includes('/customers')
          ? { customers: [] }
          : { orders: [order] }
      return { ok: true, status: 200, json: async () => body }
    }))
    localStorage.setItem('order-notebook.accessToken', 'access-token')

    renderApp(undefined, { initialRoute: '/orders' })

    await waitFor(() => expect(screen.getByText('Mg Mg')).toBeInTheDocument())
    expect(screen.getByText('Facial cream × 2')).toBeInTheDocument()
    expect(screen.getAllByText('COD').length).toBeGreaterThan(1)
    expect(screen.getAllByText('To deliver').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'To confirm' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delivering' })).not.toBeInTheDocument()
    expect(screen.queryByText('Draft')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'COD' }))
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('paymentMethod=COD'),
      expect.any(Object),
    )
  })
})
