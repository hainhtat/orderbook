import { describe, expect, it } from 'vitest'
import { formatDeliveryClipboard } from '@/lib/delivery-clipboard'

describe('formatDeliveryClipboard', () => {
  it('formats delivery info for courier smart-paste', () => {
    expect(
      formatDeliveryClipboard({
        customerName: 'Aye Aye',
        customerPhone: '09123456789',
        detailedAddress: 'No. 12, 3rd Floor',
        townshipOrCity: 'Tamwe',
      }),
    ).toBe('Aye Aye\n09123456789\nNo. 12, 3rd Floor, Tamwe')
  })
})
