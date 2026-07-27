import { Router } from 'express';
import type { AuthService } from './auth.service.js';
import { createAuthController } from './auth.controller.js';
import {
  loginValidators,
  logoutValidators,
  refreshValidators,
  registerValidators,
} from './auth.validators.js';
import { validateRequest } from '../../../middleware/validate-request.js';
import type { RequestHandler } from 'express';

export function createAuthRouter(auth: AuthService, authenticate: RequestHandler): Router {
  const router = Router();
  const controller = createAuthController(auth);

  router.post('/register', registerValidators, validateRequest, controller.register);
  router.post('/login', loginValidators, validateRequest, controller.login);
  router.get('/verify', authenticate, controller.verify);
  router.post('/refresh', refreshValidators, validateRequest, controller.refresh);
  router.post('/logout', authenticate, logoutValidators, validateRequest, controller.logout);

  return router;
}
