-- Editable order-number prefix + per-shop monotonic sequence (new orders only).
ALTER TABLE "Shop" ADD COLUMN "orderNumberPrefix" TEXT;
ALTER TABLE "Shop" ADD COLUMN "orderNumberSeq" INTEGER NOT NULL DEFAULT 0;
