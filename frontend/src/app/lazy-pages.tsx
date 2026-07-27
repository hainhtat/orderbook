import { lazy } from 'react'

export const LoginPage = lazy(() =>
  import('@/features/auth/login-page').then(({ LoginPage }) => ({ default: LoginPage })),
)
export const RegisterPage = lazy(() =>
  import('@/features/auth/register-page').then(({ RegisterPage }) => ({ default: RegisterPage })),
)
export const ShopSetupPage = lazy(() =>
  import('@/features/shops/shop-setup-page').then(({ ShopSetupPage }) => ({
    default: ShopSetupPage,
  })),
)
export const DashboardPage = lazy(() =>
  import('@/pages/dashboard-page').then(({ DashboardPage }) => ({ default: DashboardPage })),
)
export const ProductsListPage = lazy(() =>
  import('@/features/products/products-list-page').then(({ ProductsListPage }) => ({
    default: ProductsListPage,
  })),
)
export const ProductCreatePage = lazy(() =>
  import('@/features/products/product-create-page').then(({ ProductCreatePage }) => ({
    default: ProductCreatePage,
  })),
)
export const ProductDetailPage = lazy(() =>
  import('@/features/products/product-detail-page').then(({ ProductDetailPage }) => ({
    default: ProductDetailPage,
  })),
)
export const CustomersListPage = lazy(() =>
  import('@/features/customers/customers-list-page').then(({ CustomersListPage }) => ({
    default: CustomersListPage,
  })),
)
export const CustomerDetailPage = lazy(() =>
  import('@/features/customers/customer-detail-page').then(({ CustomerDetailPage }) => ({
    default: CustomerDetailPage,
  })),
)
export const OrdersListPage = lazy(() =>
  import('@/features/orders/orders-list-page').then(({ OrdersListPage }) => ({
    default: OrdersListPage,
  })),
)
export const PreordersPage = lazy(() =>
  import('@/features/orders/preorders-page').then(({ PreordersPage }) => ({
    default: PreordersPage,
  })),
)
export const OrderCreatePage = lazy(() =>
  import('@/features/orders/order-create-page').then(({ OrderCreatePage }) => ({
    default: OrderCreatePage,
  })),
)
export const OrderDetailPage = lazy(() =>
  import('@/features/orders/order-detail-page').then(({ OrderDetailPage }) => ({
    default: OrderDetailPage,
  })),
)
export const SettingsPage = lazy(() =>
  import('@/pages/settings-page').then(({ SettingsPage }) => ({ default: SettingsPage })),
)
export const NotFoundPage = lazy(() =>
  import('@/pages/not-found-page').then(({ NotFoundPage }) => ({ default: NotFoundPage })),
)
