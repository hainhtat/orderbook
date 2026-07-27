import { Host, ScrollView } from '@expo/ui';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  testID?: string;
};

export function Screen({ children, scroll = true, testID }: ScreenProps) {
  const { colors } = useTheme();

  const content = scroll ? (
    <View style={styles.flex}>
      <ScrollView>
        <Host style={{ padding: 20 }}>{children}</Host>
      </ScrollView>
    </View>
  ) : (
    <View style={styles.flex}>
      <Host style={{ padding: 20 }}>{children}</Host>
    </View>
  );

  return (
    <SafeAreaView
      testID={testID}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
