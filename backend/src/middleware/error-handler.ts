import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '../../generated/client/index.js';
import { AppError, isAppError } from '../errors/app-error.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { t } from '../i18n/index.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(ErrorCodes.NOT_FOUND, 404));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const locale = req.locale ?? 'en';
  const requestId = req.requestId ?? 'unknown';

  if (isAppError(err)) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: t(locale, err.code),
        details: err.details,
        requestId,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({
      error: {
        code: ErrorCodes.CONFLICT,
        message: t(locale, ErrorCodes.CONFLICT),
        requestId,
      },
    });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(500).json({
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: t(locale, ErrorCodes.INTERNAL_ERROR),
      requestId,
    },
  });
}
