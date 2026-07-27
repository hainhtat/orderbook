import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { ErrorCodes } from '../errors/error-codes.js';
import type { TokenService } from '../utilities/tokens.js';

export function createAuthenticate(tokens: TokenService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      next(new AppError(ErrorCodes.UNAUTHORIZED, 401));
      return;
    }
    const token = header.slice(7);
    try {
      const { userId } = await tokens.verifyAccessToken(token);
      req.user = { userId };
      next();
    } catch {
      next(new AppError(ErrorCodes.UNAUTHORIZED, 401));
    }
  };
}
