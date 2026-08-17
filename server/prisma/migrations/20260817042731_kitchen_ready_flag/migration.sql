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
    "readyForService" BOOLEAN NOT NULL DEFAULT false,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
