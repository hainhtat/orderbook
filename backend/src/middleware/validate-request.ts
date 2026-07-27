import type { Request, Response, NextFunction } from 'express';
import { validationResult, type ValidationError } from 'express-validator';
import { AppError } from '../errors/app-error.js';
import { ErrorCodes } from '../errors/error-codes.js';
import type { FieldError } from '../errors/app-error.js';

function mapValidationErrors(errors: ValidationError[]): FieldError[] {
  return errors.map((e) => ({
    field: 'path' in e ? String(e.path) : 'unknown',
    code: typeof e.msg === 'string' ? e.msg : 'VALIDATION_FAILED',
  }));
}

export function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(ErrorCodes.VALIDATION_FAILED, 422, mapValidationErrors(errors.array())));
    return;
  }
  next();
}
