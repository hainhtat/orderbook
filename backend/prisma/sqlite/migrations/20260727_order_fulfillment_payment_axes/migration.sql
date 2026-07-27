ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT;

UPDATE "Order"
SET "status" = CASE
  WHEN "type" = 'STANDARD' AND "status" IN ('DRAFT', 'CONFIRMED') THEN 'TO_CONFIRM'
  WHEN "type" = 'STANDARD' AND "status" = 'COMPLETED' THEN 'DELIVERED'
  ELSE "status"
END;

UPDATE "OrderStatusHistory"
SET
  "fromStatus" = CASE
    WHEN "fromStatus" IN ('DRAFT', 'CONFIRMED') THEN 'TO_CONFIRM'
    WHEN "fromStatus" = 'COMPLETED' THEN 'DELIVERED'
    ELSE "fromStatus"
  END,
  "toStatus" = CASE
    WHEN "toStatus" IN ('DRAFT', 'CONFIRMED') THEN 'TO_CONFIRM'
    WHEN "toStatus" = 'COMPLETED' THEN 'DELIVERED'
    ELSE "toStatus"
  END
WHERE "orderId" IN (
  SELECT "id"
  FROM "Order"
  WHERE "type" = 'STANDARD'
);
