import type { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import type { OrderService } from './order.service.js';

export function createOrderController(orders: OrderService) {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const filters = matchedData(req) as Parameters<OrderService['list']>[1];
        const items = await orders.list(req.shop!.shopId, filters);
        res.json({ orders: items.items, pagination: items.pagination });
      } catch (e) {
        next(e);
      }
    },

    get: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = matchedData(req) as { id: string };
        const order = await orders.get(req.shop!.shopId, id);
        res.json({ order });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = matchedData(req) as Parameters<OrderService['create']>[2];
        const order = await orders.create(req.shop!.shopId, req.user!.userId, data);
        res.status(201).json({ order });
      } catch (e) {
        next(e);
      }
    },

    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, ...data } = matchedData(req) as { id: string } & Parameters<
          OrderService['update']
        >[2];
        const order = await orders.update(req.shop!.shopId, id, data);
        res.json({ order });
      } catch (e) {
        next(e);
      }
    },

    transition: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, status, note } = matchedData(req) as {
          id: string;
          status: string;
          note?: string | null;
        };
        const order = await orders.transition(
          req.shop!.shopId,
          id,
          req.user!.userId,
          status,
          note,
        );
        res.json({ order });
      } catch (e) {
        next(e);
      }
    },

    payment: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, ...data } = matchedData(req) as {
          id: string;
        } & Parameters<OrderService['recordPayment']>[3];
        const result = await orders.recordPayment(
          req.shop!.shopId,
          id,
          req.user!.userId,
          data,
        );
        res.status(201).json(result);
      } catch (e) {
        next(e);
      }
    },

    history: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = matchedData(req) as { id: string };
        const history = await orders.history(req.shop!.shopId, id);
        res.json({ history });
      } catch (e) {
        next(e);
      }
    },
  };
}
