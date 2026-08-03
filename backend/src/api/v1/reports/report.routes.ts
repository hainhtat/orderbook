import { Router } from 'express';
import type { RequestHandler } from 'express';
import { validateRequest } from '../../../middleware/validate-request.js';
import { createReportController } from './report.controller.js';
import type { ReportService } from './report.service.js';
import {
  ordersExportValidators,
  paymentMethodsValidators,
  salesSummaryValidators,
  topProductsValidators,
} from './report.validators.js';

export function createReportRouter(
  reports: ReportService,
  authenticate: RequestHandler,
  tenant: RequestHandler,
): Router {
  const router = Router();
  const controller = createReportController(reports);

  router.get(
    '/sales-summary',
    authenticate,
    tenant,
    salesSummaryValidators,
    validateRequest,
    controller.salesSummary,
  );
  router.get(
    '/top-products',
    authenticate,
    tenant,
    topProductsValidators,
    validateRequest,
    controller.topProducts,
  );
  router.get(
    '/preorder-pipeline',
    authenticate,
    tenant,
    controller.preorderPipeline,
  );
  router.get('/preorder-shortages', authenticate, tenant, controller.preorderShortages);
  router.get(
    '/payment-methods',
    authenticate,
    tenant,
    paymentMethodsValidators,
    validateRequest,
    controller.paymentMethods,
  );
  router.get(
    '/orders/export',
    authenticate,
    tenant,
    ordersExportValidators,
    validateRequest,
    controller.ordersExport,
  );

  return router;
}
