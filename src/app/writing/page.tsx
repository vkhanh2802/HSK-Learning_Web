import Link from "next/link";
import WritingPractice from "@/components/WritingPractice";
import { AI_GRADING_ENABLED } from "@/lib/grader";
import { prisma } from "@/lib/db";
import type { WritingExercise } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [rows, words] = await Promise.all([
    prisma.exercise.findMany({ where: { skill: "writing" }, orderBy: [{ levelId: "asc" }, { key: "asc" }] }),
    prisma.word.findMany({ orderBy: { id: "asc" }, select: { hanzi: true, pinyin: true, meaningVi: true } }),
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
      <WritingPractice aiEnabled={AI_GRADING_ENABLED} exercises={exercises} words={words.map((w) => ({ hanzi: w.hanzi, pinyin: w.pinyin, vi: w.meaningVi }))} />
    </main>
  );
}
