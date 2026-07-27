import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { OrderActions } from '@/features/orders/order-actions'
import type { Order } from '@/features/orders/types'

const transition = vi.fn()

vi.mock('@/features/orders/use-orders', () => ({
  useTransitionOrder: () => ({ isPending: false, mutateAsync: transition }),
  useRecordPayment: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))

const codOrder: Order = {
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
  lineItems: [],
  payments: [],
}

describe('OrderActions', () => {
  it('asks for COD payment immediately after marking an unpaid order delivered', async () => {
    transition.mockResolvedValue({ ...codOrder, status: 'DELIVERED' })
    render(<OrderActions order={codOrder} />)

    await userEvent.click(screen.getByRole('button', { name: 'Mark delivered' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Record payment' })).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Amount (MMK)')).toHaveValue('14500')
    expect(screen.getByRole('combobox', { name: 'Method' })).toHaveTextContent('Cash on delivery')
  })
})
