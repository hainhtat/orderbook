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

    const rescheduled = await request(app)
      .post('/api/v1/orders/preorders/bulk-expected-date')
      .set(auth)
      .send({ orderIds: [created.body.order.id], expectedFulfillAt: '2026-08-25' });
    expect(rescheduled.status).toBe(200);
    expect(rescheduled.body).toEqual({ updatedCount: 1 });

    const afterReschedule = await request(app)
      .get(`/api/v1/orders/${created.body.order.id}`)
      .set(auth);
    expect(afterReschedule.body.order.expectedFulfillAt).toContain('2026-08-25');

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

    const afterFulfillment = await request(app)
      .get(`/api/v1/products/${product.body.product.id}`)
      .set(auth);
    expect(afterFulfillment.body.product).toMatchObject({
      stockQty: 3,
      reservedQty: 0,
      availableStock: 3,
    });

    await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/status`)
      .set(auth)
      .send({ status: 'CANCELLED' })
      .expect(409);

    const afterRejectedFulfilledCancellation = await request(app)
      .get(`/api/v1/products/${product.body.product.id}`)
      .set(auth);
    expect(afterRejectedFulfilledCancellation.body.product).toMatchObject({
      stockQty: 3,
      reservedQty: 0,
      availableStock: 3,
    });

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

    await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/status`)
      .set(auth)
      .send({ status: 'CANCELLED' })
      .expect(409);

    await request(app)
      .post('/api/v1/orders/preorders/bulk-expected-date')
      .set(auth)
      .send({ orderIds: [created.body.order.id], expectedFulfillAt: '2026-09-01' })
      .expect(409);
  });

  it('moves AWAITING_STOCK pre-orders to RESERVED when stock is replenished', async () => {
    const app = createApp({ env: getEnv() });
    const register = await request(app).post('/api/v1/auth/register').send({
      name: 'Replenish owner',
      email: 'replenish-owner@example.com',
      password: 'password123',
    });
    expect(register.status).toBe(201);
    const auth = { Authorization: `Bearer ${register.body.accessToken as string}` };

    await request(app)
      .post('/api/v1/shops')
      .set(auth)
      .send({ name: 'Replenish shop' })
      .expect(201);
    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Waiting customer', phone: '09770009992' });
    const product = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({
        sku: 'PREORDER-SKU-2',
        name: 'Out of stock product',
        priceMMK: 10_000,
        stockQty: 0,
      });
    expect(customer.status).toBe(201);
    expect(product.status).toBe(201);

    const created = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        type: 'PREORDER',
        expectedFulfillAt: '2026-08-20',
        delivery: {
          customerName: 'Waiting customer',
          customerPhone: '09770009992',
          townshipOrCity: 'Yangon',
          detailedAddress: 'No. 2',
        },
        lineItems: [{ productId: product.body.product.id, quantity: 2 }],
      });
    expect(created.status).toBe(201);

    const deposit = await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/payments`)
      .set(auth)
      .send({ amountMMK: 6_000, method: 'KBZPAY_MANUAL', note: '30% deposit' });
    expect(deposit.status).toBe(201);
    expect(deposit.body.order).toMatchObject({
      status: 'AWAITING_STOCK',
      amountPaidMMK: 6_000,
    });

    const replenished = await request(app)
      .post(`/api/v1/products/${product.body.product.id}/adjust-stock`)
      .set(auth)
      .send({ deltaQty: 5, reason: 'RECEIVED', note: 'New shipment' });
    expect(replenished.status).toBe(200);

    const orderAfterReplenish = await request(app)
      .get(`/api/v1/orders/${created.body.order.id}`)
      .set(auth);
    expect(orderAfterReplenish.status).toBe(200);
    expect(orderAfterReplenish.body.order).toMatchObject({ status: 'RESERVED' });

    const productAfter = await request(app)
      .get(`/api/v1/products/${product.body.product.id}`)
      .set(auth);
    expect(productAfter.body.product).toMatchObject({
      stockQty: 5,
      reservedQty: 2,
      availableStock: 3,
    });
  });

  it('releases reserved stock when a pre-order is cancelled', async () => {
    const app = createApp({ env: getEnv() });
    const register = await request(app).post('/api/v1/auth/register').send({
      name: 'Cancel owner',
      email: 'cancel-preorder-owner@example.com',
      password: 'password123',
    });
    expect(register.status).toBe(201);
    const auth = { Authorization: `Bearer ${register.body.accessToken as string}` };

    await request(app)
      .post('/api/v1/shops')
      .set(auth)
      .send({ name: 'Cancel shop' })
      .expect(201);
    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Cancel customer', phone: '09770009993' });
    const product = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({
        sku: 'PREORDER-SKU-3',
        name: 'Reserved then cancelled',
        priceMMK: 10_000,
        stockQty: 5,
      });
    expect(customer.status).toBe(201);
    expect(product.status).toBe(201);

    const created = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        type: 'PREORDER',
        expectedFulfillAt: '2026-08-20',
        delivery: {
          customerName: 'Cancel customer',
          customerPhone: '09770009993',
          townshipOrCity: 'Yangon',
          detailedAddress: 'No. 3',
        },
        lineItems: [{ productId: product.body.product.id, quantity: 2 }],
      });
    expect(created.status).toBe(201);

    await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/payments`)
      .set(auth)
      .send({ amountMMK: 6_000, method: 'KBZPAY_MANUAL' })
      .expect(201);

    const cancelled = await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/status`)
      .set(auth)
      .send({ status: 'CANCELLED', note: 'Customer forfeited deposit' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.order).toMatchObject({ status: 'CANCELLED' });

    const productAfter = await request(app)
      .get(`/api/v1/products/${product.body.product.id}`)
      .set(auth);
    expect(productAfter.body.product).toMatchObject({
      stockQty: 5,
      reservedQty: 0,
      availableStock: 5,
    });
  });
});
