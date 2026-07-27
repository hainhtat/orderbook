import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';

describe('Milestone 3 pre-order lifecycle', () => {
  it('reserves stock after the minimum deposit and completes after fulfillment and final payment', async () => {
    const app = createApp({ env: getEnv() });
    const register = await request(app).post('/api/v1/auth/register').send({
      name: 'Pre-order owner',
      email: 'preorder-owner@example.com',
      password: 'password123',
    });
    expect(register.status).toBe(201);
    const auth = { Authorization: `Bearer ${register.body.accessToken as string}` };

    await request(app)
      .post('/api/v1/shops')
      .set(auth)
      .send({ name: 'Pre-order shop' })
      .expect(201);
    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Pre-order customer', phone: '09770009991' });
    expect(customer.status).toBe(201);
    const product = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({
        sku: 'PREORDER-SKU-1',
        name: 'Reserved product',
        priceMMK: 10_000,
        stockQty: 5,
      });
    expect(product.status).toBe(201);

    const created = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        type: 'PREORDER',
        expectedFulfillAt: '2026-08-20',
        delivery: {
          customerName: 'Pre-order customer',
          customerPhone: '09770009991',
          townshipOrCity: 'Yangon',
          detailedAddress: 'No. 1',
        },
        lineItems: [{ productId: product.body.product.id, quantity: 2 }],
      });
    expect(created.status).toBe(201);
    expect(created.body.order).toMatchObject({
      type: 'PREORDER',
      status: 'CONFIRMED',
      totalMMK: 20_000,
      balanceDueMMK: 20_000,
    });

    const deposit = await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/payments`)
      .set(auth)
      .send({ amountMMK: 6_000, method: 'KBZPAY_MANUAL', note: '30% deposit' });
    expect(deposit.status).toBe(201);
    expect(deposit.body.order).toMatchObject({
      status: 'RESERVED',
      amountPaidMMK: 6_000,
      balanceDueMMK: 14_000,
    });

    const afterReservation = await request(app)
      .get(`/api/v1/products/${product.body.product.id}`)
      .set(auth);
    expect(afterReservation.status).toBe(200);
    expect(afterReservation.body.product).toMatchObject({
      stockQty: 5,
      reservedQty: 2,
      availableStock: 3,
    });

    await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/status`)
      .set(auth)
      .send({ status: 'READY_TO_FULFILL' })
      .expect(200);
    await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/status`)
      .set(auth)
      .send({ status: 'FULFILLED' })
      .expect(200);

    const balance = await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/payments`)
      .set(auth)
      .send({ amountMMK: 14_000, method: 'CASH', note: 'Final balance' });
    expect(balance.status).toBe(201);
    expect(balance.body.order).toMatchObject({
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      balanceDueMMK: 0,
    });
  });
});
