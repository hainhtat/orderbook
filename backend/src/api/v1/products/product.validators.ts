import { body, param, query } from 'express-validator';

export const createProductValidators = [
  body('sku').trim().notEmpty().withMessage('REQUIRED'),
  body('name').trim().notEmpty().withMessage('REQUIRED'),
  body('priceMMK').isInt({ min: 0 }).withMessage('INVALID_AMOUNT'),
  body('stockQty').optional().isInt({ min: 0 }),
  body('lowStockAt').optional().isInt({ min: 0 }),
  body('imageUrl').optional().isURL(),
  body('categoryId').optional().isString(),
];

export const updateProductValidators = [
  param('id').isString().notEmpty(),
  body('sku').optional().trim().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('priceMMK').optional().isInt({ min: 0 }),
  body('lowStockAt').optional().isInt({ min: 0 }),
  body('imageUrl').optional({ nullable: true }).isString(),
  body('categoryId').optional({ nullable: true }).isString(),
];

export const adjustStockValidators = [
  param('id').isString().notEmpty(),
  body('deltaQty').isInt().withMessage('REQUIRED'),
  body('reason').trim().notEmpty().withMessage('REQUIRED'),
  body('note').optional().trim(),
];

export const listProductsValidators = [
  query('includeArchived').optional().isBoolean().toBoolean(),
];

export const createCategoryValidators = [
  body('name').trim().notEmpty().withMessage('REQUIRED'),
  body('sortOrder').optional().isInt(),
];
