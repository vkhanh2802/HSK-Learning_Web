import Link from "next/link";
import { notFound } from "next/navigation";
import LessonFlow from "@/components/LessonFlow";
import { prisma } from "@/lib/db";
import { getWords } from "@/lib/words";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const lesson = Number.isInteger(id)
    ? await prisma.lesson.findUnique({
        where: { id },
        include: { level: true, items: { where: { itemType: "word" }, orderBy: { order: "asc" } } },
      })
    : null;
  if (!lesson) notFound();

  const words = await getWords(lesson.items.map((i) => i.itemId));

  return (
    <main className="p-8">
      <Link href={`/learn/${lesson.levelId}`} className="text-sm opacity-75 hover:underline">
        ← {lesson.level.name}
      </Link>
      <h1 className="mt-1 text-2xl font-bold">
        Bài {lesson.order}: {lesson.title}
      </h1>
      <LessonFlow lessonId={lesson.id} words={words} />
    </main>
  );
}
