/**
 * Open / unfulfilled pre-order statuses — demand still outstanding.
 * Excludes FULFILLED, COMPLETED, CANCELLED (and non-preorder lifecycle statuses).
 */
export const OPEN_UNFULFILLED_PREORDER_STATUSES = [
  'CONFIRMED',
  'DEPOSIT_PAID',
  'RESERVED',
  'AWAITING_STOCK',
  'READY_TO_FULFILL',
] as const;

export type OpenUnfulfilledPreorderStatus =
  (typeof OPEN_UNFULFILLED_PREORDER_STATUSES)[number];
