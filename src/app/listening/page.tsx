import Link from "next/link";
import ListeningSession from "@/components/ListeningSession";
import { prisma } from "@/lib/db";
import type { ListeningExercise } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const level = Number((await searchParams).level ?? 1) || 1;
  const [rows, levels] = await Promise.all([
    prisma.exercise.findMany({ where: { skill: "listening", levelId: level }, orderBy: { key: "asc" } }),
    prisma.exercise.groupBy({ by: ["levelId"], where: { skill: "listening" }, orderBy: { levelId: "asc" } }),
  ]);
  // Không gửi đáp án xuống client; chấm ở server action submitExercise.
  const exercises = rows.map((r) => ({ id: r.id, type: r.type, payload: JSON.parse(r.payload) }) as ListeningExercise);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Luyện nghe</h1>
      <p className="mt-1 text-sm opacity-75">
        Nghe rồi trả lời; sau mỗi câu có lời thoại (chữ Hán, pinyin, nghĩa). Ảnh minh hoạ CC0 / Public Domain (nguồn: public/images/CREDITS.md).
      </p>
      {levels.length > 1 && (
        <nav aria-label="Chọn cấp" className="mt-4 flex gap-2">
          {levels.map((l) => (
            <Link
              key={l.levelId}
              href={`/listening?level=${l.levelId}`}
              aria-current={l.levelId === level ? "page" : undefined}
              className={`rounded border border-border px-3 py-1 ${l.levelId === level ? "bg-accent text-background" : "hover:bg-muted"}`}
            >
              HSK{l.levelId}
            </Link>
          ))}
        </nav>
      )}
      <h2 className="mt-4 font-semibold">HSK{level}</h2>
      <ListeningSession exercises={exercises} />
    </main>
  );
}
