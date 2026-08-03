import type { Prisma, PrismaClient } from '../../../../generated/client/index.js';
import { resolveOrderNumberPrefix } from '../../../domain/order-number-prefix.js';
import { AppError } from '../../../errors/app-error.js';
import { postCodCollectionFee, postPaymentToCashbook } from '../cashbook/cashbook.service.js';
import { ErrorCodes } from '../../../errors/error-codes.js';

export type DeliverySnapshot = {
  customerName: string;
  customerPhone: string;
  townshipOrCity: string;
  detailedAddress: string;
  addressLabel: string | null;
};

export type PublicOrderLineItem = {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string;
  unitPriceMMK: number;
  quantity: number;
  lineTotalMMK: number;
};

export type PublicOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  type: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  channel: string;
  channelReference: string | null;
  subtotalMMK: number;
  discountMMK: number;
  totalMMK: number;
  amountPaidMMK: number;
  balanceDueMMK: number;
  expectedFulfillAt: string | null;
  notes: string | null;
  customerName: string;
  customerPhone: string;
  townshipOrCity: string;
  detailedAddress: string;
  addressLabel: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: PublicOrderLineItem[];
  payments: PublicPayment[];
};

export type PublicPayment = {
  id: string;
  amountMMK: number;
  method: string;
  note: string | null;
  recordedBy: string;
  createdAt: string;
};

type OrderRecord = Prisma.OrderGetPayload<{
  include: { lineItems: true; payments: true };
}>;

function toPublicLineItem(item: OrderRecord['lineItems'][number]): PublicOrderLineItem {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productSku: item.productSku,
    unitPriceMMK: item.unitPriceMMK,
    quantity: item.quantity,
    lineTotalMMK: item.lineTotalMMK,
  };
}

function toPublicOrder(order: OrderRecord): PublicOrder {
  const paymentStatus =
    order.amountPaidMMK <= 0
      ? 'UNPAID'
      : order.amountPaidMMK >= order.totalMMK
        ? 'PAID'
        : 'PARTIALLY_PAID';
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    type: order.type,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus,
    channel: order.channel,
    channelReference: order.channelReference,
    subtotalMMK: order.subtotalMMK,
    discountMMK: order.discountMMK,
    totalMMK: order.totalMMK,
    amountPaidMMK: order.amountPaidMMK,
    balanceDueMMK: Math.max(0, order.totalMMK - order.amountPaidMMK),
    expectedFulfillAt: order.expectedFulfillAt?.toISOString() ?? null,
    notes: order.notes,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    townshipOrCity: order.townshipOrCity,
    detailedAddress: order.detailedAddress,
    addressLabel: order.addressLabel,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    lineItems: order.lineItems.map(toPublicLineItem),
    payments: order.payments.map((payment) => ({
      id: payment.id,
      amountMMK: payment.amountMMK,
      method: payment.method,
      note: payment.note,
      recordedBy: payment.recordedBy,
      createdAt: payment.createdAt.toISOString(),
    })),
  };
}

async function generateOrderNumber(
  tx: Prisma.TransactionClient,
  shopId: string,
): Promise<string> {
  const shop = await tx.shop.findUniqueOrThrow({ where: { id: shopId } });
  const prefix = resolveOrderNumberPrefix(shop);

  // One-time bump after deploy: if seq was never used and orders exist, skip past them.
  if (shop.orderNumberSeq === 0) {
    const count = await tx.order.count({ where: { shopId } });
    if (count > 0) {
      await tx.shop.update({
        where: { id: shopId },
        data: { orderNumberSeq: count },
      });
    }
  }

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const updated = await tx.shop.update({
      where: { id: shopId },
      data: { orderNumberSeq: { increment: 1 } },
    });
    const orderNumber = `${prefix}-${String(updated.orderNumberSeq).padStart(3, '0')}`;
    const existing = await tx.order.findFirst({
      where: { shopId, orderNumber },
      select: { id: true },
    });
    if (!existing) {
      return orderNumber;
    }
  }

  throw new AppError(ErrorCodes.CONFLICT, 409, [
    { field: 'orderNumber', code: 'ORDER_NUMBER_COLLISION' },
  ]);
}

const standardTransitions: Record<string, Set<string>> = {
  TO_CONFIRM: new Set(['TO_DELIVER', 'CANCELLED']),
  TO_DELIVER: new Set(['DELIVERED', 'CANCELLED']),
  DELIVERING: new Set(['DELIVERED', 'CANCELLED']),
  DELIVERED: new Set(),
  CANCELLED: new Set(),
};

export type ListOrdersOptions = {
  status?: string;
  customerId?: string;
  channel?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  type?: string;
  preorderOnly?: boolean;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export class OrderService {
  constructor(private prisma: PrismaClient) {}

  private buildListWhere(shopId: string, options: ListOrdersOptions): Prisma.OrderWhereInput {
    const q = options.search?.trim();
    return {
      shopId,
      ...(options.status ? { status: options.status as 'TO_CONFIRM' } : {}),
      ...(options.paymentMethod
        ? { paymentMethod: options.paymentMethod as 'CASH' }
        : {}),
      ...(options.customerId ? { customerId: options.customerId } : {}),
      ...(options.channel ? { channel: options.channel as 'MESSENGER' } : {}),
      ...(options.preorderOnly
        ? { type: 'PREORDER' }
        : options.type
          ? { type: options.type as 'STANDARD' }
          : {}),
      ...(options.from || options.to
        ? {
            createdAt: {
              ...(options.from ? { gte: new Date(options.from) } : {}),
              ...(options.to ? { lte: new Date(options.to) } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q } },
              { customerName: { contains: q } },
              { customerPhone: { contains: q } },
              { channelReference: { contains: q } },
            ],
          }
        : {}),
    };
  }

  async list(shopId: string, options: ListOrdersOptions = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 25;
    const skip = (page - 1) * limit;

    if (
      options.paymentStatus === 'PAID' ||
      options.paymentStatus === 'PARTIALLY_PAID'
    ) {
      return this.listWithDerivedPaymentStatus(shopId, options, page, limit, skip);
    }

    const where: Prisma.OrderWhereInput = {
      ...this.buildListWhere(shopId, options),
      ...(options.paymentStatus === 'UNPAID'
        ? { amountPaidMMK: { lte: 0 } }
        : {}),
    };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: { lineItems: true, payments: { orderBy: { createdAt: 'asc' } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: orders.map(toPublicOrder),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async listWithDerivedPaymentStatus(
    shopId: string,
    options: ListOrdersOptions,
    page: number,
    limit: number,
    skip: number,
  ) {
    const paymentStatus = options.paymentStatus!;
    const candidates = await this.prisma.order.findMany({
      where: this.buildListWhere(shopId, options),
      select: {
        id: true,
        amountPaidMMK: true,
        totalMMK: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const matchingIds = candidates
      .filter((order) => {
        const status =
          order.amountPaidMMK <= 0
            ? 'UNPAID'
            : order.amountPaidMMK >= order.totalMMK
              ? 'PAID'
              : 'PARTIALLY_PAID';
        return status === paymentStatus;
      })
      .map((order) => order.id);

    const total = matchingIds.length;
    const pageIds = matchingIds.slice(skip, skip + limit);
    if (pageIds.length === 0) {
      return {
        items: [],
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    const orders = await this.prisma.order.findMany({
      where: { id: { in: pageIds } },
      include: { lineItems: true, payments: { orderBy: { createdAt: 'asc' } } },
    });
    const orderById = new Map(orders.map((order) => [order.id, order]));
    const sorted = pageIds
      .map((id) => orderById.get(id))
      .filter((order): order is OrderRecord => Boolean(order));

    return {
      items: sorted.map(toPublicOrder),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async get(shopId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopId },
      include: { lineItems: true, payments: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404);
    }
    return toPublicOrder(order);
  }

  async create(
    shopId: string,
    actorId: string,
    input: {
      customerId: string;
      customer?: {
        name: string;
        phone: string;
        townshipOrCity?: string | null;
        detailedAddress?: string | null;
        addressLabel?: string | null;
        notes?: string | null;
      };
      channel?: string;
      paymentMethod?: string | null;
      channelReference?: string;
      discountMMK?: number;
      notes?: string;
      delivery: DeliverySnapshot;
      lineItems: Array<{ productId: string; quantity: number }>;
      type?: string;
      expectedFulfillAt?: string | null;
      chatSessionId?: string;
    },
  ) {
    if (input.lineItems.length === 0) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'lineItems', code: 'REQUIRED' },
      ]);
    }
    if (input.lineItems.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'lineItems.quantity', code: 'INVALID_AMOUNT' },
      ]);
    }

    const productIds = [...new Set(input.lineItems.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { shopId, id: { in: productIds }, isArchived: false },
    });
    if (products.length !== productIds.length) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404);
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const lineItems = input.lineItems.map((item) => {
      const product = productById.get(item.productId)!;
      const lineTotalMMK = product.priceMMK * item.quantity;
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unitPriceMMK: product.priceMMK,
        quantity: item.quantity,
        lineTotalMMK,
      };
    });

    const subtotalMMK = lineItems.reduce((sum, item) => sum + item.lineTotalMMK, 0);
    const discountMMK = input.discountMMK ?? 0;
    if (discountMMK < 0 || discountMMK > subtotalMMK) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'discountMMK', code: 'INVALID_AMOUNT' },
      ]);
    }
    const totalMMK = subtotalMMK - discountMMK;
    const isPreorder = input.type === 'PREORDER';

    const order = await this.prisma.$transaction(async (tx) => {
      let customerId = input.customerId;
      if (input.customer) {
        const existingPhone = await tx.customer.findFirst({
          where: { shopId, phone: input.customer.phone.trim() },
        });
        if (existingPhone) {
          throw new AppError(ErrorCodes.CONFLICT, 409, [
            { field: 'customer.phone', code: 'DUPLICATE_PHONE' },
          ]);
        }
        const customer = await tx.customer.create({
          data: {
            shopId,
            name: input.customer.name.trim(),
            phone: input.customer.phone.trim(),
            townshipOrCity: input.customer.townshipOrCity?.trim() || null,
            detailedAddress: input.customer.detailedAddress?.trim() || null,
            addressLabel: input.customer.addressLabel?.trim() || null,
            notes: input.customer.notes?.trim() || null,
          },
        });
        customerId = customer.id;
      } else {
        const customer = await tx.customer.findFirst({
          where: { id: customerId, shopId },
        });
        if (!customer) {
          throw new AppError(ErrorCodes.NOT_FOUND, 404);
        }
      }
      const orderNumber = await generateOrderNumber(tx, shopId);
      if (!isPreorder) {
        const shop = await tx.shop.findUniqueOrThrow({ where: { id: shopId } });
        for (const item of lineItems) {
          const result = await tx.product.updateMany({
            where: {
              id: item.productId,
              shopId,
              ...(shop.allowOversell ? {} : { stockQty: { gte: item.quantity } }),
            },
            data: { stockQty: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
              { field: 'lineItems', code: 'INSUFFICIENT_STOCK' },
            ]);
          }
          await tx.stockAdjustment.create({
            data: {
              shopId,
              productId: item.productId,
              deltaQty: -item.quantity,
              reason: 'SALE',
              note: `Order ${orderNumber} ready for delivery`,
              actorId,
            },
          });
        }
      }
      const created = await tx.order.create({
        data: {
          shopId,
          customerId,
          orderNumber,
          type: (input.type as 'STANDARD' | 'PREORDER') ?? 'STANDARD',
          channel: (input.channel as 'MESSENGER') ?? 'MESSENGER',
          paymentMethod: input.paymentMethod as 'CASH' | undefined,
          channelReference: input.channelReference,
          subtotalMMK,
          discountMMK,
          totalMMK,
          notes: input.notes,
          expectedFulfillAt: input.expectedFulfillAt ? new Date(input.expectedFulfillAt) : null,
          customerName: input.delivery.customerName.trim(),
          customerPhone: input.delivery.customerPhone.trim(),
          townshipOrCity: input.delivery.townshipOrCity.trim(),
          detailedAddress: input.delivery.detailedAddress.trim(),
          addressLabel: input.delivery.addressLabel?.trim() || null,
          chatSessionId: input.chatSessionId ?? null,
          createdByUserId: actorId,
          lineItems: { create: lineItems },
          status: isPreorder ? 'CONFIRMED' : 'TO_DELIVER',
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: isPreorder ? 'CONFIRMED' : 'TO_DELIVER',
              actorId,
            },
          },
        },
        include: { lineItems: true, payments: true },
      });
      return created;
    });

    return toPublicOrder(order);
  }

  async update(
    shopId: string,
    id: string,
    input: Partial<{
      channelReference: string | null;
      discountMMK: number;
      notes: string | null;
      delivery: Partial<DeliverySnapshot>;
      lineItems: Array<{ productId: string; quantity: number }>;
    }>,
  ) {
    const existing = await this.prisma.order.findFirst({
      where: { id, shopId },
      include: { lineItems: true, payments: true },
    });
    if (!existing) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404);
    }
    if (existing.status !== 'TO_DELIVER') {
      throw new AppError(ErrorCodes.CONFLICT, 409, [
        { field: 'status', code: 'ORDER_NOT_EDITABLE' },
      ]);
    }
    if (input.lineItems) {
      throw new AppError(ErrorCodes.CONFLICT, 409, [
        { field: 'lineItems', code: 'ORDER_ITEMS_NOT_EDITABLE' },
      ]);
    }

    const subtotalMMK = existing.subtotalMMK;

    const discountMMK = input.discountMMK ?? existing.discountMMK;
    if (discountMMK < 0 || discountMMK > subtotalMMK) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'discountMMK', code: 'INVALID_AMOUNT' },
      ]);
    }
    const totalMMK = subtotalMMK - discountMMK;
    if (totalMMK < existing.amountPaidMMK) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'discountMMK', code: 'TOTAL_BELOW_AMOUNT_PAID' },
      ]);
    }

    const delivery = input.delivery;
    const order = await this.prisma.$transaction(async (tx) => {
      return tx.order.update({
        where: { id },
        data: {
          channelReference:
            input.channelReference !== undefined
              ? input.channelReference
              : undefined,
          discountMMK,
          subtotalMMK,
          totalMMK,
          notes: input.notes !== undefined ? input.notes : undefined,
          ...(delivery?.customerName !== undefined
            ? { customerName: delivery.customerName.trim() }
            : {}),
          ...(delivery?.customerPhone !== undefined
            ? { customerPhone: delivery.customerPhone.trim() }
            : {}),
          ...(delivery?.townshipOrCity !== undefined
            ? { townshipOrCity: delivery.townshipOrCity.trim() }
            : {}),
          ...(delivery?.detailedAddress !== undefined
            ? { detailedAddress: delivery.detailedAddress.trim() }
            : {}),
          ...(delivery?.addressLabel !== undefined
            ? { addressLabel: delivery.addressLabel?.trim() || null }
            : {}),
        },
        include: { lineItems: true, payments: { orderBy: { createdAt: 'asc' } } },
      });
    });

    return toPublicOrder(order);
  }

  async bulkUpdatePreorderExpectedDate(
    shopId: string,
    orderIds: string[],
    expectedFulfillAt: string,
  ) {
    const uniqueIds = [...new Set(orderIds)];
    const orders = await this.prisma.order.findMany({
      where: { id: { in: uniqueIds }, shopId, type: 'PREORDER' },
      select: { id: true, status: true },
    });
    if (orders.length !== uniqueIds.length) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404);
    }
    if (orders.some((order) => ['COMPLETED', 'CANCELLED'].includes(order.status))) {
      throw new AppError(ErrorCodes.CONFLICT, 409, [
        { field: 'orderIds', code: 'ORDER_NOT_EDITABLE' },
      ]);
    }

    const result = await this.prisma.order.updateMany({
      where: { id: { in: uniqueIds }, shopId, type: 'PREORDER' },
      data: { expectedFulfillAt: new Date(expectedFulfillAt) },
    });
    return { updatedCount: result.count };
  }

  async transition(
    shopId: string,
    id: string,
    actorId: string,
    toStatus: string,
    note?: string | null,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopId },
      include: { lineItems: true, payments: true },
    });
    if (!order) throw new AppError(ErrorCodes.NOT_FOUND, 404);
    const preorderTransitions: Record<string, Set<string>> = {
      DRAFT: new Set(['CONFIRMED', 'CANCELLED']),
      CONFIRMED: new Set(['CANCELLED']),
      DEPOSIT_PAID: new Set(['RESERVED', 'AWAITING_STOCK', 'CANCELLED']),
      RESERVED: new Set(['READY_TO_FULFILL', 'CANCELLED']),
      AWAITING_STOCK: new Set(['RESERVED', 'CANCELLED']),
      READY_TO_FULFILL: new Set(['FULFILLED', 'CANCELLED']),
      FULFILLED: new Set(['COMPLETED']),
      COMPLETED: new Set(),
      CANCELLED: new Set(),
    };
    const transitions = order.type === 'PREORDER' ? preorderTransitions : standardTransitions;
    if (!transitions[order.status]?.has(toStatus)) {
      throw new AppError(ErrorCodes.INVALID_STATUS_TRANSITION, 409, [
        { field: 'status', code: 'INVALID_STATUS_TRANSITION' },
      ]);
    }

    const shouldDecrement =
      order.type === 'STANDARD' &&
      order.status === 'TO_CONFIRM' &&
      toStatus === 'TO_DELIVER';
    const shouldReverse =
      order.type === 'STANDARD' &&
      ['TO_DELIVER', 'DELIVERING', 'DELIVERED'].includes(order.status) &&
      toStatus === 'CANCELLED';
    const shouldReserve = order.type === 'PREORDER' && toStatus === 'RESERVED';
    const shouldRelease = order.type === 'PREORDER' && ['RESERVED', 'READY_TO_FULFILL'].includes(order.status) && toStatus === 'CANCELLED';
    const shouldConsumeReservation = order.type === 'PREORDER' && order.status === 'READY_TO_FULFILL' && toStatus === 'FULFILLED';
    const shouldValidateStandardDelivery = order.type === 'STANDARD' && order.status === 'TO_DELIVER' && toStatus === 'DELIVERED';
    const quantityByProduct = new Map<string, number>();
    for (const item of order.lineItems) {
      if (item.productId) {
        quantityByProduct.set(
          item.productId,
          (quantityByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.findUniqueOrThrow({ where: { id: shopId } });
      if (shouldValidateStandardDelivery) {
        for (const [productId] of quantityByProduct) {
          const product = await tx.product.findFirst({ where: { id: productId, shopId } });
          if (!product || product.stockQty < 0) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'status', code: 'INSUFFICIENT_STOCK' }]);
        }
      }
      if (shouldReserve) {
        for (const [productId, quantity] of quantityByProduct) {
          const product = await tx.product.findFirst({ where: { id: productId, shopId } });
          if (!product) throw new AppError(ErrorCodes.NOT_FOUND, 404);
          if (product.stockQty - product.reservedQty < quantity) {
            throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'status', code: 'INSUFFICIENT_STOCK' }]);
          }
          await tx.product.update({ where: { id: productId }, data: { reservedQty: { increment: quantity } } });
          await tx.stockAdjustment.create({ data: { shopId, productId, deltaQty: -quantity, reason: 'PREORDER_RESERVATION', note: `Order ${order.orderNumber} reserved`, actorId } });
        }
      } else if (shouldRelease) {
        for (const [productId, quantity] of quantityByProduct) {
          await tx.product.updateMany({ where: { id: productId, shopId }, data: { reservedQty: { decrement: quantity } } });
          await tx.stockAdjustment.create({ data: { shopId, productId, deltaQty: quantity, reason: 'PREORDER_RESERVATION_RELEASE', note: `Order ${order.orderNumber} cancelled`, actorId } });
        }
      }
      if (shouldConsumeReservation) {
        for (const [productId, quantity] of quantityByProduct) {
          const result = await tx.product.updateMany({
            where: { id: productId, shopId, stockQty: { gte: quantity }, reservedQty: { gte: quantity } },
            data: { stockQty: { decrement: quantity }, reservedQty: { decrement: quantity } },
          });
          if (result.count === 0) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'status', code: 'INSUFFICIENT_STOCK' }]);
          await tx.stockAdjustment.create({ data: { shopId, productId, deltaQty: -quantity, reason: 'PREORDER_FULFILLMENT', note: `Order ${order.orderNumber} fulfilled`, actorId } });
        }
      } else if (shouldDecrement) {
        for (const [productId, quantity] of quantityByProduct) {
          const result = await tx.product.updateMany({
            where: {
              id: productId,
              shopId,
              ...(shop.allowOversell ? {} : { stockQty: { gte: quantity } }),
            },
            data: { stockQty: { decrement: quantity } },
          });
          if (result.count === 0) {
            throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
              { field: 'status', code: 'INSUFFICIENT_STOCK' },
            ]);
          }
          await tx.stockAdjustment.create({
            data: {
              shopId,
              productId,
              deltaQty: -quantity,
              reason: 'SALE',
              note: `Order ${order.orderNumber} prepared for delivery`,
              actorId,
            },
          });
        }
      } else if (shouldReverse) {
        for (const [productId, quantity] of quantityByProduct) {
          const restored = await tx.product.updateMany({
            where: { id: productId, shopId },
            data: { stockQty: { increment: quantity } },
          });
          if (restored.count > 0) {
            await tx.stockAdjustment.create({
              data: {
                shopId,
                productId,
                deltaQty: quantity,
                reason: 'RETURN',
                note: `Order ${order.orderNumber} cancelled`,
                actorId,
              },
            });
          }
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: toStatus as 'CONFIRMED',
          note: note?.trim() || null,
          actorId,
        },
      });
      return tx.order.update({
        where: { id },
        data: { status: toStatus as 'CONFIRMED' },
        include: { lineItems: true, payments: { orderBy: { createdAt: 'asc' } } },
      });
    });

    return toPublicOrder(updated);
  }

  async recordPayment(
    shopId: string,
    id: string,
    actorId: string,
    input: { amountMMK: number; method: string; note?: string | null },
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id, shopId }, include: { lineItems: true } });
      if (!order) throw new AppError(ErrorCodes.NOT_FOUND, 404);
      if (order.status === 'CANCELLED') {
        throw new AppError(ErrorCodes.CONFLICT, 409, [
          { field: 'status', code: 'ORDER_CANCELLED' },
        ]);
      }
      if (input.amountMMK > order.totalMMK - order.amountPaidMMK) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
          { field: 'amountMMK', code: 'PAYMENT_EXCEEDS_BALANCE' },
        ]);
      }
      const payment = await tx.payment.create({
        data: {
          orderId: id,
          shopId,
          amountMMK: input.amountMMK,
          method: input.method as 'CASH',
          note: input.note?.trim() || null,
          recordedBy: actorId,
        },
      });
      await postPaymentToCashbook(tx, {
        shopId,
        orderId: id,
        paymentId: payment.id,
        method: payment.method,
        amountMMK: payment.amountMMK,
        note: payment.note,
        actorId,
      });
      const updated = await tx.order.update({
        where: { id },
        data: {
          amountPaidMMK: { increment: input.amountMMK },
          paymentMethod: order.paymentMethod ?? (input.method as 'CASH'),
        },
        include: { lineItems: true, payments: { orderBy: { createdAt: 'asc' } } },
      });
      if (order.type === 'PREORDER' && order.status === 'CONFIRMED') {
        const shop = await tx.shop.findUniqueOrThrow({ where: { id: shopId } });
        const minimum = Math.ceil(order.totalMMK * (shop.preorderDepositMinPct ?? 30) / 100);
        if (updated.amountPaidMMK < minimum) {
          throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'amountMMK', code: 'PREORDER_DEPOSIT_MINIMUM' }]);
        }
        const byProduct = new Map<string, number>();
        for (const item of order.lineItems) if (item.productId) byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + item.quantity);
        let canReserve = true;
        for (const [productId, quantity] of byProduct) {
          const product = await tx.product.findFirst({ where: { id: productId, shopId } });
          if (!product || product.stockQty - product.reservedQty < quantity) canReserve = false;
        }
        if (canReserve) {
          for (const [productId, quantity] of byProduct) {
            await tx.product.update({ where: { id: productId }, data: { reservedQty: { increment: quantity } } });
            await tx.stockAdjustment.create({ data: { shopId, productId, deltaQty: -quantity, reason: 'PREORDER_RESERVATION', note: `Order ${order.orderNumber} reserved`, actorId } });
          }
        }
        const nextStatus = canReserve ? 'RESERVED' : 'AWAITING_STOCK';
        await tx.orderStatusHistory.create({ data: { orderId: id, fromStatus: 'CONFIRMED', toStatus: 'DEPOSIT_PAID', actorId } });
        await tx.orderStatusHistory.create({ data: { orderId: id, fromStatus: 'DEPOSIT_PAID', toStatus: nextStatus, actorId } });
        await tx.order.update({ where: { id }, data: { status: nextStatus } });
      }
      const finalOrder = await tx.order.findFirstOrThrow({ where: { id, shopId }, include: { lineItems: true, payments: { orderBy: { createdAt: 'asc' } } } });
      if (finalOrder.type === 'PREORDER' && finalOrder.status === 'FULFILLED' && finalOrder.amountPaidMMK >= finalOrder.totalMMK) {
        await tx.orderStatusHistory.create({ data: { orderId: id, fromStatus: 'FULFILLED', toStatus: 'COMPLETED', actorId } });
        const completed = await tx.order.update({ where: { id }, data: { status: 'COMPLETED' }, include: { lineItems: true, payments: { orderBy: { createdAt: 'asc' } } } });
        return { payment, order: completed };
      }
      return { payment, order: finalOrder };
    });

    return {
      payment: {
        id: result.payment.id,
        amountMMK: result.payment.amountMMK,
        method: result.payment.method,
        note: result.payment.note,
        recordedBy: result.payment.recordedBy,
        createdAt: result.payment.createdAt.toISOString(),
      },
      order: toPublicOrder(result.order),
    };
  }

  async collectCod(
    shopId: string,
    id: string,
    actorId: string,
    input: { amountMMK: number; settlementMethod: string; feeMMK?: number; note?: string | null },
  ) {
    if (input.settlementMethod === 'COD') {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'settlementMethod', code: 'COD_REQUIRES_SETTLEMENT_METHOD' },
      ]);
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id, shopId }, include: { lineItems: true } });
      if (!order) throw new AppError(ErrorCodes.NOT_FOUND, 404);
      if (order.paymentMethod !== 'COD') {
        throw new AppError(ErrorCodes.CONFLICT, 409, [{ field: 'paymentMethod', code: 'ORDER_NOT_COD' }]);
      }
      if (order.status === 'CANCELLED') throw new AppError(ErrorCodes.CONFLICT, 409, [{ field: 'status', code: 'ORDER_CANCELLED' }]);
      const balance = order.totalMMK - order.amountPaidMMK;
      if (input.amountMMK > balance || (input.feeMMK ?? 0) > input.amountMMK) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
          { field: (input.feeMMK ?? 0) > input.amountMMK ? 'feeMMK' : 'amountMMK', code: (input.feeMMK ?? 0) > input.amountMMK ? 'FEE_EXCEEDS_COLLECTION' : 'PAYMENT_EXCEEDS_BALANCE' },
        ]);
      }
      const method = input.settlementMethod as 'CASH' | 'BANK_TRANSFER' | 'KBZPAY_MANUAL' | 'WAVE_MANUAL' | 'OTHER';
      const reserved = await tx.order.updateMany({
        where: { id, shopId, amountPaidMMK: { lte: order.totalMMK - input.amountMMK } },
        data: { amountPaidMMK: { increment: input.amountMMK } },
      });
      if (reserved.count !== 1) throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [{ field: 'amountMMK', code: 'PAYMENT_EXCEEDS_BALANCE' }]);
      const payment = await tx.payment.create({ data: { orderId: id, shopId, amountMMK: input.amountMMK, method, note: input.note?.trim() || null, recordedBy: actorId } });
      await postPaymentToCashbook(tx, { shopId, orderId: id, paymentId: payment.id, method: payment.method, amountMMK: payment.amountMMK, note: input.note, actorId });
      await postCodCollectionFee(tx, { shopId, orderId: id, method: payment.method, feeMMK: input.feeMMK ?? 0, note: input.note, actorId });
      const updated = await tx.order.findFirstOrThrow({ where: { id, shopId }, include: { lineItems: true, payments: { orderBy: { createdAt: 'asc' } } } });
      return { payment, order: updated, feeMMK: input.feeMMK ?? 0 };
    });
    return { payment: { ...result.payment, createdAt: result.payment.createdAt.toISOString() }, order: toPublicOrder(result.order), feeMMK: result.feeMMK };
  }

  async history(shopId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, shopId },
      select: { id: true },
    });
    if (!order) throw new AppError(ErrorCodes.NOT_FOUND, 404);
    const history = await this.prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
    });
    return history.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      note: entry.note,
      actorId: entry.actorId,
      createdAt: entry.createdAt.toISOString(),
    }));
  }
}
