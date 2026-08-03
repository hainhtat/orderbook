import type { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import type { CategoryService, ProductService } from './product.service.js';

export function createProductController(products: ProductService, categories: CategoryService) {
  return {
    list: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { includeArchived, q, categoryId, lowStock, needsPreorderRestock, page, limit } =
          matchedData(req) as {
            includeArchived?: boolean;
            q?: string;
            categoryId?: string;
            lowStock?: boolean;
            needsPreorderRestock?: boolean;
            page?: number;
            limit?: number;
          };
        const items = await products.list(req.shop!.shopId, {
          includeArchived,
          search: q,
          categoryId,
          lowStock,
          needsPreorderRestock,
          page,
          limit,
        });
        res.json({ products: items.items, pagination: items.pagination });
      } catch (e) {
        next(e);
      }
    },

    get: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = matchedData(req) as { id: string };
        const product = await products.get(req.shop!.shopId, id);
        res.json({ product });
      } catch (e) {
        next(e);
      }
    },

    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = matchedData(req) as Parameters<ProductService['create']>[1];
        const product = await products.create(req.shop!.shopId, data);
        res.status(201).json({ product });
      } catch (e) {
        next(e);
      }
    },

    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, ...data } = matchedData(req) as { id: string } & Parameters<
          ProductService['update']
        >[2];
        const product = await products.update(req.shop!.shopId, id, data);
        res.json({ product });
      } catch (e) {
        next(e);
      }
    },

    archive: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = matchedData(req) as { id: string };
        const product = await products.archive(req.shop!.shopId, id);
        res.json({ product });
      } catch (e) {
        next(e);
      }
    },

    adjustStock: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, ...data } = matchedData(req) as { id: string } & Parameters<
          ProductService['adjustStock']
        >[3];
        const product = await products.adjustStock(
          req.shop!.shopId,
          id,
          req.user!.userId,
          data,
        );
        res.json({ product });
      } catch (e) {
        next(e);
      }
    },

    listCategories: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const items = await categories.list(req.shop!.shopId);
        res.json({ categories: items });
      } catch (e) {
        next(e);
      }
    },

    createCategory: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = matchedData(req) as Parameters<CategoryService['create']>[1];
        const category = await categories.create(req.shop!.shopId, data);
        res.status(201).json({ category });
      } catch (e) {
        next(e);
      }
    },

    updateCategory: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id, ...data } = matchedData(req) as { id: string } & Parameters<
          CategoryService['update']
        >[2];
        const category = await categories.update(req.shop!.shopId, id, data);
        res.json({ category });
      } catch (e) {
        next(e);
      }
    },

    deleteCategory: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = matchedData(req) as { id: string };
        await categories.delete(req.shop!.shopId, id);
        res.status(204).send();
      } catch (e) {
        next(e);
      }
    },
  };
}
