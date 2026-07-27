export function formatDeliveryClipboard(order: {
  customerName: string;
  customerPhone: string;
  townshipOrCity: string;
  detailedAddress: string;
}): string {
  return [
    order.customerName.trim(),
    order.customerPhone.trim(),
    `${order.detailedAddress.trim()}, ${order.townshipOrCity.trim()}`,
  ].join('\n');
}

export async function copyDeliveryToClipboard(order: {
  customerName: string;
  customerPhone: string;
  townshipOrCity: string;
  detailedAddress: string;
}): Promise<void> {
  await navigator.clipboard.writeText(formatDeliveryClipboard(order));
}
