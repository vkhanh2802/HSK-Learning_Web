import Link from "next/link";
import { notFound } from "next/navigation";
import LessonFlow from "@/components/LessonFlow";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/lang-server";
import { getWords } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const id = Number((await params).id);
  const lesson = Number.isInteger(id)
    ? await prisma.lesson.findUnique({
        where: { id },
        include: { level: true, items: { orderBy: { order: "asc" } } },
      })
    : null;
  if (!lesson) notFound();

  const byType = (t: string) => lesson.items.filter((i) => i.itemType === t).map((i) => i.itemId);
  const [words, grammar] = await Promise.all([
    getWords(byType("word")),
    prisma.grammarPoint.findMany({ where: { id: { in: byType("grammar") } }, select: { id: true, title: true, pattern: true } }),
  ]);

  return (
    <main className="p-8">
      <Link href={`/learn/${lesson.levelId}`} className="text-sm opacity-75 hover:underline">
        ← {lesson.level.name}
      </Link>
      <h1 className="mt-1 text-2xl font-bold">
        {t("Bài", "Lesson")} {lesson.order}: {lesson.title}
      </h1>
      <LessonFlow lessonId={lesson.id} words={words} />
      {grammar.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t("Ngữ pháp của bài", "Grammar in this lesson")}</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {grammar.map((g) => (
              <li key={g.id}>
                <Link href={`/grammar/${g.id}`} className="block rounded border border-border p-3 hover:bg-muted">
                  <span className="block font-semibold">{g.title}</span>
                  <span lang="zh-CN" className="text-sm opacity-75">
                    {g.pattern}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
