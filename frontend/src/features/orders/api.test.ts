import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchOrders, recordPayment, transitionOrder } from '@/features/orders/api'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ orders: [], order: {}, payment: {} }),
  })))
})

describe('orders API contract', () => {
  it('serializes search, status, channel, customer, and date filters', async () => {
    await fetchOrders({
      search: 'Aung 09',
      status: 'TO_DELIVER',
      channel: 'MESSENGER',
      customerId: 'customer-1',
      from: '2026-07-01',
      to: '2026-07-31',
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '/orders?search=Aung+09&status=TO_DELIVER&channel=MESSENGER&customerId=customer-1&from=2026-07-01&to=2026-07-31',
      ),
      expect.any(Object),
    )
  })

  it('sends explicit status transition and payment payloads', async () => {
    await transitionOrder('order-1', 'DELIVERED')
    await recordPayment('order-1', {
      amountMMK: 15000,
      method: 'KBZPAY_MANUAL',
      note: 'Messenger receipt',
    })

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/orders/order-1/status'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ status: 'DELIVERED' }),
      }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/orders/order-1/payments'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          amountMMK: 15000,
          method: 'KBZPAY_MANUAL',
          note: 'Messenger receipt',
        }),
      }),
    )
  })
})
