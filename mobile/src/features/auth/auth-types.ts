import type { Shop } from '@/features/shop/shop-types';

export type User = {
  id: string;
  email: string;
  name: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type VerifyResponse = {
  user: User;
  shop: Shop | null;
};

export type AuthState =
  | { status: 'bootstrapping' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User; shop: Shop | null };
