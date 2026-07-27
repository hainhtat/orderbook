import { Router } from 'express';
import { t } from '../../../i18n/index.js';

export function createHealthRouter(): Router {
  const router = Router();
  router.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: t(req.locale, 'HEALTH_OK'),
      timestamp: new Date().toISOString(),
    });
  });
  return router;
}
