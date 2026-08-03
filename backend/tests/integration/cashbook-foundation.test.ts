import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';

async function setup(suffix: string) {
  const app = createApp({ env: getEnv() });
  const register = await request(app).post('/api/v1/auth/register').send({
    name: `Cashbook owner ${suffix}`,
    email: `cashbook-${suffix}@example.com`,
    password: 'password123',
  });
  const auth = { Authorization: `Bearer ${register.body.accessToken as string}` };
  await request(app).post('/api/v1/shops').set(auth).send({ name: `Cashbook shop ${suffix}` }).expect(201);
  return { app, auth };
}

describe('Cashbook foundation', () => {
  it('posts order payments automatically and keeps expenses, transfers, and reversals auditable', async () => {
    const { app, auth } = await setup('flow');
    const customer = await request(app).post('/api/v1/customers').set(auth).send({ name: 'Cash customer', phone: '09900001111' });
    const product = await request(app).post('/api/v1/products').set(auth).send({ sku: 'CASH-1', name: 'Cash product', priceMMK: 10_000, stockQty: 5 });
    const order = await request(app).post('/api/v1/orders').set(auth).send({
      customerId: customer.body.customer.id,
      paymentMethod: 'KBZPAY_MANUAL',
      delivery: { customerName: 'Cash customer', customerPhone: '09900001111', townshipOrCity: 'Yangon', detailedAddress: 'No. 1' },
      lineItems: [{ productId: product.body.product.id, quantity: 1 }],
    });
    await request(app).post(`/api/v1/orders/${order.body.order.id}/payments`).set(auth).send({ amountMMK: 4_000, method: 'KBZPAY_MANUAL' }).expect(201);
    await request(app).post(`/api/v1/orders/${order.body.order.id}/status`).set(auth).send({ status: 'DELIVERED' }).expect(200);

    const accounts = await request(app).get('/api/v1/cashbook/accounts').set(auth).expect(200);
    expect(accounts.body.accounts).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'KBZPAY', balanceMMK: 4_000 }),
    ]));
    const kbz = accounts.body.accounts.find((account: { type: string }) => account.type === 'KBZPAY');
    const cash = await request(app).post('/api/v1/cashbook/accounts').set(auth).send({ name: 'Cash box', type: 'CASH', openingBalance: 1_000 }).expect(201);

    const expense = await request(app).post('/api/v1/cashbook/entries').set(auth).send({
      accountId: kbz.id,
      direction: 'OUT',
      kind: 'EXPENSE',
      amountMMK: 500,
      category: 'PACKAGING',
      note: 'Bags',
    }).expect(201);
    await request(app).post('/api/v1/cashbook/transfers').set(auth).send({ fromAccountId: kbz.id, toAccountId: cash.body.account.id, amountMMK: 1_000 }).expect(201);
    await request(app).post(`/api/v1/cashbook/entries/${expense.body.entry.id}/reverse`).set(auth).send({ note: 'Expense entered twice' }).expect(201);

    const after = await request(app).get('/api/v1/cashbook/accounts').set(auth).expect(200);
    expect(after.body.accounts).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: kbz.id, balanceMMK: 3_000 }),
      expect.objectContaining({ id: cash.body.account.id, balanceMMK: 2_000 }),
    ]));
    const entries = await request(app).get('/api/v1/cashbook/entries').set(auth).expect(200);
    expect(entries.body.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'PAYMENT', paymentId: expect.any(String), order: { orderNumber: order.body.order.orderNumber } }),
      expect.objectContaining({ kind: 'REVERSAL', reversesEntryId: expense.body.entry.id }),
    ]));

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Yangon' }).format(new Date());
    const daily = await request(app).get('/api/v1/cashbook/daily-report').query({ date: today }).set(auth).expect(200);
    expect(daily.body.report.totals).toMatchObject({ orderCount: 1, salesMMK: 10_000, moneyReceivedMMK: 4_000 });
    expect(daily.body.report.orders).toEqual([
      expect.objectContaining({ customerName: 'Cash customer', lineItems: [expect.objectContaining({ productName: 'Cash product', quantity: 1 })] }),
    ]);
    expect(daily.body.report.products).toEqual([
      expect.objectContaining({ productName: 'Cash product', quantity: 1, revenueMMK: 10_000 }),
    ]);
  });

  it('does not expose accounts across shops', async () => {
    const first = await setup('tenant-a');
    const second = await setup('tenant-b');
    const account = await request(first.app).post('/api/v1/cashbook/accounts').set(first.auth).send({ name: 'Private bank', type: 'BANK' }).expect(201);
    await request(second.app).post('/api/v1/cashbook/entries').set(second.auth).send({ accountId: account.body.account.id, direction: 'IN', kind: 'MANUAL_INCOME', amountMMK: 1_000, category: 'OTHER_INCOME' }).expect(404);
    const secondAccounts = await request(second.app).get('/api/v1/cashbook/accounts').set(second.auth).expect(200);
    expect(secondAccounts.body.accounts).toEqual([]);
  });

  it('settles COD into the received account and records the collection fee separately', async () => {
    const { app, auth } = await setup('cod-settlement');
    const customer = await request(app).post('/api/v1/customers').set(auth).send({ name: 'COD customer', phone: '09900002222' });
    const product = await request(app).post('/api/v1/products').set(auth).send({ sku: 'COD-1', name: 'COD product', priceMMK: 10_000, stockQty: 5 });
    const order = await request(app).post('/api/v1/orders').set(auth).send({
      customerId: customer.body.customer.id,
      paymentMethod: 'COD',
      delivery: { customerName: 'COD customer', customerPhone: '09900002222', townshipOrCity: 'Yangon', detailedAddress: 'No. 2' },
      lineItems: [{ productId: product.body.product.id, quantity: 1 }],
    }).expect(201);

    const collected = await request(app).post(`/api/v1/orders/${order.body.order.id}/collect-cod`).set(auth).send({
      amountMMK: 10_000,
      settlementMethod: 'WAVE_MANUAL',
      feeMMK: 700,
    }).expect(201);
    expect(collected.body.order).toMatchObject({ amountPaidMMK: 10_000, paymentStatus: 'PAID', paymentMethod: 'COD' });
    expect(collected.body.feeMMK).toBe(700);

    const accounts = await request(app).get('/api/v1/cashbook/accounts').set(auth).expect(200);
    expect(accounts.body.accounts).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'WAVE', balanceMMK: 9_300 }),
    ]));
    const entries = await request(app).get('/api/v1/cashbook/entries').set(auth).expect(200);
    expect(entries.body.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'PAYMENT', direction: 'IN', amountMMK: 10_000 }),
      expect.objectContaining({ kind: 'EXPENSE', direction: 'OUT', amountMMK: 700, category: 'COD_COLLECTION_FEE' }),
    ]));
  });
});
