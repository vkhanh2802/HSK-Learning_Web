import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [points, items] = await Promise.all([
    prisma.grammarPoint.findMany({ orderBy: [{ levelId: "asc" }, { key: "asc" }], select: { id: true, levelId: true, title: true, pattern: true } }),
    prisma.lessonItem.findMany({ where: { itemType: "grammar" }, include: { lesson: { select: { order: true } } } }),
  ]);
  const lessonOf = new Map(items.map((i) => [i.itemId, i.lesson.order]));
  const levels = [...new Set(points.map((p) => p.levelId))];

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Ngữ pháp</h1>
      <p className="mt-1 text-sm opacity-75">Mỗi điểm có công thức, giải thích, ví dụ, lỗi hay gặp và bài tập.</p>
      {points.length === 0 && <p className="mt-6">Chưa có điểm ngữ pháp.</p>}
      {levels.map((level) => (
        <section key={level} className="mt-6">
          <h2 className="font-semibold">HSK{level}</h2>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2">
            {points
              .filter((p) => p.levelId === level)
              .map((p) => (
                <li key={p.id}>
                  <Link href={`/grammar/${p.id}`} className="block rounded border border-border p-3 hover:bg-muted">
                    {lessonOf.has(p.id) && <span className="text-sm opacity-75">Bài {lessonOf.get(p.id)}</span>}
                    <span className="block font-semibold">{p.title}</span>
                    <span lang="zh-CN" className="text-sm opacity-75">
                      {p.pattern}
                    </span>
                  </Link>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
