import Link from "next/link";
import { prisma } from "@/lib/db";
import { SKILL_NAMES, accuracyBySkill } from "@/lib/stats";
import { streak } from "@/lib/streak";

const SKILL_HREF: Record<string, string> = {
  listening: "/listening",
  speaking: "/speaking",
  reading: "/reading",
  writing: "/writing",
  grammar: "/grammar",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const since = new Date(now.getTime() - 400 * 24 * 3600_000);

  const [due, levels, learnedCards, attempts, lessonsDone, nextLesson] = await Promise.all([
    prisma.reviewCard.count({ where: { due: { lte: now }, suspended: false } }),
    prisma.level.findMany({ orderBy: { id: "asc" }, include: { _count: { select: { words: true } } } }),
    prisma.reviewCard.findMany({ where: { itemType: "word" }, distinct: ["itemId"], select: { itemId: true } }),
    prisma.attempt.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, skill: true, correct: true } }),
    prisma.lesson.findMany({ where: { doneAt: { gte: since } }, select: { doneAt: true } }),
    prisma.lesson.findFirst({ where: { doneAt: null }, orderBy: [{ levelId: "asc" }, { order: "asc" }] }),
  ]);

  // Đếm ở JS thay vì `id in [...]`: số từ đã học có thể vượt giới hạn 999 tham số của SQLite.
  const learned = new Set(learnedCards.map((c) => c.itemId));
  const learnedByLevel = new Map<number, number>();
  for (const w of await prisma.word.findMany({ select: { id: true, levelId: true } }))
    if (learned.has(w.id)) learnedByLevel.set(w.levelId, (learnedByLevel.get(w.levelId) ?? 0) + 1);
  const month = new Date(now.getTime() - 30 * 86_400_000);
  const skills = accuracyBySkill(attempts.filter((a) => a.createdAt >= month));
  const weak = skills.rows.find((r) => r.skill === skills.weakest);
  const days = streak([...attempts.map((a) => a.createdAt), ...lessonsDone.flatMap((l) => l.doneAt ?? [])], now);

  return (
    <main className="px-6 pb-16 pt-10">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl leading-tight sm:text-5xl">
          Mỗi ngày một chút,
          <br />
          <span className="relative inline-block">
            tiếng Trung tiến bộ.
            <svg aria-hidden className="absolute -bottom-3 left-0 w-full text-brush" viewBox="0 0 300 14" preserveAspectRatio="none">
              <path d="M3 9 C60 3, 130 12, 190 6 S270 4, 297 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <p className="mx-auto mt-10 max-w-md opacity-80">
          Từ vựng, ngữ pháp và đủ 4 kỹ năng Nghe, Nói, Đọc, Viết từ HSK1 đến HSK4, ôn theo lịch lặp lại ngắt quãng.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {nextLesson && (
            <Link href={`/lesson/${nextLesson.id}`} className="rounded-xl bg-accent px-6 py-3 font-semibold text-background hover:opacity-90">
              Học bài tiếp theo
            </Link>
          )}
          {due > 0 && (
            <Link href="/review" className="rounded-xl border border-border px-6 py-3 font-semibold hover:bg-muted">
              Ôn {due} thẻ đến hạn
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted p-5">
          <p className="text-sm opacity-75">Thẻ đến hạn</p>
          <p className="font-serif text-4xl">{due}</p>
          {due > 0 && (
            <Link href="/review" className="underline decoration-brush decoration-2 underline-offset-4">
              Ôn tập ngay
            </Link>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-muted p-5">
          <p className="text-sm opacity-75">Chuỗi ngày học</p>
          <p className="font-serif text-4xl">{days} ngày</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted p-5">
          <p className="text-sm opacity-75">Bài tiếp theo</p>
          {nextLesson ? (
            <Link href={`/lesson/${nextLesson.id}`} className="mt-1 block font-semibold underline decoration-brush decoration-2 underline-offset-4">
              HSK{nextLesson.levelId} · Bài {nextLesson.order}: {nextLesson.title}
            </Link>
          ) : (
            <p className="mt-1">Đã học hết các bài hiện có 🎉</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
      <p className="mt-4">
        {weak ? (
          <>
            Kỹ năng yếu nhất 30 ngày qua: <strong>{SKILL_NAMES[weak.skill]}</strong> ({Math.round(weak.rate! * 100)}% đúng) —{" "}
            <Link href={SKILL_HREF[weak.skill]} className="underline decoration-brush decoration-2 underline-offset-4">
              luyện ngay
            </Link>
            .{" "}
          </>
        ) : (
          "Làm thêm bài luyện để biết kỹ năng nào còn yếu. "
        )}
        <Link href="/stats" className="underline decoration-brush decoration-2 underline-offset-4">
          Xem thống kê
        </Link>
      </p>

      <h2 className="mt-10 text-2xl">Tiến độ từ vựng</h2>
      <ul className="mt-3 grid gap-3">
        {levels.map((l) => {
          const learned = learnedByLevel.get(l.id) ?? 0;
          const total = l._count.words;
          return (
            <li key={l.id}>
              <div className="flex justify-between text-sm">
                <Link href={`/learn/${l.id}`} className="hover:underline">
                  {l.name}
                </Link>
                <span>
                  {learned}/{total} từ
                </span>
              </div>
              <progress
                className="mt-1 h-2 w-full accent-accent"
                value={learned}
                max={total || 1}
                aria-label={`${l.name}: đã học ${learned} trên ${total} từ`}
              />
            </li>
          );
        })}
      </ul>
      </div>
    </main>
  );
}
