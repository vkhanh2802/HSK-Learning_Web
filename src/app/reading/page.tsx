import Link from "next/link";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/lang-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const t = await getT();
  const passages = await prisma.passage.findMany({
    orderBy: [{ levelId: "asc" }, { key: "asc" }],
    select: { id: true, levelId: true, title: true, type: true },
  });
  const levels = [...new Set(passages.map((p) => p.levelId))];

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">{t("Bài đọc", "Reading")}</h1>
      <p className="mt-1 text-sm opacity-75">
        {t("Bấm vào từ để tra nghĩa và thêm vào ôn tập. Mỗi bài có câu hỏi đọc hiểu ở cuối.", "Tap a word to look it up and add it to your review. Each passage ends with comprehension questions.")}
      </p>
      {passages.length === 0 && <p className="mt-6">{t("Chưa có bài đọc.", "No reading passages yet.")}</p>}
      {levels.map((level) => (
        <section key={level} className="mt-6">
          <h2 className="font-semibold">HSK{level}</h2>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2">
            {passages
              .filter((p) => p.levelId === level)
              .map((p, i) => (
                <li key={p.id}>
                  <Link href={`/reading/${p.id}`} className="block rounded border border-border p-3 hover:bg-muted">
                    <span className="text-sm opacity-75">
                      {t("Bài", "Passage")} {i + 1} · {p.type === "dialogue" ? t("Hội thoại", "Dialogue") : t("Đoạn văn", "Paragraph")}
                    </span>
                    <span className="block font-semibold">{p.title}</span>
                  </Link>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
