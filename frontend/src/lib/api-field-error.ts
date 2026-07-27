import type { ApiError } from '@/lib/api-error'

export function getFieldErrorCode(
  error: ApiError,
  field: string,
): string | undefined {
  if (!error.details || !Array.isArray(error.details)) {
    return undefined
  }

  return error.details.find((detail) => detail.field === field)?.code
}
