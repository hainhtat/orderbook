import { randomUUID } from 'node:crypto';
import type { CashAccountType, PaymentMethod, Prisma, PrismaClient } from '../../../../generated/client/index.js';
import { AppError } from '../../../errors/app-error.js';
import { ErrorCodes } from '../../../errors/error-codes.js';

const paymentAccounts: Record<PaymentMethod, { type: CashAccountType; name: string }> = {
  CASH: { type: 'CASH', name: 'Cash' },
  COD: { type: 'COD_CLEARING', name: 'COD remaining' },
  BANK_TRANSFER: { type: 'BANK', name: 'Bank' },
  KBZPAY_MANUAL: { type: 'KBZPAY', name: 'KBZPay' },
  WAVE_MANUAL: { type: 'WAVE', name: 'Wave Money' },
  OTHER: { type: 'OTHER', name: 'Other payments' },
};

export async function postPaymentToCashbook(
  tx: Prisma.TransactionClient,
  input: {
    shopId: string;
    orderId: string;
    paymentId: string;
    method: PaymentMethod;
    amountMMK: number;
    note?: string | null;
    actorId: string;
  },
) {
  const mapped = paymentAccounts[input.method];
  const account = await tx.cashAccount.upsert({
    where: { shopId_type_name: { shopId: input.shopId, type: mapped.type, name: mapped.name } },
    update: { isArchived: false },
    create: { shopId: input.shopId, ...mapped },
  });
  return tx.cashbookEntry.create({
    data: {
      shopId: input.shopId,
      accountId: account.id,
      orderId: input.orderId,
      paymentId: input.paymentId,
      kind: 'PAYMENT',
      direction: 'IN',
      amountMMK: input.amountMMK,
      category: 'ORDER_PAYMENT',
      note: input.note?.trim() || null,
      actorId: input.actorId,
    },
  });
}

export async function postCodCollectionFee(
  tx: Prisma.TransactionClient,
  input: {
    shopId: string;
    orderId: string;
    method: PaymentMethod;
    feeMMK: number;
    note?: string | null;
    actorId: string;
  },
) {
  if (input.feeMMK <= 0) return null;
  const mapped = paymentAccounts[input.method];
  const account = await tx.cashAccount.upsert({
    where: { shopId_type_name: { shopId: input.shopId, type: mapped.type, name: mapped.name } },
    update: { isArchived: false },
    create: { shopId: input.shopId, ...mapped },
  });
  return tx.cashbookEntry.create({
    data: {
      shopId: input.shopId,
      accountId: account.id,
      orderId: input.orderId,
      kind: 'EXPENSE',
      direction: 'OUT',
      amountMMK: input.feeMMK,
      category: 'COD_COLLECTION_FEE',
      note: input.note?.trim() || 'COD collection fee',
      actorId: input.actorId,
    },
  });
}

function rangeWhere(from?: string, to?: string) {
  return from || to
    ? {
        occurredAt: {
          ...(from ? { gte: new Date(`${from}T00:00:00+06:30`) } : {}),
          ...(to ? { lte: new Date(`${to}T23:59:59.999+06:30`) } : {}),
        },
      }
    : {};
}

export class CashbookService {
  constructor(private prisma: PrismaClient) {}

  async accounts(shopId: string) {
    await this.prisma.$transaction(async (tx) => {
      const oldCod = await tx.cashAccount.findFirst({ where: { shopId, type: 'COD_CLEARING', name: 'COD clearing' } });
      const newCod = await tx.cashAccount.findFirst({ where: { shopId, type: 'COD_CLEARING', name: 'COD remaining' } });
      if (oldCod && !newCod) await tx.cashAccount.update({ where: { id: oldCod.id }, data: { name: 'COD remaining' } });
      const legacyPayments = await tx.payment.findMany({
        where: { shopId, cashbookEntry: null },
        select: { id: true, orderId: true, method: true, amountMMK: true, note: true, recordedBy: true },
      });
      for (const payment of legacyPayments) {
        await postPaymentToCashbook(tx, {
          shopId,
          orderId: payment.orderId,
          paymentId: payment.id,
          method: payment.method,
          amountMMK: payment.amountMMK,
          note: payment.note,
          actorId: payment.recordedBy,
        });
      }
    });
    const [accounts, entries, codOrders] = await this.prisma.$transaction([
      this.prisma.cashAccount.findMany({ where: { shopId, isArchived: false }, orderBy: { createdAt: 'asc' } }),
      this.prisma.cashbookEntry.findMany({ where: { shopId }, select: { accountId: true, direction: true, amountMMK: true } }),
      this.prisma.order.findMany({ where: { shopId, paymentMethod: 'COD', status: { not: 'CANCELLED' }, amountPaidMMK: { lt: 2_147_483_647 } }, select: { totalMMK: true, amountPaidMMK: true } }),
    ]);
    const movement = new Map<string, number>();
    entries.forEach((entry) => movement.set(entry.accountId, (movement.get(entry.accountId) ?? 0) + (entry.direction === 'IN' ? entry.amountMMK : -entry.amountMMK)));
    const codRemaining = codOrders.reduce((sum, order) => sum + Math.max(0, order.totalMMK - order.amountPaidMMK), 0);
    return accounts.map((account) => ({ ...account, balanceMMK: account.type === 'COD_CLEARING' ? codRemaining : account.openingBalance + (movement.get(account.id) ?? 0) }));
  }

  async createAccount(shopId: string, input: { name: string; type: CashAccountType; openingBalance?: number }) {
    return this.prisma.cashAccount.create({
      data: { shopId, name: input.name.trim(), type: input.type, openingBalance: input.openingBalance ?? 0 },
    });
  }

  async entries(shopId: string, options: { accountId?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 50;
    const where = { shopId, ...(options.accountId ? { accountId: options.accountId } : {}), ...rangeWhere(options.from, options.to) };
    const [total, entries] = await this.prisma.$transaction([
      this.prisma.cashbookEntry.count({ where }),
      this.prisma.cashbookEntry.findMany({
        where,
        include: { account: { select: { name: true, type: true } }, order: { select: { orderNumber: true } } },
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { items: entries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async summary(shopId: string, options: { from?: string; to?: string }) {
    const entries = await this.prisma.cashbookEntry.findMany({ where: { shopId, ...rangeWhere(options.from, options.to) } });
    return entries.reduce((summary, entry) => {
      if (entry.direction === 'IN') summary.moneyInMMK += entry.amountMMK;
      else summary.moneyOutMMK += entry.amountMMK;
      summary.netMMK = summary.moneyInMMK - summary.moneyOutMMK;
      return summary;
    }, { moneyInMMK: 0, moneyOutMMK: 0, netMMK: 0 });
  }

  async dailyReport(shopId: string, date: string) {
    const dateRange = rangeWhere(date, date).occurredAt!;
    const [orders, cashEntries] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: {
          shopId,
          OR: [
            { type: 'STANDARD', status: 'DELIVERED', statusHistory: { some: { toStatus: 'DELIVERED', createdAt: dateRange } } },
            { type: 'PREORDER', status: 'COMPLETED', statusHistory: { some: { toStatus: 'COMPLETED', createdAt: dateRange } } },
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          type: true,
          customerName: true,
          customerPhone: true,
          townshipOrCity: true,
          totalMMK: true,
          amountPaidMMK: true,
          lineItems: { select: { productName: true, productSku: true, quantity: true, lineTotalMMK: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.cashbookEntry.findMany({
        where: { shopId, occurredAt: dateRange },
        include: { account: { select: { name: true, type: true } }, order: { select: { orderNumber: true } } },
        orderBy: { occurredAt: 'desc' },
      }),
    ]);
    const productMap = new Map<string, { productName: string; productSku: string; quantity: number; revenueMMK: number }>();
    orders.flatMap((order) => order.lineItems).forEach((item) => {
      const key = `${item.productSku}:${item.productName}`;
      const current = productMap.get(key) ?? { productName: item.productName, productSku: item.productSku, quantity: 0, revenueMMK: 0 };
      productMap.set(key, { ...current, quantity: current.quantity + item.quantity, revenueMMK: current.revenueMMK + item.lineTotalMMK });
    });
    const expenses = cashEntries.filter((entry) => entry.kind === 'EXPENSE' && entry.direction === 'OUT');
    const moneyReceivedMMK = cashEntries.filter((entry) => entry.direction === 'IN' && entry.kind !== 'TRANSFER_IN' && entry.kind !== 'REVERSAL').reduce((sum, entry) => sum + entry.amountMMK, 0);
    return {
      date,
      totals: {
        orderCount: orders.length,
        salesMMK: orders.reduce((sum, order) => sum + order.totalMMK, 0),
        moneyReceivedMMK,
        expensesMMK: expenses.reduce((sum, entry) => sum + entry.amountMMK, 0),
        netCashMMK: moneyReceivedMMK - expenses.reduce((sum, entry) => sum + entry.amountMMK, 0),
      },
      products: [...productMap.values()].sort((a, b) => b.quantity - a.quantity),
      orders,
      expenses,
    };
  }

  async createEntry(shopId: string, actorId: string, input: {
    accountId: string;
    direction: 'IN' | 'OUT';
    kind: 'MANUAL_INCOME' | 'EXPENSE' | 'ADJUSTMENT';
    amountMMK: number;
    category: string;
    note?: string | null;
    occurredAt?: string;
  }) {
    const account = await this.prisma.cashAccount.findFirst({ where: { id: input.accountId, shopId, isArchived: false } });
    if (!account) throw new AppError(ErrorCodes.NOT_FOUND, 404);
    return this.prisma.cashbookEntry.create({
      data: {
        shopId,
        accountId: account.id,
        direction: input.direction,
        kind: input.kind,
        amountMMK: input.amountMMK,
        category: input.category.trim(),
        note: input.note?.trim() || null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
        actorId,
      },
    });
  }

  async transfer(shopId: string, actorId: string, input: { fromAccountId: string; toAccountId: string; amountMMK: number; note?: string | null; occurredAt?: string }) {
    if (input.fromAccountId === input.toAccountId) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'toAccountId', code: 'INVALID_TRANSFER' }]);
    }
    const accounts = await this.prisma.cashAccount.findMany({ where: { id: { in: [input.fromAccountId, input.toAccountId] }, shopId, isArchived: false } });
    if (accounts.length !== 2) throw new AppError(ErrorCodes.NOT_FOUND, 404);
    const transferGroupId = randomUUID();
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    await this.prisma.$transaction([
      this.prisma.cashbookEntry.create({ data: { shopId, accountId: input.fromAccountId, transferGroupId, kind: 'TRANSFER_OUT', direction: 'OUT', amountMMK: input.amountMMK, category: 'TRANSFER', note: input.note?.trim() || null, occurredAt, actorId } }),
      this.prisma.cashbookEntry.create({ data: { shopId, accountId: input.toAccountId, transferGroupId, kind: 'TRANSFER_IN', direction: 'IN', amountMMK: input.amountMMK, category: 'TRANSFER', note: input.note?.trim() || null, occurredAt, actorId } }),
    ]);
    return { transferGroupId };
  }

  async reverse(shopId: string, actorId: string, id: string, note: string) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.cashbookEntry.findFirst({ where: { id, shopId }, include: { reversedBy: true } });
      if (!original) throw new AppError(ErrorCodes.NOT_FOUND, 404);
      if (original.reversedBy || original.kind === 'REVERSAL') {
        throw new AppError(ErrorCodes.CONFLICT, 409, [{ field: 'id', code: 'ENTRY_ALREADY_REVERSED' }]);
      }
      return tx.cashbookEntry.create({
        data: {
          shopId,
          accountId: original.accountId,
          orderId: original.orderId,
          reversesEntryId: original.id,
          kind: 'REVERSAL',
          direction: original.direction === 'IN' ? 'OUT' : 'IN',
          amountMMK: original.amountMMK,
          category: 'REVERSAL',
          note: note.trim(),
          actorId,
        },
      });
    });
  }
}
