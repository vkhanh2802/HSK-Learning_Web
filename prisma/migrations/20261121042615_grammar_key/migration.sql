/*
  Warnings:

  - Added the required column `key` to the `GrammarPoint` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GrammarPoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "levelId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "examples" TEXT NOT NULL,
    "mistakes" TEXT,
    "exercises" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "GrammarPoint_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GrammarPoint" ("examples", "explanation", "id", "levelId", "mistakes", "pattern", "title") SELECT "examples", "explanation", "id", "levelId", "mistakes", "pattern", "title" FROM "GrammarPoint";
DROP TABLE "GrammarPoint";
ALTER TABLE "new_GrammarPoint" RENAME TO "GrammarPoint";
CREATE UNIQUE INDEX "GrammarPoint_key_key" ON "GrammarPoint"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
