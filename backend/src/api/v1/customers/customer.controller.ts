import type { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import type { CustomerService } from './customer.service.js';

export function createCustomerController(customers: CustomerService) {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { q, page, limit } = matchedData(req) as { q?: string; page?: number; limit?: number };
        const items = await customers.list(req.shop!.shopId, q, page, limit);
        res.json({ customers: items.items, pagination: items.pagination });
      } catch (e) {
        next(e);
      }
    },

    get: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = matchedData(req) as { id: string };
        const customer = await customers.get(req.shop!.shopId, id);
        res.json({ customer });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = matchedData(req) as Parameters<CustomerService['create']>[1];
        const customer = await customers.create(req.shop!.shopId, data);
        res.status(201).json({ customer });
      } catch (e) {
        next(e);
      }
    },

    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, ...data } = matchedData(req) as { id: string } & Parameters<
          CustomerService['update']
        >[2];
        const customer = await customers.update(req.shop!.shopId, id, data);
        res.json({ customer });
      } catch (e) {
        next(e);
      }
    },

    orders: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = matchedData(req) as { id: string };
        const orders = await customers.orderHistory(req.shop!.shopId, id);
        res.json({ orders });
      } catch (e) {
        next(e);
      }
    },
  };
}
