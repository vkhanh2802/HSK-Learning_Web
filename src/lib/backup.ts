// Sao lưu / khôi phục tiến độ học (Phase 12). Dữ liệu bài học (từ, bài tập…) nằm trong data/ và seed lại được,
// nên backup chỉ chứa tiến độ. Mọi liên kết dùng khoá tự nhiên (chữ Hán, key bài tập…) thay cho id,
// để khôi phục được vào một DB mới seed (id có thể khác).
import { z } from "zod";
import { prisma } from "@/lib/db";

const date = z.coerce.date();
const cardKey = z.object({ itemType: z.literal("word"), item: z.string().min(1), mode: z.string().min(1) });

export const backupSchema = z.object({
  app: z.literal("web_chinese"),
  version: z.literal(1),
  exportedAt: date,
  lessons: z.array(z.object({ level: z.number().int(), order: z.number().int(), doneAt: date })),
  cards: z.array(cardKey.extend({ fsrs: z.string(), due: date, suspended: z.boolean() })),
  attempts: z.array(
    z.object({
      exercise: z.string().nullable(),
      card: cardKey.nullable(),
      skill: z.string(),
      correct: z.boolean(),
      rating: z.number().int().nullable(),
      response: z.string().nullable(),
      durationMs: z.number().int().nullable(),
      createdAt: date,
    }),
  ),
  mockTests: z.array(
    z.object({
      level: z.number().int(),
      sections: z.string(),
      results: z.array(z.object({ scores: z.string(), answers: z.string(), createdAt: date })),
    }),
  ),
  settings: z.array(z.object({ key: z.string(), value: z.string() })),
});
export type Backup = z.infer<typeof backupSchema>;

/** Bảng id ↔ khoá tự nhiên cho từ, bài tập, bài đọc, điểm ngữ pháp. */
async function keyMaps() {
  const [words, exercises, passages, points] = await Promise.all([
    prisma.word.findMany({ select: { id: true, hanzi: true } }),
    prisma.exercise.findMany({ select: { id: true, key: true } }),
    prisma.passage.findMany({ select: { id: true, key: true } }),
    prisma.grammarPoint.findMany({ select: { id: true, key: true } }),
  ]);
  const pair = <T extends { id: number }>(rows: T[], key: (r: T) => string) => ({
    toKey: new Map(rows.map((r) => [r.id, key(r)])),
    toId: new Map(rows.map((r) => [key(r), r.id])),
  });
  return {
    word: pair(words, (r) => r.hanzi),
    ex: pair(exercises, (r) => r.key),
    pq: pair(passages, (r) => r.key),
    gr: pair(points, (r) => r.key),
  };
}
type Maps = Awaited<ReturnType<typeof keyMaps>>;

/** Đổi ref câu thi thử "ex:12" ↔ "ex:hsk1-listening-01" (giữ phần số thứ tự câu phía sau). null nếu không tìm thấy. */
function mapRef(ref: string, maps: Maps, dir: "toKey" | "toId"): string | null {
  const [kind, id, ...rest] = ref.split(":");
  const m = (maps as Record<string, Maps["ex"]>)[kind];
  if (!m) return null;
  const v = dir === "toKey" ? m.toKey.get(Number(id)) : m.toId.get(id);
  return v === undefined ? null : [kind, v, ...rest].join(":");
}

function mapSections(json: string, maps: Maps, dir: "toKey" | "toId") {
  const sections = JSON.parse(json) as { items: string[] }[];
  return JSON.stringify(sections.map((s) => ({ ...s, items: s.items.flatMap((r) => mapRef(r, maps, dir) ?? []) })));
}
function mapAnswers(json: string, maps: Maps, dir: "toKey" | "toId") {
  const answers = JSON.parse(json) as { ref: string }[];
  return JSON.stringify(answers.flatMap((a) => (mapRef(a.ref, maps, dir) ? [{ ...a, ref: mapRef(a.ref, maps, dir) }] : [])));
}

export async function exportBackup(): Promise<Backup> {
  const maps = await keyMaps();
  const [lessons, cards, attempts, tests, settings] = await Promise.all([
    prisma.lesson.findMany({ where: { doneAt: { not: null } }, select: { levelId: true, order: true, doneAt: true } }),
    prisma.reviewCard.findMany({ where: { itemType: "word" } }),
    prisma.attempt.findMany({ orderBy: { id: "asc" } }),
    prisma.mockTest.findMany({ where: { results: { some: {} } }, include: { results: true } }),
    prisma.setting.findMany(),
  ]);
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const cardRef = (id: number | null) => {
    const c = id === null ? undefined : cardById.get(id);
    const item = c && maps.word.toKey.get(c.itemId);
    return c && item ? { itemType: "word" as const, item, mode: c.mode } : null;
  };

  return {
    app: "web_chinese",
    version: 1,
    exportedAt: new Date(),
    lessons: lessons.map((l) => ({ level: l.levelId, order: l.order, doneAt: l.doneAt! })),
    cards: cards.flatMap((c) => {
      const item = maps.word.toKey.get(c.itemId);
      return item ? [{ itemType: "word" as const, item, mode: c.mode, fsrs: c.fsrs, due: c.due, suspended: c.suspended }] : [];
    }),
    attempts: attempts.map((a) => ({
      exercise: a.exerciseId === null ? null : (maps.ex.toKey.get(a.exerciseId) ?? null),
      card: cardRef(a.cardId),
      skill: a.skill,
      correct: a.correct,
      rating: a.rating,
      response: a.response,
      durationMs: a.durationMs,
      createdAt: a.createdAt,
    })),
    mockTests: tests.map((t) => ({
      level: t.levelId,
      sections: mapSections(t.sections, maps, "toKey"),
      results: t.results.map((r) => ({ scores: r.scores, answers: mapAnswers(r.answers, maps, "toKey"), createdAt: r.createdAt })),
    })),
    settings,
  };
}

/**
 * Thay toàn bộ tiến độ hiện tại bằng nội dung backup (trong một transaction).
 * Mục trỏ tới từ/bài tập không còn trong dữ liệu hiện tại bị bỏ qua và được đếm vào `skipped`.
 */
export async function importBackup(input: unknown) {
  const b = backupSchema.parse(input);
  const maps = await keyMaps();
  const lessons = await prisma.lesson.findMany({ select: { id: true, levelId: true, order: true } });
  const lessonId = new Map(lessons.map((l) => [`${l.levelId}:${l.order}`, l.id]));
  let skipped = 0;

  return prisma.$transaction(
    async (tx) => {
      await tx.attempt.deleteMany();
      await tx.mockResult.deleteMany();
      await tx.mockTest.deleteMany();
      await tx.reviewCard.deleteMany();
      await tx.setting.deleteMany();
      await tx.lesson.updateMany({ data: { doneAt: null } });

      for (const l of b.lessons) {
        const id = lessonId.get(`${l.level}:${l.order}`);
        if (id) await tx.lesson.update({ where: { id }, data: { doneAt: l.doneAt } });
        else skipped++;
      }

      const cardIds = new Map<string, number>();
      const ck = (c: { item: string; mode: string }) => `${c.item}|${c.mode}`;
      for (const c of b.cards) {
        const itemId = maps.word.toId.get(c.item);
        if (itemId === undefined) {
          skipped++;
          continue;
        }
        const row = await tx.reviewCard.create({
          data: { itemType: "word", itemId, mode: c.mode, fsrs: c.fsrs, due: c.due, suspended: c.suspended },
        });
        cardIds.set(ck(c), row.id);
      }

      await tx.attempt.createMany({
        data: b.attempts.map((a) => ({
          exerciseId: a.exercise === null ? null : (maps.ex.toId.get(a.exercise) ?? null),
          cardId: a.card ? (cardIds.get(ck(a.card)) ?? null) : null,
          skill: a.skill,
          correct: a.correct,
          rating: a.rating,
          response: a.response,
          durationMs: a.durationMs,
          createdAt: a.createdAt,
        })),
      });

      for (const t of b.mockTests) {
        const test = await tx.mockTest.create({ data: { levelId: t.level, sections: mapSections(t.sections, maps, "toId") } });
        for (const r of t.results)
          await tx.mockResult.create({
            data: { mockTestId: test.id, scores: r.scores, answers: mapAnswers(r.answers, maps, "toId"), createdAt: r.createdAt },
          });
      }

      for (const s of b.settings) await tx.setting.create({ data: s });

      return {
        lessons: b.lessons.length,
        cards: cardIds.size,
        attempts: b.attempts.length,
        mockTests: b.mockTests.length,
        skipped,
      };
    },
    { timeout: 60_000 },
  );
}
