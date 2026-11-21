import Link from "next/link";
import { notFound } from "next/navigation";
import { mistakeWords } from "@/app/actions";
import AddMistakes from "@/components/AddMistakes";
import { prisma } from "@/lib/db";
import type { Line } from "@/lib/exercises";
import { SKILL_VI, type SectionScore } from "@/lib/mock";
import { loadItems, type FullItem, type Response, type Section } from "@/lib/mockData";

export const dynamic = "force-dynamic";

const yesNo = (v: unknown) => (v === true ? "Đúng" : v === false ? "Sai" : "—");

/** Đổi một câu trả lời (của người làm hoặc đáp án) thành chữ để hiện. */
function show(item: FullItem, v: unknown): string {
  if (v === null || v === undefined || v === "") return "(bỏ trống)";
  if (Array.isArray(v)) return v.join("");
  if (typeof v === "boolean") return yesNo(v);
  if (typeof v === "string") return v;
  const i = v as number;
  if (item.kind === "gr") return item.ex.type === "reorder" ? "" : item.ex.options[i] ?? "?";
  if (item.kind === "pq") {
    const q = item.q;
    return q.type === "mcq" ? (q.options[i]?.hanzi ?? "?") : q.type === "picture" ? (q.options[i]?.label ?? "?") : "?";
  }
  const p = item.exercise.payload as { options?: ({ hanzi: string } | { label: string })[] };
  const o = p.options?.[i];
  return o ? ("hanzi" in o ? o.hanzi : o.label) : "?";
}

function correctAnswer(item: FullItem): string {
  if (item.kind === "gr") return item.ex.type === "reorder" ? item.ex.answers[0] : show(item, item.ex.answer);
  if (item.kind === "pq") return show(item, item.q.answer);
  const t = item.exercise.type;
  if (t === "dictation") return (item.exercise.payload as { audio: Line[] }).audio[0].hanzi;
  if (t === "reorder") return (item.answer as string[])[0];
  return show(item, item.answer);
}

function Prompt({ item }: { item: FullItem }) {
  if (item.kind === "gr") {
    const ex = item.ex;
    return (
      <p>
        {ex.type === "choose" && (
          <>
            <span lang="zh-CN">{ex.prompt.hanzi}</span> <span className="text-sm opacity-75">— {ex.prompt.vi}</span>
          </>
        )}
        {ex.type === "reorder" && <>Sắp xếp: {ex.vi}</>}
        {ex.type === "error" && (
          <>
            Chọn câu sai — <span className="opacity-75">{ex.explain}</span>
          </>
        )}
        <span className="ml-2 text-sm opacity-60">({item.title})</span>
      </p>
    );
  }
  if (item.kind === "pq") {
    const q = item.q;
    const t = q.type === "tf" ? q.statement : q.type === "mcq" ? q.question : q.sentence;
    return (
      <p>
        <span className="text-sm opacity-60">Bài đọc “{item.passage.title}”: </span>
        <span lang="zh-CN">{t.hanzi}</span> <span className="text-sm opacity-75">— {t.vi}</span>
      </p>
    );
  }
  const p = item.exercise.payload as { audio?: Line[]; question?: { hanzi: string }; sentence?: string; vi?: string };
  return (
    <div>
      {p.audio && (
        <div className="rounded bg-muted p-2 text-sm">
          {p.audio.map((l, i) => (
            <p key={i}>
              {l.speaker && <span className="mr-1 opacity-75">{l.speaker === "nam" ? "Nam:" : "Nữ:"}</span>}
              <span lang="zh-CN" className="text-base">
                {l.hanzi}
              </span>{" "}
              <span className="opacity-75">{l.pinyin}</span> — {l.vi}
            </p>
          ))}
        </div>
      )}
      {p.question && (
        <p className="mt-1" lang="zh-CN">
          {p.question.hanzi}
        </p>
      )}
      {p.sentence && <p lang="zh-CN">{p.sentence}</p>}
      {item.exercise.type === "reorder" && <p>Sắp xếp: {p.vi}</p>}
    </div>
  );
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const result = Number.isInteger(id) ? await prisma.mockResult.findUnique({ where: { id }, include: { mockTest: true } }) : null;
  if (!result) notFound();

  const level = result.mockTest.levelId;
  const scores = JSON.parse(result.scores) as { sections: SectionScore[]; total: number; max: number; pass: number; passed: boolean };
  const answers = new Map(
    (JSON.parse(result.answers) as { ref: string; response: Response | null; correct: boolean }[]).map((a) => [a.ref, a]),
  );
  const sections = JSON.parse(result.mockTest.sections) as Section[];
  const items = new Map((await loadItems(sections.flatMap((s) => s.items))).map((i) => [i.ref, i]));
  const words = await mistakeWords(id);
  let n = 0;

  return (
    <main className="p-8">
      <Link href={`/mock-test/${level}`} className="text-sm opacity-75 hover:underline">
        ← Thi thử HSK{level}
      </Link>
      <h1 className="mt-1 text-2xl font-bold">Kết quả thi thử HSK{level}</h1>
      <p className="text-sm opacity-75">{result.createdAt.toLocaleString("vi-VN")}</p>

      <div className="mt-4 flex flex-wrap gap-4">
        {scores.sections.map((s) => (
          <div key={s.skill} className="rounded border border-border p-4">
            <p className="text-sm opacity-75">{SKILL_VI[s.skill]}</p>
            <p className="text-2xl font-bold">{s.score}</p>
            <p className="text-sm opacity-75">
              {s.correct}/{s.total} câu đúng
            </p>
          </div>
        ))}
        <div className="rounded border border-border p-4">
          <p className="text-sm opacity-75">Tổng</p>
          <p className="text-2xl font-bold">
            {scores.total}/{scores.max}
          </p>
          <p className={`font-semibold ${scores.passed ? "text-green-600" : "text-accent"}`}>
            {scores.passed ? "Đỗ" : "Chưa đỗ"} (cần {scores.pass})
          </p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Từ trong các câu làm sai (chưa có trong ôn tập)</h2>
        {words.length === 0 ? (
          <p className="mt-1 opacity-75">Không có từ nào cần thêm.</p>
        ) : (
          <>
            <p lang="zh-CN" className="mt-1 text-lg">
              {words.map((w) => w.hanzi).join("、")}
            </p>
            <AddMistakes resultId={id} count={words.length} />
          </>
        )}
      </section>

      {sections.map((s) => (
        <section key={s.skill} className="mt-8">
          <h2 className="text-lg font-semibold">Phần {SKILL_VI[s.skill]}</h2>
          <ol className="mt-2 space-y-3">
            {s.items.map((ref) => {
              const item = items.get(ref);
              if (!item) return null;
              const a = answers.get(ref);
              n++;
              return (
                <li key={ref} className={`rounded border p-3 ${a?.correct ? "border-border" : "border-accent"}`}>
                  <p className="mb-1 text-sm font-semibold">
                    Câu {n} {a?.correct ? "✓" : "✗"}
                  </p>
                  <Prompt item={item} />
                  <p className="mt-1 text-sm">
                    Bạn chọn: <span lang="zh-CN">{show(item, a?.response)}</span>
                    {!a?.correct && (
                      <>
                        {" "}
                        · Đáp án: <strong lang="zh-CN">{correctAnswer(item)}</strong>
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </main>
  );
}
