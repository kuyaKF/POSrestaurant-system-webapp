-- CreateTable
CREATE TABLE "Combo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComboSlot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comboId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ComboSlot_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComboSlot_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderCombo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "comboId" INTEGER NOT NULL,
    "nameSnap" TEXT NOT NULL,
    "priceSnap" INTEGER NOT NULL,
    "isTakeout" BOOLEAN NOT NULL DEFAULT false,
    "round" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderCombo_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderCombo_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "served" BOOLEAN NOT NULL DEFAULT false,
    "isTakeout" BOOLEAN NOT NULL DEFAULT false,
    "round" INTEGER NOT NULL DEFAULT 1,
    "orderComboId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_orderComboId_fkey" FOREIGN KEY ("orderComboId") REFERENCES "OrderCombo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("createdAt", "id", "isTakeout", "lineTotal", "menuItemId", "nameSnap", "orderId", "quantity", "ready", "round", "served", "unitPriceSnap") SELECT "createdAt", "id", "isTakeout", "lineTotal", "menuItemId", "nameSnap", "orderId", "quantity", "ready", "round", "served", "unitPriceSnap" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_menuItemId_idx" ON "OrderItem"("menuItemId");
CREATE INDEX "OrderItem_orderComboId_idx" ON "OrderItem"("orderComboId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ComboSlot_comboId_idx" ON "ComboSlot"("comboId");

-- CreateIndex
CREATE INDEX "OrderCombo_orderId_idx" ON "OrderCombo"("orderId");
