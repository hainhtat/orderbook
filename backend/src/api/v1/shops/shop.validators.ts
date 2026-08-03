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
  body('receiptFooter').optional({ nullable: true }).isString().isLength({ max: 200 }).trim(),
  body('allowOversell').optional().isBoolean(),
  body('preorderDepositMinPct').optional().isInt({ min: 0, max: 100 }),
  body('orderNumberPrefix')
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value === null || value === undefined) return value;
      if (typeof value !== 'string') return value;
      const normalized = value.trim().toLowerCase();
      return normalized === '' ? null : normalized;
    })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      if (typeof value !== 'string' || !/^[a-z0-9]{1,12}$/.test(value)) {
        throw new Error('INVALID');
      }
      return true;
    }),
];
