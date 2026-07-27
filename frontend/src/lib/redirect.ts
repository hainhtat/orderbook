export function sanitizeRedirectPath(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return null
  }

  return value
}
