import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'auth.access_token';
const REFRESH_KEY = 'auth.refresh_token';

export const tokenStorage = {
  async save(access: string, refresh?: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    if (refresh) {
      await SecureStore.setItemAsync(REFRESH_KEY, refresh);
    }
  },

  async getAccess(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },

  async getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
