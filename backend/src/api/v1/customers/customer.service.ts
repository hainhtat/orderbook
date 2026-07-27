import type { PrismaClient } from '../../../../generated/sqlite/index.js';
import { AppError } from '../../../errors/app-error.js';
import { ErrorCodes } from '../../../errors/error-codes.js';

export type PublicCustomer = {
  id: string;
  name: string;
  phone: string;
  townshipOrCity: string | null;
  detailedAddress: string | null;
  addressLabel: string | null;
  notes: string | null;
  lastOrder: {
    id: string;
    createdAt: string;
    totalMMK: number;
    itemSummary: string;
  } | null;
};

const baseCustomerSelect = {
  id: true,
  name: true,
  phone: true,
  townshipOrCity: true,
  detailedAddress: true,
  addressLabel: true,
  notes: true,
} as const;

const listCustomerSelect = {
  ...baseCustomerSelect,
  orders: {
    where: { status: { not: 'CANCELLED' as const } },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: {
      id: true,
      createdAt: true,
      totalMMK: true,
      lineItems: {
        orderBy: { id: 'asc' as const },
        take: 2,
        select: { productName: true, quantity: true },
      },
    },
  },
} as const;

function withLastOrder(
  customer: {
    id: string;
    name: string;
    phone: string;
    townshipOrCity: string | null;
    detailedAddress: string | null;
    addressLabel: string | null;
    notes: string | null;
    orders?: Array<{
      id: string;
      createdAt: Date;
      totalMMK: number;
      lineItems: Array<{ productName: string; quantity: number }>;
    }>;
  },
): PublicCustomer {
  const lastOrder = customer.orders?.[0];
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    townshipOrCity: customer.townshipOrCity,
    detailedAddress: customer.detailedAddress,
    addressLabel: customer.addressLabel,
    notes: customer.notes,
    lastOrder: lastOrder
      ? {
          id: lastOrder.id,
          createdAt: lastOrder.createdAt.toISOString(),
          totalMMK: lastOrder.totalMMK,
          itemSummary: lastOrder.lineItems
            .map((item) => `${item.productName} × ${item.quantity}`)
            .join(', '),
        }
      : null,
  };
}

export class CustomerService {
  constructor(private prisma: PrismaClient) {}

  async list(shopId: string, search?: string, page = 1, limit = 25) {
    const q = search?.trim();
    const where = {
        shopId,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
                { townshipOrCity: { contains: q } },
                { detailedAddress: { contains: q } },
              ],
            }
          : {}),
      };
    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: listCustomerSelect,
      }),
    ]);
    return { items: customers.map(withLastOrder), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async get(shopId: string, id: string): Promise<PublicCustomer> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, shopId },
      select: baseCustomerSelect,
    });
    if (!customer) throw new AppError(ErrorCodes.NOT_FOUND, 404);
    return withLastOrder(customer);
  }

  async create(
    shopId: string,
    input: {
      name: string;
      phone: string;
      townshipOrCity?: string;
      detailedAddress?: string;
      addressLabel?: string;
      notes?: string;
    },
  ): Promise<PublicCustomer> {
    const phone = input.phone.trim();
    const existing = await this.prisma.customer.findUnique({
      where: { shopId_phone: { shopId, phone } },
    });
    if (existing) {
      throw new AppError(ErrorCodes.CONFLICT, 409, [
        { field: 'phone', code: 'DUPLICATE_PHONE' },
      ]);
    }
    const customer = await this.prisma.customer.create({
      data: {
        shopId,
        name: input.name.trim(),
        phone,
        townshipOrCity: input.townshipOrCity?.trim() || null,
        detailedAddress: input.detailedAddress?.trim() || null,
        addressLabel: input.addressLabel?.trim() || null,
        notes: input.notes,
      },
      select: baseCustomerSelect,
    });
    return withLastOrder(customer);
  }

  async update(
    shopId: string,
    id: string,
    input: Partial<{
      name: string;
      phone: string;
      townshipOrCity: string | null;
      detailedAddress: string | null;
      addressLabel: string | null;
      notes: string;
    }>,
  ): Promise<PublicCustomer> {
    await this.get(shopId, id);
    if (input.phone) {
      const phone = input.phone.trim();
      const dup = await this.prisma.customer.findFirst({
        where: { shopId, phone, NOT: { id } },
      });
      if (dup) {
        throw new AppError(ErrorCodes.CONFLICT, 409, [
          { field: 'phone', code: 'DUPLICATE_PHONE' },
        ]);
      }
      input.phone = phone;
    }
    const data = {
      ...input,
      ...(input.townshipOrCity !== undefined
        ? { townshipOrCity: input.townshipOrCity?.trim() || null }
        : {}),
      ...(input.detailedAddress !== undefined
        ? { detailedAddress: input.detailedAddress?.trim() || null }
        : {}),
      ...(input.addressLabel !== undefined
        ? { addressLabel: input.addressLabel?.trim() || null }
        : {}),
    };
    const customer = await this.prisma.customer.update({
      where: { id },
      data,
      select: baseCustomerSelect,
    });
    return withLastOrder(customer);
  }

  async orderHistory(shopId: string, customerId: string) {
    await this.get(shopId, customerId);
    return this.prisma.order.findMany({
      where: { shopId, customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalMMK: true,
        amountPaidMMK: true,
        createdAt: true,
      },
    });
  }
}
