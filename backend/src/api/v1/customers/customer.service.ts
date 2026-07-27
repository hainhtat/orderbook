import type { PrismaClient } from '../../../../generated/sqlite/index.js';
import { AppError } from '../../../errors/app-error.js';
import { ErrorCodes } from '../../../errors/error-codes.js';

export type PublicCustomer = {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
};

export class CustomerService {
  constructor(private prisma: PrismaClient) {}

  async list(shopId: string, search?: string): Promise<PublicCustomer[]> {
    const q = search?.trim();
    return this.prisma.customer.findMany({
      where: {
        shopId,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, phone: true, address: true, notes: true },
    });
  }

  async get(shopId: string, id: string): Promise<PublicCustomer> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, shopId },
      select: { id: true, name: true, phone: true, address: true, notes: true },
    });
    if (!customer) throw new AppError(ErrorCodes.NOT_FOUND, 404);
    return customer;
  }

  async create(
    shopId: string,
    input: { name: string; phone: string; address?: string; notes?: string },
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
    return this.prisma.customer.create({
      data: {
        shopId,
        name: input.name.trim(),
        phone,
        address: input.address,
        notes: input.notes,
      },
      select: { id: true, name: true, phone: true, address: true, notes: true },
    });
  }

  async update(
    shopId: string,
    id: string,
    input: Partial<{ name: string; phone: string; address: string; notes: string }>,
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
    return this.prisma.customer.update({
      where: { id },
      data: input,
      select: { id: true, name: true, phone: true, address: true, notes: true },
    });
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
