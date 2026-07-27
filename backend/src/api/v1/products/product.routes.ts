import { Router } from 'express';
import { param } from 'express-validator';
import type { CategoryService, ProductService } from './product.service.js';
import { createProductController } from './product.controller.js';
import {
  adjustStockValidators,
  createCategoryValidators,
  createProductValidators,
  listProductsValidators,
  updateProductValidators,
} from './product.validators.js';
import { validateRequest } from '../../../middleware/validate-request.js';
import type { RequestHandler } from 'express';

export function createProductRouter(
  products: ProductService,
  categories: CategoryService,
  authenticate: RequestHandler,
  tenant: RequestHandler,
): Router {
  const router = Router();
  const controller = createProductController(products, categories);

  router.get('/', authenticate, tenant, listProductsValidators, validateRequest, controller.list);
  router.post('/', authenticate, tenant, createProductValidators, validateRequest, controller.create);
  router.get(
    '/:id',
    authenticate,
    tenant,
    param('id').isString().notEmpty(),
    validateRequest,
    controller.get,
  );
  router.patch(
    '/:id',
    authenticate,
    tenant,
    updateProductValidators,
    validateRequest,
    controller.update,
  );
  router.delete(
    '/:id',
    authenticate,
    tenant,
    param('id').isString().notEmpty(),
    validateRequest,
    controller.archive,
  );
  router.post(
    '/:id/adjust-stock',
    authenticate,
    tenant,
    adjustStockValidators,
    validateRequest,
    controller.adjustStock,
  );

  return router;
}

export function createCategoryRouter(
  products: ProductService,
  categories: CategoryService,
  authenticate: RequestHandler,
  tenant: RequestHandler,
): Router {
  const router = Router();
  const controller = createProductController(products, categories);

  router.get('/', authenticate, tenant, controller.listCategories);
  router.post(
    '/',
    authenticate,
    tenant,
    createCategoryValidators,
    validateRequest,
    controller.createCategory,
  );

  return router;
}
