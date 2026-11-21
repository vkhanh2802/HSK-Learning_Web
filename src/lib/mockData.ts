// Thi thử HSK: đọc kho câu từ DB, nạp câu theo ref, chấm. Chỉ dùng ở server.
import { matchesDictation } from "@/lib/compare";
import { prisma } from "@/lib/db";
import { gradeExercise, type ClientExercise, type Line } from "@/lib/exercises";
import { gradeGrammar, stripGrammarAnswers, type ClientGrammarExercise, type GrammarExercise } from "@/lib/grammar";
import type { PoolItem, Skill } from "@/lib/mock";
import { stripAnswers, type ClientQuestion, type Question, type Token } from "@/lib/passages";

export type Section = { skill: Skill; minutes: number; items: string[] };
export type Response = boolean | number | string | string[];

type Ex = ClientExercise;
export type FullItem =
  | { ref: string; kind: "ex"; exerciseId: number; exercise: Ex; answer: unknown }
  | { ref: string; kind: "pq"; passage: { id: number; title: string; lines: Token[][] }; qi: number; q: Question }
  | { ref: string; kind: "gr"; pointId: number; title: string; ex: GrammarExercise };

export type ClientMockItem =
  | { ref: string; kind: "ex"; exercise: Ex }
  | { ref: string; kind: "pq"; passage: { id: number; title: string; lines: Token[][] }; qi: number; q: ClientQuestion }
  | { ref: string; kind: "gr"; ex: ClientGrammarExercise };

const LISTEN_ORDER = ["picture_tf", "picture_mcq", "mcq", "dictation"];

/** Kho câu cho đề cấp `level`: lấy từ cấp đó và các cấp dưới (đề HSK bao gồm kiến thức cấp dưới). */
export async function buildPool(level: number): Promise<Record<Skill, PoolItem[]>> {
  const [exercises, points, passages] = await Promise.all([
    prisma.exercise.findMany({ where: { levelId: { lte: level } }, select: { id: true, levelId: true, skill: true, type: true } }),
    prisma.grammarPoint.findMany({ where: { levelId: { lte: level } }, select: { id: true, levelId: true, exercises: true } }),
    prisma.passage.findMany({ where: { levelId: { lte: level } }, select: { id: true, levelId: true, questions: true } }),
  ]);
  const grammar = points.flatMap((p) =>
    (JSON.parse(p.exercises) as GrammarExercise[]).map((ex, i) => ({ ref: `gr:${p.id}:${i}`, level: p.levelId, type: ex.type })),
  );

  return {
    listening: exercises
      .filter((e) => e.skill === "listening")
      .map((e) => ({ ref: `ex:${e.id}`, level: e.levelId, order: LISTEN_ORDER.indexOf(e.type) })),
    reading: [
      ...grammar.filter((g) => g.type !== "reorder").map((g) => ({ ref: g.ref, level: g.level, order: g.type === "choose" ? 0 : 1 })),
      ...passages.flatMap((p) =>
        (JSON.parse(p.questions) as Question[]).map((_, qi) => ({ ref: `pq:${p.id}:${qi}`, level: p.levelId, order: 2, group: `p:${p.id}` })),
      ),
    ],
    writing: [
      // Đặt câu (compose) cần AI chấm — đang khoá — nên chưa đưa vào đề.
      ...exercises
        .filter((e) => e.skill === "writing" && e.type !== "compose")
        .map((e) => ({ ref: `ex:${e.id}`, level: e.levelId, order: e.type === "fill" ? 0 : 1 })),
      ...grammar.filter((g) => g.type === "reorder").map((g) => ({ ref: g.ref, level: g.level, order: 1 })),
    ],
  };
}

/** Câu đã ra trong 3 đề gần nhất (đã nộp) của cấp này — đề mới ưu tiên tránh. */
export async function recentRefs(level: number): Promise<Set<string>> {
  const tests = await prisma.mockTest.findMany({
    where: { levelId: level, results: { some: {} } },
    orderBy: { id: "desc" },
    take: 3,
    select: { sections: true },
  });
  return new Set(tests.flatMap((t) => (JSON.parse(t.sections) as Section[]).flatMap((s) => s.items)));
}

/** Nạp đầy đủ (kèm đáp án) các câu theo ref; giữ thứ tự, bỏ ref không còn tồn tại. */
export async function loadItems(refs: string[]): Promise<FullItem[]> {
  const ids = (prefix: string) => [...new Set(refs.filter((r) => r.startsWith(prefix)).map((r) => Number(r.split(":")[1])))];
  const [exercises, passages, points] = await Promise.all([
    prisma.exercise.findMany({ where: { id: { in: ids("ex:") } } }),
    prisma.passage.findMany({ where: { id: { in: ids("pq:") } } }),
    prisma.grammarPoint.findMany({ where: { id: { in: ids("gr:") } } }),
  ]);
  const exById = new Map(exercises.map((e) => [e.id, e]));
  const pById = new Map(passages.map((p) => [p.id, p]));
  const gById = new Map(points.map((g) => [g.id, g]));

  return refs.flatMap((ref): FullItem[] => {
    const [kind, a, b] = ref.split(":");
    const id = Number(a);
    if (kind === "ex") {
      const e = exById.get(id);
      if (!e) return [];
      const exercise = { id: e.id, type: e.type, payload: JSON.parse(e.payload) } as Ex;
      return [{ ref, kind, exerciseId: e.id, exercise, answer: JSON.parse(e.answer) }];
    }
    if (kind === "pq") {
      const p = pById.get(id);
      const q = p && (JSON.parse(p.questions) as Question[])[Number(b)];
      if (!p || !q) return [];
      const passage = { id: p.id, title: p.title, lines: JSON.parse(p.tokens) as Token[][] };
      return [{ ref, kind, passage, qi: Number(b), q }];
    }
    if (kind === "gr") {
      const g = gById.get(id);
      const ex = g && (JSON.parse(g.exercises) as GrammarExercise[])[Number(b)];
      if (!g || !ex) return [];
      return [{ ref, kind, pointId: g.id, title: g.title, ex }];
    }
    return [];
  });
}

/** Bỏ đáp án trước khi gửi xuống client. */
export function toClient(item: FullItem): ClientMockItem {
  if (item.kind === "ex") return { ref: item.ref, kind: "ex", exercise: item.exercise };
  if (item.kind === "pq") {
    const { id, title, lines } = item.passage;
    return { ref: item.ref, kind: "pq", passage: { id, title, lines }, qi: item.qi, q: stripAnswers([item.q])[0] };
  }
  return { ref: item.ref, kind: "gr", ex: stripGrammarAnswers([item.ex])[0] };
}

export function gradeItem(item: FullItem, response: Response | undefined): boolean {
  if (response === undefined) return false;
  if (item.kind === "ex") {
    const payload = item.exercise.payload as { audio?: Line[] };
    return gradeExercise(item.exercise.type, item.answer, payload, response, matchesDictation);
  }
  if (item.kind === "pq") return response === item.q.answer;
  if (typeof response !== "number" && !Array.isArray(response)) return false;
  return gradeGrammar(item.ex, response);
}

/** Chữ Hán của câu (đã điền đáp án đúng) — để tìm từ vựng đưa vào ôn tập khi làm sai. */
export function itemText(item: FullItem): string {
  if (item.kind === "ex") {
    const p = item.exercise.payload as Record<string, unknown>;
    const parts: string[] = [];
    for (const l of (p.audio as Line[] | undefined) ?? []) parts.push(l.hanzi);
    if (item.exercise.type === "mcq") {
      const { question, options } = p as { question: { hanzi: string }; options: { hanzi: string }[] };
      parts.push(question.hanzi, options[item.answer as number].hanzi);
    }
    if (item.exercise.type === "fill") parts.push((p.sentence as string).replace("___", item.answer as string));
    if (item.exercise.type === "reorder") parts.push((item.answer as string[])[0]);
    return parts.join(" ");
  }
  if (item.kind === "pq") {
    const q = item.q;
    if (q.type === "tf") return q.statement.hanzi;
    if (q.type === "mcq") return `${q.question.hanzi} ${q.options[q.answer].hanzi}`;
    return q.sentence.hanzi;
  }
  const ex = item.ex;
  if (ex.type === "choose") return ex.prompt.hanzi.replace("___", ex.options[ex.answer]);
  if (ex.type === "reorder") return ex.answers[0];
  return ex.options.join(" ");
}
