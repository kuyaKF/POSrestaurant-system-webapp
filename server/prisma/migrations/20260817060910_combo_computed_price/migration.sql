/*
  Warnings:

  - You are about to drop the column `price` on the `Combo` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Combo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Combo" ("createdAt", "id", "isActive", "name", "updatedAt") SELECT "createdAt", "id", "isActive", "name", "updatedAt" FROM "Combo";
DROP TABLE "Combo";
ALTER TABLE "new_Combo" RENAME TO "Combo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
