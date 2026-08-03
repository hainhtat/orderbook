CREATE TABLE "CashAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shopId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "openingBalance" INTEGER NOT NULL DEFAULT 0,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CashAccount_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CashbookEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shopId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "orderId" TEXT,
  "paymentId" TEXT,
  "transferGroupId" TEXT,
  "reversesEntryId" TEXT,
  "kind" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "amountMMK" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "note" TEXT,
  "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CashbookEntry_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CashbookEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CashAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CashbookEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CashbookEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CashbookEntry_reversesEntryId_fkey" FOREIGN KEY ("reversesEntryId") REFERENCES "CashbookEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CashAccount_shopId_type_name_key" ON "CashAccount"("shopId", "type", "name");
CREATE INDEX "CashAccount_shopId_isArchived_idx" ON "CashAccount"("shopId", "isArchived");
CREATE UNIQUE INDEX "CashbookEntry_paymentId_key" ON "CashbookEntry"("paymentId");
CREATE UNIQUE INDEX "CashbookEntry_reversesEntryId_key" ON "CashbookEntry"("reversesEntryId");
CREATE INDEX "CashbookEntry_shopId_occurredAt_idx" ON "CashbookEntry"("shopId", "occurredAt");
CREATE INDEX "CashbookEntry_shopId_accountId_occurredAt_idx" ON "CashbookEntry"("shopId", "accountId", "occurredAt");
CREATE INDEX "CashbookEntry_shopId_orderId_idx" ON "CashbookEntry"("shopId", "orderId");
CREATE INDEX "CashbookEntry_transferGroupId_idx" ON "CashbookEntry"("transferGroupId");
