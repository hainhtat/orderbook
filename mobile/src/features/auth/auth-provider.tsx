import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  authApi,
  configureApiClient,
  isApiError,
  setLocaleGetter,
  setShopIdGetter,
  shopApi,
} from '@/api/client';
import { getApiBaseUrl } from '@/api/env';
import type {
  AuthState,
  LoginInput,
  RegisterInput,
  User,
} from '@/features/auth/auth-types';
import { tokenStorage } from '@/features/auth/token-storage';
import type { CreateShopInput, Shop } from '@/features/shop/shop-types';
import { useLocale } from '@/i18n/LocaleProvider';

type AuthContextValue = {
  state: AuthState;
  status: AuthState['status'];
  user: User | null;
  shop: Shop | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  createShop: (input: CreateShopInput) => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function verifyWithRefresh(): Promise<{ user: User; shop: Shop | null } | null> {
  const accessToken = await tokenStorage.getAccess();
  if (!accessToken) {
    return null;
  }

  try {
    return await authApi.verify(accessToken);
  } catch (error) {
    if (!isApiError(error) || error.status !== 401) {
      throw error;
    }
  }

  const refreshToken = await tokenStorage.getRefresh();
  if (!refreshToken) {
    await tokenStorage.clear();
    return null;
  }

  try {
    const tokens = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

    if (!tokens.ok) {
      await tokenStorage.clear();
      return null;
    }

    const data = (await tokens.json()) as { accessToken: string; refreshToken: string };
    await tokenStorage.save(data.accessToken, data.refreshToken);
    return authApi.verify(data.accessToken);
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const [state, setState] = useState<AuthState>({ status: 'bootstrapping' });
  const shopRef = useRef<Shop | null>(null);

  const clearSession = useCallback(async () => {
    await tokenStorage.clear();
    shopRef.current = null;
    queryClient.clear();
    setState({ status: 'anonymous' });
  }, [queryClient]);

  const setAuthenticated = useCallback((user: User, shop: Shop | null) => {
    shopRef.current = shop;
    setState({ status: 'authenticated', user, shop });
  }, []);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => tokenStorage.getAccess(),
      getRefreshToken: () => tokenStorage.getRefresh(),
      saveTokens: (access, refresh) => tokenStorage.save(access, refresh),
      clearSession,
    });
  }, [clearSession]);

  useEffect(() => {
    setLocaleGetter(() => locale);
    setShopIdGetter(() => shopRef.current?.id ?? null);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const session = await verifyWithRefresh();
        if (cancelled) {
          return;
        }
        if (session) {
          setAuthenticated(session.user, session.shop);
        } else {
          setState({ status: 'anonymous' });
        }
      } catch {
        if (!cancelled) {
          await clearSession();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearSession, setAuthenticated]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await authApi.login(input);
      await tokenStorage.save(result.accessToken, result.refreshToken);
      const verified = await authApi.verify(result.accessToken);
      setAuthenticated(verified.user, verified.shop);
      queryClient.clear();
    },
    [queryClient, setAuthenticated],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await authApi.register({
        name: input.name,
        email: input.email,
        password: input.password,
      });
      await tokenStorage.save(result.accessToken, result.refreshToken);
      const verified = await authApi.verify(result.accessToken);
      setAuthenticated(verified.user, verified.shop);
      queryClient.clear();
    },
    [queryClient, setAuthenticated],
  );

  const logout = useCallback(async () => {
    const refreshToken = await tokenStorage.getRefresh();
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Always clear local session even if logout request fails.
    }
    await clearSession();
  }, [clearSession]);

  const createShop = useCallback(
    async (input: CreateShopInput) => {
      const { shop } = await shopApi.create(input);
      const verified = await authApi.verify();
      setAuthenticated(verified.user, shop);
    },
    [setAuthenticated],
  );

  const refreshSession = useCallback(async () => {
    const verified = await authApi.verify();
    setAuthenticated(verified.user, verified.shop);
  }, [setAuthenticated]);

  const value = useMemo<AuthContextValue>(() => {
    const user = state.status === 'authenticated' ? state.user : null;
    const shop = state.status === 'authenticated' ? state.shop : null;

    return {
      state,
      status: state.status,
      user,
      shop,
      login,
      register,
      logout,
      createShop,
      refreshSession,
    };
  }, [state, login, register, logout, createShop, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
