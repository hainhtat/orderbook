export type FieldError = {
  field: string;
  code: string;
  message?: string;
};

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly details?: FieldError[],
    public readonly cause?: unknown,
  ) {
    super(code);
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
