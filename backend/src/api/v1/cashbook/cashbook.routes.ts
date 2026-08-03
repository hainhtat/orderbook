import { Router } from 'express';
import type { RequestHandler } from 'express';
import { validateRequest } from '../../../middleware/validate-request.js';
import { createCashbookController } from './cashbook.controller.js';
import type { CashbookService } from './cashbook.service.js';
import { createAccountValidators, createEntryValidators, dailyReportValidators, listEntryValidators, reverseValidators, summaryValidators, transferValidators } from './cashbook.validators.js';

export function createCashbookRouter(cashbook: CashbookService, authenticate: RequestHandler, tenant: RequestHandler) {
  const router = Router();
  const controller = createCashbookController(cashbook);
  router.get('/accounts', authenticate, tenant, controller.accounts);
  router.post('/accounts', authenticate, tenant, createAccountValidators, validateRequest, controller.createAccount);
  router.get('/entries', authenticate, tenant, listEntryValidators, validateRequest, controller.entries);
  router.post('/entries', authenticate, tenant, createEntryValidators, validateRequest, controller.createEntry);
  router.get('/summary', authenticate, tenant, summaryValidators, validateRequest, controller.summary);
  router.get('/daily-report', authenticate, tenant, dailyReportValidators, validateRequest, controller.dailyReport);
  router.post('/transfers', authenticate, tenant, transferValidators, validateRequest, controller.transfer);
  router.post('/entries/:id/reverse', authenticate, tenant, reverseValidators, validateRequest, controller.reverse);
  return router;
}
