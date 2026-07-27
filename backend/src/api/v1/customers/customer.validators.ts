import { body, param, query } from 'express-validator';

export const createCustomerValidators = [
  body('name').trim().notEmpty().withMessage('REQUIRED'),
  body('phone').trim().notEmpty().withMessage('REQUIRED'),
  body('address').optional().trim(),
  body('notes').optional().trim(),
];

export const updateCustomerValidators = [
  param('id').isString().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty(),
  body('address').optional().trim(),
  body('notes').optional().trim(),
];

export const listCustomersValidators = [query('q').optional().trim()];
