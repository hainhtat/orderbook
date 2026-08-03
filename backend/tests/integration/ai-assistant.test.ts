import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';

async function setup(suffix: string) {
  const app = createApp({ env: getEnv() });
  const register = await request(app).post('/api/v1/auth/register').send({
    name: `AI owner ${suffix}`,
    email: `ai-owner-${suffix}@example.com`,
    password: 'password123',
  });
  expect(register.status).toBe(201);
  const auth = { Authorization: `Bearer ${register.body.accessToken as string}` };
  await request(app).post('/api/v1/shops').set(auth).send({ name: `AI shop ${suffix}` });
  return { app, auth };
}

describe('AI assistant config and confirm', () => {
  it('returns config status and confirms a draft into an order', async () => {
    const { app, auth } = await setup('ai');
    const config = await request(app).get('/api/v1/ai/config').set(auth);
    expect(config.status).toBe(200);
    expect(config.body.config).toMatchObject({
      isEnabled: expect.any(Boolean),
      hasApiKey: expect.any(Boolean),
    });

    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({
        name: 'AI Customer',
        phone: '09100002001',
        townshipOrCity: 'Yangon',
        detailedAddress: 'No. 10',
      });
    const product = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({ sku: 'AI-1', name: 'AI Product', priceMMK: 4_000, stockQty: 5 });
    expect(customer.status).toBe(201);
    expect(product.status).toBe(201);

    const session = await request(app).post('/api/v1/ai/sessions').set(auth);
    expect(session.status).toBe(201);

    const confirm = await request(app)
      .post(`/api/v1/ai/sessions/${session.body.session.id}/confirm`)
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        lineItems: [{ productId: product.body.product.id, quantity: 2 }],
        notes: 'From assistant confirm test',
        delivery: {
          customerName: 'AI Customer',
          customerPhone: '09100002001',
          townshipOrCity: 'Yangon',
          detailedAddress: 'No. 10',
        },
      });
    expect(confirm.status).toBe(201);
    expect(confirm.body.order).toMatchObject({
      totalMMK: 8_000,
      customerName: 'AI Customer',
      notes: 'From assistant confirm test',
    });
    expect(confirm.body.order.lineItems).toHaveLength(1);
  });
});
