import { body, param, query } from 'express-validator';

const accountTypes = ['CASH', 'BANK', 'KBZPAY', 'WAVE', 'COD_CLEARING', 'OTHER'];

export const createAccountValidators = [
  body('name').trim().isLength({ min: 1, max: 80 }),
  body('type').isIn(accountTypes),
  body('openingBalance').optional().isInt(),
];

export const listEntryValidators = [
  query('accountId').optional().isString().notEmpty(),
  query('from').optional().isISO8601({ strict: true }),
  query('to').optional().isISO8601({ strict: true }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const summaryValidators = [
  query('from').optional().isISO8601({ strict: true }),
  query('to').optional().isISO8601({ strict: true }),
];

export const dailyReportValidators = [query('date').isISO8601({ strict: true })];

export const createEntryValidators = [
  body('accountId').isString().notEmpty(),
  body('direction').isIn(['IN', 'OUT']),
  body('kind').isIn(['MANUAL_INCOME', 'EXPENSE', 'ADJUSTMENT']),
  body('amountMMK').isInt({ min: 1 }),
  body('category').trim().isLength({ min: 1, max: 80 }),
  body('note').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('occurredAt').optional().isISO8601(),
];

export const transferValidators = [
  body('fromAccountId').isString().notEmpty(),
  body('toAccountId').isString().notEmpty(),
  body('amountMMK').isInt({ min: 1 }),
  body('note').optional({ nullable: true }).trim().isLength({ max: 500 }),
  body('occurredAt').optional().isISO8601(),
];

export const reverseValidators = [
  param('id').isString().notEmpty(),
  body('note').trim().isLength({ min: 1, max: 500 }),
];
