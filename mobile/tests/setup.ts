jest.mock('@expo/ui', () => {
  const React = require('react');
  const RN = require('react-native');

  const wrap = (Component: typeof RN.View) =>
    function Wrapper({
      children,
      testID,
      style,
    }: {
      children?: React.ReactNode;
      testID?: string;
      style?: object;
    }) {
      return React.createElement(Component, { testID, style }, children);
    };

  return {
    Host: wrap(RN.View),
    Column: wrap(RN.View),
    Row: wrap(RN.View),
    Text: ({
      children,
      textStyle,
      testID,
    }: {
      children?: string;
      textStyle?: object;
      testID?: string;
    }) => React.createElement(RN.Text, { testID, style: textStyle }, children),
    Button: ({
      label,
      onPress,
      testID,
      disabled,
    }: {
      label?: string;
      onPress?: () => void;
      testID?: string;
      disabled?: boolean;
    }) =>
      React.createElement(
        RN.Pressable,
        { testID, onPress, disabled },
        React.createElement(RN.Text, null, label),
      ),
    TextInput: (props: Record<string, unknown>) => React.createElement(RN.TextInput, props),
    Switch: ({
      value,
      onValueChange,
      testID,
    }: {
      value: boolean;
      onValueChange: (value: boolean) => void;
      testID?: string;
    }) => React.createElement(RN.Switch, { testID, value, onValueChange }),
    ScrollView: ({
      children,
      style,
    }: {
      children?: React.ReactNode;
      style?: object;
    }) => React.createElement(RN.ScrollView, { style }, children),
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({ isConnected: true })),
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
