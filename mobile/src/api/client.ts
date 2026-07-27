import { getApiBaseUrl } from '@/api/env';
import { ApiError, parseApiError } from '@/api/errors';
import type {
  AuthTokens,
  LoginInput,
  RegisterInput,
  User,
  VerifyResponse,
} from '@/features/auth/auth-types';
import type { CreateShopInput, Shop } from '@/features/shop/shop-types';

export type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  locale?: string;
  shopId?: string | null;
  skipAuth?: boolean;
  retried?: boolean;
};

type AuthHandlers = {
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  saveTokens: (access: string, refresh: string) => Promise<void>;
  clearSession: () => Promise<void>;
};

let authHandlers: AuthHandlers | null = null;
let refreshPromise: Promise<string | null> | null = null;
let localeGetter: () => string = () => 'en';
let shopIdGetter: () => string | null = () => null;

const AUTH_PATHS = ['/auth/refresh', '/auth/verify', '/auth/logout'];

function isAuthPath(path: string): boolean {
  return AUTH_PATHS.some((authPath) => path.endsWith(authPath));
}

export function configureApiClient(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

export function setLocaleGetter(getter: () => string): void {
  localeGetter = getter;
}

export function setShopIdGetter(getter: () => string | null): void {
  shopIdGetter = getter;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!authHandlers) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await authHandlers!.getRefreshToken();
      if (!refreshToken) {
        await authHandlers!.clearSession();
        return null;
      }

      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': localeGetter(),
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await authHandlers!.clearSession();
        return null;
      }

      const data = (await response.json()) as AuthTokens;
      await authHandlers!.saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    locale,
    shopId,
    skipAuth = false,
    retried = false,
  } = options;

  const headers: Record<string, string> = {
    'Accept-Language': locale ?? localeGetter(),
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const resolvedShopId = shopId ?? shopIdGetter();
  if (resolvedShopId) {
    headers['X-Shop-Id'] = resolvedShopId;
  }

  let accessToken = token;
  if (!skipAuth && accessToken === undefined && authHandlers) {
    accessToken = await authHandlers.getAccessToken();
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuth && !isAuthPath(path)) {
    if (retried) {
      await authHandlers?.clearSession();
      throw await parseApiError(response);
    }

    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw await parseApiError(response);
    }

    return apiRequest<T>(path, { ...options, token: newToken, retried: true });
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const authApi = {
  login(input: LoginInput): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    return apiRequest('/auth/login', { method: 'POST', body: input, skipAuth: true });
  },

  register(input: Omit<RegisterInput, 'confirmPassword'>): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    return apiRequest('/auth/register', { method: 'POST', body: input, skipAuth: true });
  },

  verify(token?: string): Promise<VerifyResponse> {
    return apiRequest('/auth/verify', { token, skipAuth: !token });
  },

  logout(refreshToken?: string | null): Promise<void> {
    return apiRequest('/auth/logout', {
      method: 'POST',
      body: refreshToken ? { refreshToken } : {},
    });
  },
};

export const shopApi = {
  create(input: CreateShopInput): Promise<{ shop: Shop }> {
    return apiRequest('/shops', { method: 'POST', body: input });
  },

  getCurrent(): Promise<{ shop: Shop }> {
    return apiRequest('/shops/current');
  },
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
