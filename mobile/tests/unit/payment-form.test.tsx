import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PaymentFormScreen } from '@/features/orders/PaymentFormScreen';

const mockReplace = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'order-1' }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/features/orders/use-orders', () => ({
  useOrder: () => ({
    data: {
      id: 'order-1',
      balanceDueMMK: 12000,
    },
    isLoading: false,
    isError: false,
  }),
  useRecordPayment: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

jest.mock('@/components/Screen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Screen: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('@/i18n/LocaleProvider', () => ({
  useLocale: () => ({
    t: (key: string, values?: Record<string, string>) => {
      const labels: Record<string, string> = {
        'common.error': 'Something went wrong',
        'common.loading': 'Loading…',
        'orders.recordPayment': 'Record payment',
        'orders.paymentAmount': 'Amount (MMK)',
        'orders.paymentMethod': 'Payment method',
        'orders.paymentNote': 'Note (optional)',
        'orders.savePayment': 'Save payment',
        'orders.invalidPaymentAmount': 'Enter a valid whole MMK amount.',
        'orders.paymentExceedsBalance': 'Payment cannot exceed the remaining balance.',
        'orders.paymentMethods.CASH': 'Cash',
        'orders.paymentMethods.BANK_TRANSFER': 'Bank transfer',
        'orders.paymentMethods.KBZPAY_MANUAL': 'KBZPay',
        'orders.paymentMethods.WAVE_MANUAL': 'Wave Money',
        'orders.paymentMethods.OTHER': 'Other',
      };
      if (key === 'orders.balanceRemaining') return `${values?.balance} remaining`;
      return labels[key] ?? key;
    },
  }),
}));

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      surface: '#fff',
      text: '#111',
      textMuted: '#666',
      border: '#ddd',
      primary: '#06f',
      danger: '#c00',
    },
  }),
}));

describe('PaymentFormScreen', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
  });

  it('prevents an overpayment before calling the API', async () => {
    const view = await render(<PaymentFormScreen />);

    await fireEvent.changeText(view.getByTestId('payment-amount'), '12001');
    await fireEvent.press(view.getByTestId('payment-submit'));

    expect(await view.findByText('Payment cannot exceed the remaining balance.')).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('records a valid partial payment and returns to order detail', async () => {
    const view = await render(<PaymentFormScreen />);

    await fireEvent.changeText(view.getByTestId('payment-amount'), '5000');
    await fireEvent.press(view.getByText('KBZPay'));
    await fireEvent.changeText(view.getByTestId('payment-note'), 'First payment');
    await fireEvent.press(view.getByTestId('payment-submit'));

    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({
        amountMMK: 5000,
        method: 'KBZPAY_MANUAL',
        note: 'First payment',
      }),
    );
    expect(mockReplace).toHaveBeenCalledWith('/orders/order-1');
  });
});
