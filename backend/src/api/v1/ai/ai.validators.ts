import { body, param } from 'express-validator';
export const aiConfigValidators = [
  body('provider').isIn(['OPENAI', 'ANTHROPIC', 'OTHER', 'DEEPSEEK']),
  body('apiKey').optional().isString().isLength({ min: 8, max: 500 }).trim(),
  body('model').optional({ nullable: true }).isString().isLength({ max: 100 }).trim(),
  body('isEnabled').isBoolean(),
];
export const aiMessageValidators = [param('id').isString().notEmpty(), body('content').isString().trim().isLength({ min: 1, max: 5000 })];
