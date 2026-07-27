import { body, param, query } from 'express-validator';

const orderChannels = ['MESSENGER', 'PHONE', 'IN_PERSON', 'OTHER'];
const orderStatuses = [
  'TO_CONFIRM',
  'TO_DELIVER',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
  'CONFIRMED',
  'DEPOSIT_PAID',
  'RESERVED',
  'AWAITING_STOCK',
  'READY_TO_FULFILL',
  'FULFILLED',
  'COMPLETED',
];
const paymentMethods = [
  'CASH',
  'COD',
  'BANK_TRANSFER',
  'KBZPAY_MANUAL',
  'WAVE_MANUAL',
  'OTHER',
];

const deliveryFields = [
  body('delivery.customerName').trim().notEmpty().withMessage('REQUIRED'),
  body('delivery.customerPhone').trim().notEmpty().withMessage('REQUIRED'),
  body('delivery.townshipOrCity').trim().notEmpty().withMessage('REQUIRED'),
  body('delivery.detailedAddress').trim().notEmpty().withMessage('REQUIRED'),
  body('delivery.addressLabel').optional({ nullable: true }).trim().isString(),
];

export const createOrderValidators = [
  body('customerId').custom((value, { req }) => {
    const hasCustomerId = typeof value === 'string' && value.trim() !== '';
    const requestBody = req.body as Record<string, unknown>;
    const customer = requestBody.customer as Record<string, unknown> | undefined;
    const hasQuickCustomer =
      customer &&
      typeof customer.name === 'string' &&
      customer.name.trim() !== '' &&
      typeof customer.phone === 'string' &&
      customer.phone.trim() !== '';
    if (hasCustomerId === hasQuickCustomer) {
      throw new Error('CUSTOMER_REQUIRED');
    }
    return true;
  }),
  body('type').optional().isIn(['STANDARD', 'PREORDER']),
  body('paymentMethod').optional({ nullable: true }).isIn(paymentMethods),
  body('expectedFulfillAt').optional({ nullable: true }).isISO8601(),
  body('customer.name').optional().trim().notEmpty(),
  body('customer.phone').optional().trim().notEmpty(),
  body('customer.townshipOrCity').optional({ nullable: true }).trim().isString(),
  body('customer.detailedAddress').optional({ nullable: true }).trim().isString(),
  body('customer.addressLabel').optional({ nullable: true }).trim().isString(),
  body('customer.notes').optional({ nullable: true }).trim().isString(),
  body('channel').optional().isIn(orderChannels),
  body('channelReference').optional({ nullable: true }).trim().isString(),
  body('discountMMK').optional().isInt({ min: 0 }),
  body('notes').optional().trim().isString(),
  ...deliveryFields,
  body('lineItems').isArray({ min: 1 }),
  body('lineItems.*.productId').isString().notEmpty(),
  body('lineItems.*.quantity').isInt({ min: 1 }),
];

export const updateOrderValidators = [
  param('id').isString().notEmpty(),
  body('channelReference').optional({ nullable: true }).trim().isString(),
  body('discountMMK').optional().isInt({ min: 0 }),
  body('notes').optional({ nullable: true }).trim().isString(),
  body('delivery.customerName').optional().trim().notEmpty(),
  body('delivery.customerPhone').optional().trim().notEmpty(),
  body('delivery.townshipOrCity').optional().trim().notEmpty(),
  body('delivery.detailedAddress').optional().trim().notEmpty(),
  body('delivery.addressLabel').optional({ nullable: true }).trim().isString(),
  body('lineItems').optional().isArray({ min: 1 }),
  body('lineItems.*.productId').optional().isString().notEmpty(),
  body('lineItems.*.quantity').optional().isInt({ min: 1 }),
];

export const orderIdValidator = [param('id').isString().notEmpty()];

export const listOrderValidators = [
  query('status').optional().isIn(orderStatuses),
  query('paymentMethod').optional().isIn(paymentMethods),
  query('paymentStatus').optional().isIn(['UNPAID', 'PARTIALLY_PAID', 'PAID']),
  query('customerId').optional().isString().notEmpty(),
  query('channel').optional().isIn(orderChannels),
  query('type').optional().isIn(['STANDARD', 'PREORDER']),
  query('preorderOnly').optional().isBoolean().toBoolean(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('search').optional().trim().isLength({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const transitionOrderValidators = [
  param('id').isString().notEmpty(),
  body('status').isIn(orderStatuses),
  body('note').optional({ nullable: true }).trim().isString(),
];

export const createPaymentValidators = [
  param('id').isString().notEmpty(),
  body('amountMMK').isInt({ min: 1 }),
  body('method').isIn(paymentMethods),
  body('note').optional({ nullable: true }).trim().isString(),
];
