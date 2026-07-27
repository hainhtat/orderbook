import { Button, Column, Text, TextInput } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/ListStates';
import { Screen } from '@/components/Screen';
import { useCustomers } from '@/features/customers/use-customers';
import { useLocale } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

export function CustomerListScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, refetch, isRefetching } = useCustomers(
    debouncedSearch ? { q: debouncedSearch } : undefined,
  );

  return (
    <Screen testID="customers-screen" scroll={false}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <Text textStyle={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
            {t('customers.title')}
          </Text>
          <Button
            testID="customers-add"
            label={t('customers.add')}
            onPress={() => router.push('/customers/new')}
          />
        </View>

        <View style={styles.search}>
          <TextInput
            testID="customers-search"
            placeholder={t('customers.searchPlaceholder')}
            defaultValue={search}
            onChangeText={setSearch}
          />
        </View>

        {isLoading ? <LoadingState testID="customers-loading" /> : null}

        {isError ? (
          <ErrorState
            testID="customers-error"
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        ) : null}

        {!isLoading && !isError && data?.length === 0 ? (
          <EmptyState
            testID="customers-empty"
            title={debouncedSearch ? t('customers.noResults') : t('customers.emptyTitle')}
            description={debouncedSearch ? undefined : t('customers.emptyDescription')}
            actionLabel={debouncedSearch ? undefined : t('customers.add')}
            onAction={debouncedSearch ? undefined : () => router.push('/customers/new')}
          />
        ) : null}

        {!isLoading && !isError && data && data.length > 0 ? (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item: customer }) => (
              <Pressable
                testID={`customer-row-${customer.id}`}
                onPress={() => router.push(`/customers/${customer.id}`)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Column spacing={4}>
                  <Text textStyle={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                    {customer.name}
                  </Text>
                  <Text textStyle={{ color: colors.textMuted, fontSize: 14 }}>{customer.phone}</Text>
                  {customer.address ? (
                    <Text textStyle={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={1}>
                      {customer.address}
                    </Text>
                  ) : null}
                </Column>
              </Pressable>
            )}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  search: {
    marginBottom: 4,
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 8,
  },
});
