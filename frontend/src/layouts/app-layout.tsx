import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/app-header'

export function AppLayout() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-background pb-0 md:pb-0">
      <AppHeader />
      <main className="mx-auto min-w-0 max-w-6xl px-4 pb-[calc(var(--mobile-tab-shell)+1.25rem)] pt-5 sm:px-6 sm:py-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}
