export type Shop = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  address: string | null;
  allowOversell: boolean;
  preorderDepositMinPct: number | null;
  status: string;
};

export type CreateShopInput = {
  name: string;
  slug?: string;
  phone?: string;
  address?: string;
};
