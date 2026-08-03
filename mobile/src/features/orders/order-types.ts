export type DeliverySnapshot = {
  customerName: string;
  customerPhone: string;
  townshipOrCity: string;
  detailedAddress: string;
  addressLabel?: string | null;
};

export const orderStatuses = ['TO_DELIVER', 'DELIVERED', 'CANCELLED'] as const;
export type StandardOrderStatus = (typeof orderStatuses)[number];
export type OrderStatus = StandardOrderStatus | string;

export const paymentMethods = [
  'COD',
  'CASH',
  'BANK_TRANSFER',
  'KBZPAY_MANUAL',
  'WAVE_MANUAL',
  'OTHER',
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export type Payment = {
  id: string;
  amountMMK: number;
  method: PaymentMethod;
  note: string | null;
  recordedBy: string;
  createdAt: string;
};

export type OrderLineItem = {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string;
  unitPriceMMK: number;
  quantity: number;
  lineTotalMMK: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  type: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  channel: string;
  channelReference: string | null;
  subtotalMMK: number;
  discountMMK: number;
  totalMMK: number;
  amountPaidMMK: number;
  balanceDueMMK: number;
  expectedFulfillAt: string | null;
  notes: string | null;
  customerName: string;
  customerPhone: string;
  townshipOrCity: string;
  detailedAddress: string;
  addressLabel: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: OrderLineItem[];
  payments: Payment[];
};

export type CreateOrderInput = {
  customerId: string;
  channel?: string;
  channelReference?: string;
  discountMMK?: number;
  notes?: string;
  delivery: DeliverySnapshot;
  lineItems: { productId: string; quantity: number }[];
};

export type UpdateOrderInput = {
  channelReference?: string | null;
  discountMMK?: number;
  notes?: string | null;
  delivery?: Partial<DeliverySnapshot>;
  lineItems?: { productId: string; quantity: number }[];
};

export type OrderListFilters = {
  search?: string;
  status?: StandardOrderStatus;
};

export type RecordPaymentInput = {
  amountMMK: number;
  method: PaymentMethod;
  note?: string;
};
