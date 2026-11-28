import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/lang-server";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ levelId: string }> }) {
  const t = await getT();
  const levelId = Number((await params).levelId);
  const level = Number.isInteger(levelId)
    ? await prisma.level.findUnique({
        where: { id: levelId },
        include: { lessons: { orderBy: { order: "asc" }, include: { _count: { select: { items: { where: { itemType: "word" } } } } } } },
      })
    : null;
  if (!level) notFound();

  const done = level.lessons.filter((l) => l.doneAt).length;
  const pct = level.lessons.length ? (done / level.lessons.length) * 100 : 0;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{level.name}</h1>
      <p className="mt-1 text-sm opacity-75">
        {t(`Đã học ${done}/${level.lessons.length} bài`, `${done}/${level.lessons.length} lessons done`)}
      </p>
      {level.lessons.length > 0 && (
        <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
          <div className="bar h-full rounded-full bg-brush" style={{ width: `${pct}%` }} />
        </div>
      )}
      {level.lessons.length === 0 && <p className="mt-6">{t("Cấp này chưa có bài học.", "This level has no lessons yet.")}</p>}
      <ol className="motion-stagger mt-6 grid gap-3 sm:grid-cols-2">
        {level.lessons.map((l) => (
          <li key={l.id} className="motion-enter">
            <Link
              href={`/lesson/${l.id}`}
              className="flex items-center justify-between rounded border border-border bg-muted/35 p-4 hover:bg-muted"
            >
              <span>
                <span className="text-sm opacity-75">{t("Bài", "Lesson")} {l.order}</span>
                <span className="block font-semibold">{l.title}</span>
                <span className="text-sm opacity-75">{l._count.items} {t("từ", "words")}</span>
              </span>
              {l.doneAt && <span className="rounded-full bg-green-600/15 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">{t("✓ Đã học", "✓ Done")}</span>}
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
