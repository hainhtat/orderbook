import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';
import { createPrismaClient } from '../../src/database/client.js';

async function setup(suffix: string) {
  const app = createApp({ env: getEnv() });
  const register = await request(app).post('/api/v1/auth/register').send({
    name: `Report owner ${suffix}`,
    email: `report-owner-${suffix}@example.com`,
    password: 'password123',
  });
  expect(register.status).toBe(201);
  const auth = { Authorization: `Bearer ${register.body.accessToken as string}` };
  await request(app).post('/api/v1/shops').set(auth).send({ name: `Report shop ${suffix}` });
  return { app, auth };
}

describe('Milestone 4 reporting', () => {
  it('returns sales summary, top products, pipeline, payment breakdown, and CSV export', async () => {
    const { app, auth } = await setup('m4');
    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: '=HYPERLINK("https://example.invalid")', phone: '09100001001' });
    const productA = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({ sku: 'RPT-A', name: 'Report product A', priceMMK: 5_000, stockQty: 10 });
    const productB = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({ sku: 'RPT-B', name: 'Report product B', priceMMK: 3_000, stockQty: 10 });
    expect(customer.status).toBe(201);
    expect(productA.status).toBe(201);
    expect(productB.status).toBe(201);

    const standard = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        delivery: {
          customerName: '=HYPERLINK("https://example.invalid")',
          customerPhone: '09100001001',
          townshipOrCity: 'Yangon',
          detailedAddress: 'No. 1',
        },
        lineItems: [{ productId: productA.body.product.id, quantity: 2 }],
      });
    expect(standard.status).toBe(201);

    await request(app)
      .post(`/api/v1/orders/${standard.body.order.id}/status`)
      .set(auth)
      .send({ status: 'DELIVERED' })
      .expect(200);

    await request(app)
      .post(`/api/v1/orders/${standard.body.order.id}/payments`)
      .set(auth)
      .send({ amountMMK: 5_000, method: 'CASH' })
      .expect(201);

    const preorder = await request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        type: 'PREORDER',
        expectedFulfillAt: '2026-09-01',
        delivery: {
          customerName: 'Report customer',
          customerPhone: '09100001001',
          townshipOrCity: 'Yangon',
          detailedAddress: 'No. 1',
        },
        lineItems: [{ productId: productB.body.product.id, quantity: 1 }],
      });
    expect(preorder.status).toBe(201);

    await request(app)
      .post(`/api/v1/orders/${preorder.body.order.id}/payments`)
      .set(auth)
      .send({ amountMMK: 1_000, method: 'KBZPAY_MANUAL' })
      .expect(201);

    const today = new Date().toISOString().slice(0, 10);
    const range = { from: today, to: today };

    const sales = await request(app)
      .get('/api/v1/reports/sales-summary')
      .query({ ...range, groupBy: 'day' })
      .set(auth);
    expect(sales.status).toBe(200);
    expect(sales.body.summary.totals).toEqual({ orderCount: 1, revenueMMK: 10_000 });

    const top = await request(app)
      .get('/api/v1/reports/top-products')
      .query({ ...range, limit: 5 })
      .set(auth);
    expect(top.status).toBe(200);
    expect(top.body.items).toEqual([
      expect.objectContaining({ productName: 'Report product A', quantity: 2, revenueMMK: 10_000 }),
    ]);

    const pipeline = await request(app).get('/api/v1/reports/preorder-pipeline').set(auth);
    expect(pipeline.status).toBe(200);
    expect(pipeline.body.pipeline.items.some((row: { status: string }) => row.status === 'RESERVED' || row.status === 'AWAITING_STOCK' || row.status === 'DEPOSIT_PAID')).toBe(true);

    const payments = await request(app)
      .get('/api/v1/reports/payment-methods')
      .query(range)
      .set(auth);
    expect(payments.status).toBe(200);
    expect(payments.body.breakdown.items.length).toBeGreaterThanOrEqual(2);

    const csv = await request(app)
      .get('/api/v1/reports/orders/export')
      .query(range)
      .set(auth);
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.text).toContain('orderNumber');
    expect(csv.text).toContain("'=HYPERLINK");
    expect(csv.text).not.toContain(',=HYPERLINK');
    expect(csv.text.split('\n').length).toBeGreaterThanOrEqual(3);
  });

  it('rejects report ranges longer than 366 Myanmar calendar days', async () => {
    const { app, auth } = await setup('range-limit');
    const response = await request(app)
      .get('/api/v1/reports/sales-summary')
      .query({ from: '2025-01-01', to: '2026-01-02' })
      .set(auth);

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.error.details).toContainEqual({
      field: 'from',
      code: 'DATE_RANGE_TOO_LARGE',
    });
  });

  it('uses Myanmar civil-day boundaries and excludes cancelled orders from revenue and CSV', async () => {
    const suffix = 'timezone-cancelled';
    const { app, auth } = await setup(suffix);
    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Boundary customer', phone: '09100001002' });
    const product = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({ sku: 'RPT-TZ', name: 'Boundary product', priceMMK: 1_000, stockQty: 10 });

    const createOrder = () => request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        delivery: {
          customerName: 'Boundary customer',
          customerPhone: '09100001002',
          townshipOrCity: 'Yangon',
          detailedAddress: 'No. 2',
        },
        lineItems: [{ productId: product.body.product.id, quantity: 1 }],
      });

    const beforeBoundary = await createOrder();
    const atBoundary = await createOrder();
    const cancelled = await createOrder();
    expect(beforeBoundary.status).toBe(201);
    expect(atBoundary.status).toBe(201);
    expect(cancelled.status).toBe(201);

    const prisma = createPrismaClient(getEnv());
    await prisma.order.update({
      where: { id: beforeBoundary.body.order.id },
      data: { createdAt: new Date('2026-07-27T17:29:59.999Z'), status: 'DELIVERED' },
    });
    await prisma.order.update({
      where: { id: atBoundary.body.order.id },
      data: { createdAt: new Date('2026-07-27T17:30:00.000Z'), status: 'DELIVERED' },
    });
    await prisma.order.update({
      where: { id: cancelled.body.order.id },
      data: { createdAt: new Date('2026-07-27T18:00:00.000Z'), status: 'CANCELLED' },
    });
    await prisma.orderStatusHistory.createMany({
      data: [
        {
          orderId: beforeBoundary.body.order.id,
          fromStatus: 'TO_DELIVER',
          toStatus: 'DELIVERED',
          actorId: 'report-test',
          createdAt: new Date('2026-07-27T17:29:59.999Z'),
        },
        {
          orderId: atBoundary.body.order.id,
          fromStatus: 'TO_DELIVER',
          toStatus: 'DELIVERED',
          actorId: 'report-test',
          createdAt: new Date('2026-07-27T17:30:00.000Z'),
        },
      ],
    });

    const range = { from: '2026-07-28', to: '2026-07-28' };
    const sales = await request(app)
      .get('/api/v1/reports/sales-summary')
      .query({ ...range, groupBy: 'day' })
      .set(auth);
    expect(sales.status).toBe(200);
    expect(sales.body.summary.totals).toEqual({ orderCount: 1, revenueMMK: 1_000 });
    expect(sales.body.summary.buckets).toEqual([
      { period: '2026-07-28', orderCount: 1, revenueMMK: 1_000 },
    ]);

    const csv = await request(app)
      .get('/api/v1/reports/orders/export')
      .query(range)
      .set(auth);
    expect(csv.status).toBe(200);
    expect(csv.text).toContain(atBoundary.body.order.orderNumber);
    expect(csv.text).not.toContain(beforeBoundary.body.order.orderNumber);
    expect(csv.text).not.toContain(cancelled.body.order.orderNumber);
  });

  it('keeps only non-terminal pre-orders in the active pipeline', async () => {
    const { app, auth } = await setup('open-pipeline');
    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Pipeline customer', phone: '09100001003' });
    const product = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({ sku: 'RPT-PIPE', name: 'Pipeline product', priceMMK: 2_000, stockQty: 10 });
    const makePreorder = () => request(app)
      .post('/api/v1/orders')
      .set(auth)
      .send({
        customerId: customer.body.customer.id,
        type: 'PREORDER',
        expectedFulfillAt: '2026-09-01',
        delivery: {
          customerName: 'Pipeline customer',
          customerPhone: '09100001003',
          townshipOrCity: 'Yangon',
          detailedAddress: 'No. 3',
        },
        lineItems: [{ productId: product.body.product.id, quantity: 1 }],
      });
    const open = await makePreorder();
    const completed = await makePreorder();
    const cancelled = await makePreorder();
    const prisma = createPrismaClient(getEnv());
    await prisma.order.update({ where: { id: completed.body.order.id }, data: { status: 'COMPLETED' } });
    await prisma.order.update({ where: { id: cancelled.body.order.id }, data: { status: 'CANCELLED' } });

    const pipeline = await request(app).get('/api/v1/reports/preorder-pipeline').set(auth);
    expect(pipeline.status).toBe(200);
    expect(pipeline.body.pipeline.items).toEqual([
      expect.objectContaining({ status: open.body.order.status, orderCount: 1 }),
    ]);
    expect(pipeline.body.pipeline.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'COMPLETED' }),
        expect.objectContaining({ status: 'CANCELLED' }),
      ]),
    );
  });

  it('reports open unfulfilled pre-order shortages against on-hand stock', async () => {
    const { app, auth } = await setup('shortages');
    const customer = await request(app)
      .post('/api/v1/customers')
      .set(auth)
      .send({ name: 'Shortage customer', phone: '09100001004' });
    const scarce = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({ sku: 'RPT-SHORT', name: 'Scarce product', priceMMK: 5_000, stockQty: 1 });
    const covered = await request(app)
      .post('/api/v1/products')
      .set(auth)
      .send({ sku: 'RPT-OK', name: 'Covered product', priceMMK: 5_000, stockQty: 10 });
    expect(customer.status).toBe(201);
    expect(scarce.status).toBe(201);
    expect(covered.status).toBe(201);

    const makePreorder = (productId: string, quantity: number) =>
      request(app)
        .post('/api/v1/orders')
        .set(auth)
        .send({
          customerId: customer.body.customer.id,
          type: 'PREORDER',
          expectedFulfillAt: '2026-09-01',
          delivery: {
            customerName: 'Shortage customer',
            customerPhone: '09100001004',
            townshipOrCity: 'Yangon',
            detailedAddress: 'No. 4',
          },
          lineItems: [{ productId, quantity }],
        });

    const confirmed = await makePreorder(scarce.body.product.id, 3);
    const reserved = await makePreorder(scarce.body.product.id, 2);
    const coveredOrder = await makePreorder(covered.body.product.id, 2);
    const fulfilled = await makePreorder(scarce.body.product.id, 5);
    expect(confirmed.status).toBe(201);
    expect(reserved.status).toBe(201);
    expect(coveredOrder.status).toBe(201);
    expect(fulfilled.status).toBe(201);

    await request(app)
      .post(`/api/v1/orders/${reserved.body.order.id}/payments`)
      .set(auth)
      .send({ amountMMK: 3_000, method: 'CASH' })
      .expect(201);

    const prisma = createPrismaClient(getEnv());
    await prisma.order.update({
      where: { id: fulfilled.body.order.id },
      data: { status: 'FULFILLED' },
    });

    const shortages = await request(app).get('/api/v1/reports/preorder-shortages').set(auth);
    expect(shortages.status).toBe(200);
    expect(shortages.body.shortages.items).toEqual([
      expect.objectContaining({
        productId: scarce.body.product.id,
        orderedQty: 5,
        availableQty: 1,
        toOrderQty: 4,
        preorderCount: 2,
      }),
    ]);
    expect(shortages.body.shortages.items).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: covered.body.product.id }),
      ]),
    );
  });
});
