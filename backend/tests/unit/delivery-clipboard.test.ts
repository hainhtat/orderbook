import { formatDeliveryClipboard } from '../../src/utilities/delivery-clipboard.js';

describe('formatDeliveryClipboard', () => {
  it('formats delivery info for third-party paste extraction', () => {
    expect(
      formatDeliveryClipboard({
        customerName: 'Aye Aye',
        customerPhone: '09123456789',
        detailedAddress: 'No. 12, 3rd Floor',
        townshipOrCity: 'Tamwe',
      }),
    ).toBe('Aye Aye\n09123456789\nNo. 12, 3rd Floor, Tamwe');
  });
});
