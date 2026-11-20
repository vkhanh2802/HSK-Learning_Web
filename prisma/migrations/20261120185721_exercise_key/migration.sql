/*
  Warnings:

  - Added the required column `key` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "skill" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "answer" TEXT NOT NULL
);
INSERT INTO "new_Exercise" ("answer", "id", "levelId", "payload", "skill", "type") SELECT "answer", "id", "levelId", "payload", "skill", "type" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
CREATE UNIQUE INDEX "Exercise_key_key" ON "Exercise"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
