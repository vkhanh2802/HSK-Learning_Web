import Link from "next/link";
import { notFound } from "next/navigation";
import AudioButton from "@/components/AudioButton";
import GrammarPractice from "@/components/GrammarPractice";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/lang-server";
import { stripGrammarAnswers, type GrammarExercise, type Mistake, type Sentence } from "@/lib/grammar";

export const dynamic = "force-dynamic";

// Mỗi thành phần công thức một màu nền nhạt (đọc được cả chế độ sáng và tối).
const PART_COLORS = ["bg-sky-500/20", "bg-emerald-500/20", "bg-amber-500/25", "bg-rose-500/20", "bg-violet-500/20"];

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const id = Number((await params).id);
  const point = Number.isInteger(id) ? await prisma.grammarPoint.findUnique({ where: { id } }) : null;
  if (!point) notFound();

  const examples = JSON.parse(point.examples) as Sentence[];
  const mistakes = JSON.parse(point.mistakes ?? "[]") as Mistake[];
  const exercises = JSON.parse(point.exercises) as GrammarExercise[];
  const item = await prisma.lessonItem.findFirst({ where: { itemType: "grammar", itemId: point.id }, include: { lesson: true } });

  return (
    <main className="p-8">
      <Link href="/grammar" className="text-sm opacity-75">
        ← {t("Ngữ pháp", "Grammar")} HSK{point.levelId}
      </Link>
      <h1 className="mt-1 text-2xl font-bold">{point.title}</h1>
      {item && (
        <p className="text-sm opacity-75">
          {t("Thuộc", "Part of")}{" "}
          <Link href={`/lesson/${item.lesson.id}`} className="underline decoration-brush decoration-2 underline-offset-4">
            {t("Bài", "Lesson")} {item.lesson.order}: {item.lesson.title}
          </Link>
        </p>
      )}

      <p className="mt-4 flex flex-wrap items-center gap-1.5 text-lg" aria-label={t(`Công thức: ${point.pattern}`, `Pattern: ${point.pattern}`)}>
        {point.pattern.split(" + ").map((part, i, all) => (
          <span key={i} className="flex items-center gap-1.5">
            <span lang="zh-CN" className={`rounded px-2 py-0.5 ${PART_COLORS[i % PART_COLORS.length]}`}>
              {part}
            </span>
            {i < all.length - 1 && <span aria-hidden>+</span>}
          </span>
        ))}
      </p>

      <p className="mt-4 max-w-2xl">{point.explanation}</p>

      <h2 className="mt-6 text-2xl">{t("Ví dụ", "Examples")}</h2>
      <ul className="mt-2 space-y-2">
        {examples.map((e) => (
          <li key={e.hanzi}>
            <p className="flex items-center gap-2">
              <span lang="zh-CN" className="text-xl">
                {e.hanzi}
              </span>
              <AudioButton text={e.hanzi} />
            </p>
            <p className="text-sm opacity-75">{e.pinyin}</p>
            <p className="text-sm">{e.vi}</p>
          </li>
        ))}
      </ul>

      {mistakes.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-semibold">{t("Lỗi hay gặp", "Common mistakes")}</h2>
          <ul className="mt-2 space-y-2">
            {mistakes.map((m) => (
              <li key={m.wrong} className="rounded border border-border p-3 text-sm">
                <p>
                  ✗ <span lang="zh-CN" className="text-base line-through opacity-75">{m.wrong}</span> → ✓{" "}
                  <span lang="zh-CN" className="text-base font-semibold">
                    {m.right}
                  </span>
                </p>
                <p className="mt-1">{m.note}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Đáp án không gửi xuống client; chấm ở server action submitGrammar. */}
      <GrammarPractice key={point.id} pointId={point.id} exercises={stripGrammarAnswers(exercises)} />
    </main>
  );
}
