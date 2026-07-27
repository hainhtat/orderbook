import { resources } from './resources';

export type Locale = keyof typeof resources;

type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<(typeof resources)['en']>;

export function translate(locale: Locale, key: TranslationKey): string {
  const parts = key.split('.');
  let current: unknown = resources[locale];

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      current = resources.en;
      for (const fallbackPart of parts) {
        if (current && typeof current === 'object' && fallbackPart in current) {
          current = (current as Record<string, unknown>)[fallbackPart];
        } else {
          return key;
        }
      }
      break;
    }
  }

  return typeof current === 'string' ? current : key;
}
