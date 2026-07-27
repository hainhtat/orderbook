const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}
