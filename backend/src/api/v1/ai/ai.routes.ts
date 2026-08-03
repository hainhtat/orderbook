import { Router, type RequestHandler } from 'express';
import { validateRequest } from '../../../middleware/validate-request.js';
import { createAiController } from './ai.controller.js';
import type { AiService } from './ai.service.js';
import {
  aiConfirmValidators,
  aiMessageValidators,
  aiStaffConfigValidators,
} from './ai.validators.js';

export function createAiRouter(
  ai: AiService,
  authenticate: RequestHandler,
  tenant: RequestHandler,
) {
  const router = Router();
  const controller = createAiController(ai);

  router.get('/config', authenticate, tenant, controller.getConfig);
  router.put('/config', authenticate, tenant, aiStaffConfigValidators, validateRequest, controller.updateConfig);
  router.post('/sessions', authenticate, tenant, controller.createSession);
  router.post(
    '/sessions/:id/messages',
    authenticate,
    tenant,
    aiMessageValidators,
    validateRequest,
    controller.message,
  );
  router.post(
    '/sessions/:id/confirm',
    authenticate,
    tenant,
    aiConfirmValidators,
    validateRequest,
    controller.confirm,
  );

  return router;
}
