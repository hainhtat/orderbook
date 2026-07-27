import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-provider'

export function OnboardingGuard() {
  const { state } = useAuth()
  const { t } = useTranslation('common')

  if (state.status === 'bootstrapping') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    )
  }

  if (state.status === 'authenticated' && state.shop) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
