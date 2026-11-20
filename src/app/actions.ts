"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { newCard, review, type Grade } from "@/lib/srs";

// MVP bật 2 chế độ thẻ; recall/write bật ở Phase 4 và 9.
const MODES = ["recognize", "listen"] as const;

/** Học xong bài: tạo thẻ ôn cho mọi từ trong bài (không đụng thẻ đã có) và đánh dấu bài đã học. */
export async function completeLesson(lessonId: number) {
  const id = z.number().int().positive().parse(lessonId);
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { items: true } });
  if (!lesson) throw new Error("Không tìm thấy bài học");

  const now = new Date();
  const wordIds = lesson.items.filter((i) => i.itemType === "word").map((i) => i.itemId);
  for (const itemId of wordIds)
    for (const mode of MODES) {
      const key = { itemType_itemId_mode: { itemType: "word", itemId, mode } };
      if (await prisma.reviewCard.findUnique({ where: key })) continue;
      await prisma.reviewCard.create({ data: { itemType: "word", itemId, mode, ...(await newCard(now)) } });
    }
  if (!lesson.doneAt) await prisma.lesson.update({ where: { id }, data: { doneAt: now } });
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
        skill: card.mode === "listen" ? "listening" : "reading",
        correct: grade > 1,
        rating: grade,
        durationMs,
      },
    }),
  ]);
  return next.due.toISOString();
}
