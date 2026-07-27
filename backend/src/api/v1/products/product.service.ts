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
  lowStockAt: number | null;
  imageUrl: string | null;
  isArchived: boolean;
  categoryId: string | null;
};

function toPublicProduct(p: {
  id: string;
  sku: string;
  name: string;
  priceMMK: number;
  stockQty: number;
  reservedQty: number;
  lowStockAt: number | null;
  imageUrl: string | null;
  isArchived: boolean;
  categoryId: string | null;
}): PublicProduct {
  return { ...p };
}

export class ProductService {
  constructor(private prisma: PrismaClient) {}

  async list(shopId: string, includeArchived = false) {
    const products = await this.prisma.product.findMany({
      where: { shopId, ...(includeArchived ? {} : { isArchived: false }) },
      orderBy: { name: 'asc' },
    });
    return products.map(toPublicProduct);
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
    const product = await this.prisma.product.create({
      data: {
        shopId,
        sku: input.sku.trim(),
        name: input.name.trim(),
        priceMMK: input.priceMMK,
        stockQty: input.stockQty ?? 0,
        lowStockAt: input.lowStockAt,
        imageUrl: input.imageUrl,
        categoryId: input.categoryId,
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
    const product = await this.prisma.product.update({
      where: { id },
      data: input,
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
    const product = await this.prisma.product.findFirst({ where: { id: productId, shopId } });
    if (!product) throw new AppError(ErrorCodes.NOT_FOUND, 404);

    const nextQty = product.stockQty + input.deltaQty;
    if (nextQty < 0) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, 422, [
        { field: 'deltaQty', code: 'INSUFFICIENT_STOCK' },
      ]);
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: { stockQty: nextQty },
      }),
      this.prisma.stockAdjustment.create({
        data: {
          shopId,
          productId,
          deltaQty: input.deltaQty,
          reason: input.reason,
          note: input.note,
          actorId,
        },
      }),
    ]);

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
}
