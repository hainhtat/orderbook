-- Existing TO_CONFIRM standard orders have not consumed inventory yet.
-- Deduct their committed quantities before moving them to TO_DELIVER so that
-- cancellation can safely restore the same quantities.
INSERT INTO "StockAdjustment" (
  "id",
  "shopId",
  "productId",
  "deltaQty",
  "reason",
  "note",
  "actorId"
)
SELECT
  lower(hex(randomblob(12))),
  "Order"."shopId",
  "OrderLineItem"."productId",
  -SUM("OrderLineItem"."quantity"),
  'SALE',
  'Order ' || "Order"."orderNumber" || ' migrated ready for delivery',
  "Order"."createdByUserId"
FROM "OrderLineItem"
INNER JOIN "Order" ON "Order"."id" = "OrderLineItem"."orderId"
WHERE "Order"."type" = 'STANDARD'
  AND "Order"."status" = 'TO_CONFIRM'
  AND "OrderLineItem"."productId" IS NOT NULL
GROUP BY "Order"."id", "OrderLineItem"."productId";

UPDATE "Product"
SET "stockQty" = "stockQty" - COALESCE((
  SELECT SUM("OrderLineItem"."quantity")
  FROM "OrderLineItem"
  INNER JOIN "Order" ON "Order"."id" = "OrderLineItem"."orderId"
  WHERE "Order"."type" = 'STANDARD'
    AND "Order"."status" = 'TO_CONFIRM'
    AND "OrderLineItem"."productId" = "Product"."id"
), 0)
WHERE EXISTS (
  SELECT 1
  FROM "OrderLineItem"
  INNER JOIN "Order" ON "Order"."id" = "OrderLineItem"."orderId"
  WHERE "Order"."type" = 'STANDARD'
    AND "Order"."status" = 'TO_CONFIRM'
    AND "OrderLineItem"."productId" = "Product"."id"
);

UPDATE "Order"
SET "status" = 'TO_DELIVER'
WHERE "type" = 'STANDARD' AND "status" = 'TO_CONFIRM';

UPDATE "OrderStatusHistory"
SET
  "fromStatus" = CASE
    WHEN "fromStatus" = 'TO_CONFIRM' THEN 'TO_DELIVER'
    ELSE "fromStatus"
  END,
  "toStatus" = CASE
    WHEN "toStatus" = 'TO_CONFIRM' THEN 'TO_DELIVER'
    ELSE "toStatus"
  END
WHERE "orderId" IN (
  SELECT "id"
  FROM "Order"
  WHERE "type" = 'STANDARD'
);
