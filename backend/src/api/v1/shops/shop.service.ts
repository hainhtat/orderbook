import type { PrismaClient, Shop } from '../../../../generated/client/index.js';
import { AppError } from '../../../errors/app-error.js';
import { ErrorCodes } from '../../../errors/error-codes.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export type PublicShop = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  address: string | null;
  allowOversell: boolean;
  preorderDepositMinPct: number | null;
  status: string;
  logoUrl: string | null;
};

function toPublicShop(shop: Shop): PublicShop {
  return {
    id: shop.id,
    slug: shop.slug,
    name: shop.name,
    phone: shop.phone,
    address: shop.address,
    allowOversell: shop.allowOversell,
    preorderDepositMinPct: shop.preorderDepositMinPct,
    status: shop.status,
    logoUrl: shop.logoUrl,
  };
}

export class ShopService {
  constructor(private prisma: PrismaClient) {}

  async createShop(
    userId: string,
    input: { name: string; slug?: string; phone?: string; address?: string },
  ): Promise<PublicShop> {
    const existing = await this.prisma.shopMember.findFirst({ where: { userId } });
    if (existing) {
      throw new AppError(ErrorCodes.CONFLICT, 409);
    }

    const baseSlug = input.slug?.trim() || slugify(input.name);
    let slug = baseSlug || `shop-${Date.now()}`;
    let attempt = 0;
    while (attempt < 5) {
      const found = await this.prisma.shop.findUnique({ where: { slug } });
      if (!found) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const shop = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shop.create({
        data: {
          name: input.name,
          slug,
          phone: input.phone,
          address: input.address,
        },
      });
      await tx.shopMember.create({
        data: { shopId: created.id, userId, role: 'OWNER' },
      });
      return created;
    });

    return toPublicShop(shop);
  }

  async getCurrentShop(shopId: string): Promise<PublicShop> {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404);
    }
    return toPublicShop(shop);
  }

  async updateShop(
    shopId: string,
    input: Partial<{ name: string; phone: string; address: string; logoUrl: string; allowOversell: boolean; preorderDepositMinPct: number }>,
  ): Promise<PublicShop> {
    const shop = await this.prisma.shop.update({
      where: { id: shopId },
      data: input,
    });
    return toPublicShop(shop);
  }
}
