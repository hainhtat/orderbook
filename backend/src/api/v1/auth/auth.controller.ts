import type { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import type { AuthService } from './auth.service.js';

export function createAuthController(auth: AuthService) {
  return {
    register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const data = matchedData(req) as { name: string; email: string; password: string };
        const result = await auth.register(data);
        res.status(201).json(result);
      } catch (e) {
        next(e);
      }
    },

    login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const data = matchedData(req) as { email: string; password: string };
        const result = await auth.login(data);
        res.json(result);
      } catch (e) {
        next(e);
      }
    },

    verify: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await auth.verify(req.user!.userId);
        res.json(result);
      } catch (e) {
        next(e);
      }
    },

    refresh: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { refreshToken } = matchedData(req) as { refreshToken: string };
        const result = await auth.refresh(refreshToken);
        res.json(result);
      } catch (e) {
        next(e);
      }
    },

    logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { refreshToken } = matchedData(req) as { refreshToken?: string };
        await auth.logout(req.user!.userId, refreshToken);
        res.status(204).send();
      } catch (e) {
        next(e);
      }
    },
  };
}
