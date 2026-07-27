import en from './locales/en.json' with { type: 'json' };
import my from './locales/my.json' with { type: 'json' };

export type Locale = 'en' | 'my';

const catalogs: Record<Locale, Record<string, string>> = { en, my };

export function parseLocale(header: string | undefined): Locale {
  if (!header) return 'en';
  const parts = header.split(',').map((p) => p.trim().split(';')[0]?.toLowerCase());
  for (const part of parts) {
    if (part === 'my' || part?.startsWith('my')) return 'my';
    if (part === 'en' || part?.startsWith('en')) return 'en';
  }
  return 'en';
}

export function t(locale: Locale, code: string): string {
  return catalogs[locale][code] ?? catalogs.en[code] ?? code;
}
