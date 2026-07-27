import type { Request, Response, NextFunction } from 'express';
import { parseLocale, type Locale } from '../i18n/index.js';

declare global {
  namespace Express {
    interface Request {
      locale: Locale;
      requestId: string;
      user?: { userId: string };
      shop?: { shopId: string; role: string };
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = req.header('x-request-id') ?? `req_${crypto.randomUUID().slice(0, 12)}`;
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.locale = parseLocale(req.header('accept-language') ?? undefined);
  next();
}
