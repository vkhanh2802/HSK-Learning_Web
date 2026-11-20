import Link from "next/link";
import { prisma } from "@/lib/db";
import { streak } from "@/lib/streak";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const since = new Date(now.getTime() - 400 * 24 * 3600_000);

  const [due, levels, learnedCards, attempts, lessonsDone, nextLesson] = await Promise.all([
    prisma.reviewCard.count({ where: { due: { lte: now }, suspended: false } }),
    prisma.level.findMany({ orderBy: { id: "asc" }, include: { _count: { select: { words: true } } } }),
    prisma.reviewCard.findMany({ where: { itemType: "word" }, distinct: ["itemId"], select: { itemId: true } }),
    prisma.attempt.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.lesson.findMany({ where: { doneAt: { gte: since } }, select: { doneAt: true } }),
    prisma.lesson.findFirst({ where: { doneAt: null }, orderBy: [{ levelId: "asc" }, { order: "asc" }] }),
  ]);

  const learnedByLevel = new Map(
    (
      await prisma.word.groupBy({
        by: ["levelId"],
        where: { id: { in: learnedCards.map((c) => c.itemId) } },
        _count: true,
      })
    ).map((g) => [g.levelId, g._count]),
  );
  const days = streak([...attempts.map((a) => a.createdAt), ...lessonsDone.flatMap((l) => l.doneAt ?? [])], now);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Hôm nay</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-border p-4">
          <p className="text-sm opacity-75">Thẻ đến hạn</p>
          <p className="text-3xl font-bold">{due}</p>
          {due > 0 && (
            <Link href="/review" className="text-accent underline">
              Ôn tập ngay
            </Link>
          )}
        </div>
        <div className="rounded border border-border p-4">
          <p className="text-sm opacity-75">Chuỗi ngày học</p>
          <p className="text-3xl font-bold">{days} ngày</p>
        </div>
        <div className="rounded border border-border p-4">
          <p className="text-sm opacity-75">Bài tiếp theo</p>
          {nextLesson ? (
            <Link href={`/lesson/${nextLesson.id}`} className="mt-1 block font-semibold text-accent underline">
              HSK{nextLesson.levelId} · Bài {nextLesson.order}: {nextLesson.title}
            </Link>
          ) : (
            <p className="mt-1">Đã học hết các bài hiện có 🎉</p>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Tiến độ từ vựng</h2>
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
    </main>
  );
}
