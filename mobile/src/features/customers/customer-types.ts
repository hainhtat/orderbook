export type Customer = {
  id: string;
  name: string;
  phone: string;
  townshipOrCity: string | null;
  detailedAddress: string | null;
  addressLabel: string | null;
  notes: string | null;
};

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  totalMMK: number;
  amountPaidMMK: number;
  createdAt: string;
};

export type ListCustomersParams = {
  q?: string;
};

export type CreateCustomerInput = {
  name: string;
  phone: string;
  townshipOrCity?: string;
  detailedAddress?: string;
  addressLabel?: string;
  notes?: string;
};

export type UpdateCustomerInput = {
  name?: string;
  phone?: string;
  townshipOrCity?: string | null;
  detailedAddress?: string | null;
  addressLabel?: string | null;
  notes?: string;
};
