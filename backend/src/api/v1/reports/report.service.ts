import type { PrismaClient } from '../../../../generated/sqlite/index.js';
import { AppError } from '../../../errors/app-error.js';
import { ErrorCodes } from '../../../errors/error-codes.js';

export type DateRange = { from: Date; to: Date; fromISO: string; toISO: string };

export type SalesSummary = {
  from: string;
  to: string;
  groupBy: 'day' | 'week' | 'month' | null;
  totals: { orderCount: number; revenueMMK: number };
  buckets: Array<{ period: string; orderCount: number; revenueMMK: number }>;
};

export type TopProductRow = {
  productId: string | null;
  productName: string;
  productSku: string;
  quantity: number;
  revenueMMK: number;
};

export type PreorderPipelineRow = {
  status: string;
  orderCount: number;
  totalMMK: number;
  amountPaidMMK: number;
  balanceDueMMK: number;
};

export type PreorderShortageRow = {
  productId: string;
  productName: string;
  productSku: string;
  orderedQty: number;
  availableQty: number;
  toOrderQty: number;
  preorderCount: number;
};

export type PaymentMethodRow = {
  method: string;
  paymentCount: number;
  amountMMK: number;
};

const ACTIVE_ORDER_WHERE = { status: { not: 'CANCELLED' as const } };
const OPEN_PREORDER_WHERE = {
  type: 'PREORDER' as const,
  status: { notIn: ['COMPLETED', 'CANCELLED'] as ('COMPLETED' | 'CANCELLED')[] },
};

export const MAX_REPORT_RANGE_DAYS = 366;
const MYANMAR_OFFSET_MINUTES = 6 * 60 + 30;
const CSV_BATCH_SIZE = 500;

function recognizedSalesWhere(range: DateRange) {
  return {
    OR: [
      {
        type: 'STANDARD' as const,
        status: 'DELIVERED' as const,
        statusHistory: {
          some: { toStatus: 'DELIVERED' as const, createdAt: { gte: range.from, lte: range.to } },
        },
      },
      {
        type: 'PREORDER' as const,
        status: 'COMPLETED' as const,
        statusHistory: {
          some: { toStatus: 'COMPLETED' as const, createdAt: { gte: range.from, lte: range.to } },
        },
      },
    ],
  };
}

function parseMyanmarDateStart(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(
    Date.UTC(year!, month! - 1, day!, 0, -MYANMAR_OFFSET_MINUTES, 0, 0),
  );
}


export function resolveDateRange(from?: string, to?: string): DateRange {
  const nowMyanmar = new Date(Date.now() + MYANMAR_OFFSET_MINUTES * 60_000);
  const defaultTo = nowMyanmar.toISOString().slice(0, 10);
  const toISO = to ?? defaultTo;
  const toDateStart = parseMyanmarDateStart(toISO);
  const toDate = new Date(toDateStart.getTime() + 86_400_000 - 1);
  const fromDate = from
    ? parseMyanmarDateStart(from)
    : new Date(toDateStart.getTime() - 29 * 86_400_000);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
      { field: 'from', code: 'INVALID_DATE' },
    ]);
  }
  if (fromDate > toDate) {
    throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
      { field: 'from', code: 'INVALID_DATE_RANGE' },
    ]);
  }
  const rangeDays = Math.floor((toDateStart.getTime() - fromDate.getTime()) / 86_400_000) + 1;
  if (rangeDays > MAX_REPORT_RANGE_DAYS) {
    throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
      { field: 'from', code: 'DATE_RANGE_TOO_LARGE' },
    ]);
  }
  return {
    from: fromDate,
    to: toDate,
    fromISO: from ?? new Date(fromDate.getTime() + MYANMAR_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10),
    toISO,
  };
}

function periodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const local = new Date(date.getTime() + MYANMAR_OFFSET_MINUTES * 60_000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  if (groupBy === 'day') return `${year}-${month}-${day}`;
  if (groupBy === 'month') return `${year}-${month}`;
  const weekStart = new Date(local);
  weekStart.setUTCDate(local.getUTCDate() - local.getUTCDay());
  const wy = weekStart.getUTCFullYear();
  const wm = String(weekStart.getUTCMonth() + 1).padStart(2, '0');
  const wd = String(weekStart.getUTCDate()).padStart(2, '0');
  return `${wy}-W${wm}-${wd}`;
}

function csvCell(value: string | number | null | undefined): string {
  const valueAsString = value == null ? '' : String(value);
  const raw = /^\s*[=+\-@]/.test(valueAsString) ? `'${valueAsString}` : valueAsString;
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  async salesSummary(
    shopId: string,
    range: DateRange,
    groupBy?: 'day' | 'week' | 'month' | null,
  ): Promise<SalesSummary> {
    const orders = await this.prisma.order.findMany({
      where: {
        shopId,
        ...recognizedSalesWhere(range),
      },
      select: {
        totalMMK: true,
        statusHistory: {
          where: {
            toStatus: { in: ['DELIVERED', 'COMPLETED'] },
            createdAt: { gte: range.from, lte: range.to },
          },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    const totals = orders.reduce(
      (acc, order) => ({
        orderCount: acc.orderCount + 1,
        revenueMMK: acc.revenueMMK + order.totalMMK,
      }),
      { orderCount: 0, revenueMMK: 0 },
    );

    if (!groupBy) {
      return {
        from: range.fromISO,
        to: range.toISO,
        groupBy: null,
        totals,
        buckets: [],
      };
    }

    const bucketMap = new Map<string, { orderCount: number; revenueMMK: number }>();
    for (const order of orders) {
      const recognizedAt = order.statusHistory[0]?.createdAt;
      if (!recognizedAt) continue;
      const key = periodKey(recognizedAt, groupBy);
      const current = bucketMap.get(key) ?? { orderCount: 0, revenueMMK: 0 };
      bucketMap.set(key, {
        orderCount: current.orderCount + 1,
        revenueMMK: current.revenueMMK + order.totalMMK,
      });
    }

    return {
      from: range.fromISO,
      to: range.toISO,
      groupBy,
      totals,
      buckets: [...bucketMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, bucket]) => ({ period, ...bucket })),
    };
  }

  async topProducts(
    shopId: string,
    range: DateRange,
    limit = 10,
  ): Promise<{ from: string; to: string; items: TopProductRow[] }> {
    const lineItems = await this.prisma.orderLineItem.findMany({
      where: {
        order: {
          shopId,
          ...recognizedSalesWhere(range),
        },
      },
      select: {
        productId: true,
        productName: true,
        productSku: true,
        quantity: true,
        lineTotalMMK: true,
      },
    });

    const grouped = new Map<string, TopProductRow>();
    for (const item of lineItems) {
      const key = item.productId ?? `${item.productSku}:${item.productName}`;
      const current = grouped.get(key) ?? {
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: 0,
        revenueMMK: 0,
      };
      grouped.set(key, {
        ...current,
        quantity: current.quantity + item.quantity,
        revenueMMK: current.revenueMMK + item.lineTotalMMK,
      });
    }

    const items = [...grouped.values()]
      .sort((a, b) => b.revenueMMK - a.revenueMMK || b.quantity - a.quantity)
      .slice(0, limit);

    return { from: range.fromISO, to: range.toISO, items };
  }

  async preorderPipeline(shopId: string): Promise<{ items: PreorderPipelineRow[] }> {
    const orders = await this.prisma.order.findMany({
      where: { shopId, ...OPEN_PREORDER_WHERE },
      select: { status: true, totalMMK: true, amountPaidMMK: true },
    });

    const grouped = new Map<string, PreorderPipelineRow>();
    for (const order of orders) {
      const current = grouped.get(order.status) ?? {
        status: order.status,
        orderCount: 0,
        totalMMK: 0,
        amountPaidMMK: 0,
        balanceDueMMK: 0,
      };
      const balance = Math.max(0, order.totalMMK - order.amountPaidMMK);
      grouped.set(order.status, {
        status: order.status,
        orderCount: current.orderCount + 1,
        totalMMK: current.totalMMK + order.totalMMK,
        amountPaidMMK: current.amountPaidMMK + order.amountPaidMMK,
        balanceDueMMK: current.balanceDueMMK + balance,
      });
    }

    return {
      items: [...grouped.values()].sort((a, b) =>
        a.status.localeCompare(b.status),
      ),
    };
  }

  async preorderShortages(shopId: string): Promise<{ items: PreorderShortageRow[] }> {
    const lines = await this.prisma.orderLineItem.findMany({
      where: { order: { shopId, type: 'PREORDER', status: 'AWAITING_STOCK' }, productId: { not: null } },
      select: { productId: true, productName: true, productSku: true, quantity: true, orderId: true },
    });
    if (lines.length === 0) return { items: [] };
    const productIds = [...new Set(lines.map((line) => line.productId!).filter(Boolean))];
    const products = await this.prisma.product.findMany({
      where: { shopId, id: { in: productIds } },
      select: { id: true, name: true, sku: true, stockQty: true, reservedQty: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    const grouped = new Map<string, PreorderShortageRow>();
    for (const line of lines) {
      const product = byId.get(line.productId!);
      if (!product) continue;
      const current = grouped.get(product.id) ?? {
        productId: product.id, productName: product.name, productSku: product.sku,
        orderedQty: 0, availableQty: Math.max(0, product.stockQty - product.reservedQty), toOrderQty: 0, preorderCount: 0,
      };
      grouped.set(product.id, { ...current, orderedQty: current.orderedQty + line.quantity, preorderCount: current.preorderCount + 1 });
    }
    return { items: [...grouped.values()].map((item) => ({ ...item, toOrderQty: Math.max(0, item.orderedQty - item.availableQty) })).filter((item) => item.toOrderQty > 0).sort((a, b) => b.toOrderQty - a.toOrderQty) };
  }

  async paymentMethods(
    shopId: string,
    range: DateRange,
  ): Promise<{ from: string; to: string; items: PaymentMethodRow[] }> {
    const payments = await this.prisma.payment.findMany({
      where: {
        shopId,
        createdAt: { gte: range.from, lte: range.to },
      },
      select: { method: true, amountMMK: true },
    });

    const grouped = new Map<string, PaymentMethodRow>();
    for (const payment of payments) {
      const current = grouped.get(payment.method) ?? {
        method: payment.method,
        paymentCount: 0,
        amountMMK: 0,
      };
      grouped.set(payment.method, {
        method: payment.method,
        paymentCount: current.paymentCount + 1,
        amountMMK: current.amountMMK + payment.amountMMK,
      });
    }

    return {
      from: range.fromISO,
      to: range.toISO,
      items: [...grouped.values()].sort((a, b) => b.amountMMK - a.amountMMK),
    };
  }

  async *ordersExportCsv(shopId: string, range: DateRange): AsyncGenerator<string> {
    yield [
      'orderNumber',
      'type',
      'status',
      'customerName',
      'customerPhone',
      'totalMMK',
      'amountPaidMMK',
      'balanceDueMMK',
      'paymentMethod',
      'channel',
      'createdAt',
    ].join(',') + '\n';

    let cursor: string | undefined;
    while (true) {
      const orders = await this.prisma.order.findMany({
        where: {
          shopId,
          ...ACTIVE_ORDER_WHERE,
          createdAt: { gte: range.from, lte: range.to },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: CSV_BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          orderNumber: true,
          type: true,
          status: true,
          customerName: true,
          customerPhone: true,
          totalMMK: true,
          amountPaidMMK: true,
          paymentMethod: true,
          channel: true,
          createdAt: true,
        },
      });
      if (orders.length === 0) break;
      yield orders
        .map((order) =>
          [
            order.orderNumber,
            order.type,
            order.status,
            order.customerName,
            order.customerPhone,
            order.totalMMK,
            order.amountPaidMMK,
            Math.max(0, order.totalMMK - order.amountPaidMMK),
            order.paymentMethod ?? '',
            order.channel,
            order.createdAt.toISOString(),
          ]
            .map(csvCell)
            .join(','),
        )
        .join('\n') + '\n';
      cursor = orders.at(-1)!.id;
      if (orders.length < CSV_BATCH_SIZE) break;
    }
  }
}
