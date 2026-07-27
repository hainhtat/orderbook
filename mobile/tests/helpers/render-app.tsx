import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { LocaleProvider } from '@/i18n/LocaleProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';

type RenderAppOptions = {
  locale?: 'en' | 'my';
};

export async function renderWithProviders(ui: ReactElement, _options?: RenderAppOptions) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <LocaleProvider>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </LocaleProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
