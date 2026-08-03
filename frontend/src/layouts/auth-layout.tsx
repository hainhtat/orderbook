import { Outlet } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ModeToggle } from '@/components/mode-toggle'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <div className="flex shrink-0 justify-end gap-2 px-4 pb-2 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
