import type { Request, Response, NextFunction } from 'express';
import type { PrismaClient } from '../../generated/client/index.js';
import { AppError } from '../errors/app-error.js';
import { ErrorCodes } from '../errors/error-codes.js';

export function createTenantMiddleware(prisma: PrismaClient) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user?.userId) {
      next(new AppError(ErrorCodes.UNAUTHORIZED, 401));
      return;
    }

    const headerShopId = req.header('x-shop-id');
    const membership = headerShopId
      ? await prisma.shopMember.findFirst({
          where: { userId: req.user.userId, shopId: headerShopId },
          include: { shop: true },
        })
      : await prisma.shopMember.findFirst({
          where: { userId: req.user.userId },
          include: { shop: true },
          orderBy: { shop: { createdAt: 'asc' } },
        });

    if (!membership) {
      next(new AppError(ErrorCodes.SHOP_REQUIRED, 403));
      return;
    }

    if (membership.shop.status === 'SUSPENDED') {
      next(new AppError(ErrorCodes.SHOP_SUSPENDED, 403));
      return;
    }

    req.shop = { shopId: membership.shopId, role: membership.role };
    next();
  };
}
