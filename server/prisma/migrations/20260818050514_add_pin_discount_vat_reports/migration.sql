-- AlterTable
ALTER TABLE "Staff" ADD COLUMN "pinHash" TEXT;

-- CreateTable
CREATE TABLE "DailyReading" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "businessDate" DATETIME NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "grossSales" INTEGER NOT NULL,
    "vatableSales" INTEGER NOT NULL,
    "vatAmount" INTEGER NOT NULL,
    "vatExemptSales" INTEGER NOT NULL,
    "discountTotal" INTEGER NOT NULL,
    "netSales" INTEGER NOT NULL,
    "transactionCount" INTEGER NOT NULL,
    "cancelledCount" INTEGER NOT NULL,
    "generatedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyReading_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tableId" INTEGER,
    "orderType" TEXT NOT NULL DEFAULT 'DINE_IN',
    "partySize" INTEGER NOT NULL,
    "serverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SEATED',
    "total" INTEGER NOT NULL DEFAULT 0,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "discountType" TEXT,
    "discountIdNumber" TEXT,
    "discountName" TEXT,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "vatableSales" INTEGER NOT NULL DEFAULT 0,
    "vatExemptSales" INTEGER NOT NULL DEFAULT 0,
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "statusChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "currentRound", "id", "orderType", "partySize", "serverId", "status", "statusChangedAt", "tableId", "total", "updatedAt") SELECT "createdAt", "currentRound", "id", "orderType", "partySize", "serverId", "status", "statusChangedAt", "tableId", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_tableId_idx" ON "Order"("tableId");
CREATE INDEX "Order_statusChangedAt_idx" ON "Order"("statusChangedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DailyReading_businessDate_idx" ON "DailyReading"("businessDate");
