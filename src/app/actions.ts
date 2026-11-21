"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { matchesDictation } from "@/lib/compare";
import { prisma } from "@/lib/db";
import { gradeExercise, type ExerciseData, type Line } from "@/lib/exercises";
import { AI_GRADING_ENABLED, GraderNotConfigured, gradeComposition } from "@/lib/grader";
import { gradeGrammar, revealGrammar, type GrammarExercise } from "@/lib/grammar";
import { BLUEPRINT, findWords, pickSection, scoreSections } from "@/lib/mock";
import { buildPool, gradeItem, itemText, loadItems, recentRefs, type Section } from "@/lib/mockData";
import type { Question } from "@/lib/passages";
import { newCard, review, type Grade } from "@/lib/srs";

// Chế độ thẻ cho mỗi từ; recall (gõ pinyin/chữ) bật ở Phase 9.
const MODES = ["recognize", "listen", "write", "recall"] as const;

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
        skill: card.mode === "listen" ? "listening" : card.mode === "write" || card.mode === "recall" ? "writing" : "reading",
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
  response: z.union([
    z.boolean(),
    z.number().int().min(0).max(20),
    z.string().max(200),
    z.array(z.string().max(20)).max(30),
  ]),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
});

/** Chấm một bài tập ở server (đáp án không gửi xuống client trước), ghi Attempt, trả kết quả. */
export async function submitExercise(input: z.input<typeof submitInput>) {
  const { exerciseId, response, durationMs } = submitInput.parse(input);
  const ex = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!ex || ex.type === "compose") throw new Error("Không tìm thấy bài tập");

  const answer = JSON.parse(ex.answer) as boolean | number | string | string[] | null;
  const payload = JSON.parse(ex.payload) as { audio?: Line[] };
  const correct = gradeExercise(ex.type as ExerciseData["type"], answer, payload, response, matchesDictation);

  await prisma.attempt.create({
    data: { exerciseId, skill: ex.skill, correct, response: JSON.stringify(response), durationMs },
  });
  return { correct, answer };
}

const writingInput = z.object({ exerciseId: z.number().int().positive(), text: z.string().trim().min(1).max(200) });

/**
 * Chấm câu tự viết (dạng compose) bằng AI. Chưa cấu hình AI thì trả `configured: false` kèm câu mẫu để tự so.
 * Đạt khi điểm ≥ 7/10.
 */
export async function gradeWriting(input: z.input<typeof writingInput>) {
  if (!AI_GRADING_ENABLED) throw new Error("Chấm bằng AI đang bị khoá");
  const { exerciseId, text } = writingInput.parse(input);
  const ex = await prisma.exercise.findUnique({ where: { id: exerciseId } });
  if (!ex || ex.type !== "compose") throw new Error("Không tìm thấy bài tập");
  const sample = JSON.parse(ex.answer) as Line;
  const { words, hint } = JSON.parse(ex.payload) as { words: string[]; hint: string };

  try {
    const result = await gradeComposition({ words, hint, sample: sample.hanzi }, text);
    await prisma.attempt.create({
      data: { exerciseId, skill: ex.skill, correct: result.score >= 7, response: JSON.stringify({ text, result }) },
    });
    return { configured: true as const, result, sample };
  } catch (e) {
    if (e instanceof GraderNotConfigured) return { configured: false as const, sample };
    throw e;
  }
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

/** Tạo đề thi thử mới cho cấp `level` rồi chuyển sang trang làm bài. */
export async function startMockTest(level: number) {
  const lv = z.number().int().min(1).max(4).parse(level);
  const spec = BLUEPRINT[lv];
  const [pool, recent] = await Promise.all([buildPool(lv), recentRefs(lv)]);
  const sections: Section[] = spec.sections.map((s) => ({
    skill: s.skill,
    minutes: s.minutes,
    items: pickSection(pool[s.skill], s.count, lv, recent, Math.random),
  }));
  const test = await prisma.mockTest.create({ data: { levelId: lv, sections: JSON.stringify(sections) } });
  redirect(`/mock-test/run/${test.id}`);
}

const mockInput = z.object({
  testId: z.number().int().positive(),
  answers: z.record(
    z.string().max(20),
    z.union([z.boolean(), z.number().int().min(0).max(20), z.string().max(200), z.array(z.string().max(20)).max(30)]),
  ),
});

/** Nộp bài thi thử: chấm ở server, lưu MockResult + Attempt cho từng câu, trả id kết quả. Mỗi đề chỉ nộp 1 lần. */
export async function submitMockTest(input: z.input<typeof mockInput>) {
  const { testId, answers } = mockInput.parse(input);
  const test = await prisma.mockTest.findUnique({ where: { id: testId }, include: { results: { select: { id: true } } } });
  if (!test) throw new Error("Không tìm thấy đề");
  if (test.results.length) return test.results[0].id;

  const sections = JSON.parse(test.sections) as Section[];
  const items = new Map((await loadItems(sections.flatMap((s) => s.items))).map((i) => [i.ref, i]));
  const graded = sections.map((s) => ({
    skill: s.skill,
    items: s.items.flatMap((ref) => {
      const item = items.get(ref);
      return item ? [{ item, response: answers[ref] ?? null, correct: gradeItem(item, answers[ref]) }] : [];
    }),
  }));
  const scores = scoreSections(
    graded.map((g) => ({ skill: g.skill, results: g.items.map((i) => i.correct) })),
    BLUEPRINT[test.levelId].pass,
  );

  const [result] = await prisma.$transaction([
    prisma.mockResult.create({
      data: {
        mockTestId: testId,
        scores: JSON.stringify(scores),
        answers: JSON.stringify(graded.flatMap((g) => g.items.map(({ item, response, correct }) => ({ ref: item.ref, response, correct })))),
      },
    }),
    prisma.attempt.createMany({
      data: graded.flatMap((g) =>
        g.items.map(({ item, response, correct }) => ({
          exerciseId: item.kind === "ex" ? item.exerciseId : null,
          skill: g.skill,
          correct,
          response: JSON.stringify({ mock: testId, ref: item.ref, response }),
        })),
      ),
    }),
  ]);
  return result.id;
}

/** Từ vựng (cấp ≤ cấp đề) xuất hiện trong các câu làm sai của một lần thi. */
export async function mistakeWords(resultId: number) {
  const result = await prisma.mockResult.findUnique({ where: { id: resultId }, include: { mockTest: true } });
  if (!result) return [];
  const wrong = (JSON.parse(result.answers) as { ref: string; correct: boolean }[]).filter((a) => !a.correct).map((a) => a.ref);
  const text = (await loadItems(wrong)).map(itemText).join(" ");
  const words = await prisma.word.findMany({ where: { levelId: { lte: result.mockTest.levelId } }, select: { id: true, hanzi: true } });
  const byHanzi = new Map(words.map((w) => [w.hanzi, w.id]));
  const found = findWords(text, new Set(byHanzi.keys())).map((hanzi) => ({ hanzi, id: byHanzi.get(hanzi)! }));
  // Chỉ giữ từ chưa có trong ôn tập.
  const carded = new Set(
    (
      await prisma.reviewCard.findMany({
        where: { itemType: "word", itemId: { in: found.map((w) => w.id) } },
        distinct: ["itemId"],
        select: { itemId: true },
      })
    ).map((c) => c.itemId),
  );
  return found.filter((w) => !carded.has(w.id));
}

/** Đưa từ trong các câu làm sai vào ôn tập. Trả về số từ có thẻ mới. */
export async function addMockMistakes(resultId: number) {
  const id = z.number().int().positive().parse(resultId);
  const now = new Date();
  let added = 0;
  for (const w of await mistakeWords(id)) if ((await createWordCards(w.id, now)) > 0) added++;
  return added;
}

const speakingInput = z.object({
  text: z.string().min(1).max(100),
  heard: z.string().max(200),
  score: z.number().min(0).max(1),
});

/** Ghi một lần luyện nói (chấm ở client bằng nhận diện giọng nói của trình duyệt): đạt khi khớp ≥ 80%. */
export async function recordSpeaking(input: z.input<typeof speakingInput>) {
  const { text, heard, score } = speakingInput.parse(input);
  await prisma.attempt.create({
    data: { skill: "speaking", correct: score >= 0.8, response: JSON.stringify({ text, heard, score }) },
  });
}
