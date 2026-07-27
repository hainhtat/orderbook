import { describe, expect, it } from 'vitest'
import { toCreateOrderPayload } from '@/features/orders/order-form'
import type { OrderFormValues } from '@/features/orders/types'

const baseValues: OrderFormValues = {
  customerId: 'customer-1',
  orderType: 'STANDARD',
  expectedFulfillAt: '',
  quickCreateCustomer: false,
  channelReference: '',
  discountMMK: '0',
  notes: '',
  paymentMethod: 'COD',
  customerName: 'Mg Mg',
  customerPhone: '09123456789',
  townshipOrCity: 'Yangon',
  detailedAddress: 'No. 1, Main Road',
  addressLabel: 'Home',
  lineItems: [{ productId: 'product-1', quantity: '2' }],
}

describe('order pre-order payload', () => {
  it('only sends a fulfillment date when pre-order is checked', () => {
    expect(toCreateOrderPayload(baseValues)).toMatchObject({
      type: 'STANDARD',
      expectedFulfillAt: null,
    })

    expect(
      toCreateOrderPayload({
        ...baseValues,
        orderType: 'PREORDER',
        expectedFulfillAt: '2026-08-20',
      }),
    ).toMatchObject({
      type: 'PREORDER',
      expectedFulfillAt: '2026-08-20',
    })
  })
})
