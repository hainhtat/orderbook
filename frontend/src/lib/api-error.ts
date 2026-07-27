export type FieldErrorDetail = {
  field: string
  code: string
  message?: string
}

export type ApiErrorBody = {
  code?: string
  message?: string
  details?: Record<string, string[]> | FieldErrorDetail[]
  error?: {
    code?: string
    message?: string
    details?: FieldErrorDetail[]
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: Record<string, string[]> | FieldErrorDetail[]

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.details = body.details
  }
}
