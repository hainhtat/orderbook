import { apiRequest } from '@/lib/api-client'
import type {
  AuthSessionResponse,
  CreateShopInput,
  LoginInput,
  RegisterInput,
  Shop,
  VerifyResponse,
} from '@/features/auth/types'

export function loginRequest(input: LoginInput) {
  return apiRequest<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: input,
    auth: false,
  })
}

export function registerRequest(input: RegisterInput) {
  return apiRequest<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: input,
    auth: false,
  })
}

export function verifyRequest() {
  return apiRequest<VerifyResponse>('/auth/verify')
}

export function logoutRequest(refreshToken: string) {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  })
}

export function createShopRequest(input: CreateShopInput) {
  return apiRequest<{ shop: Shop }>('/shops', {
    method: 'POST',
    body: input,
  }).then((data) => data.shop)
}

export function getCurrentShopRequest() {
  return apiRequest<{ shop: Shop }>('/shops/current').then((data) => data.shop)
}

export function updateCurrentShopRequest(input: Partial<CreateShopInput>) {
  return apiRequest<{ shop: Shop }>('/shops/current', {
    method: 'PATCH',
    body: input,
  }).then((data) => data.shop)
}
