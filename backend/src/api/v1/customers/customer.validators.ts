import { body, param, query } from 'express-validator';

export const createCustomerValidators = [
  body('name').trim().notEmpty().withMessage('REQUIRED'),
  body('phone').trim().notEmpty().withMessage('REQUIRED'),
  body('townshipOrCity').optional().trim().isString(),
  body('detailedAddress').optional().trim().isString(),
  body('addressLabel').optional().trim().isString(),
  body('notes').optional().trim(),
];

export const updateCustomerValidators = [
  param('id').isString().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty(),
  body('townshipOrCity')
    .optional({ values: 'undefined' })
    .custom((value) => value === null || typeof value === 'string')
    .customSanitizer((value) => (typeof value === 'string' ? value.trim() : value)),
  body('detailedAddress')
    .optional({ values: 'undefined' })
    .custom((value) => value === null || typeof value === 'string')
    .customSanitizer((value) => (typeof value === 'string' ? value.trim() : value)),
  body('addressLabel')
    .optional({ values: 'undefined' })
    .custom((value) => value === null || typeof value === 'string')
    .customSanitizer((value) => (typeof value === 'string' ? value.trim() : value)),
  body('notes').optional().trim(),
];

export const listCustomersValidators = [
  query('q').optional().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
