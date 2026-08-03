import type { NextFunction, Request, Response } from 'express';
import { matchedData } from 'express-validator';
import type { AiService } from './ai.service.js';

export function createAiController(ai: AiService) {
  return {
    getConfig: async (req: Request, res: Response, next: NextFunction) => {
      try {
        res.json({ config: await ai.config(req.shop!.shopId) });
      } catch (error) {
        next(error);
      }
    },

    updateConfig: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { isEnabled } = matchedData(req) as { isEnabled: boolean };
        res.json({ config: await ai.updateStaffConfig(req.shop!.shopId, isEnabled) });
      } catch (error) {
        next(error);
      }
    },

    createSession: async (req: Request, res: Response, next: NextFunction) => {
      try {
        res.status(201).json({
          session: await ai.createSession(req.shop!.shopId, req.user!.userId),
        });
      } catch (error) {
        next(error);
      }
    },

    message: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, content, locale } = matchedData(req) as {
          id: string;
          content: string;
          locale?: 'en' | 'my';
        };
        res.json({
          draft: await ai.message(req.shop!.shopId, req.user!.userId, id, content, locale ?? 'en'),
        });
      } catch (error) {
        next(error);
      }
    },

    confirm: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, ...payload } = matchedData(req) as {
          id: string;
          customerId?: string | null;
          newCustomer?: {
            name: string;
            phone: string;
            townshipOrCity?: string | null;
            detailedAddress?: string | null;
            addressLabel?: string | null;
          } | null;
          lineItems: Array<{ productId: string; quantity: number }>;
          notes?: string;
          type?: 'STANDARD' | 'PREORDER';
          expectedFulfillAt?: string | null;
          delivery: {
            customerName: string;
            customerPhone: string;
            townshipOrCity: string;
            detailedAddress: string;
            addressLabel?: string | null;
          };
          channel?: string;
          paymentMethod?: string | null;
        };
        const order = await ai.confirm(req.shop!.shopId, req.user!.userId, id, payload);
        res.status(201).json({ order });
      } catch (error) {
        next(error);
      }
    },
  };
}
