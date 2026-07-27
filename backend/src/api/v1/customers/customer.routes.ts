import { Router } from 'express';
import { param } from 'express-validator';
import type { CustomerService } from './customer.service.js';
import { createCustomerController } from './customer.controller.js';
import {
  createCustomerValidators,
  listCustomersValidators,
  updateCustomerValidators,
} from './customer.validators.js';
import { validateRequest } from '../../../middleware/validate-request.js';
import type { RequestHandler } from 'express';

export function createCustomerRouter(
  customers: CustomerService,
  authenticate: RequestHandler,
  tenant: RequestHandler,
): Router {
  const router = Router();
  const controller = createCustomerController(customers);

  router.get('/', authenticate, tenant, listCustomersValidators, validateRequest, controller.list);
  router.post('/', authenticate, tenant, createCustomerValidators, validateRequest, controller.create);
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
    updateCustomerValidators,
    validateRequest,
    controller.update,
  );
  router.get(
    '/:id/orders',
    authenticate,
    tenant,
    param('id').isString().notEmpty(),
    validateRequest,
    controller.orders,
  );

  return router;
}
