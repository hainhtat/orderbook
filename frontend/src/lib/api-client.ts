import { ApiError, type ApiErrorBody } from '@/lib/api-error'
import { env } from '@/lib/env'
import i18n from '@/i18n'

const AUTH_ENDPOINTS = new Set([
  '/auth/refresh',
  '/auth/verify',
  '/auth/logout',
])

type SessionHandlers = {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  setTokens: (accessToken: string, refreshToken: string) => void
  clearSession: () => void
}

let sessionHandlers: SessionHandlers | null = null
let refreshPromise: Promise<boolean> | null = null

export function configureApiClient(handlers: SessionHandlers) {
  sessionHandlers = handlers
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as
      | ApiErrorBody
      | { error?: ApiErrorBody }
    const body: ApiErrorBody =
      'error' in payload && payload.error
        ? payload.error
        : (payload as ApiErrorBody)
    return new ApiError(response.status, {
      message: body.message ?? i18n.t('common:errors.generic'),
      code: body.code,
      details: body.details,
    })
  } catch {
    return new ApiError(response.status, {
      message: i18n.t('common:errors.generic'),
    })
  }
}

async function refreshTokens(): Promise<boolean> {
  if (!sessionHandlers) {
    return false
  }

  const refreshToken = sessionHandlers.getRefreshToken()
  if (!refreshToken) {
    sessionHandlers.clearSession()
    return false
  }

  const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': i18n.language,
    },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    sessionHandlers.clearSession()
    return false
  }

  const data = (await response.json()) as {
    accessToken: string
    refreshToken: string
  }

  sessionHandlers.setTokens(data.accessToken, data.refreshToken)
  return true
}

async function coordinatedRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: boolean
  retried?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, auth = true, retried = false, headers, ...rest } = options

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept-Language', i18n.language)

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (auth && sessionHandlers) {
    const accessToken = sessionHandlers.getAccessToken()
    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (
    response.status === 401 &&
    auth &&
    !retried &&
    !AUTH_ENDPOINTS.has(path) &&
    sessionHandlers
  ) {
    const refreshed = await coordinatedRefresh()
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retried: true })
    }
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
