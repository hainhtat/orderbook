import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';
import { formatDeliveryClipboard } from '../../src/utilities/delivery-clipboard.js';

async function createOwnerAndShop(suffix: string) {
  const app = createApp({ env: getEnv() });
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: `Owner ${suffix}`,
      email: `owner-${suffix}@example.com`,
      password: 'password123',
    });
  expect(register.status).toBe(201);

  const token = register.body.accessToken as string;
  const shop = await request(app)
    .post('/api/v1/shops')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `Shop ${suffix}` });
  expect(shop.status).toBe(201);

  return { app, token };
}

describe('Orders delivery snapshot', () => {
  it('stores separated delivery fields and returns them on detail', async () => {
    const { app, token } = await createOwnerAndShop('orders');
    const auth = { Authorization: `Bearer ${token}` };

    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({
        name: 'Ma Hla',
        phone: '09987654321',
        townshipOrCity: 'Yankin',
        detailedAddress: 'Old single-line address',
      });
    expect(customer.status).toBe(201);

    const product = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({ sku: 'LIP-01', name: 'Lip Tint', priceMMK: 15000, stockQty: 10 });
    expect(product.status).toBe(201);

    const delivery = {
      customerName: 'Ma Hla',
      customerPhone: '09987654321',
      townshipOrCity: 'Yankin',
      detailedAddress: 'Building 5, Room 302',
      addressLabel: 'Home',
    };

    const created = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        delivery,
        lineItems: [{ productId: product.body.product.id, quantity: 2 }],
      });
    expect(created.status).toBe(201);
    expect(created.body.order).toMatchObject({
      ...delivery,
      status: 'TO_DELIVER',
      totalMMK: 30000,
    });

    const detail = await request(app)
      .get(`/api/v1/orders/${created.body.order.id}`)
      .set(auth);
    expect(detail.status).toBe(200);
    expect(detail.body.order).toMatchObject(delivery);

    expect(formatDeliveryClipboard(delivery)).toBe(
      'Ma Hla\n09987654321\nBuilding 5, Room 302, Yankin',
    );

    const updated = await request(app)
      .patch(`/api/v1/orders/${created.body.order.id}`)
      .set(auth)
      .send({
        delivery: {
          townshipOrCity: 'Tamwe',
          detailedAddress: 'No. 8, Ground Floor',
        },
      });
    expect(updated.status).toBe(200);
    expect(updated.body.order.townshipOrCity).toBe('Tamwe');
    expect(updated.body.order.detailedAddress).toBe('No. 8, Ground Floor');
  });
});
