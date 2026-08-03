import { BookOpen, Bot, Box, ClipboardList, Ellipsis, Home, LineChart, LogOut, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-provider'
import { cn } from '@/lib/utils'
import { AssistantDialog } from '@/features/assistant/assistant-dialog'

export function AppHeader() {
  const { t } = useTranslation('common')
  const { logout, state } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  const shopName =
    state.status === 'authenticated' ? state.shop?.name : undefined

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-border bg-background/95 pt-[env(safe-area-inset-top,0px)] shadow-[0_2px_10px_rgba(15,23,42,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/75 dark:shadow-[0_2px_12px_rgba(0,0,0,0.22)]">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <span className="shrink-0 text-sm font-bold tracking-tight sm:text-base">
            {t('appName')}
          </span>
          <nav aria-label={t('navigation')} className="hidden min-w-0 items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3',
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
              to="/orders"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {t('nav.orders')}
            </NavLink>
            <NavLink
              to="/cashbook"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                )
              }
            >
              {t('nav.cashbook')}
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {t('nav.reports')}
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
          {shopName ? (
            <span className="hidden max-w-40 truncate text-sm font-medium md:inline">
              {shopName}
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
      <nav
        aria-label={t('navigation')}
        className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t bg-card/95 px-2 pt-1.5 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
      >
        {[
          ['/dashboard', Home, t('nav.dashboard')],
          ['/orders', ClipboardList, t('nav.orders')],
          ['/products', Box, t('nav.products')],
          ['/customers', Users, t('nav.customers')],
          ['/more', Ellipsis, t('nav.more')],
        ].map(([to, Icon, label]) => (
              to === '/more' ? <div key={to as string} className="relative min-w-0 flex-1"><button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)} className={cn('flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-semibold sm:text-[10px]', moreOpen ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><Icon className="h-5 w-5" /><span>{label as string}</span></button>{moreOpen ? <div className="absolute bottom-full right-0 mb-3 min-w-36 rounded-2xl border bg-card p-2 shadow-xl"><NavLink onClick={() => setMoreOpen(false)} to="/cashbook" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-accent"><BookOpen className="h-4 w-4" />{t('nav.cashbook')}</NavLink><NavLink onClick={() => setMoreOpen(false)} to="/reports" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-accent"><LineChart className="h-4 w-4" />{t('nav.reports')}</NavLink><NavLink onClick={() => setMoreOpen(false)} to="/settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-accent"><Settings className="h-4 w-4" />{t('nav.settings')}</NavLink></div> : null}</div> : <NavLink key={to as string} to={to as string} className={({ isActive }) => cn('flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-semibold sm:text-[10px]', isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><Icon className="h-5 w-5" /><span>{label as string}</span></NavLink>
        ))}
      </nav>
      <button
        type="button"
        aria-label={t('nav.assistant')}
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-[calc(var(--mobile-tab-bar)+0.75rem)] right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bottom-6 md:right-6"
      >
        <Bot className="h-6 w-6" />
      </button>
      <AssistantDialog open={assistantOpen} onOpenChange={setAssistantOpen} />
    </>
  )
}
