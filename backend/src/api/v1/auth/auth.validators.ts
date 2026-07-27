import { body } from 'express-validator';

export const registerValidators = [
  body('name').trim().notEmpty().withMessage('REQUIRED'),
  body('email').trim().isEmail().withMessage('INVALID_EMAIL').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('PASSWORD_TOO_SHORT'),
];

export const loginValidators = [
  body('email').trim().isEmail().withMessage('INVALID_EMAIL').normalizeEmail(),
  body('password').notEmpty().withMessage('REQUIRED'),
];

export const refreshValidators = [
  body('refreshToken').notEmpty().withMessage('REQUIRED'),
];

export const logoutValidators = [
  body('refreshToken').optional().isString(),
];
