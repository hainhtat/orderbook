import type { PrismaClient } from '../../../../generated/sqlite/index.js';
import { AppError } from '../../../errors/app-error.js';
import { ErrorCodes } from '../../../errors/error-codes.js';

export type PublicCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type PublicProduct = {
  id: string;
  sku: string;
  name: string;
  priceMMK: number;
  stockQty: number;
  reservedQty: number;
  availableStock: number;
  lowStockAt: number | null;
  imageUrl: string | null;
  isArchived: boolean;
  categoryId: string | null;
  soldQuantity: number;
  salesRevenueMMK: number;
};

function toPublicProduct(p: {
  id: string;
  sku: string;
  name: string;
  priceMMK: number;
  stockQty: number;
  reservedQty: number;
  availableStock?: number;
  lowStockAt: number | null;
  imageUrl: string | null;
  isArchived: boolean;
  categoryId: string | null;
  soldQuantity?: number;
  salesRevenueMMK?: number;
}): PublicProduct {
  return {
    ...p,
    availableStock: p.availableStock ?? Math.max(0, p.stockQty - p.reservedQty),
    soldQuantity: p.soldQuantity ?? 0,
    salesRevenueMMK: p.salesRevenueMMK ?? 0,
  };
}

export type ListProductsOptions = {
  includeArchived?: boolean;
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
};

export class ProductService {
  constructor(private prisma: PrismaClient) {}

  private async resolveCategoryId(
    shopId: string,
    categoryId: string | null | undefined,
  ): Promise<string | null | undefined> {
    if (categoryId === undefined) {
      return undefined;
    }
    if (categoryId === null) {
      return null;
    }
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, shopId },
    });
    if (!category) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404);
    }
    return categoryId;
  }

  async list(shopId: string, options: ListProductsOptions = {}) {
    const { includeArchived = false, search, categoryId, lowStock } = options;
    const page = options.page ?? 1;
    const limit = options.limit ?? 25;
    const q = search?.trim();

    const products = await this.prisma.product.findMany({
      where: {
        shopId,
        ...(includeArchived ? {} : { isArchived: false }),
        ...(categoryId ? { categoryId } : {}),
        ...(q
          ? {
              OR: [{ name: { contains: q } }, { sku: { contains: q } }],
            }
          : {}),
        ...(lowStock ? { lowStockAt: { not: null } } : {}),
      },
      orderBy: { name: 'asc' },
    });

    const filtered = lowStock
      ? products.filter(
          (product) =>
            product.lowStockAt !== null && product.stockQty <= product.lowStockAt,
        )
      : products;

    const productIds = filtered.map((product) => product.id);
    const sales = productIds.length
      ? await this.prisma.orderLineItem.groupBy({
          by: ['productId'],
          where: {
            productId: { in: productIds },
            order: { shopId, type: 'STANDARD', status: 'DELIVERED' },
          },
          _sum: { quantity: true, lineTotalMMK: true },
        })
      : [];
    const salesByProductId = new Map(
      sales.flatMap((row) =>
        row.productId
          ? [
              [
                row.productId,
                {
                  soldQuantity: row._sum.quantity ?? 0,
                  salesRevenueMMK: row._sum.lineTotalMMK ?? 0,
                },
              ] as const,
            ]
          : [],
      ),
    );

    const start = (page - 1) * limit;
    return { items: filtered.slice(start, start + limit).map((product) =>
      toPublicProduct({ ...product, ...salesByProductId.get(product.id) }),
    ), pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } };
  }

  async get(shopId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, shopId } });
    if (!product) throw new AppError(ErrorCodes.NOT_FOUND, 404);
    return toPublicProduct(product);
  }

  async create(
    shopId: string,
    input: {
      sku: string;
      name: string;
      priceMMK: number;
      stockQty?: number;
      lowStockAt?: number;
      imageUrl?: string;
      categoryId?: string;
    },
  ) {
    const categoryId = await this.resolveCategoryId(shopId, input.categoryId);
    const product = await this.prisma.product.create({
      data: {
        shopId,
        sku: input.sku.trim(),
        name: input.name.trim(),
        priceMMK: input.priceMMK,
        stockQty: input.stockQty ?? 0,
        lowStockAt: input.lowStockAt,
        imageUrl: input.imageUrl,
        categoryId: categoryId ?? undefined,
      },
    });
    return toPublicProduct(product);
  }

  async update(
    shopId: string,
    id: string,
    input: Partial<{
      sku: string;
      name: string;
      priceMMK: number;
      lowStockAt: number | null;
      imageUrl: string | null;
      categoryId: string | null;
    }>,
  ) {
    await this.get(shopId, id);
    const categoryId =
      'categoryId' in input
        ? await this.resolveCategoryId(shopId, input.categoryId)
        : undefined;
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...input,
        ...(categoryId !== undefined ? { categoryId } : {}),
      },
    });
    return toPublicProduct(product);
  }

  async archive(shopId: string, id: string) {
    await this.get(shopId, id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { isArchived: true },
    });
    return toPublicProduct(product);
  }

  async adjustStock(
    shopId: string,
    productId: string,
    actorId: string,
    input: { deltaQty: number; reason: string; note?: string },
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.product.updateMany({
        where: {
          id: productId,
          shopId,
          ...(input.deltaQty < 0 ? { stockQty: { gte: -input.deltaQty } } : {}),
        },
        data: {
          stockQty: { increment: input.deltaQty },
        },
      });

      if (result.count === 0) {
        const product = await tx.product.findFirst({ where: { id: productId, shopId } });
        if (!product) {
          throw new AppError(ErrorCodes.NOT_FOUND, 404);
        }
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
          { field: 'deltaQty', code: 'INSUFFICIENT_STOCK' },
        ]);
      }

      const product = await tx.product.findFirstOrThrow({ where: { id: productId, shopId } });

      await tx.stockAdjustment.create({
        data: {
          shopId,
          productId,
          deltaQty: input.deltaQty,
          reason: input.reason,
          note: input.note,
          actorId,
        },
      });

      // Newly received stock may satisfy pre-orders waiting for inventory.
      if (input.deltaQty > 0) {
        const waiting = await tx.order.findMany({
          where: { shopId, status: 'AWAITING_STOCK', type: 'PREORDER', lineItems: { some: { productId } } },
          include: { lineItems: true },
          orderBy: { createdAt: 'asc' },
        });
        for (const order of waiting) {
          const quantities = new Map<string, number>();
          for (const item of order.lineItems) if (item.productId) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
          let canReserve = true;
          for (const [pid, qty] of quantities) {
            const p = await tx.product.findFirstOrThrow({ where: { id: pid, shopId } });
            if (p.stockQty - p.reservedQty < qty) canReserve = false;
          }
          if (!canReserve) continue;
          for (const [pid, qty] of quantities) {
            await tx.product.update({ where: { id: pid }, data: { reservedQty: { increment: qty } } });
            await tx.stockAdjustment.create({ data: { shopId, productId: pid, deltaQty: 0, reason: 'PREORDER_RESERVATION', note: `Order ${order.orderNumber} reserved after replenishment`, actorId } });
          }
          await tx.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: 'AWAITING_STOCK', toStatus: 'RESERVED', actorId } });
          await tx.order.update({ where: { id: order.id }, data: { status: 'RESERVED' } });
        }
      }

      return product;
    });

    return toPublicProduct(updated);
  }
}

export class CategoryService {
  constructor(private prisma: PrismaClient) {}

  async list(shopId: string): Promise<PublicCategory[]> {
    return this.prisma.category.findMany({
      where: { shopId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, sortOrder: true },
    });
  }

  async create(shopId: string, input: { name: string; sortOrder?: number }) {
    return this.prisma.category.create({
      data: { shopId, name: input.name.trim(), sortOrder: input.sortOrder ?? 0 },
      select: { id: true, name: true, sortOrder: true },
    });
  }

  async get(shopId: string, id: string): Promise<PublicCategory> {
    const category = await this.prisma.category.findFirst({
      where: { id, shopId },
      select: { id: true, name: true, sortOrder: true },
    });
    if (!category) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404);
    }
    return category;
  }

  async update(
    shopId: string,
    id: string,
    input: Partial<{ name: string; sortOrder: number }>,
  ): Promise<PublicCategory> {
    await this.get(shopId, id);
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
      select: { id: true, name: true, sortOrder: true },
    });
  }

  async delete(shopId: string, id: string): Promise<void> {
    await this.get(shopId, id);
    const productCount = await this.prisma.product.count({
      where: { shopId, categoryId: id },
    });
    if (productCount > 0) {
      throw new AppError(ErrorCodes.CONFLICT, 409, [
        { field: 'categoryId', code: 'CATEGORY_IN_USE' },
      ]);
    }
    await this.prisma.category.delete({ where: { id } });
  }
}
