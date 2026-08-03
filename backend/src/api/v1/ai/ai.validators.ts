import { body, param } from 'express-validator';
export const aiMessageValidators = [param('id').isString().notEmpty(), body('content').isString().trim().isLength({ min: 1, max: 5000 })];
