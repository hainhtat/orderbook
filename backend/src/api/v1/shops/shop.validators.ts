import { body } from 'express-validator';

export const createShopValidators = [
  body('name').trim().notEmpty().withMessage('REQUIRED'),
  body('slug').optional().trim().isLength({ min: 2, max: 48 }),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('logoUrl').optional({ nullable: true }).isURL({ protocols: ['http', 'https'] }).trim(),
];

export const updateShopValidators = [
  body('name').optional().trim().notEmpty().withMessage('REQUIRED'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('logoUrl').optional({ nullable: true }).isURL({ protocols: ['http', 'https'] }).trim(),
  body('allowOversell').optional().isBoolean(),
  body('preorderDepositMinPct').optional().isInt({ min: 0, max: 100 }),
];
