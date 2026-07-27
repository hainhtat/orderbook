export type Product = {
  id: string;
  sku: string;
  name: string;
  priceMMK: number;
  stockQty: number;
  reservedQty: number;
  lowStockAt: number | null;
  imageUrl: string | null;
  isArchived: boolean;
  categoryId: string | null;
};

export type ListProductsParams = {
  includeArchived?: boolean;
};
