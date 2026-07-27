import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { resources } from './resources';
import { translate, type Locale, type TranslationKey } from './translate';

const LOCALE_STORAGE_KEY = 'app.locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectDeviceLocale(): Locale {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === 'my' ? 'my' : 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectDeviceLocale());

  useEffect(() => {
    let mounted = true;

    async function loadLocale() {
      try {
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (mounted && (stored === 'en' || stored === 'my')) {
          setLocaleState(stored);
        }
      } catch {
        // Keep detected locale on failure.
      }
    }

    void loadLocale();
    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string>) => {
      let value = translate(locale, key);
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          value = value.replace(`{{${paramKey}}}`, paramValue);
        }
      }
      return value;
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}

export function isSupportedLocale(value: string): value is Locale {
  return value in resources;
}
