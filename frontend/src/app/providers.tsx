import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { PwaUpdatePrompt } from '@/components/pwa-update-prompt'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'
import { AuthProvider } from '@/features/auth/auth-provider'
import { ThemeProvider } from '@/theme/theme-provider'

export function AppProviders() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <PwaUpdatePrompt />
          <div className="fixed bottom-6 left-6 z-[60] hidden md:block">
            <PwaInstallPrompt />
          </div>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
