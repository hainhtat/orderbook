const ACCESS_TOKEN_KEY = 'order-notebook.accessToken'
const REFRESH_TOKEN_KEY = 'order-notebook.refreshToken'

let memoryAccessToken: string | null = null

export function getAccessToken(): string | null {
  if (memoryAccessToken) {
    return memoryAccessToken
  }

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setTokens(accessToken: string, refreshToken: string) {
  memoryAccessToken = accessToken
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens() {
  memoryAccessToken = null
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function hasStoredSession(): boolean {
  return Boolean(getAccessToken() || getRefreshToken())
}
