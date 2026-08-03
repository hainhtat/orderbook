export type User = {
  id: string
  name: string
  email: string
}

export type Shop = {
  id: string
  name: string
  slug: string
  phone?: string | null
  address?: string | null
  logoUrl?: string | null
  receiptFooter?: string | null
  orderNumberPrefix?: string | null
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type AuthSessionResponse = AuthTokens & {
  user: User
}

export type VerifyResponse = {
  user: User
  shop?: Shop | null
}

export type CreateShopInput = {
  name: string
  slug?: string
  phone?: string
  address?: string
  logoUrl?: string
  receiptFooter?: string
  orderNumberPrefix?: string
}

export type AuthState =
  | { status: 'bootstrapping' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User; shop: Shop | null }

export type AuthContextValue = {
  state: AuthState
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  setShop: (shop: Shop) => void
}
