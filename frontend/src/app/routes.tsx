import { Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import type { RouteObject } from 'react-router-dom'
import {
  CustomerDetailPage,
  CashbookPage,
  CustomersListPage,
  DashboardPage,
  LoginPage,
  NotFoundPage,
  OrderCreatePage,
  OrderDetailPage,
  OrdersListPage,
  PreordersPage,
  ProductCreatePage,
  ProductDetailPage,
  ProductsListPage,
  RegisterPage,
  ReportsPage,
  SettingsPage,
  AssistantPage,
  ShopSetupPage,
} from '@/app/lazy-pages'
import {
  AuthGuard,
  PublicOnlyGuard,
  ShopGuard,
} from '@/features/auth/auth-guard'
import { OnboardingGuard } from '@/features/auth/onboarding-guard'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function LoadingFallback() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-48 items-center justify-center" role="status" aria-live="polite">
      <span className="sr-only">{t('common.loading', { defaultValue: 'Loading…' })}</span>
      <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  )
}

function lazyElement(Page: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense
      fallback={<LoadingFallback />}
    >
      <Page />
    </Suspense>
  )
}

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
            element: lazyElement(LoginPage),
          },
          {
            path: '/auth/register',
            element: lazyElement(RegisterPage),
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
            element: lazyElement(ShopSetupPage),
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
                element: lazyElement(DashboardPage),
              },
              {
                path: '/products',
                element: lazyElement(ProductsListPage),
              },
              {
                path: '/products/new',
                element: lazyElement(ProductCreatePage),
              },
              {
                path: '/products/:id',
                element: lazyElement(ProductDetailPage),
              },
              {
                path: '/customers',
                element: lazyElement(CustomersListPage),
              },
              {
                path: '/customers/:id',
                element: lazyElement(CustomerDetailPage),
              },
              {
                path: '/orders',
                element: lazyElement(OrdersListPage),
              },
              {
                path: '/pre-orders',
                element: lazyElement(PreordersPage),
              },
              {
                path: '/reports',
                element: lazyElement(ReportsPage),
              },
              {
                path: '/cashbook',
                element: lazyElement(CashbookPage),
              },
              {
                path: '/orders/new',
                element: lazyElement(OrderCreatePage),
              },
              {
                path: '/orders/:id',
                element: lazyElement(OrderDetailPage),
              },
              {
                path: '/settings',
                element: lazyElement(SettingsPage),
              },
              { path: '/assistant', element: lazyElement(AssistantPage) },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: lazyElement(NotFoundPage),
  },
]
