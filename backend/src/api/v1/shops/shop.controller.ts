import type { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import type { ShopService } from './shop.service.js';

export function createShopController(shops: ShopService) {
  return {
    create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const data = matchedData(req) as {
          name: string;
          slug?: string;
          phone?: string;
          address?: string;
        };
        const shop = await shops.createShop(req.user!.userId, data);
        res.status(201).json({ shop });
      } catch (e) {
        next(e);
      }
    },

    current: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const shop = await shops.getCurrentShop(req.shop!.shopId);
        res.json({ shop });
      } catch (e) {
        next(e);
      }
    },

    update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const data = matchedData(req) as Parameters<ShopService['updateShop']>[1];
        const shop = await shops.updateShop(req.shop!.shopId, data);
        res.json({ shop });
      } catch (e) {
        next(e);
      }
    },
  };
}
