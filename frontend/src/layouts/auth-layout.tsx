import { Outlet } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ModeToggle } from '@/components/mode-toggle'

export function AuthLayout() {
  return (
    <div className="min-h-svh bg-muted/30">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
      <div className="flex min-h-svh items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
