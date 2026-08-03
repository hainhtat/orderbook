import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';

async function setup(suffix: string) {
  const app = createApp({ env: getEnv() });
  const register = await request(app).post('/api/v1/auth/register').send({
    name: `Prefix owner ${suffix}`,
    email: `prefix-owner-${suffix}@example.com`,
    password: 'password123',
  });
  expect(register.status).toBe(201);
  const token = register.body.accessToken as string;
  const auth = { Authorization: `Bearer ${token}` };
  return { app, auth };
}

describe('Shop orderNumberPrefix', () => {
  it('initializes prefix on create, keeps existing order numbers when prefix changes, and sequences new orders', async () => {
    const { app, auth } = await setup('onp1');

    const shop = await request(app)
      .post('/api/v1/shops')
      .set(auth)
      .send({ name: 'Glow Cosmetics' });
    expect(shop.status).toBe(201);
    expect(shop.body.shop.orderNumberPrefix).toBe('glow');
    expect(shop.body.shop).not.toHaveProperty('orderNumberSeq');

    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Customer ONP', phone: '09111000001' });
    expect(customer.status).toBe(201);

    const product = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({ sku: 'ONP-1', name: 'Serum', priceMMK: 5000, stockQty: 20 });
    expect(product.status).toBe(201);

    const delivery = {
      customerName: 'Delivery',
      customerPhone: '09999999999',
      townshipOrCity: 'Yankin',
      detailedAddress: 'No. 1',
    };
    const lineItems = [{ productId: product.body.product.id as string, quantity: 1 }];

    const first = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        channel: 'MESSENGER',
        delivery,
        lineItems,
      });
    expect(first.status).toBe(201);
    expect(first.body.order.orderNumber).toBe('glow-001');

    const patched = await request(app)
      .patch('/api/v1/shops/current')
      .set(auth)
      .send({ orderNumberPrefix: 'ACME' });
    expect(patched.status).toBe(200);
    expect(patched.body.shop.orderNumberPrefix).toBe('acme');
    expect(patched.body.shop).not.toHaveProperty('orderNumberSeq');

    const second = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        channel: 'MESSENGER',
        delivery,
        lineItems,
      });
    expect(second.status).toBe(201);
    expect(second.body.order.orderNumber).toBe('acme-002');

    const firstAgain = await request(app)
      .get(`/api/v1/orders/${first.body.order.id}`)
      .set(auth);
    expect(firstAgain.status).toBe(200);
    expect(firstAgain.body.order.orderNumber).toBe('glow-001');

    const cleared = await request(app)
      .patch('/api/v1/shops/current')
      .set(auth)
      .send({ orderNumberPrefix: '' });
    expect(cleared.status).toBe(200);
    expect(cleared.body.shop.orderNumberPrefix).toBeNull();

    const third = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        channel: 'MESSENGER',
        delivery,
        lineItems,
      });
    expect(third.status).toBe(201);
    // Empty prefix falls back to derived name token; seq continues.
    expect(third.body.order.orderNumber).toBe('glow-003');
  });

  it('rejects invalid orderNumberPrefix values', async () => {
    const { app, auth } = await setup('onp2');
    await request(app).post('/api/v1/shops').set(auth).send({ name: 'Valid Shop' }).expect(201);

    const invalid = await request(app)
      .patch('/api/v1/shops/current')
      .set(auth)
      .send({ orderNumberPrefix: 'Bad Prefix!' });
    expect(invalid.status).toBe(422);
  });
});
