import * as SecureStore from 'expo-secure-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { authApi } from '@/api/client';
import { BootstrappingScreen } from '@/components/BootstrappingScreen';
import { AuthProvider } from '@/features/auth/auth-provider';
import { tokenStorage } from '@/features/auth/token-storage';

const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;

jest.mock('@/i18n/LocaleProvider', () => ({
  useLocale: () => ({
    locale: 'en',
    setLocale: jest.fn(),
    t: (key: string) => (key === 'bootstrap.loading' ? 'Restoring your session…' : key),
  }),
}));

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      primary: '#2563eb',
      text: '#111111',
      textMuted: '#666666',
    },
    resolvedTheme: 'light',
    preference: 'light',
    setPreference: jest.fn(),
    toggleTheme: jest.fn(),
  }),
}));

describe('auth bootstrap', () => {
  const fetchMock = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function renderAuth(ui: React.ReactElement) {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows bootstrapping loading UI', async () => {
    const view = await render(<BootstrappingScreen />);
    expect(view.getByTestId('bootstrap-spinner')).toBeOnTheScreen();
    expect(view.getByText('Restoring your session…')).toBeOnTheScreen();
  });

  it('token storage saves and clears tokens', async () => {
    mockSetItemAsync.mockResolvedValue(undefined);
    mockDeleteItemAsync.mockResolvedValue(undefined);

    await tokenStorage.save('access-token', 'refresh-token');
    expect(mockSetItemAsync).toHaveBeenCalledWith('auth.access_token', 'access-token');
    expect(mockSetItemAsync).toHaveBeenCalledWith('auth.refresh_token', 'refresh-token');

    await tokenStorage.clear();
    expect(mockDeleteItemAsync).toHaveBeenCalledWith('auth.access_token');
    expect(mockDeleteItemAsync).toHaveBeenCalledWith('auth.refresh_token');
  });

  it('resolves to anonymous when no stored token exists', async () => {
    mockGetItemAsync.mockResolvedValue(null);

    function Probe() {
      const { useAuth } = require('@/features/auth/use-auth');
      const { status } = useAuth();
      return <Text>{status}</Text>;
    }

    const view = await renderAuth(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(view.getByText('anonymous')).toBeOnTheScreen();
    });
  });

  it('restores authenticated session after successful verify', async () => {
    mockGetItemAsync.mockImplementation(async (key: string) => {
      if (key === 'auth.access_token') return 'stored-access';
      if (key === 'auth.refresh_token') return 'stored-refresh';
      return null;
    });

    jest.spyOn(authApi, 'verify').mockResolvedValue({
      user: { id: 'u1', email: 'staff@example.com', name: 'Staff' },
      shop: {
        id: 's1',
        slug: 'demo',
        name: 'Demo Shop',
        phone: null,
        address: null,
        allowOversell: false,
        preorderDepositMinPct: null,
        status: 'ACTIVE',
      },
    });

    function Probe() {
      const { useAuth } = require('@/features/auth/use-auth');
      const { status, user } = useAuth();
      return (
        <View>
          <Text>{status}</Text>
          <Text>{user?.name}</Text>
        </View>
      );
    }

    const view = await renderAuth(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(view.getByText('authenticated')).toBeOnTheScreen();
      expect(view.getByText('Staff')).toBeOnTheScreen();
    });
  });
});
