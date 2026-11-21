import Link from "next/link";
import WritingPractice from "@/components/WritingPractice";
import { prisma } from "@/lib/db";
import type { WritingExercise } from "@/lib/exercises";
import { AI_GRADING_ENABLED } from "@/lib/grader";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const level = Number((await searchParams).level ?? 1) || 1;
  const [rows, words, levels] = await Promise.all([
    prisma.exercise.findMany({ where: { skill: "writing", levelId: level }, orderBy: { key: "asc" } }),
    // Luyện gõ dùng từ của cấp đang chọn và các cấp dưới.
    prisma.word.findMany({ where: { levelId: { lte: level } }, orderBy: { id: "asc" }, select: { hanzi: true, pinyin: true, meaningVi: true } }),
    prisma.level.findMany({ orderBy: { id: "asc" }, select: { id: true } }),
  ]);
  // Không gửi đáp án xuống client; chấm ở server action submitExercise / gradeWriting.
  const exercises = rows.map((r) => ({ id: r.id, type: r.type, payload: JSON.parse(r.payload) }) as WritingExercise);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Luyện viết</h1>
      <p className="mt-1 max-w-2xl text-sm opacity-75">
        Gõ pinyin chọn chữ như bộ gõ thật, điền chữ còn thiếu, sắp xếp từ thành câu, và đặt câu với từ cho trước. Tập viết
        từng nét chữ ở trang{" "}
        <Link href="/write" className="text-accent underline">
          Tập viết
        </Link>
        .
      </p>
      {levels.length > 1 && (
        <nav aria-label="Chọn cấp" className="mt-4 flex gap-2">
          {levels.map((l) => (
            <Link
              key={l.id}
              href={`/writing?level=${l.id}`}
              aria-current={l.id === level ? "page" : undefined}
              className={`rounded border border-border px-3 py-1 ${l.id === level ? "bg-accent text-background" : "hover:bg-muted"}`}
            >
              HSK{l.id}
            </Link>
          ))}
        </nav>
      )}
      <WritingPractice
        key={level}
        aiEnabled={AI_GRADING_ENABLED}
        exercises={exercises}
        words={words.map((w) => ({ hanzi: w.hanzi, pinyin: w.pinyin, vi: w.meaningVi }))}
      />
    </main>
  );
}
