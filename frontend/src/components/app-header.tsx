import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-provider'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { t } = useTranslation('common')
  const { logout, state } = useAuth()

  const userName =
    state.status === 'authenticated' ? state.user.name : undefined

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold tracking-tight">
            {t('appName')}
          </span>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {t('nav.dashboard')}
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {t('nav.products')}
            </NavLink>
            <NavLink
              to="/customers"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {t('nav.customers')}
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {t('nav.settings')}
            </NavLink>
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {userName ? (
            <span className="hidden text-sm text-muted-foreground md:inline">
              {userName}
            </span>
          ) : null}
          <LanguageSwitcher />
          <ModeToggle />
          <Button
            variant="outline"
            size="icon"
            aria-label={t('logout')}
            onClick={() => void logout()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
