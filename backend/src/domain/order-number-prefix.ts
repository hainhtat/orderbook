/** Derive a stable order-number prefix from shop name/slug (legacy + create default). */
export function deriveOrderNumberPrefix(shop: {
  name: string;
  slug: string;
}): string {
  const namePrefix = shop.name
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const slugPrefix = shop.slug
    .toLowerCase()
    .split('-')[0]
    ?.replace(/[^a-z0-9]/g, '');
  return (namePrefix || slugPrefix || 'shop').slice(0, 12);
}

/** Resolve prefix for a new order: stored setting if set, else derive (do not persist). */
export function resolveOrderNumberPrefix(shop: {
  name: string;
  slug: string;
  orderNumberPrefix: string | null;
}): string {
  const stored = shop.orderNumberPrefix?.trim();
  if (stored) {
    return stored.slice(0, 12);
  }
  return deriveOrderNumberPrefix(shop);
}
