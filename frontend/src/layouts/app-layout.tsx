import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/app-header'

export function AppLayout() {
  return (
    <div className="min-h-svh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
