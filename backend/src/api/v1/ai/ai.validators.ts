import { body, param } from 'express-validator';

const deliveryFields = [
  body('delivery.customerName').trim().notEmpty(),
  body('delivery.customerPhone').trim().notEmpty(),
  body('delivery.townshipOrCity').trim().notEmpty(),
  body('delivery.detailedAddress').trim().notEmpty(),
  body('delivery.addressLabel').optional({ nullable: true }).trim().isString(),
];

export const aiMessageValidators = [
  param('id').isString().notEmpty(),
  body('content').isString().trim().isLength({ min: 1, max: 5000 }),
  body('locale').optional().isIn(['en', 'my']),
];

export const aiStaffConfigValidators = [body('isEnabled').isBoolean()];

export const aiConfirmValidators = [
  param('id').isString().notEmpty(),
  body('customerId').custom((value, { req }) => {
    const hasCustomerId = typeof value === 'string' && value.trim() !== '';
    const customer = (req.body as { newCustomer?: { name?: string; phone?: string } }).newCustomer;
    const hasNewCustomer =
      Boolean(customer?.name?.trim()) && Boolean(customer?.phone?.trim());
    if (hasCustomerId === hasNewCustomer) {
      throw new Error('CUSTOMER_REQUIRED');
    }
    return true;
  }),
  body('newCustomer.name').optional().trim().notEmpty(),
  body('newCustomer.phone').optional().trim().notEmpty(),
  body('newCustomer.townshipOrCity').optional({ nullable: true }).trim().isString(),
  body('newCustomer.detailedAddress').optional({ nullable: true }).trim().isString(),
  body('newCustomer.addressLabel').optional({ nullable: true }).trim().isString(),
  body('type').optional().isIn(['STANDARD', 'PREORDER']),
  body('expectedFulfillAt').optional({ nullable: true }).isISO8601(),
  body('notes').optional().trim().isString(),
  body('channel').optional().isIn(['MESSENGER', 'PHONE', 'IN_PERSON', 'OTHER']),
  body('paymentMethod')
    .optional({ nullable: true })
    .isIn(['CASH', 'COD', 'BANK_TRANSFER', 'KBZPAY_MANUAL', 'WAVE_MANUAL', 'OTHER']),
  ...deliveryFields,
  body('lineItems').isArray({ min: 1 }),
  body('lineItems.*.productId').isString().notEmpty(),
  body('lineItems.*.quantity').isInt({ min: 1 }),
];
