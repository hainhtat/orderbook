export function formatMMK(amount: number): string {
  return `${new Intl.NumberFormat('en-US').format(amount)} MMK`
}

export function isLowStock(
  stockQty: number,
  lowStockAt: number | null,
): boolean {
  return lowStockAt !== null && stockQty <= lowStockAt
}
