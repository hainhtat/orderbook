import type { PrismaClient } from '../../../generated/sqlite/index.js';
import type { Env } from '../../config/env.js';
import type { TokenService } from '../../utilities/tokens.js';
import { AuthService } from './auth/auth.service.js';
import { createAuthRouter } from './auth/auth.routes.js';
import { ShopService } from './shops/shop.service.js';
import { createShopRouter } from './shops/shop.routes.js';
import { createHealthRouter } from './health/health.routes.js';
import { CategoryService, ProductService } from './products/product.service.js';
import { createCategoryRouter, createProductRouter } from './products/product.routes.js';
import { CustomerService } from './customers/customer.service.js';
import { createCustomerRouter } from './customers/customer.routes.js';
import { OrderService } from './orders/order.service.js';
import { createOrderRouter } from './orders/order.routes.js';
import { ReportService } from './reports/report.service.js';
import { createReportRouter } from './reports/report.routes.js';
import { CashbookService } from './cashbook/cashbook.service.js';
import { createCashbookRouter } from './cashbook/cashbook.routes.js';
import { AiService } from './ai/ai.service.js';
import { createAiRouter } from './ai/ai.routes.js';
import { createAuthenticate } from '../../middleware/authenticate.js';
import { createTenantMiddleware } from '../../middleware/tenant.js';
import { Router } from 'express';

export type V1Dependencies = {
  env: Env;
  prisma: PrismaClient;
  tokens: TokenService;
};

export function createV1Router(deps: V1Dependencies): Router {
  const router = Router();
  const authenticate = createAuthenticate(deps.tokens);
  const tenant = createTenantMiddleware(deps.prisma);

  const authService = new AuthService(deps.prisma, deps.tokens);
  const shopService = new ShopService(deps.prisma);
  const productService = new ProductService(deps.prisma);
  const categoryService = new CategoryService(deps.prisma);
  const customerService = new CustomerService(deps.prisma);
  const orderService = new OrderService(deps.prisma);
  const reportService = new ReportService(deps.prisma);
  const cashbookService = new CashbookService(deps.prisma);
  const aiService = new AiService(deps.prisma, deps.env.AI_ENCRYPTION_KEY, deps.env, orderService);

  router.use('/health', createHealthRouter());
  router.use('/auth', createAuthRouter(authService, authenticate));
  router.use('/shops', createShopRouter(shopService, authenticate, tenant));
  router.use(
    '/products',
    createProductRouter(productService, categoryService, authenticate, tenant),
  );
  router.use(
    '/categories',
    createCategoryRouter(productService, categoryService, authenticate, tenant),
  );
  router.use('/customers', createCustomerRouter(customerService, authenticate, tenant));
  router.use('/orders', createOrderRouter(orderService, authenticate, tenant));
  router.use('/reports', createReportRouter(reportService, authenticate, tenant));
  router.use('/cashbook', createCashbookRouter(cashbookService, authenticate, tenant));
  router.use('/ai', createAiRouter(aiService, authenticate, tenant));

  return router;
}
