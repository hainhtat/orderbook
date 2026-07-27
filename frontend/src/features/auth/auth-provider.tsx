import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  loginRequest,
  logoutRequest,
  registerRequest,
  verifyRequest,
} from '@/features/auth/api'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasStoredSession,
  setTokens,
} from '@/features/auth/token-storage'
import type {
  AuthContextValue,
  AuthState,
  LoginInput,
  RegisterInput,
  Shop,
} from '@/features/auth/types'
import { configureApiClient } from '@/lib/api-client'

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>({ status: 'bootstrapping' })

  const clearSession = useCallback(() => {
    clearTokens()
    setState({ status: 'anonymous' })
    queryClient.clear()
  }, [queryClient])

  const establishSession = useCallback(
    async (accessToken: string, refreshToken: string) => {
      setTokens(accessToken, refreshToken)
      const session = await verifyRequest()
      setState({
        status: 'authenticated',
        user: session.user,
        shop: session.shop ?? null,
      })
    },
    [],
  )

  const refreshSession = useCallback(async () => {
    if (!hasStoredSession()) {
      clearSession()
      return
    }

    try {
      const session = await verifyRequest()
      setState({
        status: 'authenticated',
        user: session.user,
        shop: session.shop ?? null,
      })
    } catch {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    configureApiClient({
      getAccessToken,
      getRefreshToken,
      setTokens,
      clearSession,
    })
  }, [clearSession])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input)
      await establishSession(response.accessToken, response.refreshToken)
    },
    [establishSession],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input)
      await establishSession(response.accessToken, response.refreshToken)
    },
    [establishSession],
  )

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await logoutRequest(refreshToken)
      }
    } catch {
      // Clear local session even when logout request fails.
    } finally {
      clearSession()
    }
  }, [clearSession])

  const setShop = useCallback((shop: Shop) => {
    setState((current) => {
      if (current.status !== 'authenticated') {
        return current
      }

      return {
        ...current,
        shop,
      }
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      login,
      register,
      logout,
      refreshSession,
      setShop,
    }),
    [state, login, register, logout, refreshSession, setShop],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
