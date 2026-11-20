-- CreateTable
CREATE TABLE "Level" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "levelId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "doneAt" DATETIME,
    CONSTRAINT "Lesson_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Word" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hanzi" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaningVi" TEXT NOT NULL,
    "meaningEn" TEXT,
    "pos" TEXT,
    "levelId" INTEGER NOT NULL,
    "examples" TEXT NOT NULL,
    "audioUrl" TEXT,
    CONSTRAINT "Word_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Character" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "char" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "radical" TEXT,
    "strokes" INTEGER,
    "meaningVi" TEXT
);

-- CreateTable
CREATE TABLE "WordCharacter" (
    "wordId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    PRIMARY KEY ("wordId", "characterId", "position"),
    CONSTRAINT "WordCharacter_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WordCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrammarPoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "levelId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "examples" TEXT NOT NULL,
    "mistakes" TEXT,
    CONSTRAINT "GrammarPoint_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "levelId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tokens" TEXT NOT NULL,
    "audioUrl" TEXT,
    "questions" TEXT NOT NULL,
    CONSTRAINT "Passage_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lessonId" INTEGER NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "LessonItem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "levelId" INTEGER NOT NULL,
    "skill" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "answer" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ReviewCard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemType" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "fsrs" TEXT NOT NULL,
    "due" DATETIME NOT NULL,
    "suspended" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exerciseId" INTEGER,
    "cardId" INTEGER,
    "skill" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "rating" INTEGER,
    "response" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Attempt_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "ReviewCard" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MockTest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "levelId" INTEGER NOT NULL,
    "sections" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MockResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mockTestId" INTEGER NOT NULL,
    "scores" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MockResult_mockTestId_fkey" FOREIGN KEY ("mockTestId") REFERENCES "MockTest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_levelId_order_key" ON "Lesson"("levelId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Word_hanzi_key" ON "Word"("hanzi");

-- CreateIndex
CREATE UNIQUE INDEX "Character_char_key" ON "Character"("char");

-- CreateIndex
CREATE UNIQUE INDEX "LessonItem_lessonId_itemType_itemId_key" ON "LessonItem"("lessonId", "itemType", "itemId");

-- CreateIndex
CREATE INDEX "ReviewCard_due_idx" ON "ReviewCard"("due");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCard_itemType_itemId_mode_key" ON "ReviewCard"("itemType", "itemId", "mode");

-- CreateIndex
CREATE INDEX "Attempt_createdAt_idx" ON "Attempt"("createdAt");
