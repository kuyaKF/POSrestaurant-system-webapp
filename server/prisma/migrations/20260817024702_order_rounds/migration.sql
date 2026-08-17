-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tableId" INTEGER NOT NULL,
    "partySize" INTEGER NOT NULL,
    "serverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SEATED',
    "total" INTEGER NOT NULL DEFAULT 0,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "statusChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "id", "partySize", "serverId", "status", "statusChangedAt", "tableId", "total", "updatedAt") SELECT "createdAt", "id", "partySize", "serverId", "status", "statusChangedAt", "tableId", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_tableId_idx" ON "Order"("tableId");
CREATE TABLE "new_OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "nameSnap" TEXT NOT NULL,
    "unitPriceSnap" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    "served" BOOLEAN NOT NULL DEFAULT false,
    "round" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("createdAt", "id", "lineTotal", "menuItemId", "nameSnap", "orderId", "quantity", "served", "unitPriceSnap") SELECT "createdAt", "id", "lineTotal", "menuItemId", "nameSnap", "orderId", "quantity", "served", "unitPriceSnap" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
