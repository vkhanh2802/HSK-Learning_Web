/*
  Warnings:

  - Added the required column `key` to the `Passage` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Passage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tokens" TEXT NOT NULL,
    "translation" TEXT,
    "audioUrl" TEXT,
    "questions" TEXT NOT NULL,
    CONSTRAINT "Passage_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Passage" ("audioUrl", "id", "levelId", "questions", "title", "tokens", "type") SELECT "audioUrl", "id", "levelId", "questions", "title", "tokens", "type" FROM "Passage";
DROP TABLE "Passage";
ALTER TABLE "new_Passage" RENAME TO "Passage";
CREATE UNIQUE INDEX "Passage_key_key" ON "Passage"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
