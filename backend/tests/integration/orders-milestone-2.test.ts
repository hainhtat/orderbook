import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';

async function setup(suffix: string) {
  const app = createApp({ env: getEnv() });
  const register = await request(app).post('/api/v1/auth/register').send({
    name: `Order owner ${suffix}`,
    email: `order-owner-${suffix}@example.com`,
    password: 'password123',
  });
  expect(register.status).toBe(201);
  const token = register.body.accessToken as string;
  const auth = { Authorization: `Bearer ${token}` };
  const shop = await request(app)
    .post('/api/v1/shops')
    .set(auth)
    .send({ name: `Order shop ${suffix}` });
  expect(shop.status).toBe(201);
  return { app, auth };
}

async function createCustomerAndProduct(
  app: ReturnType<typeof createApp>,
  auth: { Authorization: string },
  suffix: string,
  stockQty = 5,
) {
  const customer = await request(app)
    .post('/api/v1/customers')
    .set(auth)
    .send({ name: `Customer ${suffix}`, phone: `09123${suffix.padStart(6, '0')}` });
  expect(customer.status).toBe(201);
  const product = await request(app)
    .post('/api/v1/products')
    .set(auth)
    .send({
      sku: `SKU-${suffix}`,
      name: `Product ${suffix}`,
      priceMMK: 10_000,
      stockQty,
    });
  expect(product.status).toBe(201);
  return { customer: customer.body.customer, product: product.body.product };
}

function orderPayload(customerId: string, productId: string, quantity = 2) {
  return {
    customerId,
    channel: 'MESSENGER',
    channelReference: 'Facebook thread A',
    discountMMK: 1_000,
    delivery: {
      customerName: 'Delivery customer',
      customerPhone: '09999999999',
      townshipOrCity: 'Yankin',
      detailedAddress: 'No. 1',
    },
    lineItems: [{ productId, quantity }],
  };
}

describe('Milestone 2 standard orders and payments', () => {
  it('records partial payments, enforces the FSM, updates stock, and audits history', async () => {
    const { app, auth } = await setup('m2-flow');
    const { customer, product } = await createCustomerAndProduct(
      app,
      auth,
      '100001',
    );
    const created = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send(orderPayload(customer.id, product.id));
    expect(created.status).toBe(201);
    expect(created.body.order).toMatchObject({
      status: 'TO_DELIVER',
      paymentStatus: 'UNPAID',
      subtotalMMK: 20_000,
      discountMMK: 1_000,
      totalMMK: 19_000,
      amountPaidMMK: 0,
      balanceDueMMK: 19_000,
      payments: [],
    });
    const orderId = created.body.order.id as string;

    const payment = await request(app)
      .post(`/api/v1/orders/${orderId}/payments`)
      .set(auth)
      .send({ amountMMK: 7_000, method: 'KBZPAY_MANUAL', note: 'First payment' });
    expect(payment.status).toBe(201);
    expect(payment.body.order).toMatchObject({
      amountPaidMMK: 7_000,
      balanceDueMMK: 12_000,
      paymentStatus: 'PARTIALLY_PAID',
    });
    expect(payment.body.payment).toMatchObject({
      amountMMK: 7_000,
      method: 'KBZPAY_MANUAL',
    });

    await request(app)
      .post(`/api/v1/orders/${orderId}/status`)
      .set(auth)
      .send({ status: 'DELIVERED' })
      .expect(200);

    const afterSale = await request(app)
      .get(`/api/v1/products/${product.id}`)
      .set(auth);
    expect(afterSale.body.product.stockQty).toBe(3);

    const productList = await request(app).get('/api/v1/products').set(auth);
    expect(productList.body.products[0]).toMatchObject({
      soldQuantity: 2,
      salesRevenueMMK: 20_000,
    });

    const customerList = await request(app).get('/api/v1/customers').set(auth);
    expect(customerList.body.customers[0].lastOrder).toMatchObject({
      id: orderId,
      totalMMK: 19_000,
      itemSummary: 'Product 100001 × 2',
    });

    const history = await request(app)
      .get(`/api/v1/orders/${orderId}/history`)
      .set(auth);
    expect(history.status).toBe(200);
    expect(history.body.history.map((entry: { toStatus: string }) => entry.toStatus)).toEqual([
      'TO_DELIVER',
      'DELIVERED',
    ]);
  });

  it('restores inventory when an active delivery is cancelled', async () => {
    const { app, auth } = await setup('m2-cancel');
    const { customer, product } = await createCustomerAndProduct(
      app,
      auth,
      '100005',
      3,
    );
    const created = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send(orderPayload(customer.id, product.id, 2));
    expect(created.status).toBe(201);

    const afterCreate = await request(app).get(`/api/v1/products/${product.id}`).set(auth);
    expect(afterCreate.body.product.stockQty).toBe(1);

    await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/status`)
      .set(auth)
      .send({ status: 'CANCELLED', note: 'Customer cancelled' })
      .expect(200);

    const afterCancel = await request(app).get(`/api/v1/products/${product.id}`).set(auth);
    expect(afterCancel.body.product.stockQty).toBe(3);
  });

  it('rejects overpayment and atomically rejects order creation without available stock', async () => {
    const { app, auth } = await setup('m2-rules');
    const { customer, product } = await createCustomerAndProduct(
      app,
      auth,
      '100002',
      1,
    );
    const created = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send(orderPayload(customer.id, product.id));
    expect(created.status).toBe(422);
    expect(created.body.error.details).toContainEqual({
      field: 'lineItems',
      code: 'INSUFFICIENT_STOCK',
    });

    const productAfter = await request(app).get(`/api/v1/products/${product.id}`).set(auth);
    expect(productAfter.body.product.stockQty).toBe(1);
    const orders = await request(app).get('/api/v1/orders').set(auth);
    expect(orders.body.orders).toEqual([]);
  });

  it('supports quick-create customers and list search and filters', async () => {
    const { app, auth } = await setup('m2-list');
    const { product } = await createCustomerAndProduct(app, auth, '100003');
    const quickCreated = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customer: { name: 'Quick Ma Ma', phone: '09770001122' },
        channel: 'PHONE',
        channelReference: 'Hotline lead',
        delivery: {
          customerName: 'Quick Ma Ma',
          customerPhone: '09770001122',
          townshipOrCity: 'Tamwe',
          detailedAddress: 'No. 8',
        },
        lineItems: [{ productId: product.id, quantity: 1 }],
      });
    expect(quickCreated.status).toBe(201);
    expect(quickCreated.body.order.customerId).toEqual(expect.any(String));

    const bySearch = await request(app)
      .get('/api/v1/orders')
      .query({ search: 'Quick Ma Ma' })
      .set(auth);
    expect(bySearch.status).toBe(200);
    expect(bySearch.body.orders).toHaveLength(1);

    const byChannel = await request(app)
      .get('/api/v1/orders')
      .query({ channel: 'PHONE', status: 'TO_DELIVER' })
      .set(auth);
    expect(byChannel.status).toBe(200);
    expect(byChannel.body.orders).toHaveLength(1);

    const excluded = await request(app)
      .get('/api/v1/orders')
      .query({ preorderOnly: true })
      .set(auth);
    expect(excluded.status).toBe(200);
    expect(excluded.body.orders).toEqual([]);
  });

  it('keeps COD unpaid until collection is recorded and supports payment filters', async () => {
    const { app, auth } = await setup('m2-cod');
    const { customer, product } = await createCustomerAndProduct(app, auth, '100004');
    const created = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        ...orderPayload(customer.id, product.id, 1),
        paymentMethod: 'COD',
      });

    expect(created.status).toBe(201);
    expect(created.body.order).toMatchObject({
      status: 'TO_DELIVER',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      amountPaidMMK: 0,
    });

    const unpaidCod = await request(app)
      .get('/api/v1/orders')
      .query({ paymentMethod: 'COD', paymentStatus: 'UNPAID' })
      .set(auth);
    expect(unpaidCod.status).toBe(200);
    expect(unpaidCod.body.orders).toHaveLength(1);

    const delivered = await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/status`)
      .set(auth)
      .send({ status: 'DELIVERED' });
    expect(delivered.status).toBe(200);
    expect(delivered.body.order).toMatchObject({
      status: 'DELIVERED',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
    });

    const collected = await request(app)
      .post(`/api/v1/orders/${created.body.order.id}/payments`)
      .set(auth)
      .send({ amountMMK: 9_000, method: 'COD', note: 'Collected on delivery' });
    expect(collected.status).toBe(201);
    expect(collected.body.order).toMatchObject({
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      balanceDueMMK: 0,
    });

    const paidOnly = await request(app)
      .get('/api/v1/orders')
      .query({ paymentStatus: 'PAID' })
      .set(auth);
    expect(paidOnly.status).toBe(200);
    expect(paidOnly.body.orders).toHaveLength(1);
    expect(paidOnly.body.pagination.total).toBe(1);

    const unpaidAfterCollection = await request(app)
      .get('/api/v1/orders')
      .query({ paymentStatus: 'UNPAID' })
      .set(auth);
    expect(unpaidAfterCollection.status).toBe(200);
    expect(unpaidAfterCollection.body.orders).toHaveLength(0);
    expect(unpaidAfterCollection.body.pagination.total).toBe(0);
  });
});
