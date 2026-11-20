import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ levelId: string }> }) {
  const levelId = Number((await params).levelId);
  const level = Number.isInteger(levelId)
    ? await prisma.level.findUnique({
        where: { id: levelId },
        include: { lessons: { orderBy: { order: "asc" }, include: { _count: { select: { items: true } } } } },
      })
    : null;
  if (!level) notFound();

  const done = level.lessons.filter((l) => l.doneAt).length;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{level.name}</h1>
      <p className="mt-1 text-sm opacity-75">
        Đã học {done}/{level.lessons.length} bài
      </p>
      {level.lessons.length === 0 && <p className="mt-6">Cấp này chưa có bài học.</p>}
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {level.lessons.map((l) => (
          <li key={l.id}>
            <Link
              href={`/lesson/${l.id}`}
              className="flex items-center justify-between rounded border border-border p-4 hover:bg-muted"
            >
              <span>
                <span className="text-sm opacity-75">Bài {l.order}</span>
                <span className="block font-semibold">{l.title}</span>
                <span className="text-sm opacity-75">{l._count.items} từ</span>
              </span>
              {l.doneAt && <span className="text-sm text-accent">✓ Đã học</span>}
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
