export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (includeArchived?: boolean, needsPreorderRestock?: boolean) =>
    [
      ...productKeys.lists(),
      {
        includeArchived: includeArchived ?? false,
        needsPreorderRestock: needsPreorderRestock ?? false,
      },
    ] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
}
