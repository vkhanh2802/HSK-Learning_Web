"use server";

import { z } from "zod";
import { matchesDictation } from "@/lib/compare";
import { prisma } from "@/lib/db";
import type { Line } from "@/lib/exercises";
import { gradeGrammar, revealGrammar, type GrammarExercise } from "@/lib/grammar";
import type { Question } from "@/lib/passages";
import { newCard, review, type Grade } from "@/lib/srs";

// Chế độ thẻ cho mỗi từ; recall (gõ pinyin/chữ) bật ở Phase 9.
const MODES = ["recognize", "listen", "write"] as const;

/** Tạo thẻ ôn cho một từ ở mọi chế độ còn thiếu; không đụng thẻ đã có. Trả về số thẻ mới tạo. */
async function createWordCards(itemId: number, now: Date) {
  let created = 0;
  for (const mode of MODES) {
    const key = { itemType_itemId_mode: { itemType: "word", itemId, mode } };
    if (await prisma.reviewCard.findUnique({ where: key })) continue;
    await prisma.reviewCard.create({ data: { itemType: "word", itemId, mode, ...(await newCard(now)) } });
    created++;
  }
  return created;
}

/** Học xong bài: tạo thẻ ôn cho mọi từ trong bài và đánh dấu bài đã học. */
export async function completeLesson(lessonId: number) {
  const id = z.number().int().positive().parse(lessonId);
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { items: true } });
  if (!lesson) throw new Error("Không tìm thấy bài học");

  const now = new Date();
  for (const i of lesson.items) if (i.itemType === "word") await createWordCards(i.itemId, now);
  if (!lesson.doneAt) await prisma.lesson.update({ where: { id }, data: { doneAt: now } });
}

/** Thêm một từ (tra trong bài đọc) vào ôn tập. Trả về số thẻ mới tạo (0 = đã có sẵn). */
export async function addWordToReview(wordId: number) {
  const id = z.number().int().positive().parse(wordId);
  if (!(await prisma.word.findUnique({ where: { id } }))) throw new Error("Không tìm thấy từ");
  return createWordCards(id, new Date());
}

const readingInput = z.object({
  passageId: z.number().int().positive(),
  question: z.number().int().min(0).max(50),
  response: z.union([z.boolean(), z.number().int().min(0).max(20)]),
});

/** Chấm một câu hỏi đọc hiểu ở server, ghi Attempt (skill reading), trả kết quả + đáp án. */
export async function submitReading(input: z.input<typeof readingInput>) {
  const { passageId, question, response } = readingInput.parse(input);
  const passage = await prisma.passage.findUnique({ where: { id: passageId } });
  const q = passage && (JSON.parse(passage.questions) as Question[])[question];
  if (!q) throw new Error("Không tìm thấy câu hỏi");

  const correct = response === q.answer;
  await prisma.attempt.create({
    data: { skill: "reading", correct, response: JSON.stringify({ passage: passage.key, question, response }) },
  });
  return { correct, answer: q.answer };
}

const reviewInput = z.object({
  cardId: z.number().int().positive(),
  grade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  durationMs: z.number().int().min(0).max(3_600_000),
});

/** Chấm một thẻ: cập nhật lịch FSRS, ghi Attempt, trả về hạn ôn tiếp theo (ISO). */
export async function reviewCard(input: z.input<typeof reviewInput>) {
  const { cardId, grade, durationMs } = reviewInput.parse(input);
  const card = await prisma.reviewCard.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Không tìm thấy thẻ");

  const next = await review(card.fsrs, grade as Grade, new Date());
  await prisma.$transaction([
    prisma.reviewCard.update({ where: { id: cardId }, data: next }),
    prisma.attempt.create({
      data: {
        cardId,
        skill: card.mode === "listen" ? "listening" : card.mode === "write" ? "writing" : "reading",
        correct: grade > 1,
        rating: grade,
        durationMs,
      },
    }),
  ]);
  return next.due.toISOString();
}

const submitInput = z.object({
  exerciseId: z.number().int().positive(),
  response: z.union([z.boolean(), z.number().int().min(0).max(20), z.string().max(200)]),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
});

/** Chấm một bài tập ở server (đáp án không gửi xuống client trước), ghi Attempt, trả kết quả. */
export async function submitExercise(input: z.input<typeof submitInput>) {
  const { exerciseId, response, durationMs } = submitInput.parse(input);
  const ex = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!ex) throw new Error("Không tìm thấy bài tập");

  const answer = JSON.parse(ex.answer) as boolean | number | null;
  const payload = JSON.parse(ex.payload) as { audio: Line[] };
  const correct =
    ex.type === "dictation"
      ? typeof response === "string" && matchesDictation(response, payload.audio[0])
      : response === answer;

  await prisma.attempt.create({
    data: { exerciseId, skill: ex.skill, correct, response: JSON.stringify(response), durationMs },
  });
  return { correct, answer };
}

const grammarInput = z.object({
  pointId: z.number().int().positive(),
  exercise: z.number().int().min(0).max(50),
  response: z.union([z.number().int().min(0).max(20), z.array(z.string().max(20)).max(30)]),
});

/** Chấm một bài tập ngữ pháp ở server, ghi Attempt (skill grammar), trả kết quả + đáp án/giải thích. */
export async function submitGrammar(input: z.input<typeof grammarInput>) {
  const { pointId, exercise, response } = grammarInput.parse(input);
  const point = await prisma.grammarPoint.findUnique({ where: { id: pointId } });
  const ex = point && (JSON.parse(point.exercises) as GrammarExercise[])[exercise];
  if (!ex) throw new Error("Không tìm thấy bài tập");

  const correct = gradeGrammar(ex, response);
  await prisma.attempt.create({
    data: { skill: "grammar", correct, response: JSON.stringify({ point: point.key, exercise, response }) },
  });
  return { correct, ...revealGrammar(ex) };
}
