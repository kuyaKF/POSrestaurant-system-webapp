-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "nameSnap" TEXT NOT NULL,
    "unitPriceSnap" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    "served" BOOLEAN NOT NULL DEFAULT false,
    "isTakeout" BOOLEAN NOT NULL DEFAULT false,
    "round" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("createdAt", "id", "lineTotal", "menuItemId", "nameSnap", "orderId", "quantity", "round", "served", "unitPriceSnap") SELECT "createdAt", "id", "lineTotal", "menuItemId", "nameSnap", "orderId", "quantity", "round", "served", "unitPriceSnap" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
