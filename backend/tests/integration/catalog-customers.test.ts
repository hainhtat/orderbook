import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';

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

describe('Milestone 1 catalog and customers', () => {
  it('supports the catalog lifecycle and prevents negative stock', async () => {
    const { app, token } = await createOwnerAndShop('catalog');
    const auth = { Authorization: `Bearer ${token}` };

    const category = await request(app)
      .post('/api/v1/categories')
      .set(auth)
      .send({ name: 'Skincare' });
    expect(category.status).toBe(201);

    const created = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({
        sku: 'SERUM-01',
        name: 'Glow Serum',
        priceMMK: 25000,
        stockQty: 5,
        lowStockAt: 2,
        imageUrl: 'https://example.com/serum.jpg',
        categoryId: category.body.category.id,
      });
    expect(created.status).toBe(201);
    expect(created.body.product).toMatchObject({
      sku: 'SERUM-01',
      stockQty: 5,
      categoryId: category.body.category.id,
      isArchived: false,
    });

    const adjusted = await request(app)
      .post(`/api/v1/products/${created.body.product.id}/adjust-stock`)
      .set(auth)
      .send({ deltaQty: -2, reason: 'DAMAGE', note: 'Broken bottles' });
    expect(adjusted.status).toBe(200);
    expect(adjusted.body.product.stockQty).toBe(3);

    const negative = await request(app)
      .post(`/api/v1/products/${created.body.product.id}/adjust-stock`)
      .set(auth)
      .send({ deltaQty: -4, reason: 'CORRECTION' });
    expect(negative.status).toBe(422);
    expect(negative.body.error).toMatchObject({
      code: 'VALIDATION_FAILED',
      details: [{ field: 'deltaQty', code: 'INSUFFICIENT_STOCK' }],
    });

    const archived = await request(app)
      .delete(`/api/v1/products/${created.body.product.id}`)
      .set(auth);
    expect(archived.status).toBe(200);
    expect(archived.body.product.isArchived).toBe(true);

    const activeList = await request(app).get('/api/v1/products').set(auth);
    expect(activeList.body.products).toEqual([]);

    const archivedList = await request(app)
      .get('/api/v1/products?includeArchived=true')
      .set(auth);
    expect(archivedList.body.products).toHaveLength(1);
  });

  it('returns the stable duplicate-phone warning contract', async () => {
    const { app, token } = await createOwnerAndShop('customers');
    const auth = { Authorization: `Bearer ${token}` };
    const input = { name: 'Aye Aye', phone: '09123456789' };

    const created = await request(app).post('/api/v1/customers').set(auth).send(input);
    expect(created.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ ...input, name: 'Another Customer' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toMatchObject({
      code: 'CONFLICT',
      details: [{ field: 'phone', code: 'DUPLICATE_PHONE' }],
    });
    expect(duplicate.body.error.requestId).toEqual(expect.any(String));
  });

  it('supports customer create, read, search, update, and order-history contracts', async () => {
    const { app, token } = await createOwnerAndShop('customer-lifecycle');
    const auth = { Authorization: `Bearer ${token}` };

    const invalid = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: '', phone: '' });
    expect(invalid.status).toBe(422);
    expect(invalid.body.error).toMatchObject({
      code: 'VALIDATION_FAILED',
      details: expect.arrayContaining([
        { field: 'name', code: 'REQUIRED' },
        { field: 'phone', code: 'REQUIRED' },
      ]),
    });

    const created = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({
        name: '  Aye Aye  ',
        phone: '  09123456789  ',
        townshipOrCity: ' Yangon ',
        detailedAddress: ' Insein Road ',
        addressLabel: ' Home ',
        notes: 'Prefers evening delivery',
      });
    expect(created.status).toBe(201);
    expect(created.body.customer).toMatchObject({
      name: 'Aye Aye',
      phone: '09123456789',
      townshipOrCity: 'Yangon',
      detailedAddress: 'Insein Road',
      addressLabel: 'Home',
      notes: 'Prefers evening delivery',
    });
    const customerId = created.body.customer.id as string;

    const detail = await request(app)
      .get(`/api/v1/customers/${customerId}`)
      .set(auth);
    expect(detail.status).toBe(200);
    expect(detail.body.customer).toMatchObject({
      id: customerId,
      lifetimeSpendMMK: 0,
      openPreorderCount: 0,
    });

    const search = await request(app)
      .get('/api/v1/customers?q=Insein')
      .set(auth);
    expect(search.status).toBe(200);
    expect(search.body.customers).toHaveLength(1);
    expect(search.body.customers[0].id).toBe(customerId);

    const updated = await request(app)
      .patch(`/api/v1/customers/${customerId}`)
      .set(auth)
      .send({
        name: 'Aye Aye Win',
        townshipOrCity: null,
        detailedAddress: 'Kamayut',
      });
    expect(updated.status).toBe(200);
    expect(updated.body.customer).toMatchObject({
      id: customerId,
      name: 'Aye Aye Win',
      townshipOrCity: null,
      detailedAddress: 'Kamayut',
    });

    const orders = await request(app)
      .get(`/api/v1/customers/${customerId}/orders`)
      .set(auth);
    expect(orders.status).toBe(200);
    expect(orders.body.orders).toEqual([]);
    expect(orders.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it('enforces customer tenant isolation and phone uniqueness on update', async () => {
    const first = await createOwnerAndShop('customer-tenant-a');
    const second = await createOwnerAndShop('customer-tenant-b');
    const firstAuth = { Authorization: `Bearer ${first.token}` };
    const secondAuth = { Authorization: `Bearer ${second.token}` };

    const original = await request(first.app)
      .post('/api/v1/customers')
      .set(firstAuth)
      .send({ name: 'First Customer', phone: '09111111111' });
    const other = await request(first.app)
      .post('/api/v1/customers')
      .set(firstAuth)
      .send({ name: 'Other Customer', phone: '09222222222' });
    expect(original.status).toBe(201);
    expect(other.status).toBe(201);

    const duplicateUpdate = await request(first.app)
      .patch(`/api/v1/customers/${other.body.customer.id}`)
      .set(firstAuth)
      .send({ phone: original.body.customer.phone });
    expect(duplicateUpdate.status).toBe(409);
    expect(duplicateUpdate.body.error).toMatchObject({
      code: 'CONFLICT',
      details: [{ field: 'phone', code: 'DUPLICATE_PHONE' }],
    });

    const foreignDetail = await request(second.app)
      .get(`/api/v1/customers/${original.body.customer.id}`)
      .set(secondAuth);
    expect(foreignDetail.status).toBe(404);
    expect(foreignDetail.body.error.code).toBe('NOT_FOUND');

    const foreignList = await request(second.app)
      .get('/api/v1/customers?q=09111111111')
      .set(secondAuth);
    expect(foreignList.status).toBe(200);
    expect(foreignList.body.customers).toEqual([]);
  });

  it('rejects assigning another shop category to a product', async () => {
    const first = await createOwnerAndShop('tenant-a');
    const second = await createOwnerAndShop('tenant-b');

    const category = await request(first.app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${first.token}`)
      .send({ name: 'Private category' });
    expect(category.status).toBe(201);

    const response = await request(second.app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${second.token}`)
      .send({
        sku: 'FOREIGN-CATEGORY',
        name: 'Invalid cross-shop product',
        priceMMK: 1000,
        categoryId: category.body.category.id,
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
