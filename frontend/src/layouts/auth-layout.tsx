import { Outlet } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ModeToggle } from '@/components/mode-toggle'

export function AuthLayout() {
  return (
    <div className="relative min-h-svh bg-muted/30 pt-[env(safe-area-inset-top)]">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
      <div className="flex min-h-[calc(100svh-env(safe-area-inset-top))] items-center justify-center px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
