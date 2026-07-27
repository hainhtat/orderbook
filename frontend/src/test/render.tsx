import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { appRoutes } from '@/app/routes'
import { AuthProvider } from '@/features/auth/auth-provider'
import { ThemeProvider } from '@/theme/theme-provider'
import '@/i18n'

type RenderAppOptions = {
  initialRoute?: string
  routes?: RouteObject[]
} & Omit<RenderOptions, 'wrapper'>

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export function renderApp(ui?: ReactElement, options: RenderAppOptions = {}) {
  const { initialRoute = '/', routes = appRoutes, ...renderOptions } = options

  const router = createMemoryRouter(routes, {
    initialEntries: [initialRoute],
  })

  const view = render(
    ui ?? (
      <TestProviders>
        <RouterProvider router={router} />
      </TestProviders>
    ),
    renderOptions,
  )

  return {
    ...view,
    router,
  }
}

export function renderWithProviders(
  ui: ReactElement,
  options: Omit<RenderAppOptions, 'initialRoute'> = {},
) {
  return render(<TestProviders>{ui}</TestProviders>, options)
}
