import { apiRequest } from '@/api/client';
import { orderApi } from '@/features/orders/order-api';

jest.mock('@/api/client', () => ({
  apiRequest: jest.fn(),
}));

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('orderApi', () => {
  beforeEach(() => request.mockReset());

  it('sends trimmed search and status filters to the standard-order list', async () => {
    request.mockResolvedValue({ orders: [] });

    await orderApi.list({ search: '  ONB-42  ', status: 'TO_DELIVER' });

    expect(request).toHaveBeenCalledWith('/orders?search=ONB-42&status=TO_DELIVER');
  });

  it('records a manual partial payment against an order', async () => {
    request.mockResolvedValue({});

    await orderApi.recordPayment('order-1', {
      amountMMK: 5000,
      method: 'KBZPAY_MANUAL',
      note: 'Messenger deposit',
    });

    expect(request).toHaveBeenCalledWith('/orders/order-1/payments', {
      method: 'POST',
      body: {
        amountMMK: 5000,
        method: 'KBZPAY_MANUAL',
        note: 'Messenger deposit',
      },
    });
  });

  it('uses the validated status transition endpoint', async () => {
    request.mockResolvedValue({});

    await orderApi.transition('order-1', 'DELIVERED');

    expect(request).toHaveBeenCalledWith('/orders/order-1/status', {
      method: 'POST',
      body: { status: 'DELIVERED', note: undefined },
    });
  });
});
