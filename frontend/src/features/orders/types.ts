export type DeliverySnapshot = {
  customerName: string;
  customerPhone: string;
  townshipOrCity: string;
  detailedAddress: string;
  addressLabel?: string | null;
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
  type: OrderType;
  status: OrderStatus;
  channel: OrderChannel;
  channelReference: string | null;
  subtotalMMK: number;
  discountMMK: number;
  totalMMK: number;
  amountPaidMMK: number;
  balanceDueMMK: number;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
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

export const orderStatuses = ['TO_CONFIRM', 'TO_DELIVER', 'DELIVERING', 'DELIVERED', 'CANCELLED'] as const;
export const preorderStatuses = ['CONFIRMED', 'DEPOSIT_PAID', 'RESERVED', 'AWAITING_STOCK', 'READY_TO_FULFILL', 'FULFILLED', 'COMPLETED', 'CANCELLED'] as const;
export type OrderStatus = (typeof orderStatuses)[number] | (typeof preorderStatuses)[number];
export const orderChannels = ['MESSENGER', 'PHONE', 'IN_PERSON', 'OTHER'] as const;
export type OrderType = 'STANDARD' | 'PREORDER';
export type OrderChannel = (typeof orderChannels)[number];
export const paymentMethods = ['COD', 'CASH', 'BANK_TRANSFER', 'KBZPAY_MANUAL', 'WAVE_MANUAL', 'OTHER'] as const;
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

export type OrderFilters = {
  page?: number;
  limit?: number;
  type?: OrderType;
  search?: string;
  status?: OrderStatus | (typeof preorderStatuses)[number];
  customerId?: string;
  channel?: (typeof orderChannels)[number];
  from?: string;
  to?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
};

export type RecordPaymentInput = {
  amountMMK: number;
  method: PaymentMethod;
  note?: string;
};

export type CollectCodInput = {
  amountMMK: number;
  settlementMethod: Exclude<PaymentMethod, 'COD'>;
  feeMMK?: number;
  note?: string;
};

export type CreateOrderInput = {
  type?: 'STANDARD' | 'PREORDER';
  expectedFulfillAt?: string | null;
  customerId?: string;
  customer?: {
    name: string;
    phone: string;
    townshipOrCity?: string;
    detailedAddress?: string;
    addressLabel?: string;
  };
  channel?: OrderChannel;
  channelReference?: string;
  discountMMK?: number;
  notes?: string;
  paymentMethod?: PaymentMethod;
  delivery: DeliverySnapshot;
  lineItems: Array<{ productId: string; quantity: number }>;
};

export type UpdateOrderInput = {
  channelReference?: string | null;
  discountMMK?: number;
  notes?: string | null;
  delivery?: Partial<DeliverySnapshot>;
  lineItems?: Array<{ productId: string; quantity: number }>;
};

export type BulkPreorderExpectedDateInput = {
  orderIds: string[];
  expectedFulfillAt: string;
};

export type OrderFormLineItem = {
  productId: string;
  quantity: string;
};

export type OrderFormValues = {
  printReceipt?: boolean;
  orderType: 'STANDARD' | 'PREORDER';
  expectedFulfillAt: string;
  customerId: string;
  quickCreateCustomer: boolean;
  channelReference: string;
  discountMMK: string;
  notes: string;
  paymentMethod: PaymentMethod | '';
  customerName: string;
  customerPhone: string;
  townshipOrCity: string;
  detailedAddress: string;
  addressLabel: string;
  lineItems: OrderFormLineItem[];
};
