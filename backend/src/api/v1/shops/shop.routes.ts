import { Router } from 'express';
import type { ShopService } from './shop.service.js';
import { createShopController } from './shop.controller.js';
import { createShopValidators, updateShopValidators } from './shop.validators.js';
import { validateRequest } from '../../../middleware/validate-request.js';
import type { RequestHandler } from 'express';

export function createShopRouter(
  shops: ShopService,
  authenticate: RequestHandler,
  tenant: RequestHandler,
): Router {
  const router = Router();
  const controller = createShopController(shops);

  router.post('/', authenticate, createShopValidators, validateRequest, controller.create);
  router.get('/current', authenticate, tenant, controller.current);
  router.patch('/current', authenticate, tenant, updateShopValidators, validateRequest, controller.update);

  return router;
}
