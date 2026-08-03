import type { TranslationKey } from '@/i18n/translate';

const knownStatuses = new Set(['TO_DELIVER', 'DELIVERED', 'CANCELLED']);

export function orderStatusTranslationKey(status: string): TranslationKey {
  if (knownStatuses.has(status)) {
    return `orders.statuses.${status}` as TranslationKey;
  }
  return 'orders.statuses.TO_DELIVER';
}
