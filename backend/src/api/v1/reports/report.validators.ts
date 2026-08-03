import { query } from 'express-validator';

export const dateRangeValidators = [
  query('from').optional().matches(/^\d{4}-\d{2}-\d{2}$/).isISO8601({ strict: true }),
  query('to').optional().matches(/^\d{4}-\d{2}-\d{2}$/).isISO8601({ strict: true }),
];

export const salesSummaryValidators = [
  ...dateRangeValidators,
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('INVALID'),
];

export const topProductsValidators = [
  ...dateRangeValidators,
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
];

export const paymentMethodsValidators = [...dateRangeValidators];

export const ordersExportValidators = [...dateRangeValidators];
