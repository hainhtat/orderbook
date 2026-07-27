import type { RouteObject } from 'react-router-dom'
import {
  AuthGuard,
  PublicOnlyGuard,
  ShopGuard,
} from '@/features/auth/auth-guard'
import { LoginPage } from '@/features/auth/login-page'
import { OnboardingGuard } from '@/features/auth/onboarding-guard'
import { RegisterPage } from '@/features/auth/register-page'
import { CustomerDetailPage } from '@/features/customers/customer-detail-page'
import { CustomersListPage } from '@/features/customers/customers-list-page'
import { ProductCreatePage } from '@/features/products/product-create-page'
import { ProductDetailPage } from '@/features/products/product-detail-page'
import { ProductsListPage } from '@/features/products/products-list-page'
import { ShopSetupPage } from '@/features/shops/shop-setup-page'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { DashboardPage } from '@/pages/dashboard-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { SettingsPage } from '@/pages/settings-page'
import { Navigate } from 'react-router-dom'

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <PublicOnlyGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/auth/login',
            element: <LoginPage />,
          },
          {
            path: '/auth/register',
            element: <RegisterPage />,
          },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <OnboardingGuard />,
        children: [
          {
            path: '/onboarding/shop',
            element: <ShopSetupPage />,
          },
        ],
      },
      {
        element: <ShopGuard />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: '/dashboard',
                element: <DashboardPage />,
              },
              {
                path: '/products',
                element: <ProductsListPage />,
              },
              {
                path: '/products/new',
                element: <ProductCreatePage />,
              },
              {
                path: '/products/:id',
                element: <ProductDetailPage />,
              },
              {
                path: '/customers',
                element: <CustomersListPage />,
              },
              {
                path: '/customers/:id',
                element: <CustomerDetailPage />,
              },
              {
                path: '/settings',
                element: <SettingsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
