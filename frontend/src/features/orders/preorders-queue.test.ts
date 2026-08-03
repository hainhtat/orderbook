import { describe, expect, it } from 'vitest'
import { queuesFor } from './preorders-page'
import type { Order } from './types'
import type { Product } from '@/features/products/types'

describe('preorder work queues', () => {
  it('shows a confirmed unpaid preorder in payment and stock queues when inventory is insufficient', () => {
    const order = { status: 'CONFIRMED', balanceDueMMK: 20_000, lineItems: [{ productId: 'p1', quantity: 2 }] } as Order
    const products = [{ id: 'p1', stockQty: 0, reservedQty: 0 }] as Product[]
    expect(queuesFor(order, products)).toEqual(['NEEDS_PAYMENT', 'WAITING_STOCK'])
  })

  it('does not show a stock warning when enough unreserved inventory exists', () => {
    const order = { status: 'CONFIRMED', balanceDueMMK: 20_000, lineItems: [{ productId: 'p1', quantity: 2 }] } as Order
    const products = [{ id: 'p1', stockQty: 3, reservedQty: 0 }] as Product[]
    expect(queuesFor(order, products)).toEqual(['NEEDS_PAYMENT'])
  })
})
