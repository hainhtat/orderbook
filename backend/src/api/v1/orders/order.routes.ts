import { Router } from 'express';
import type { RequestHandler } from 'express';
import { validateRequest } from '../../../middleware/validate-request.js';
import { createOrderController } from './order.controller.js';
import type { OrderService } from './order.service.js';
import {
  createOrderValidators,
  createPaymentValidators,
  listOrderValidators,
  orderIdValidator,
  transitionOrderValidators,
  updateOrderValidators,
} from './order.validators.js';

export function createOrderRouter(
  orders: OrderService,
  authenticate: RequestHandler,
  tenant: RequestHandler,
): Router {
  const router = Router();
  const controller = createOrderController(orders);

  router.get('/', authenticate, tenant, listOrderValidators, validateRequest, controller.list);
  router.post('/', authenticate, tenant, createOrderValidators, validateRequest, controller.create);
  router.get('/:id', authenticate, tenant, orderIdValidator, validateRequest, controller.get);
  router.patch(
    '/:id',
    authenticate,
    tenant,
    updateOrderValidators,
    validateRequest,
    controller.update,
  );
  router.post(
    '/:id/status',
    authenticate,
    tenant,
    transitionOrderValidators,
    validateRequest,
    controller.transition,
  );
  router.post(
    '/:id/payments',
    authenticate,
    tenant,
    createPaymentValidators,
    validateRequest,
    controller.payment,
  );
  router.get(
    '/:id/history',
    authenticate,
    tenant,
    orderIdValidator,
    validateRequest,
    controller.history,
  );

  return router;
}
