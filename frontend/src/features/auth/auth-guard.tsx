import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-provider'
import { sanitizeRedirectPath } from '@/lib/redirect'

export function AuthGuard() {
  const { state } = useAuth()
  const location = useLocation()
  const { t } = useTranslation('common')

  if (state.status === 'bootstrapping') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  if (state.status === 'anonymous') {
    const redirect = sanitizeRedirectPath(location.pathname + location.search)
    const search = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
    return <Navigate to={`/auth/login${search}`} replace />
  }

  return <Outlet />
}

export function PublicOnlyGuard() {
  const { state } = useAuth()
  const location = useLocation()
  const { t } = useTranslation('common')

  if (state.status === 'bootstrapping') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  if (state.status === 'authenticated') {
    const params = new URLSearchParams(location.search)
    const redirect = sanitizeRedirectPath(params.get('redirect'))
    return <Navigate to={redirect ?? '/dashboard'} replace />
  }

  return <Outlet />
}

export function ShopGuard() {
  const { state } = useAuth()
  const { t } = useTranslation('common')

  if (state.status === 'bootstrapping') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  if (state.status === 'authenticated' && !state.shop) {
    return <Navigate to="/onboarding/shop" replace />
  }

  return <Outlet />
}
